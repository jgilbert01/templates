import debug from 'debug';
import AWS from 'aws-sdk-mock';

import Connector from '../../../src/connectors/dynamodb';

describe('connectors/dynamodb.js', () => {
  afterEach(() => {
    AWS.restore('DynamoDB.DocumentClient');
    jest.restoreAllMocks();
  });

  it('should update', async () => {
    const spy = jest.fn((params, cb) => cb(null, {}));
    AWS.mock('DynamoDB.DocumentClient', 'update', spy);

    const data = await new Connector({ debug: debug('db'), tableName: 't1' })
      .update({
        pk: '00000000-0000-0000-0000-000000000000',
        sk: 'thing',
      }, {
        name: 'thing0',
        timestamp: 1600051691001,
      });

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith({
      TableName: 't1',
      Key: {
        pk: '00000000-0000-0000-0000-000000000000',
        sk: 'thing',
      },
      ExpressionAttributeNames: { '#name': 'name', '#timestamp': 'timestamp' },
      ExpressionAttributeValues: { ':name': 'thing0', ':timestamp': 1600051691001 },
      UpdateExpression: 'SET #name = :name, #timestamp = :timestamp',
      ReturnValues: 'ALL_NEW',
    }, expect.anything());
    expect(data).toEqual({});
  });

  it('should get by id', async () => {
    const spy = jest.fn((params, cb) => cb(null, {
      Items: [{
        pk: '00000000-0000-0000-0000-000000000000',
        sk: 'thing',
        name: 'thing0',
        timestamp: 1600051691001,
      }],
    }));

    AWS.mock('DynamoDB.DocumentClient', 'query', spy);

    const data = await new Connector({ debug: debug('db'), tableName: 't1' })
      .get('00000000-0000-0000-0000-000000000000');

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith({
      TableName: 't1',
      Limit: 3,
      ScanIndexForward: false,
      KeyConditionExpression: '#pk = :pk',
      ExpressionAttributeNames: { '#pk': 'pk' },
      ExpressionAttributeValues: { ':pk': '00000000-0000-0000-0000-000000000000' },
      ConsistentRead: true,
    }, expect.anything());
    expect(data).toEqual([{
      pk: '00000000-0000-0000-0000-000000000000',
      sk: 'thing',
      name: 'thing0',
      timestamp: 1600051691001,
    }]);
  });
});
