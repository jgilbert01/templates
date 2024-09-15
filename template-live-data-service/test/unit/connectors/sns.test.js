import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import debug from 'debug';
import AWS from 'aws-sdk-mock';

import Connector from '../../../src/connectors/sns';

describe('connectors/sns.js', () => {
  afterEach(() => {
    AWS.restore('SNS');
  });

  it('should subscribe', async () => {
    const spy = sinon.spy((params, cb) => cb(null, {
      ResponseMetadata: { RequestId: 'fc88a5cd-c9db-5fcc-8179-ff7c2857d6b2' },
      SubscriptionArn: 'arn:aws:sns:us-west-2:123456789012:event-live-update-service-stg:3dd9dd86-4730-4f07-8749-e6845a5c5314',
    }));
    AWS.mock('SNS', 'subscribe', spy);

    const data = await new Connector(debug('sns'))
      .subscribe({
        Protocol: 'sqs',
        TopicArn: 'arn:aws:sns:us-west-2:123456789012:event-live-update-service-stg',
        Endpoint: 'arn:aws:sqs:us-west-2:123456789012:lvu-sub1',
        ReturnSubscriptionArn: true,
      });

    // console.log('data: ', data);

    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWith({
      Protocol: 'sqs',
      TopicArn: 'arn:aws:sns:us-west-2:123456789012:event-live-update-service-stg',
      Endpoint: 'arn:aws:sqs:us-west-2:123456789012:lvu-sub1',
      ReturnSubscriptionArn: true,
    });
    expect(data).to.deep.equal({
      ResponseMetadata: { RequestId: 'fc88a5cd-c9db-5fcc-8179-ff7c2857d6b2' },
      SubscriptionArn: 'arn:aws:sns:us-west-2:123456789012:event-live-update-service-stg:3dd9dd86-4730-4f07-8749-e6845a5c5314',
    });
  });

  it('should unsubscribe', async () => {
    const spy = sinon.spy((params, cb) => cb(null, {
      ResponseMetadata: { RequestId: '09e727d9-91a3-58f8-b639-7d68738215d3' },
    }));
    AWS.mock('SNS', 'unsubscribe', spy);

    const data = await new Connector(debug('sns'))
      .unsubscribe({
        SubscriptionArn: 'arn:aws:sns:us-west-2:123456789012:event-live-update-service-stg:3dd9dd86-4730-4f07-8749-e6845a5c5314',
      });

    // console.log('data: ', data);

    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWith({
      SubscriptionArn: 'arn:aws:sns:us-west-2:123456789012:event-live-update-service-stg:3dd9dd86-4730-4f07-8749-e6845a5c5314',
    });
    expect(data).to.deep.equal({
      ResponseMetadata: { RequestId: '09e727d9-91a3-58f8-b639-7d68738215d3' },
    });
  });
});
