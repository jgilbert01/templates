import 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import debug from 'debug';

import Model from '../../../src/models/subscription';
import SqsConnector from '../../../src/connectors/sqs';
import SnsConnector from '../../../src/connectors/sns';

describe('models/subscription.js', () => {
  afterEach(sinon.restore);

  it('should subscribe', async () => {
    const stub1 = sinon.stub(SqsConnector.prototype, 'createQueue')
      .resolves({
        ResponseMetadata: { RequestId: '3e6ac069-17ef-56ee-bb2c-9d05b8bbf741' },
        QueueUrl: 'https://sqs.us-west-2.amazonaws.com/123456789012/lvd-stg-sub1',
      });
    const stub2 = sinon.stub(SnsConnector.prototype, 'subscribe')
      .resolves({
        ResponseMetadata: {
          RequestId: '4233f3c8-8ed7-50ff-bd32-aea42182b092',
        },
        SubscriptionArn: 'arn:aws:sns:us-west-2:123456789012:template-live-data-service-stg:f717e298-a091-456b-b3f5-de1421ad9d1e',
      });

    const sqs = new SqsConnector(
      debug('test'),
    );

    const sns = new SnsConnector(
      debug('test'),
    );

    const model = new Model(
      debug('test'),
      sqs,
      sns,
      { sub: 'sub1' },
    );

    const data = await model.subscribe({
      FilterPolicy: {
        tags: {
          source: ['template-task-service'],
        },
      },
    });

    expect(stub1).to.have.been.calledOnce;
    expect(stub1).to.have.been.calledWith({
      QueueName: 'lvd-stg-sub1',
      Attributes: {
        MessageRetentionPeriod: '7200',
        Policy: '{"Statement":[{"Effect":"Allow","Principal":{"Service":"sns.amazonaws.com"},"Action":"sqs:SendMessage","Resource":"arn:aws:sqs:us-west-2:123456789012:lvd-stg-sub1","Condition":{"ArnEquals":{"aws:SourceArn":"arn:aws:sns:us-west-2:123456789012:template-live-data-service-stg"}}}]}',
      },
    });

    expect(stub2).to.have.been.calledOnce;
    expect(stub2).to.have.been.calledWith({
      Protocol: 'sqs',
      TopicArn: 'arn:aws:sns:us-west-2:123456789012:template-live-data-service-stg',
      Endpoint: 'arn:aws:sqs:us-west-2:123456789012:lvd-stg-sub1',
      ReturnSubscriptionArn: true,
      Attributes: {
        RawMessageDelivery: 'true',
        FilterPolicyScope: 'MessageBody',
        FilterPolicy: '{"tags":{"source":["template-task-service"]}}',
      },
    });

    expect(data).to.deep.equal({
      ResponseMetadata: {
        RequestId: '4233f3c8-8ed7-50ff-bd32-aea42182b092',
      },
      SubscriptionArn: 'arn:aws:sns:us-west-2:123456789012:template-live-data-service-stg:f717e298-a091-456b-b3f5-de1421ad9d1e',
    });
  });

  it('should long poll', async () => {
    const stub1 = sinon.stub(SqsConnector.prototype, 'deleteMessageBatch')
      .resolves({});

    const stub2 = sinon.stub(SqsConnector.prototype, 'receiveMessage')
      .resolves({
        Messages: [{
          MessageId: 'e9fd559d-ca23-4515-b24a-4adf471799f1',
          ReceiptHandle: 'AQEBvi77N8ma7KK8ad+oJZeyPeVmZTo8/5nTUEOk5KoJGloQFZwYaREST9w8pC2syAxi/6GL1T6wdhjq+2gHKhVnTkz6m54qS7sZoSqkoqhpkJj4s1kNLyqztaGYzf7eE1cmDOTWukYiJ/Tz1F5m00iDBH3wPG4pR1OQcBpDFp/UTAy8xGnX5yx9rGZ2HNk2d+myRhFQh0TE0uazP5XSBJAdnpid/XuibpuMso1LVGnOxbNh+8uivX6SqsWGGT/Kndx8z3JwdOjLxv18VdvjGWe4s8K5IXo4eZYlm/+kUhMlQRzd7Te8zXIKC1P/YM2Cal4uJ9gurtAYk7gu17Puq4iQqxBS1FB8UHChzbQ/j7E9A+hurDi+RU3Z40vmC4p9+6m3tuKY8/3sLCvea8D+gSygNQ==',
          Body: JSON.stringify({
            id: '1',
            type: 'task-updated',
            raw: {
              new: {
                id: '1',
                type: 't0',
                status: 's1',
                timestamp: 1693236475001,
              },
            },
          }),
        }],
      });

    const sqs = new SqsConnector(
      debug('test'),
    );

    const model = new Model(
      debug('test'),
      sqs,
      undefined,
      { sub: 'sub1' },
    );

    const data = await model.longPoll({
      ack: [{
        Id: 'e9fd559d-ca23-4515-b24a-4adf471799f1',
        ReceiptHandle: 'AQEBvi77N8ma7KK8ad+oJZeyPeVmZTo8/5nTUEOk5KoJGloQFZwYaREST9w8pC2syAxi/6GL1T6wdhjq+2gHKhVnTkz6m54qS7sZoSqkoqhpkJj4s1kNLyqztaGYzf7eE1cmDOTWukYiJ/Tz1F5m00iDBH3wPG4pR1OQcBpDFp/UTAy8xGnX5yx9rGZ2HNk2d+myRhFQh0TE0uazP5XSBJAdnpid/XuibpuMso1LVGnOxbNh+8uivX6SqsWGGT/Kndx8z3JwdOjLxv18VdvjGWe4s8K5IXo4eZYlm/+kUhMlQRzd7Te8zXIKC1P/YM2Cal4uJ9gurtAYk7gu17Puq4iQqxBS1FB8UHChzbQ/j7E9A+hurDi+RU3Z40vmC4p9+6m3tuKY8/3sLCvea8D+gSygNQ==',
      }],
    });

    expect(stub1).to.have.been.calledOnce;
    expect(stub1).to.have.been.calledWith({
      QueueUrl: 'https://sqs.us-west-2.amazonaws.com/123456789012/lvd-stg-sub1',
      Entries: [
        {
          Id: 'e9fd559d-ca23-4515-b24a-4adf471799f1',
          ReceiptHandle: 'AQEBvi77N8ma7KK8ad+oJZeyPeVmZTo8/5nTUEOk5KoJGloQFZwYaREST9w8pC2syAxi/6GL1T6wdhjq+2gHKhVnTkz6m54qS7sZoSqkoqhpkJj4s1kNLyqztaGYzf7eE1cmDOTWukYiJ/Tz1F5m00iDBH3wPG4pR1OQcBpDFp/UTAy8xGnX5yx9rGZ2HNk2d+myRhFQh0TE0uazP5XSBJAdnpid/XuibpuMso1LVGnOxbNh+8uivX6SqsWGGT/Kndx8z3JwdOjLxv18VdvjGWe4s8K5IXo4eZYlm/+kUhMlQRzd7Te8zXIKC1P/YM2Cal4uJ9gurtAYk7gu17Puq4iQqxBS1FB8UHChzbQ/j7E9A+hurDi+RU3Z40vmC4p9+6m3tuKY8/3sLCvea8D+gSygNQ==',
        },
      ],
    });

    expect(stub2).to.have.been.calledOnce;
    expect(stub2).to.have.been.calledWith({
      QueueUrl: 'https://sqs.us-west-2.amazonaws.com/123456789012/lvd-stg-sub1',
      WaitTimeSeconds: 20,
    });

    expect(data).to.deep.equal({
      messages: [{
        Id: 'e9fd559d-ca23-4515-b24a-4adf471799f1',
        ReceiptHandle: 'AQEBvi77N8ma7KK8ad+oJZeyPeVmZTo8/5nTUEOk5KoJGloQFZwYaREST9w8pC2syAxi/6GL1T6wdhjq+2gHKhVnTkz6m54qS7sZoSqkoqhpkJj4s1kNLyqztaGYzf7eE1cmDOTWukYiJ/Tz1F5m00iDBH3wPG4pR1OQcBpDFp/UTAy8xGnX5yx9rGZ2HNk2d+myRhFQh0TE0uazP5XSBJAdnpid/XuibpuMso1LVGnOxbNh+8uivX6SqsWGGT/Kndx8z3JwdOjLxv18VdvjGWe4s8K5IXo4eZYlm/+kUhMlQRzd7Te8zXIKC1P/YM2Cal4uJ9gurtAYk7gu17Puq4iQqxBS1FB8UHChzbQ/j7E9A+hurDi+RU3Z40vmC4p9+6m3tuKY8/3sLCvea8D+gSygNQ==',
      }],
      data: [
        {
          id: '1',
          type: 'task-updated',
          raw: {
            new: {
              id: '1',
              type: 't0',
              status: 's1',
              timestamp: 1693236475001,
            },
          },
        },
      ],
    });
  });

  it('should unsubscribe', async () => {
    const stub1 = sinon.stub(SqsConnector.prototype, 'deleteQueue')
      .resolves({
      });
    const stub2 = sinon.stub(SnsConnector.prototype, 'unsubscribe')
      .resolves({
        ResponseMetadata: { RequestId: '5bd643e4-53d2-56f5-a00c-1e88e165781d' },
      });

    const sqs = new SqsConnector(
      debug('test'),
    );

    const sns = new SnsConnector(
      debug('test'),
    );

    const model = new Model(
      debug('test'),
      sqs,
      sns,
      { sub: 'sub1' },
    );

    const data = await model.unsubscribe({
      SubscriptionArn: 'arn:aws:sns:us-west-2:123456789012:template-live-data-service-stg:4d8d9cf3-dcca-49ff-b0c4-28a999c98ac7',
    });

    expect(stub1).to.have.been.calledOnce;
    expect(stub1).to.have.been.calledWith({
      QueueUrl: 'https://sqs.us-west-2.amazonaws.com/123456789012/lvd-stg-sub1',
    });

    expect(stub2).to.have.been.calledOnce;
    expect(stub2).to.have.been.calledWith({
      SubscriptionArn: 'arn:aws:sns:us-west-2:123456789012:template-live-data-service-stg:4d8d9cf3-dcca-49ff-b0c4-28a999c98ac7',
    });

    expect(data).to.deep.equal({
    });
  });
});
