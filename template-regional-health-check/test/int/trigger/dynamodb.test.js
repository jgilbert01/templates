import { handle } from '../../../src/trigger/dynamodb';
import * as utils from '../../../src/utils';

describe('trigger/index.js', () => {
  beforeAll(() => {
    require('baton-vcr-replay-for-aws-sdk'); // eslint-disable-line global-require
    jest.spyOn(utils, 'now').mockReturnValue(1668461435080);
  });

  it('should test trigger integration', async () => {
    const res = await handle(EVENT, {});
    expect(res).toEqual('Success');
  });
});

const EVENT = {
  Records: [
    {
      eventID: 'b31620aefda12855fab119eb78ddae5b',
      eventName: 'INSERT',
      eventVersion: '1.1',
      eventSource: 'aws:dynamodb',
      awsRegion: 'us-west-2',
      dynamodb: {
        ApproximateCreationDateTime: 1668461435,
        Keys: {
          sk: {
            S: '1668461460000',
          },
          pk: {
            S: 'us-west-2',
          },
        },
        NewImage: {
          sk: {
            S: '1668461460000',
          },
          pk: {
            S: 'us-west-2',
          },
          ttl: {
            N: '1676410235',
          },
          awsregion: {
            S: 'us-west-2',
          },
          discriminator: {
            S: 'trace',
          },
          status: {
            S: 'STARTED',
          },
          timestamp: {
            N: '1668461435079',
          },
        },
        SequenceNumber: '9452900000000045795824346',
        SizeBytes: 127,
        StreamViewType: 'NEW_AND_OLD_IMAGES',
      },
      eventSourceARN:
        'arn:aws:dynamodb:us-west-2:123456789012:table/template-regional-health-check-np-entities/stream/2022-11-12T21:46:16.836',
    },
  ],
};