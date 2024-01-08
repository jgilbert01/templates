import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import debug from 'debug';
import AWS from 'aws-sdk-mock';

import Connector from '../../../src/connectors/dynamodb';

describe('connectors/dynamodb.js', () => {
  afterEach(() => {
    AWS.restore('DynamoDB.DocumentClient');
  });

  it('should update', async () => {
    const spy = sinon.spy((params, cb) => cb(null, {}));
    AWS.mock('DynamoDB.DocumentClient', 'update', spy);

    const data = await new Connector(debug('db'), 't1')
      .update({
        pk: '00000000-0000-0000-0000-000000000000',
        sk: 'thing',
      }, {
        name: 'thing0',
        timestamp: 1600051691001,
      });

    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWith({
      TableName: 't1',
      Key: {
        pk: '00000000-0000-0000-0000-000000000000',
        sk: 'thing',
      },
      ExpressionAttributeNames: { '#name': 'name', '#timestamp': 'timestamp' },
      ExpressionAttributeValues: { ':name': 'thing0', ':timestamp': 1600051691001 },
      UpdateExpression: 'SET #name = :name, #timestamp = :timestamp',
      ReturnValues: 'ALL_NEW',
    });
    expect(data).to.deep.equal({});
  });

  it('should get by id', async () => {
    const spy = sinon.spy((params, cb) => cb(null, {
      Items: [{
        pk: '00000000-0000-0000-0000-000000000000',
        sk: 'thing',
        name: 'thing0',
        timestamp: 1600051691001,
      }],
    }));

    AWS.mock('DynamoDB.DocumentClient', 'query', spy);

    const data = await new Connector(debug('db'), 't1')
      .get('00000000-0000-0000-0000-000000000000');

    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWith({
      TableName: 't1',
      IndexName: undefined,
      KeyConditionExpression: '#pk = :pk',
      ExpressionAttributeNames: { '#pk': 'pk' },
      ExpressionAttributeValues: { ':pk': '00000000-0000-0000-0000-000000000000' },
      ConsistentRead: true,
    });
    expect(data).to.deep.equal([{
      pk: '00000000-0000-0000-0000-000000000000',
      sk: 'thing',
      name: 'thing0',
      timestamp: 1600051691001,
    }]);
  });

  it('should query - page 1', async () => {
    const spy = sinon.spy((params, cb) => cb(null, {
      LastEvaluatedKey: { pk: '1', sk: 'thing' },
      Items: [{
        pk: '1',
        sk: 'thing',
        name: 'thing1',
        timestamp: 1600051691001,
      }],
    }));

    AWS.mock('DynamoDB.DocumentClient', 'query', spy);

    const data = await new Connector(debug('db'), 't1')
      .query({
        index: 'gsi1',
        keyName: 'discriminator',
        keyValue: 'thing',
        limit: 1,
      });

    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWith({
      TableName: 't1',
      IndexName: 'gsi1',
      Limit: 1,
      ExclusiveStartKey: undefined,
      KeyConditionExpression: '#keyName = :keyName',
      ExpressionAttributeNames: { '#keyName': 'discriminator' },
      ExpressionAttributeValues: { ':keyName': 'thing' },
      FilterExpression: undefined,
      ScanIndexForward: undefined,
    });
    expect(data).to.deep.equal({
      last: 'eyJwayI6IjEiLCJzayI6InRoaW5nIn0=',
      data: [{
        pk: '1',
        sk: 'thing',
        name: 'thing1',
        timestamp: 1600051691001,
      }],
    });
  });

  it('should query - page 1 - below limit', async () => {
    const spy = sinon.spy((params, cb) => cb(null, {
      LastEvaluatedKey: { pk: '1', sk: 'thing' },
      Items: [{
        pk: '1',
        sk: 'thing',
        name: 'thing1',
        timestamp: 1600051691001,
      }],
    }));

    AWS.mock('DynamoDB.DocumentClient', 'query', spy);

    const data = await new Connector(debug('db'), 't1')
      .query({
        index: 'gsi1',
        keyName: 'discriminator',
        keyValue: 'thing',
        limit: 2,
      });

    expect(spy).to.have.been.calledTwice;
    expect(spy).to.have.been.calledWith({
      TableName: 't1',
      IndexName: 'gsi1',
      Limit: 2,
      ExclusiveStartKey: { pk: '1', sk: 'thing' },
      KeyConditionExpression: '#keyName = :keyName',
      ExpressionAttributeNames: { '#keyName': 'discriminator' },
      ExpressionAttributeValues: { ':keyName': 'thing' },
      FilterExpression: undefined,
      ScanIndexForward: undefined,
    });
    expect(data).to.deep.equal({
      last: 'eyJwayI6IjEiLCJzayI6InRoaW5nIn0=',
      data: [{
        pk: '1',
        sk: 'thing',
        name: 'thing1',
        timestamp: 1600051691001,
      }, {
        pk: '1',
        sk: 'thing',
        name: 'thing1',
        timestamp: 1600051691001,
      }],
    });
  });

  it('should query - page 2', async () => {
    const spy = sinon.spy((params, cb) => cb(null, {
      Items: [{
        pk: '2',
        sk: 'thing',
        name: 'thing2',
        timestamp: 1600051691001,
      }],
    }));

    AWS.mock('DynamoDB.DocumentClient', 'query', spy);

    const data = await new Connector(debug('db'), 't1')
      .query({
        index: 'gsi1',
        keyName: 'discriminator',
        keyValue: 'thing',
        last: 'eyJwayI6IjEiLCJzayI6InRoaW5nIn0=',
        limit: 1,
      });

    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWith({
      TableName: 't1',
      IndexName: 'gsi1',
      Limit: 1,
      ExclusiveStartKey: { pk: '1', sk: 'thing' },
      KeyConditionExpression: '#keyName = :keyName',
      ExpressionAttributeNames: { '#keyName': 'discriminator' },
      ExpressionAttributeValues: { ':keyName': 'thing' },
      FilterExpression: undefined,
      ScanIndexForward: undefined,
    });
    expect(data).to.deep.equal({
      last: undefined,
      data: [{
        pk: '2',
        sk: 'thing',
        name: 'thing2',
        timestamp: 1600051691001,
      }],
    });
  });

  it('should query all', async () => {
    const responses = [
      {
        LastEvaluatedKey: { pk: '1', sk: 'thing' },
        Items: [{
          pk: '1',
          sk: 'thing',
          name: 'thing1',
          timestamp: 1600051691001,
        }],
      },
      {
        Items: [{
          pk: '2',
          sk: 'thing',
          name: 'thing2',
          timestamp: 1600051691001,
        }],
      },
    ];

    const spy = sinon.spy((params, cb) => cb(null, responses.shift()));

    AWS.mock('DynamoDB.DocumentClient', 'query', spy);

    const data = await new Connector(debug('db'), 't1')
      .queryAll({
        index: 'gsi1',
        keyName: 'discriminator',
        keyValue: 'thing',
      });

    expect(spy).to.have.been.calledTwice;
    // expect(spy).to.have.been.calledWith({
    //   TableName: 't1',
    //   IndexName: 'gsi1',
    //   ExclusiveStartKey: undefined,
    //   KeyConditionExpression: '#keyName = :keyName',
    //   ExpressionAttributeNames: { '#keyName': 'discriminator' },
    //   ExpressionAttributeValues: { ':keyName': 'thing' },
    //   FilterExpression: undefined,
    //   ScanIndexForward: undefined,
    // });
    expect(spy).to.have.been.calledWith({
      TableName: 't1',
      IndexName: 'gsi1',
      ExclusiveStartKey: { pk: '1', sk: 'thing' },
      KeyConditionExpression: '#keyName = :keyName',
      ExpressionAttributeNames: { '#keyName': 'discriminator' },
      ExpressionAttributeValues: { ':keyName': 'thing' },
      FilterExpression: undefined,
      ScanIndexForward: undefined,
    });
    expect(data).to.deep.equal({
      data: [{
        pk: '1',
        sk: 'thing',
        name: 'thing1',
        timestamp: 1600051691001,
      },
      {
        pk: '2',
        sk: 'thing',
        name: 'thing2',
        timestamp: 1600051691001,
      }],
    });
  });
});
