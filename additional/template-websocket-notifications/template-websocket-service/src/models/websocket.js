import debug from 'debug';
import { DynamoDBConnector } from 'aws-lambda-stream';

// The TTL for events stored in EVENTS_TABLE determines how long events will be available for replay. Default is 1800 seconds (30 minutes).
// If you change this value, make sure to also update the replayWindowSecs option in the useWebSocket hook in the MFE,
// so that the client considers events expired at the same time they expire in DynamoDB and doesn't attempt to replay them.
const EVENT_TTL_SECONDS = Number(process.env.EVENT_TTL_SECONDS || 1800);

const connector = new DynamoDBConnector({
  debug: debug('subscriptions'),
  tableName: process.env.SUBSCRIPTIONS_TABLE,
});

/**
 * Sends the event data to all WebSocket connections subscribed to the event's type.
 */
export const toMessage = (uow) => ({
  type: uow.event.type,
  data: uow.event,
  timestamp: uow.event.timestamp || Date.now(),
});

/**
 * Queries the SUBSCRIPTIONS_TABLE for any connections subscribed to the event's type, and returns an array of connectionId objects for those connections.
 * It also handles wildcard subscriptions by including connections subscribed to '*' in addition to those subscribed to the specific event type.
 * Duplicate connectionIds are filtered out to prevent sending the same message multiple times to the same connection.
 */
export const toConnections = (uow) => Promise.all([
  connector.query({
    KeyConditionExpression: 'eventType = :et',
    ExpressionAttributeValues: { ':et': uow.event.type },
  }),
  connector.query({
    KeyConditionExpression: 'eventType = :et',
    ExpressionAttributeValues: { ':et': '*' },
  }),
]).then(([specific, catchAll]) => {
  const seen = new Set();
  return [...specific, ...catchAll]
    .filter(({ connectionId }) => {
      if (seen.has(connectionId)) return false;
      seen.add(connectionId);
      return true;
    })
    .map(({ connectionId }) => ({ connectionId }));
});

/**
 * Uses the event's type and timestamp as the key to store the event data in the EVENTS_TABLE.
 * The TTL is set to the current time plus the configured EVENT_TTL_SECONDS, so that the record will automatically expire after that time.
 * This allows new connections that subscribe to the event type to receive recent events that they may have missed while they were disconnected.
 */
export const toUpdateRequest = (uow) => ({
  Key: {
    eventType: uow.event.type,
    timestamp: new Date().toISOString(),
  },
  ExpressionAttributeNames: {
    '#data': 'data',
    '#ttl': 'ttl',
  },
  ExpressionAttributeValues: {
    ':data': uow.event,
    ':ttl': Math.floor(Date.now() / 1000) + EVENT_TTL_SECONDS,
  },
  UpdateExpression: 'SET #data = :data, #ttl = :ttl',
  TableName: process.env.EVENTS_TABLE,
});
