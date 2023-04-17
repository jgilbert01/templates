/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
import { config, DynamoDB } from 'aws-sdk';
import Promise from 'bluebird';
import merge from 'lodash/merge';

config.setPromisesDependency(Promise);

export const updateExpression = (Item) => {
  const keys = Object.keys(Item);

  const ExpressionAttributeNames = keys
    .filter((attrName) => Item[attrName] !== undefined)
    .map((attrName) => ({ [`#${attrName}`]: attrName }))
    .reduce(merge, {});

  const ExpressionAttributeValues = keys
    .filter((attrName) => Item[attrName] !== undefined && Item[attrName] !== null)
    .map((attrName) => ({ [`:${attrName}`]: Item[attrName] }))
    .reduce(merge, {});

  let UpdateExpression = `SET ${keys
    .filter((attrName) => Item[attrName] !== undefined && Item[attrName] !== null)
    .map((attrName) => `#${attrName} = :${attrName}`)
    .join(', ')}`;

  const UpdateExpressionRemove = keys
    .filter((attrName) => Item[attrName] === null)
    .map((attrName) => `#${attrName}`)
    .join(', ');

  if (UpdateExpressionRemove.length) {
    UpdateExpression = `${UpdateExpression} REMOVE ${UpdateExpressionRemove}`;
  }

  return {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
    ReturnValues: 'ALL_NEW',
  };
};

class Connector {
  constructor(
    debug,
    tableName,
    timeout = Number(process.env.DYNAMODB_TIMEOUT) || Number(process.env.TIMEOUT) || 1000,
  ) {
    this.debug = (msg) => debug('%j', msg);
    this.tableName = tableName || /* istanbul ignore next */ 'undefined';
    this.db = new DynamoDB.DocumentClient({
      httpOptions: {
        timeout,
      },
      logger: { log: /* istanbul ignore next */ (msg) => debug('%s', msg.replace(/\n/g, '\r')) },
    });
  }

  update(Key, inputParams) {
    const params = {
      TableName: this.tableName,
      Key,
      ...updateExpression(inputParams),
    };

    return this.db.update(params).promise()
      .tap(this.debug)
      .tapCatch(this.debug);
  }

  batchUpdate(batch) {
    return Promise.all(
      batch.map((req) => this.update(req.key, req.inputParams)),
    );
  }

  get(id) {
    const params = {
      TableName: this.tableName,
      KeyConditionExpression: '#pk = :pk',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      ExpressionAttributeValues: {
        ':pk': id,
      },
      ConsistentRead: true,
    };

    return this.db.query(params).promise()
      .tap(this.debug)
      .tapCatch(this.debug)
      .then((data) => data.Items);
    // TODO assert data.LastEvaluatedKey
  }

  query({
    index, keyName, keyValue, last, ScanIndexForward,
    FilterExpression,
    ExpressionAttributeNames = {},
    ExpressionAttributeValues = {},
  }) {
    const { tableName, db } = this;
    const params = {
      TableName: tableName,
      IndexName: index,
      ExclusiveStartKey: last ? JSON.parse(Buffer.from(last, 'base64').toString()) : undefined,
      KeyConditionExpression: '#keyName = :keyName', // and begins_with(#rangeName, :rangeBeginsWithValue)
      ExpressionAttributeNames: {
        '#keyName': keyName,
        // '#rangeName': rangeName,
        ...ExpressionAttributeNames,
      },
      ExpressionAttributeValues: {
        ':keyName': keyValue,
        // ':rangeBeginsWithValue': rangeBeginWithValue,
        ...ExpressionAttributeValues,
      },
      FilterExpression,
      ScanIndexForward,
    };

    return db.query(params).promise()
      .then((data) => ({
        last: data.LastEvaluatedKey
          ? Buffer.from(JSON.stringify(data.LastEvaluatedKey)).toString('base64')
          : undefined,
        data: data.Items,
      }));
    // TODO recurse when there is a LastEvaluatedKey and
    //      we are below some minimum Items size
  }
}

export default Connector;
