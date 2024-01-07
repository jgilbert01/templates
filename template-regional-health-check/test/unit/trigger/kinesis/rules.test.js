import { toKinesisRecords, DynamoDBConnector, S3Connector } from 'aws-lambda-stream';

import * as utils from '../../../../src/utils';
import { Handler } from '../../../../src/trigger/kinesis';

describe('trigger/kinesis/rules.js', () => {
  beforeEach(() => {
    jest.spyOn(utils, 'now').mockReturnValue(1600349040394);
    jest.spyOn(DynamoDBConnector.prototype, 'update').mockResolvedValue({});
  });
  afterEach(jest.restoreAllMocks);

  it('should verify rule t1', (done) => {
    new Handler()
      .handle(toKinesisRecords([{
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
      }]), false)
      .collect()
      // .tap((collected) => console.log(JSON.stringify(collected, null, 2)))
      .tap((collected) => {
        expect(collected.length).toEqual(1);
        expect(collected[0].pipeline).toEqual('t1');
        expect(collected[0].updateRequest).toEqual({
          Key: {
            pk: 'us-west-2',
            sk: '1548967022000',
          },
          ExpressionAttributeNames: {
            '#status': 'status',
            '#discriminator': 'discriminator',
            '#timestamp': 'timestamp',
            '#latency': 'latency',
            '#latched': 'latched',
            '#ttl': 'ttl',
            '#awsregion': 'awsregion',
          },
          ExpressionAttributeValues: {
            ':status': 'COMPLETED',
            ':discriminator': 'trace',
            ':timestamp': 1600349040394,
            ':latency': 51382017.394,
            ':latched': true,
            ':ttl': 1556915823,
            ':awsregion': 'us-west-2',
          },
          UpdateExpression: 'SET #status = :status, #discriminator = :discriminator, #timestamp = :timestamp, #latency = :latency, #latched = :latched, #ttl = :ttl, #awsregion = :awsregion',
          ReturnValues: 'ALL_NEW',
          ConditionExpression: 'attribute_not_exists(#timestamp) OR #timestamp < :timestamp',
        });
      })
      .done(done);
  });
});
