import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { toEventBridgeRecord, DynamoDBConnector, ApiGatewayClientConnector } from 'aws-lambda-stream';

import { handle } from '../../../src/broadcast';

describe('broadcast/index.js', () => {
  beforeEach(() => {
    process.env.SUBSCRIPTIONS_TABLE = 'test-subscriptions';
    process.env.EVENTS_TABLE = 'test-events';
    process.env.EVENT_TYPE = 'thing-updated';
    process.env.EVENT_TTL_SECONDS = '1800';
    process.env.WEBSOCKET_ENDPOINT = 'https://test.execute-api.us-west-2.amazonaws.com/np';

    sinon.stub(DynamoDBConnector.prototype, 'query').resolves([
      { connectionId: 'conn-1' },
    ]);
    sinon.stub(DynamoDBConnector.prototype, 'update').resolves({});
    sinon.stub(ApiGatewayClientConnector.prototype, 'postToConnection').resolves({});
  });
  afterEach(sinon.restore);

  it('should resolve as the Lambda handler', async () => {
    const result = await handle(
      toEventBridgeRecord({
        type: 'thing-updated',
        timestamp: 1548967023000,
        thing: { id: '00000000-0000-0000-0000-000000000000', name: 'thing0' },
      }),
      {},
    );

    expect(result).to.equal('Success');
  });
});
