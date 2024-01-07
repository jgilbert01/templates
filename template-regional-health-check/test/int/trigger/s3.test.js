import { handle } from '../../../src/trigger/s3';
import * as utils from '../../../src/utils';

describe('trigger/s3/index.js', () => {
  beforeAll(() => {
    require('baton-vcr-replay-for-aws-sdk'); // eslint-disable-line global-require
    jest.spyOn(utils, 'now').mockReturnValue(1668461435080);
  });
  afterEach(jest.restoreAllMocks);

  it('should test trigger integration', async () => {
    const res = await handle(EVENT, {});
    expect(res).toEqual('Success');
  });
});

const EVENT = {
  Records: [
    {
      messageId: 'dfe73913-b38c-4c41-ae1d-7859722fce00',
      receiptHandle: 'AQEBYvb6nrE6M2ThaOfGL66XoZAXRZSrgQAhoudvWWhemmoBTgwOgSQ8FpJr5O7fFtmr7xgOOxsAfc1zxsC1OfVOw+WDZszcdBB46OitSM0SF0bvMzpMASVYkAwv65tgPvc/sJpnEOJEnysEHDuGFF7Y+6WjmCBLVIqs1ZjdalWr0hO7Y9NKgo2AveKER3lNV8suAeBuKzMYETXj9gexUJ4S9FgqYE1Y6S0CCPcDQgQlPWkd4AEMk0SK3HNHKlJgVQp2+y8zkfKOXTvJ3ghMrlHMiPAiHQsN6VxP8En/1Hur3DBUOVvAw72p82uT2hBRRGOeuuEqEjSsybiX2/atW2cJ2Z+B1neT8EPPWjIMA/vxh4SzgUh4EsX/3+WfiZclnezaw20ixcgxhIPIeg5YJIjCb8AxTbJPgB7YHt3IFiQmkgBBHUKAqcvG9IbuKqcH4YXe',
      body: '{\n  "Type" : "Notification",\n  "MessageId" : "d3492b28-6d65-5315-be0d-77305cf51465",\n  "TopicArn" : "arn:aws:sns:us-west-2:123456789012:template-regional-health-check-np",\n  "Subject" : "Amazon S3 Notification",\n  "Message" : "{\\"Records\\":[{\\"eventVersion\\":\\"2.1\\",\\"eventSource\\":\\"aws:s3\\",\\"awsRegion\\":\\"us-west-2\\",\\"eventTime\\":\\"2022-12-17T21:06:23.394Z\\",\\"eventName\\":\\"ObjectCreated:Put\\",\\"userIdentity\\":{\\"principalId\\":\\"AWS:AROAQT33DE54B6YKBLFXM:awssaml-cli-x243319\\"},\\"requestParameters\\":{\\"sourceIPAddress\\":\\"108.28.81.130\\"},\\"responseElements\\":{\\"x-amz-request-id\\":\\"XD88PFTY5WX87C0N\\",\\"x-amz-id-2\\":\\"3qFC/cnVn/lEzWhcf7b9mJmXGSOn1soriT8d5WN5o8xJ0oiyW8Mjut63kyM58W7zHMXc79qmmYxPG2Wbq41F0vJRR2qKyv8b\\"},\\"s3\\":{\\"s3SchemaVersion\\":\\"1.0\\",\\"configurationId\\":\\"0765f322-3621-4c7a-9913-65c63c976b7a\\",\\"bucket\\":{\\"name\\":\\"my-template-regional-health-check-np-us-west-2\\",\\"ownerIdentity\\":{\\"principalId\\":\\"A23FZC4PMT9BPS\\"},\\"arn\\":\\"arn:aws:s3:::my-template-regional-health-check-np-us-west-2\\"},\\"object\\":{\\"key\\":\\"us-west-2/1668461460000\\",\\"size\\":149,\\"eTag\\":\\"56d37dc47d6c1b8bc581eda0fc72bfda\\",\\"versionId\\":\\"CHL9zC.dTK2nmo2kH9TGDUF1_ao2CqOe\\",\\"sequencer\\":\\"00639E2F4F576E0BB2\\"}}}]}",\n  "Timestamp" : "2022-12-17T21:06:24.288Z",\n  "SignatureVersion" : "1",\n  "Signature" : "JHmlI1WVR1hAb9Qec1qFvH8pQlFBXHMbxOLne4mok0rfRlj9vD3/s248DuZEMZ7CRUtnhqDNLa1c9xn0m/esN2tVQEJm8DlL/aDKEJk5EOnX4Q2QSVHjhT1AZt8UQJCOYLy7gUHz7kcRnpFpkoZwaaaoO7hKtqu1ozIQ0dih445mydpohBkshH7cN7Z+oWufDeLj1AVTj9wTEPaqi1QgRZIBZaAhDGKDbHEvu8odtzGmju0ne6KkRBID0c7lJyUUxv6szUUnGi6LOqaF2G+zxmuZbJRGlfysvGkkwFT2Wcb2SXV58Ovn1JYDy0qJBVZh5r7WgOgE1U8u3xGfJW1tiw==",\n  "SigningCertURL" : "https://sns.us-west-2.amazonaws.com/SimpleNotificationService-56e67fcb41f6fec09b0196692625d385.pem",\n  "UnsubscribeURL" : "https://sns.us-west-2.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-west-2:123456789012:template-regional-health-check-np:d84cb2f7-161d-46ef-aab8-517c01d5e69f"\n}',
      attributes: {
        ApproximateReceiveCount: '1',
        SentTimestamp: '1671311184326',
        SenderId: 'AIDAIYLAVTDLUXBIEIX46',
        ApproximateFirstReceiveTimestamp: '1671311184329',
      },
      messageAttributes: {},
      md5OfBody: 'e622f507abf09de0dd23ef8d0e4a467c',
      eventSource: 'aws:sqs',
      eventSourceARN: 'arn:aws:sqs:us-west-2:123456789012:template-regional-health-check-np-trigger',
      awsRegion: 'us-west-2',
    },
  ],
};
