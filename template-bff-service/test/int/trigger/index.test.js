import 'mocha';
import { expect } from 'chai';

import lambdaTest from 'aws-lambda-stream/utils/lambda-test';

const invoke = lambdaTest({ functionName: `${process.env.npm_package_name}-dev-trigger` });

describe('trigger/index.js', () => {
  it('should test trigger integration', async () => {
    const res = await invoke(EVENT);
    expect(res.Payload).toEqual('Success');
  });
});

const EVENT = {
  Records: [{
    eventID: 'a24f9cdaec8ead2781353ef13e942f42',
    eventName: 'INSERT',
    eventVersion: '1.1',
    eventSource: 'aws:dynamodb',
    awsRegion: 'us-west-2',
    dynamodb: {
      ApproximateCreationDateTime: 1600485986,
      Keys: { sk: { S: 'thing' }, pk: { S: '00000000-0000-0000-0000-000000000000' } },
      NewImage: {
        deleted: { NULL: true }, lastModifiedBy: { S: 'offlineContext_authorizer_principalId' }, sk: { S: 'thing' }, discriminator: { S: 'thing' }, latched: { NULL: true }, pk: { S: '00000000-0000-0000-0000-000000000000' }, ttl: { N: '1601299440' }, timestamp: { N: '1600349040394' },
      },
      SequenceNumber: '7062900000000002294748234',
      SizeBytes: 183,
      StreamViewType: 'NEW_AND_OLD_IMAGES',
    },
    eventSourceARN: 'arn:aws:dynamodb:us-west-2:0123456789012:table/stg-template-task-service-entities/stream/2020-09-17T13:17:40.955',
  }, {
    eventID: 'a24f9cdaec8ead2781353ef13e942f42',
    eventName: 'INSERT',
    eventVersion: '1.1',
    eventSource: 'aws:dynamodb',
    awsRegion: 'us-west-2',
    dynamodb: {
      ApproximateCreationDateTime: 1600485986,
      Keys: { sk: { S: 'job' }, pk: { S: '00000000-0000-0000-0000-000000000000' } },
      NewImage: {
        sk: { S: 'job' }, discriminator: { S: 'job' }, pk: { S: '00000000-0000-0000-0000-000000000000' },
      },
      SequenceNumber: '7062900000000002294748234',
      SizeBytes: 183,
      StreamViewType: 'NEW_AND_OLD_IMAGES',
    },
    eventSourceARN: 'arn:aws:dynamodb:us-west-2:0123456789012:table/stg-template-task-service-entities/stream/2020-09-17T13:17:40.955',
  }],
};
