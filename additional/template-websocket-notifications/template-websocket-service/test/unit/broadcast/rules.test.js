import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { toEventBridgeRecord, DynamoDBConnector, ApiGatewayClientConnector } from 'aws-lambda-stream';

import { Handler } from '../../../src/broadcast';

const EVENT = {
  type: 'thing-updated',
  timestamp: 1548967023000,
  thing: { id: '00000000-0000-0000-0000-000000000000', name: 'thing0' },
};

describe('broadcast/rules.js', () => {
  beforeEach(() => {
    process.env.SUBSCRIPTIONS_TABLE = 'test-subscriptions';
    process.env.EVENTS_TABLE = 'test-events';
    process.env.EVENT_TYPE = 'thing-updated';
    process.env.EVENT_TTL_SECONDS = '1800';
    process.env.WEBSOCKET_ENDPOINT = 'https://test.execute-api.us-west-2.amazonaws.com/np';

    sinon.stub(DynamoDBConnector.prototype, 'query').resolves([
      { connectionId: 'conn-1' },
      { connectionId: 'conn-2' },
    ]);
    sinon.stub(DynamoDBConnector.prototype, 'update').resolves({});
    sinon.stub(ApiGatewayClientConnector.prototype, 'postToConnection').resolves({});
  });
  afterEach(sinon.restore);

  it('should broadcast to subscribers', (done) => {
    new Handler()
      .handle(toEventBridgeRecord(EVENT), false)
      .collect()
      .tap((collected) => {
        expect(collected.length).to.be.greaterThan(0);
        const broadcast = collected.find((c) => c.pipeline === 'b1');
        expect(broadcast).to.exist;
        expect(broadcast.event.type).to.equal('thing-updated');
      })
      .done(done);
  });

  it('should persist event to EVENTS_TABLE', (done) => {
    new Handler()
      .handle(toEventBridgeRecord(EVENT), false)
      .collect()
      .tap((collected) => {
        const persist = collected.find((c) => c.pipeline === 'p1');
        expect(persist).to.exist;
        expect(persist.event.type).to.equal('thing-updated');
        expect(persist.updateRequest.Key.eventType).to.equal('thing-updated');
      })
      .done(done);
  });

  it('should not broadcast or persist events with type *', (done) => {
    new Handler()
      .handle(toEventBridgeRecord({ type: '*', timestamp: Date.now() }), false)
      .collect()
      .tap((collected) => {
        expect(collected.find((c) => c.pipeline === 'b1')).to.not.exist;
        expect(collected.find((c) => c.pipeline === 'p1')).to.not.exist;
      })
      .done(done);
  });
});
