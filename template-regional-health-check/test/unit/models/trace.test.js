import debug from 'debug';

import * as utils from '../../../src/utils';
import Connector from '../../../src/connectors/dynamodb';
import Model, { toUpdateRequest } from '../../../src/models/trace';

describe('models/thing.js', () => {
  beforeEach(() => {
    jest.spyOn(utils, 'now').mockReturnValue(1669052447000);
  });
  afterEach(jest.restoreAllMocks);

  it('should save', async () => {
    const stub = jest.spyOn(Connector.prototype, 'update')
      .mockResolvedValue({});

    const connector = new Connector({
      debug: debug('db'),
      tableName: 't1',
    });

    const model = new Model({
      debug: debug('model'),
      connector,
    });

    const data = await model.save();

    expect(stub).toHaveBeenCalledOnce();
    expect(stub).toHaveBeenCalledWith({
      pk: 'us-west-2',
      sk: '1669052400000',
    }, {
      discriminator: 'trace',
      latched: null,
      status: 'STARTED',
      timestamp: 1669052447000,
      ttl: 1677001247,
      awsregion: 'us-west-2',
    });
    expect(data).toEqual({});
  });

  it('should get by id', async () => {
    const stub = jest.spyOn(Connector.prototype, 'get')
      .mockResolvedValue([
        {
          pk: 'us-west-2',
          sk: '1669052460000',
          discriminator: 'trace',
          status: 'STARTED',
          timestamp: 1669052447000,
        },
        {
          pk: 'us-west-2',
          sk: '1669052400000',
          discriminator: 'trace',
          status: 'COMPLETED',
          timestamp: 1669052404000,
        },
      ]);

    const connector = new Connector({
      debug: debug('db'),
      tableName: 't1',
    });

    const model = new Model({
      debug: debug('model'),
      connector,
    });

    const data = await model.get();

    expect(stub).toHaveBeenCalledOnce();
    expect(stub).toHaveBeenCalledWith('us-west-2');
    expect(data).toEqual([
      {
        pk: 'us-west-2',
        sk: '1669052460000',
        discriminator: 'trace',
        timestamp: 1669052447000,
        status: 'STARTED',
      },
      {
        pk: 'us-west-2',
        sk: '1669052400000',
        discriminator: 'trace',
        timestamp: 1669052404000,
        status: 'COMPLETED',
      },
    ]);
  });

  it('should check out unhealthy - simulated', async () => {
    jest.spyOn(utils, 'now').mockReturnValue(1668255480000);

    const model = new Model({
      debug: debug('model'),
      unhealthyFlag: true,
    });

    const data = await model.check();

    expect(data).toEqual({
      statusCode: 503,
      timestamp: 1668255480000,
      region: 'us-west-2',
    });
  });

  it('should check out healthy', async () => {
    jest.spyOn(utils, 'now').mockReturnValue(1668255480000);
    const stub1 = jest.spyOn(Connector.prototype, 'get')
      .mockResolvedValue([
        {
          pk: 'us-west-2',
          sk: '1668255420000',
          discriminator: 'trace',
          status: 'COMPLETED',
          timestamp: 1668255420000,
        },
      ]);
    const stub2 = jest.spyOn(Connector.prototype, 'update')
      .mockResolvedValue({});

    const connector = new Connector({
      debug: debug('db'),
      tableName: 't1',
    });

    const model = new Model({
      debug: debug('model'),
      connector,
    });

    const data = await model.check();

    expect(stub1).toHaveBeenCalledOnce();
    expect(stub2).toHaveBeenCalledOnce();
    expect(data).toEqual({
      statusCode: 200,
      timestamp: 1668255480000,
      region: 'us-west-2',
      incomplete: false,
      elapsed: 1,
      get: [
        {
          pk: 'us-west-2',
          sk: '1668255420000',
          discriminator: 'trace',
          timestamp: 1668255420000,
          status: 'COMPLETED',
        },
      ],
      save: {},
    });
  });

  it('should check - unhealthy', async () => {
    jest.spyOn(utils, 'now').mockReturnValue(1668255480000);
    const stub1 = jest.spyOn(Connector.prototype, 'get')
      .mockResolvedValue([
        {
          pk: 'us-west-2',
          sk: '1668255420000',
          discriminator: 'trace',
          status: 'STARTED',
          timestamp: 1668255420000,
        },
      ]);
    const stub2 = jest.spyOn(Connector.prototype, 'update')
      .mockResolvedValue({});

    const connector = new Connector({
      debug: debug('db'),
      tableName: 't1',
    });

    const model = new Model({
      debug: debug('model'),
      connector,
    });

    const data = await model.check();

    expect(stub1).toHaveBeenCalledOnce();
    expect(stub2).toHaveBeenCalledOnce();
    expect(data).toEqual({
      statusCode: 503,
      timestamp: 1668255480000,
      region: 'us-west-2',
      incomplete: true,
      elapsed: 1,
      get: [
        {
          pk: 'us-west-2',
          sk: '1668255420000',
          discriminator: 'trace',
          timestamp: 1668255420000,
          status: 'STARTED',
        },
      ],
      save: {},
    });
  });

  it('should map to update request', () => {
    const uow = {
      event: {
        timestamp: 1669052404000,
        type: 'trace-created',
        raw: {
          new: {
            sk: '1669052400000',
            timestamp: 1669052404000,
          }
        }
      },
    };

    // console.log(toUpdateRequest(uow));

    expect(toUpdateRequest(uow)).toEqual({
      Key: {
        pk: 'us-west-2',
        sk: '1669052400000',
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
        ':timestamp': 1669052447000,
        ':latency': 43,
        ':latched': true,
        ':ttl': 1677001204,
        ':awsregion': 'us-west-2',
      },
      UpdateExpression: 'SET #status = :status, #discriminator = :discriminator, #timestamp = :timestamp, #latency = :latency, #latched = :latched, #ttl = :ttl, #awsregion = :awsregion',
      ReturnValues: 'ALL_NEW',
      ConditionExpression: 'attribute_not_exists(#timestamp) OR #timestamp < :timestamp',
    });
  });
});
