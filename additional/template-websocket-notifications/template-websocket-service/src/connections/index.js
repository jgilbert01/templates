import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient, PutCommand, DeleteCommand, QueryCommand, ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

// Create a DynamoDB Document Client for easier interaction with DynamoDB tables.
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

/**
 * TTL (Time To Live) is used in DynamoDB to automatically delete items after a certain time. This function calculates the TTL value by taking the current time in seconds and adding the specified number of seconds to it. The resulting value is a Unix timestamp that indicates when the item should expire and be removed from the table. This is useful for managing the lifecycle of connection and subscription records, ensuring that stale data is cleaned up without manual intervention.
 * @param {number} seconds - The number of seconds until the item should expire.
 * @returns {number} The Unix timestamp representing the expiration time.
 */
const ttl = (seconds) => Math.floor(Date.now() / 1000) + Number(seconds);

/**
 * USER_PATTERN matches allowed characters in event types, which are used as DynamoDB partition keys. It allows alphanumeric characters, underscores, hyphens, and periods. The pattern is used to validate event types and ensure they conform to expected formats, preventing issues with DynamoDB key constraints and ensuring consistent event type naming across the system.
 */
const USER_PATTERN = '[a-zA-Z0-9_\\-\\.]+';

/**
 * EVENT_TYPE is a regular expression that matches valid event types for the WebSocket service. It ensures that event types do not include the wildcard character '*' (which is reserved for subscription tokens) and only contain allowed characters as defined by USER_PATTERN. This validation helps maintain the integrity of event types and prevents conflicts with subscription tokens, ensuring that publishers cannot emit events with invalid types.
 */
const EVENT_TYPE = new RegExp(`^${USER_PATTERN}$`);

/**
 * Wildcard subscription token pattern for event types, used in the SUBSCRIPTIONS_TABLE to allow clients to subscribe to all event types without specifying each one individually. This pattern is used to identify subscription records that should receive all events, regardless of their specific type.
 * Note that publishers cannot emit events with the type '*', as this is reserved for subscription purposes only.
 * @param {string[]} types - An array of event types to normalize, which may include the wildcard '*' character.
 * @returns {string[]} An array of normalized event types, where duplicates are removed and only valid event types (including the wildcard) are retained.
 */
const normalizeEventTypes = (types) => {
  const normalized = types.includes('*') ? ['*'] : [...new Set(types)];
  return normalized.filter((type) => type === '*' || EVENT_TYPE.test(type));
};

/**
 * Called by API Gateway when a client connects to the WebSocket endpoint.
 * Stores the connectionId in CONNECTIONS_TABLE, and any eventType subscriptions in SUBSCRIPTIONS_TABLE.
 * The client may optionally include a "subscribe" query parameter with a comma-separated list of event types to subscribe to.
 * The client will later trigger the "replay" route to receive any recent events of the subscribed types that were missed during connection.
 */
export const connect = async (event) => {
  const { connectionId } = event.requestContext;
  const { subscribe = '' } = event.queryStringParameters || {};
  const eventTypes = normalizeEventTypes(subscribe.split(',').map((s) => s.trim()).filter(Boolean));
  const connectionTtl = ttl(process.env.CONNECTION_TTL_SECONDS || 7200);

  await ddb.send(new PutCommand({
    TableName: process.env.CONNECTIONS_TABLE,
    Item: { connectionId, region: process.env.AWS_REGION, ttl: connectionTtl },
  }));

  await Promise.all(eventTypes.map((eventType) => ddb.send(new PutCommand({
    TableName: process.env.SUBSCRIPTIONS_TABLE,
    Item: { eventType, connectionId, ttl: connectionTtl },
  }))));

  return { statusCode: 200 };
};

/**
 * Called by the client after ws.onopen fires, via { action: 'replay' }.
 * PostToConnection cannot be used during $connect (connection not yet OPEN), so replay is deferred to this explicit client-triggered route.
 * Queries SUBSCRIPTIONS_TABLE for the connectionId to get the subscribed event types, then queries EVENTS_TABLE for recent events of those types, and posts them to the connection using the ApiGatewayManagementApiClient.
 * The handler returns a 200 status code to the client regardless of whether the PostToConnectionCommand calls succeed or fail, since failed calls due to stale connections will be cleaned up over time via DynamoDB TTL as clients reconnect and trigger replays.
 */
