/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import Promise from 'bluebird';
import _ from 'highland';
import { updateExpression } from 'aws-lambda-stream';

class Connector {
  constructor(
    debug,
    tableName,
    timeout = Number(process.env.DYNAMODB_TIMEOUT) || Number(process.env.TIMEOUT) || 1000,
  ) {
    this.debug = (msg) => debug('%j', msg);
    this.tableName = tableName || /* istanbul ignore next */ 'undefined';
    this.db = DynamoDBDocumentClient.from(new DynamoDBClient({
      requestHandler: new NodeHttpHandler({
        requestTimeout: timeout,
        connectionTimeout: timeout,
      }),
      logger: { log: /* istanbul ignore next */ (msg) => debug('%s', msg.replace(/\n/g, '\r')) },
    }));
  }

  update(Key, inputParams) {
    const params = {
      TableName: this.tableName,
      Key,
      ...updateExpression(inputParams),
    };

    return this._executeCommand(new UpdateCommand(params))
      .tap(this.debug)
      .tapCatch(this.debug);
  }

  batchUpdate(batch) {
    return Promise.all(
      batch.map((req) => this.update(req.key, req.inputParams)),
    );
  }

  get(id, IndexName, pk) {
    const params = {
      TableName: this.tableName,
      IndexName,
      KeyConditionExpression: '#pk = :pk',
      ExpressionAttributeNames: {
        '#pk': pk || 'pk',
      },
      ExpressionAttributeValues: {
        ':pk': id,
      },
      ConsistentRead: !IndexName,
    };

    return this._executeCommand(new QueryCommand(params))
      .tap(this.debug)
      .tapCatch(this.debug)
      .then((data) => data.Items);
    // TODO assert data.LastEvaluatedKey
  }

  query({
    index, keyName, keyValue, last, limit, ScanIndexForward,
    FilterExpression,
    ExpressionAttributeNames = {},
    ExpressionAttributeValues = {},
  }) {
    const params = {
      TableName: this.tableName,
      IndexName: index,
      Limit: limit || /* istanbul ignore next */ 25,
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

    let cursor = last ? JSON.parse(Buffer.from(last, 'base64').toString()) : undefined;
    let itemsCount = 0;
    let nextLast;

    return _((push, next) => {
      params.ExclusiveStartKey = cursor;
      return this._executeCommand(new QueryCommand(params))
        .tap(this.debug)
        .tapCatch(this.debug)
        .then((data) => {
          itemsCount += data.Items.length;
          if (data.LastEvaluatedKey && itemsCount < params.Limit) {
            cursor = data.LastEvaluatedKey;
          } else {
            nextLast = data.LastEvaluatedKey;
            cursor = undefined;
          }

          data.Items.forEach((obj) => {
            push(null, obj);
          });
        })
        .catch(/* istanbul ignore next */(err) => {
          push(err, null);
        })
        .finally(() => {
          if (cursor) {
            next();
          } else {
            push(null, _.nil);
          }
        });
    })
      .collect()
      .map((data) => ({
        last: nextLast
          ? Buffer.from(JSON.stringify(nextLast)).toString('base64')
          : undefined,
        data,
      }))
      .toPromise(Promise);
  }

  queryAll({
    index, keyName, keyValue, ScanIndexForward,
    FilterExpression,
    ExpressionAttributeNames = {},
    ExpressionAttributeValues = {},
  }) {
    const params = {
      TableName: this.tableName,
      IndexName: index,
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

    let cursor;
    // let itemsCount = 0;

    return _((push, next) => {
      params.ExclusiveStartKey = cursor;
      return this._executeCommand(new QueryCommand(params))
        .tap(this.debug)
        .tapCatch(this.debug)
        .then((data) => {
          if (data.LastEvaluatedKey) {
            cursor = data.LastEvaluatedKey;
          } else {
            cursor = undefined;
          }

          data.Items.forEach((obj) => {
            push(null, obj);
          });
        })
        .catch(/* istanbul ignore next */(err) => {
          push(err, null);
        })
        .finally(() => {
          if (cursor) {
            next();
          } else {
            push(null, _.nil);
          }
        });
    })
      .collect()
      .map((data) => ({ data }))
      .toPromise(Promise);
  }

  _executeCommand(command) {
    return Promise.resolve(this.db.send(command))
      .tap(this.debug)
      .tapCatch(this.debug);
  }
}

export default Connector;
