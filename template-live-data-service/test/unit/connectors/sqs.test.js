import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import debug from 'debug';
import AWS from 'aws-sdk-mock';

import Connector from '../../../src/connectors/sqs';

describe('connectors/sqs.js', () => {
  afterEach(() => {
    AWS.restore('SQS');
  });

  it('should create queue', async () => {
    const spy = sinon.spy((params, cb) => cb(null, {
      // ResponseMetadata: { RequestId: 'a48ea0de-d90c-51b2-8e0a-fa6f074613b6' },
      QueueUrl: 'https://sqs.us-west-2.amazonaws.com/123456789012/lvu-sub1',
    }));
    AWS.mock('SQS', 'createQueue', spy);

    const data = await new Connector(debug('sqs'))
      .createQueue({
        QueueName: 'lvu-sub1',
      });

    // console.log('data: ', data);

    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWith({
      QueueName: 'lvu-sub1',
    });
    expect(data).to.deep.equal({
      // ResponseMetadata: { RequestId: 'a48ea0de-d90c-51b2-8e0a-fa6f074613b6' },
      QueueUrl: 'https://sqs.us-west-2.amazonaws.com/123456789012/lvu-sub1',
    });
  });

  it('should delete queue', async () => {
    const spy = sinon.spy((params, cb) => cb(null, {
      ResponseMetadata: { RequestId: '58569d14-f405-5476-813b-c7a516af504b' },
    }));
    AWS.mock('SQS', 'deleteQueue', spy);

    const data = await new Connector(debug('sqs'))
      .deleteQueue({
        QueueUrl: 'https://sqs.us-west-2.amazonaws.com/123456789012/lvu-sub1',
      });

    // console.log('data: ', data);

    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWith({
      QueueUrl: 'https://sqs.us-west-2.amazonaws.com/123456789012/lvu-sub1',
    });
    expect(data).to.deep.equal({
      ResponseMetadata: { RequestId: '58569d14-f405-5476-813b-c7a516af504b' },
    });
  });

  it('should receive messages', async () => {
    const spy = sinon.spy((params, cb) => cb(null, {
      data: {
        Messages: [{ MessageId: '1' }],
      },
    }));
    AWS.mock('SQS', 'receiveMessage', spy);

    const data = await new Connector(debug('sqs'))
      .receiveMessage({
        QueueUrl: 'https://sqs.us-west-2.amazonaws.com/123456789012/lvu-sub1',
        WaitTimeSeconds: 20,
      });

    // console.log('data: ', data);

    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWith({
      QueueUrl: 'https://sqs.us-west-2.amazonaws.com/123456789012/lvu-sub1',
      WaitTimeSeconds: 20,
    });
    expect(data).to.deep.equal({
      data: {
        Messages: [{ MessageId: '1' }],
      },
    });
  });

  it('should delete messages', async () => {
    const spy = sinon.spy((params, cb) => cb(null, {
    }));
    AWS.mock('SQS', 'deleteMessageBatch', spy);

    const data = await new Connector(debug('sqs'))
      .deleteMessageBatch({
        QueueUrl: 'https://sqs.us-west-2.amazonaws.com/123456789012/lvu-sub1',
        Entries: [{
          Id: 'e9fd559d-ca23-4515-b24a-4adf471799f1',
          ReceiptHandle: 'AQEBvi77N8ma7KK8ad+oJZeyPeVmZTo8/5nTUEOk5KoJGloQFZwYaREST9w8pC2syAxi/6GL1T6wdhjq+2gHKhVnTkz6m54qS7sZoSqkoqhpkJj4s1kNLyqztaGYzf7eE1cmDOTWukYiJ/Tz1F5m00iDBH3wPG4pR1OQcBpDFp/UTAy8xGnX5yx9rGZ2HNk2d+myRhFQh0TE0uazP5XSBJAdnpid/XuibpuMso1LVGnOxbNh+8uivX6SqsWGGT/Kndx8z3JwdOjLxv18VdvjGWe4s8K5IXo4eZYlm/+kUhMlQRzd7Te8zXIKC1P/YM2Cal4uJ9gurtAYk7gu17Puq4iQqxBS1FB8UHChzbQ/j7E9A+hurDi+RU3Z40vmC4p9+6m3tuKY8/3sLCvea8D+gSygNQ==',
        }],
      });

    // console.log('data: ', data);

    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWith({
      QueueUrl: 'https://sqs.us-west-2.amazonaws.com/123456789012/lvu-sub1',
      Entries: [{
        Id: 'e9fd559d-ca23-4515-b24a-4adf471799f1',
        ReceiptHandle: 'AQEBvi77N8ma7KK8ad+oJZeyPeVmZTo8/5nTUEOk5KoJGloQFZwYaREST9w8pC2syAxi/6GL1T6wdhjq+2gHKhVnTkz6m54qS7sZoSqkoqhpkJj4s1kNLyqztaGYzf7eE1cmDOTWukYiJ/Tz1F5m00iDBH3wPG4pR1OQcBpDFp/UTAy8xGnX5yx9rGZ2HNk2d+myRhFQh0TE0uazP5XSBJAdnpid/XuibpuMso1LVGnOxbNh+8uivX6SqsWGGT/Kndx8z3JwdOjLxv18VdvjGWe4s8K5IXo4eZYlm/+kUhMlQRzd7Te8zXIKC1P/YM2Cal4uJ9gurtAYk7gu17Puq4iQqxBS1FB8UHChzbQ/j7E9A+hurDi+RU3Z40vmC4p9+6m3tuKY8/3sLCvea8D+gSygNQ==',
      }],
    });
    expect(data).to.deep.equal({
    });
  });
});
