import { toDynamodbRecords, S3Connector, EventBridgeConnector } from 'aws-lambda-stream';

import * as utils from '../../../../src/utils';
import { Handler } from '../../../../src/trigger/dynamodb';

describe('trigger/dynamodb/rules.js', () => {
  beforeEach(() => {
    jest.spyOn(utils, 'now').mockReturnValue(1600349040394);
    jest.spyOn(S3Connector.prototype, 'putObject').mockResolvedValue({});
  });
  afterEach(jest.restoreAllMocks);

  it('should verify rule t1', (done) => {

    new Handler()
      .handle(toDynamodbRecords([
        {
          timestamp: 1548967023,
          keys: {
            pk: 'us-west-2',
            sk: '1548967022000',
          },
          newImage: {
            pk: 'us-west-2',
            sk: '1548967022000',
            discriminator: 'trace',
            timestamp: 1548967023000,
            ttl: 1551818222,
            status: 'STARTED',
          },
        },
      ]), false)
      .collect()
      // .tap((collected) => console.log(JSON.stringify(collected, null, 2)))
      .tap((collected) => {
        expect(collected.length).toEqual(1);
        expect(collected[0].pipeline).toEqual('t1');
        expect(collected[0].putRequest).toEqual({
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
      })
      .done(done);
  });
});
