import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { DynamoDBConnector } from 'aws-lambda-stream';

import { toMessage, toConnections, toUpdateRequest } from '../../../src/models/websocket';

describe('models/websocket.js', () => {
  beforeEach(() => {
    process.env.SUBSCRIPTIONS_TABLE = 'test-subscriptions';
    process.env.EVENTS_TABLE = 'test-events';
    process.env.EVENT_TTL_SECONDS = '1800';
  });
  afterEach(sinon.restore);

  describe('toMessage', () => {
    it('should format event as a WebSocket message', () => {
      const uow = { event: { type: 'thing-updated', timestamp: 1548967023000, thing: {} } };
      const msg = toMessage(uow);
      expect(msg.type).to.equal('thing-updated');
      expect(msg.data).to.equal(uow.event);
      expect(msg.timestamp).to.equal(1548967023000);
    });

    it('should fall back to Date.now() when event has no timestamp', () => {
      const msg = toMessage({ event: { type: 'thing-updated' } });
      expect(msg.timestamp).to.be.a('number');
    });
  });

  describe('toConnections', () => {
    it('should return connections for both specific and catch-all subscribers', async () => {
      sinon.stub(DynamoDBConnector.prototype, 'query')
        .onFirstCall().resolves([{ connectionId: 'conn-specific' }])
        .onSecondCall()
        .resolves([{ connectionId: 'conn-catchall' }]);

      const connections = await toConnections({ event: { type: 'thing-updated' } });
      expect(connections).to.deep.include({ connectionId: 'conn-specific' });
      expect(connections).to.deep.include({ connectionId: 'conn-catchall' });
      expect(connections.length).to.equal(2);
    });

    it('should deduplicate connectionIds that appear in both specific and catch-all', async () => {
      sinon.stub(DynamoDBConnector.prototype, 'query')
        .onFirstCall().resolves([{ connectionId: 'conn-1' }])
        .onSecondCall()
        .resolves([{ connectionId: 'conn-1' }, { connectionId: 'conn-2' }]);

      const connections = await toConnections({ event: { type: 'thing-updated' } });
      expect(connections.length).to.equal(2);
      expect(connections.map((c) => c.connectionId)).to.have.members(['conn-1', 'conn-2']);
    });
  });

  describe('toUpdateRequest', () => {
    it('should produce a valid DynamoDB update expression for the event', () => {
      const uow = { event: { type: 'thing-updated', id: 'abc' } };
      const req = toUpdateRequest(uow);
      expect(req.Key.eventType).to.equal('thing-updated');
      expect(req.Key.timestamp).to.be.a('string');
      expect(req.ExpressionAttributeValues[':data']).to.equal(uow.event);
      expect(req.ExpressionAttributeValues[':ttl']).to.be.a('number');
      expect(req.TableName).to.equal(process.env.EVENTS_TABLE);
    });
  });
});
