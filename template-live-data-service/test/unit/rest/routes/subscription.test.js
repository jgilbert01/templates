import 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';

import Model from '../../../../src/models/subscription';
import { subscribe, longPoll, unsubscribe } from '../../../../src/rest/routes/subscription';

class Response {
  constructor() {
    this.status = sinon.stub().returns(this);
    this.json = sinon.spy((data) => data);
  }
}

describe('rest/routes/subscription.js', () => {
  afterEach(sinon.restore);

  it('should subscribe', async () => {
    const stub = sinon.stub(Model.prototype, 'subscribe').resolves({
      SubscriptionArn: 'arn:aws:sns:us-west-2:123456789012:template-live-data-service-stg:f717e298-a091-456b-b3f5-de1421ad9d1e',
    });

    const request = {
      namespace: {
        models: {
          subscription: new Model(undefined, undefined, undefined, { sub: 'sub1' }),
        },
      },
    };
    const response = new Response();

    const data = await subscribe(request, response);

    expect(stub).to.have.been.calledWith();

    expect(response.status).to.have.been.calledWith(200);
    expect(response.json).to.have.been.calledWith({
      SubscriptionArn: 'arn:aws:sns:us-west-2:123456789012:template-live-data-service-stg:f717e298-a091-456b-b3f5-de1421ad9d1e',
    });
    expect(data).to.deep.equal({
      SubscriptionArn: 'arn:aws:sns:us-west-2:123456789012:template-live-data-service-stg:f717e298-a091-456b-b3f5-de1421ad9d1e',
    });
  });

  it('should long poll', async () => {
    const stub = sinon.stub(Model.prototype, 'longPoll').resolves({
      Messages: [{ MessageId: '1' }],
    });

    const request = {
      namespace: {
        models: {
          subscription: new Model(undefined, undefined, undefined, { sub: 'sub1' }),
        },
      },
    };
    const response = new Response();

    const data = await longPoll(request, response);

    expect(stub).to.have.been.calledWith();

    expect(response.status).to.have.been.calledWith(200);
    expect(response.json).to.have.been.calledWith({
      Messages: [{ MessageId: '1' }],
    });
    expect(data).to.deep.equal({
      Messages: [{ MessageId: '1' }],
    });
  });

  it('should unsubscribe', async () => {
    const stub = sinon.stub(Model.prototype, 'unsubscribe').resolves({
      ResponseMetadata: { RequestId: '5bd643e4-53d2-56f5-a00c-1e88e165781d' },
    });

    const request = {
      namespace: {
        models: {
          subscription: new Model(undefined, undefined, undefined, { sub: 'sub1' }),
        },
      },
      body: {
        SubscriptionArn: 'arn:aws:sns:us-west-2:123456789012:template-live-data-service-stg:f717e298-a091-456b-b3f5-de1421ad9d1e',
      },
    };
    const response = new Response();

    const data = await unsubscribe(request, response);

    expect(stub).to.have.been.calledWith({
      SubscriptionArn: 'arn:aws:sns:us-west-2:123456789012:template-live-data-service-stg:f717e298-a091-456b-b3f5-de1421ad9d1e',
    });

    expect(response.status).to.have.been.calledWith(200);
    expect(response.json).to.have.been.calledWith({
      ResponseMetadata: { RequestId: '5bd643e4-53d2-56f5-a00c-1e88e165781d' },
    });
    expect(data).to.deep.equal({
      ResponseMetadata: { RequestId: '5bd643e4-53d2-56f5-a00c-1e88e165781d' },
    });
  });
});
