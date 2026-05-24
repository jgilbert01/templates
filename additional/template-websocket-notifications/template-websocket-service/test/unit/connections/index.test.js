import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { mockClient } from 'aws-sdk-client-mock';
import {
  DynamoDBDocumentClient, PutCommand, DeleteCommand, QueryCommand, ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

import {
  connect, disconnect, replay, subscribe,
} from '../../../src/connections';

const ddbMock = mockClient(DynamoDBDocumentClient);
const apigwMock = mockClient(ApiGatewayManagementApiClient);

describe('connections/index.js', () => {
  beforeEach(() => {
    ddbMock.reset();
    apigwMock.reset();
    process.env.CONNECTIONS_TABLE = 'test-connections';
    process.env.SUBSCRIPTIONS_TABLE = 'test-subscriptions';
    process.env.EVENTS_TABLE = 'test-events';
    process.env.EVENT_TTL_SECONDS = '1800';
    process.env.CONNECTION_TTL_SECONDS = '7200';
    process.env.WEBSOCKET_ENDPOINT = 'https://test.execute-api.us-west-2.amazonaws.com/np';
    process.env.AWS_REGION = 'us-west-2';
  });
  afterEach(sinon.restore);

  describe('connect', () => {
    it('should write to ConnectionsTable and SubscriptionsTable', async () => {
      ddbMock.on(PutCommand).resolves({});
      ddbMock.on(QueryCommand).resolves({ Items: [] });
      apigwMock.on(PostToConnectionCommand).resolves({});

      const result = await connect({
        requestContext: { connectionId: 'conn-abc' },
        queryStringParameters: { subscribe: 'thing-updated' },
      });

      expect(result).to.deep.equal({ statusCode: 200 });
      const putCalls = ddbMock.commandCalls(PutCommand);
      expect(putCalls.length).to.equal(2);
      expect(putCalls[0].args[0].input.TableName).to.equal('test-connections');
      expect(putCalls[1].args[0].input.TableName).to.equal('test-subscriptions');
    });

    it('should write multiple subscriptions', async () => {
      ddbMock.on(PutCommand).resolves({});

      const result = await connect({
        requestContext: { connectionId: 'conn-abc' },
        queryStringParameters: { subscribe: 'thing-updated,job-completed' },
      });

      expect(result).to.deep.equal({ statusCode: 200 });
      const putCalls = ddbMock.commandCalls(PutCommand);
      expect(putCalls.length).to.equal(3);
      expect(putCalls[1].args[0].input.Item.eventType).to.equal('thing-updated');
      expect(putCalls[2].args[0].input.Item.eventType).to.equal('job-completed');
    });

    it('should handle null queryStringParameters', async () => {
      ddbMock.on(PutCommand).resolves({});

      const result = await connect({
        requestContext: { connectionId: 'conn-abc' },
        queryStringParameters: null,
      });

      expect(result).to.deep.equal({ statusCode: 200 });
      const putCalls = ddbMock.commandCalls(PutCommand);
      expect(putCalls.length).to.equal(1);
    });

    it('should use default ttl when CONNECTION_TTL_SECONDS is not set', async () => {
      delete process.env.CONNECTION_TTL_SECONDS;
      ddbMock.on(PutCommand).resolves({});

      const result = await connect({
        requestContext: { connectionId: 'conn-abc' },
        queryStringParameters: {},
      });

      expect(result).to.deep.equal({ statusCode: 200 });
    });

    it('should normalize * to single catch-all subscription', async () => {
      ddbMock.on(PutCommand).resolves({});

      await connect({
        requestContext: { connectionId: 'conn-abc' },
        queryStringParameters: { subscribe: '*,thing-updated' },
      });

      const putCalls = ddbMock.commandCalls(PutCommand);
      expect(putCalls.length).to.equal(2); // connections + one subscription
      expect(putCalls[1].args[0].input.Item.eventType).to.equal('*');
    });

    it('should deduplicate event types', async () => {
      ddbMock.on(PutCommand).resolves({});

      await connect({
        requestContext: { connectionId: 'conn-abc' },
        queryStringParameters: { subscribe: 'thing-updated,thing-updated,job-completed' },
      });

      const subPutCalls = ddbMock.commandCalls(PutCommand).slice(1);
      const storedTypes = subPutCalls.map((c) => c.args[0].input.Item.eventType);
      expect(storedTypes).to.deep.equal(['thing-updated', 'job-completed']);
    });
  });

  describe('disconnect', () => {
    it('should delete from ConnectionsTable and SubscriptionsTable', async () => {
      ddbMock.on(DeleteCommand).resolves({});
      ddbMock.on(QueryCommand).resolves({
        Items: [
          { eventType: 'thing-updated', connectionId: 'conn-abc' },
        ],
      });

      const result = await disconnect({
        requestContext: { connectionId: 'conn-abc' },
      });

      expect(result).to.deep.equal({ statusCode: 200 });
      const deleteCalls = ddbMock.commandCalls(DeleteCommand);
      expect(deleteCalls.length).to.equal(2);
      expect(deleteCalls[0].args[0].input.TableName).to.equal('test-connections');
      expect(deleteCalls[1].args[0].input.TableName).to.equal('test-subscriptions');
    });

    it('should handle no subscriptions on disconnect', async () => {
      ddbMock.on(DeleteCommand).resolves({});
      ddbMock.on(QueryCommand).resolves({ Items: [] });

      const result = await disconnect({
        requestContext: { connectionId: 'conn-abc' },
      });

      expect(result).to.deep.equal({ statusCode: 200 });
      const deleteCalls = ddbMock.commandCalls(DeleteCommand);
      expect(deleteCalls.length).to.equal(1); // only ConnectionsTable
    });

    it('should handle undefined Items on disconnect', async () => {
      ddbMock.on(DeleteCommand).resolves({});
      ddbMock.on(QueryCommand).resolves({});

      const result = await disconnect({
        requestContext: { connectionId: 'conn-abc' },
      });

      expect(result).to.deep.equal({ statusCode: 200 });
    });
  });

  describe('replay', () => {
    it('should return 200 when no subscriptions', async () => {
      ddbMock.on(QueryCommand).resolves({ Items: [] });

      const result = await replay({
        requestContext: { connectionId: 'conn-abc' },
      });

      expect(result).to.deep.equal({ statusCode: 200 });
    });

    it('should replay recent events to the connection', async () => {
      ddbMock.on(QueryCommand)
        .resolvesOnce({ Items: [{ eventType: 'thing-updated', connectionId: 'conn-abc' }] })
        .resolvesOnce({ Items: [{ eventType: 'thing-updated', data: { type: 'thing-updated', timestamp: 1548967023000 } }] });
      apigwMock.on(PostToConnectionCommand).resolves({});

      const result = await replay({
        requestContext: { connectionId: 'conn-abc' },
      });

      expect(result).to.deep.equal({ statusCode: 200 });
      const postCalls = apigwMock.commandCalls(PostToConnectionCommand);
      expect(postCalls.length).to.equal(1);
      expect(postCalls[0].args[0].input.ConnectionId).to.equal('conn-abc');
    });

    it('should return 200 even when api gateway rejects stale connections', async () => {
      ddbMock.on(QueryCommand)
        .resolvesOnce({ Items: [{ eventType: 'thing-updated', connectionId: 'conn-abc' }] })
        .resolvesOnce({ Items: [{ eventType: 'thing-updated', data: { type: 'thing-updated' } }] });
      apigwMock.on(PostToConnectionCommand).rejects(new Error('Gone'));

      const result = await replay({
        requestContext: { connectionId: 'conn-abc' },
      });

      expect(result).to.deep.equal({ statusCode: 200 });
    });

    it('should handle undefined Items from subscriptions query', async () => {
      ddbMock.on(QueryCommand).resolves({});

      const result = await replay({
        requestContext: { connectionId: 'conn-abc' },
      });

      expect(result).to.deep.equal({ statusCode: 200 });
    });

    it('should handle undefined Items from events query', async () => {
      ddbMock.on(QueryCommand)
        .resolvesOnce({ Items: [{ eventType: 'thing-updated', connectionId: 'conn-abc' }] })
        .resolvesOnce({});
      apigwMock.on(PostToConnectionCommand).resolves({});

      const result = await replay({
        requestContext: { connectionId: 'conn-abc' },
      });

      expect(result).to.deep.equal({ statusCode: 200 });
    });

    it('should use Date.now() when replayed item has no data timestamp', async () => {
      delete process.env.EVENT_TTL_SECONDS;
      ddbMock.on(QueryCommand)
        .resolvesOnce({ Items: [{ eventType: 'thing-updated', connectionId: 'conn-abc' }] })
        .resolvesOnce({ Items: [{ eventType: 'thing-updated', data: null }] });
      apigwMock.on(PostToConnectionCommand).resolves({});

      const result = await replay({
        requestContext: { connectionId: 'conn-abc' },
      });

      expect(result).to.deep.equal({ statusCode: 200 });
      const postCalls = apigwMock.commandCalls(PostToConnectionCommand);
      expect(postCalls.length).to.equal(1);
    });

    it('should use since timestamp from body when provided', async () => {
      const since = Date.now() - 5000;
      ddbMock.on(QueryCommand)
        .resolvesOnce({ Items: [{ eventType: 'thing-updated', connectionId: 'conn-abc' }] })
        .resolvesOnce({ Items: [{ eventType: 'thing-updated', data: { type: 'thing-updated', timestamp: since + 1000 } }] });
      apigwMock.on(PostToConnectionCommand).resolves({});

      const result = await replay({
        requestContext: { connectionId: 'conn-abc' },
        body: JSON.stringify({ action: 'replay', since }),
      });

      expect(result).to.deep.equal({ statusCode: 200 });
      const eventQuery = ddbMock.commandCalls(QueryCommand)[1];
      expect(eventQuery.args[0].input.ExpressionAttributeValues[':cutoff']).to.equal(new Date(since).toISOString());
    });

    it('should scan all events when subscribed to *', async () => {
      ddbMock.on(QueryCommand).resolvesOnce({
        Items: [{ eventType: '*', connectionId: 'conn-abc' }],
      });
      ddbMock.on(ScanCommand).resolves({
        Items: [{ eventType: 'thing-updated', data: { type: 'thing-updated', timestamp: Date.now() } }],
      });
      apigwMock.on(PostToConnectionCommand).resolves({});

      const result = await replay({
        requestContext: { connectionId: 'conn-abc' },
      });

      expect(result).to.deep.equal({ statusCode: 200 });
      expect(ddbMock.commandCalls(ScanCommand).length).to.equal(1);
      expect(apigwMock.commandCalls(PostToConnectionCommand).length).to.equal(1);
    });
  });

  describe('subscribe', () => {
    it('should delete existing subscriptions and write new ones', async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: [{ eventType: 'thing-updated', connectionId: 'conn-abc' }],
      });
      ddbMock.on(DeleteCommand).resolves({});
      ddbMock.on(PutCommand).resolves({});

      const result = await subscribe({
        requestContext: { connectionId: 'conn-abc' },
        body: JSON.stringify({ action: 'subscribe', eventTypes: ['job-completed'] }),
      });

      expect(result).to.deep.equal({ statusCode: 200 });
      const deleteCalls = ddbMock.commandCalls(DeleteCommand);
      expect(deleteCalls.length).to.equal(1);
      expect(deleteCalls[0].args[0].input.Key.eventType).to.equal('thing-updated');
      const putCalls = ddbMock.commandCalls(PutCommand);
      expect(putCalls.length).to.equal(1);
      expect(putCalls[0].args[0].input.Item.eventType).to.equal('job-completed');
    });

    it('should delete all subscriptions when eventTypes is empty', async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: [{ eventType: 'thing-updated', connectionId: 'conn-abc' }],
      });
      ddbMock.on(DeleteCommand).resolves({});

      const result = await subscribe({
        requestContext: { connectionId: 'conn-abc' },
        body: JSON.stringify({ action: 'subscribe', eventTypes: [] }),
      });

      expect(result).to.deep.equal({ statusCode: 200 });
      const deleteCalls = ddbMock.commandCalls(DeleteCommand);
      expect(deleteCalls.length).to.equal(1);
      expect(ddbMock.commandCalls(PutCommand).length).to.equal(0);
    });

    it('should handle no existing subscriptions', async () => {
      ddbMock.on(QueryCommand).resolves({ Items: [] });
      ddbMock.on(PutCommand).resolves({});

      const result = await subscribe({
        requestContext: { connectionId: 'conn-abc' },
        body: JSON.stringify({ action: 'subscribe', eventTypes: ['thing-updated'] }),
      });

      expect(result).to.deep.equal({ statusCode: 200 });
      expect(ddbMock.commandCalls(PutCommand).length).to.equal(1);
    });

    it('should handle undefined Items from subscriptions query', async () => {
      ddbMock.on(QueryCommand).resolves({});
      ddbMock.on(PutCommand).resolves({});

      const result = await subscribe({
        requestContext: { connectionId: 'conn-abc' },
        body: JSON.stringify({ action: 'subscribe', eventTypes: ['thing-updated'] }),
      });

      expect(result).to.deep.equal({ statusCode: 200 });
    });

    it('should handle missing body', async () => {
      ddbMock.on(QueryCommand).resolves({ Items: [] });

      const result = await subscribe({
        requestContext: { connectionId: 'conn-abc' },
      });

      expect(result).to.deep.equal({ statusCode: 200 });
      expect(ddbMock.commandCalls(PutCommand).length).to.equal(0);
    });

    it('should default TTL to 7200 when CONNECTION_TTL_SECONDS is not set', async () => {
      delete process.env.CONNECTION_TTL_SECONDS;
      ddbMock.on(QueryCommand).resolves({ Items: [] });
      ddbMock.on(PutCommand).resolves({});

      const result = await subscribe({
        requestContext: { connectionId: 'conn-abc' },
        body: JSON.stringify({ action: 'subscribe', eventTypes: ['thing-updated'] }),
      });

      expect(result).to.deep.equal({ statusCode: 200 });
    });

    it('should normalize * to single catch-all subscription', async () => {
      ddbMock.on(QueryCommand).resolves({ Items: [] });
      ddbMock.on(PutCommand).resolves({});

      await subscribe({
        requestContext: { connectionId: 'conn-abc' },
        body: JSON.stringify({ action: 'subscribe', eventTypes: ['*', 'thing-updated'] }),
      });

      const putCalls = ddbMock.commandCalls(PutCommand);
      expect(putCalls.length).to.equal(1);
      expect(putCalls[0].args[0].input.Item.eventType).to.equal('*');
    });
  });
});
