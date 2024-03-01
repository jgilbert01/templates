import 'mocha';
import { expect } from 'chai';

import { toKinesisRecords, toSqsEventRecords } from 'aws-lambda-stream';
import lambdaTest from 'aws-lambda-stream/utils/lambda-test';

const invoke = lambdaTest({ functionName: `${process.env.npm_package_name}-dev-listener` });

describe('listener/index.js', () => {
  it('should test listener integration', async () => {
    const res = await invoke(EVENT);
    expect(res.Payload).toEqual('Success');
  });
});

const EVENT = toSqsEventRecords([{
  id: 'a24f9cdaec8ead2781353ef13e942f42',
  type: 'thing-created',
  partitionKey: '00000000-0000-0000-0000-000000000000',
  timestamp: 1600485986000,
  tags: {
    account: 'dev',
    region: 'us-west-2',
    stage: 'stg',
    source: 'template-bff-service',
    functionname: 'undefined',
    pipeline: 't1',
    skip: false,
  },
  thing: {
    lastModifiedBy: 'offlineContext_authorizer_principalId',
    timestamp: 1600349040394,
    id: '00000000-0000-0000-0000-000000000000',
  },
}]);
