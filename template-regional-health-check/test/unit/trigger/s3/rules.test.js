import { toSqsSnsS3Records, EventBridgeConnector, S3Connector } from 'aws-lambda-stream';

import * as utils from '../../../../src/utils';
import { Handler } from '../../../../src/trigger/s3';

describe('trigger/s3/rules.js', () => {
  beforeEach(() => {
    jest.spyOn(utils, 'now').mockReturnValue(1600349040394);
    jest.spyOn(EventBridgeConnector.prototype, 'putEvents').mockResolvedValue({ FailedEntryCount: 0 });
    jest.spyOn(S3Connector.prototype, 'getObject').mockResolvedValue({
      Key: 'us-west-2/1548967022000',
      Body: JSON.stringify({
        id: '0',
        type: 'trace-created',
        partitionKey: 'us-west-2',
        timestamp: 1548967023000,
        tags: {
          region: 'us-west-2',
        },
        raw: {
          new: {
            pk: 'us-west-2',
            sk: '1548967022000',
            discriminator: 'trace',
            timestamp: 1548967023000,
            ttl: 1551818222,
            status: 'STARTED',
          },
        },
      }),
    });
  });
  afterEach(jest.restoreAllMocks);

  it('should verify rule t1', (done) => {
    new Handler()
      .handle(toSqsSnsS3Records([{
        bucket: {
          name: 'my-bucket',
        },
        object: {
          key: 'us-west-2/1548967022000',
        },
      }]), false)
      .collect()
      .tap((collected) => console.log(JSON.stringify(collected, null, 2)))
      .tap((collected) => {
        expect(collected.length).toEqual(1);
        expect(collected[0].pipeline).toEqual('t1');
        expect(collected[0].publishRequest).toEqual({
          Entries: [{
            EventBusName: 'undefined',
            Source: 'custom',
            DetailType: 'trace-created',
            Detail: JSON.stringify({
              id: '0',
              type: 'trace-created',
              partitionKey: 'us-west-2',
              timestamp: 1548967023000,
              tags: {
                account: 'undefined',
                region: 'us-west-2',
                stage: 'undefined',
                source: 'undefined',
                functionname: 'undefined',
                pipeline: 't1',
                skip: true,
              },
              raw: {
                new: {
                  pk: 'us-west-2',
                  sk: '1548967022000',
                  discriminator: 'trace',
                  timestamp: 1548967023000,
                  ttl: 1551818222,
                  status: 'STARTED',
                },
              },
            }),
          }],
        });
      })
      .done(done);
  });
});