export const replay = async (event) => {
  const { connectionId } = event.requestContext;

  // Query the SUBSCRIPTIONS_TABLE to find out which event types this connection is subscribed to.
  const subsResult = await ddb.send(new QueryCommand({
    TableName: process.env.SUBSCRIPTIONS_TABLE,
    IndexName: 'connectionId-index',
    KeyConditionExpression: 'connectionId = :cid',
    ExpressionAttributeValues: { ':cid': connectionId },
  }));

  // Extract the event types from the subscription records. If there are no subscriptions, return early with a 200 status code.
  const eventTypes = (subsResult.Items || []).map((item) => item.eventType);
  if (eventTypes.length === 0) return { statusCode: 200 };

  // Create an instance of the ApiGatewayManagementApiClient to post messages back to the WebSocket connection.
  const apigw = new ApiGatewayManagementApiClient({ endpoint: process.env.WEBSOCKET_ENDPOINT });

  const body = event.body ? JSON.parse(event.body) : {};
  const sinceMs = body.since ? Number(body.since) : null;
  const cutoffIso = sinceMs
    ? new Date(sinceMs).toISOString()
    : new Date((Math.floor(Date.now() / 1000) - Number(process.env.EVENT_TTL_SECONDS || 1800)) * 1000).toISOString();

  // Helper function to post an array of event items to the WebSocket connection. Each item is sent as a JSON string with the event type, data, timestamp, and a flag indicating that it is a replayed event.
  // Errors from PostToConnectionCommand are caught and ignored, as they may occur if the connection is stale, and such stale connections will be cleaned up over time by DynamoDB TTL.
  const postItems = async (items) => Promise.all(
    (items || []).map((item) => apigw.send(new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: Buffer.from(JSON.stringify({
        type: item.eventType,
        data: item.data,
        timestamp: (item.data && item.data.timestamp) || Date.now(),
        replayed: true,
      })),
    })).catch(() => {})),
  );

  // If the connection is subscribed to the wildcard '*', query the EVENTS_TABLE for all events with a timestamp greater than the cutoff time. Otherwise, query for each subscribed event type individually.
  // Post the retrieved events to the connection using the helper function.
  if (eventTypes.includes('*')) {
    const result = await ddb.send(new ScanCommand({
      TableName: process.env.EVENTS_TABLE,
      FilterExpression: '#ts >= :cutoff',
      ExpressionAttributeNames: { '#ts': 'timestamp' },
      ExpressionAttributeValues: { ':cutoff': cutoffIso },
    }));
    await postItems(result.Items);
  } else { // Query each event type separately, more efficient since they are partitioned by eventType in the EVENTS_TABLE
    await Promise.all(eventTypes.map(async (eventType) => {
      const result = await ddb.send(new QueryCommand({
        TableName: process.env.EVENTS_TABLE,
        KeyConditionExpression: 'eventType = :et AND #ts >= :cutoff',
        ExpressionAttributeNames: { '#ts': 'timestamp' },
        ExpressionAttributeValues: { ':et': eventType, ':cutoff': cutoffIso },
      }));
      await postItems(result.Items);
    }));
  }

  return { statusCode: 200 };
};

/**
 * Called by API Gateway when a client subscribes to event types after connecting, via { action: 'subscribe', eventTypes: [...] }.
 * Updates the SUBSCRIPTIONS_TABLE with the new event type subscriptions for the connectionId. Any existing subscriptions for the connectionId are deleted before adding the new ones.
 * The client will later trigger the "replay" route to receive any recent events of the subscribed types that were missed during connection.
 * The handler returns a 200 status code to the client regardless of whether the DynamoDB operations succeed or fail, since the client is already connected and any stale records will be cleaned up over time via DynamoDB TTL as clients reconnect and trigger replays.
 */
export const subscribe = async (event) => {
  const { connectionId } = event.requestContext;
  const body = event.body ? JSON.parse(event.body) : {};
  const eventTypes = normalizeEventTypes((body.eventTypes || []).map((s) => s.trim()).filter(Boolean));
  const connectionTtl = ttl(process.env.CONNECTION_TTL_SECONDS || 7200);

  // Query existing subscriptions for the connectionId and delete them, since we are replacing them with the new set of event types.
  // This ensures that the subscription records in SUBSCRIPTIONS_TABLE accurately reflect the client's current subscriptions, and prevents stale subscriptions from lingering if the client changes their subscribed event types.
  const existing = await ddb.send(new QueryCommand({
    TableName: process.env.SUBSCRIPTIONS_TABLE,
    IndexName: 'connectionId-index',
    KeyConditionExpression: 'connectionId = :cid',
    ExpressionAttributeValues: { ':cid': connectionId },
  }));

  await Promise.all((existing.Items || []).map((item) => ddb.send(new DeleteCommand({
    TableName: process.env.SUBSCRIPTIONS_TABLE,
    Key: { eventType: item.eventType, connectionId: item.connectionId },
  }))));

  await Promise.all(eventTypes.map((eventType) => ddb.send(new PutCommand({
    TableName: process.env.SUBSCRIPTIONS_TABLE,
    Item: { eventType, connectionId, ttl: connectionTtl },
  }))));

  return { statusCode: 200 };
};

/**
 * Called by API Gateway when a client disconnects from the WebSocket endpoint.
 * Deletes the connectionId from CONNECTIONS_TABLE, and any eventType subscriptions from SUBSCRIPTIONS_TABLE.
 * The handler returns a 200 status code to the client regardless of whether the DynamoDB operations succeed or fail, since the client is already disconnected and any stale records will be cleaned up over time via DynamoDB TTL as clients reconnect and trigger replays.
 */
export const disconnect = async (event) => {
  const { connectionId } = event.requestContext;

  await ddb.send(new DeleteCommand({
    TableName: process.env.CONNECTIONS_TABLE,
    Key: { connectionId },
  }));

  const result = await ddb.send(new QueryCommand({
    TableName: process.env.SUBSCRIPTIONS_TABLE,
    IndexName: 'connectionId-index',
    KeyConditionExpression: 'connectionId = :cid',
    ExpressionAttributeValues: { ':cid': connectionId },
  }));

  await Promise.all((result.Items || []).map((item) => ddb.send(new DeleteCommand({
    TableName: process.env.SUBSCRIPTIONS_TABLE,
    Key: { eventType: item.eventType, connectionId: item.connectionId },
  }))));

  return { statusCode: 200 };
};
