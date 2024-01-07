import { toKinesisRecords } from 'aws-lambda-stream';

import { handle } from '../../../src/trigger/kinesis';
import * as utils from '../../../src/utils';

describe('trigger/kinesis/index.js', () => {
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

const EVENT = toKinesisRecords([{
    id: 'b31620aefda12855fab119eb78ddae5b',
    type: 'trace-created',
    partitionKey: 'us-west-2',
    timestamp: 1668461435000,
    tags: {
      account: 'np',
      region: 'us-west-2',
      stage: 'np',
      source: 'template-regional-health-check',
      functionname: 'undefined',
      pipeline: 't1',
      skip: true,
    },
    raw: {
      new: {
        sk: '1668461460000',
        pk: 'us-west-2',
        ttl: 1676410235,
        awsregion: 'us-west-2',
        discriminator: 'trace',
        status: 'STARTED',
        timestamp: 1668461435079,
      },
    },
  }]);
