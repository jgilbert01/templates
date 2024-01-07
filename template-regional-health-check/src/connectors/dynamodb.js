/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
import { config, DynamoDB } from 'aws-sdk';
import Promise from 'bluebird';

import { updateExpression } from 'aws-lambda-stream';

config.setPromisesDependency(Promise);

class Connector {
  constructor({
    debug,
    tableName,
    timeout = Number(process.env.DYNAMODB_TIMEOUT) ||
      Number(process.env.TIMEOUT) ||
      1000,
  }) {
    this.debug = msg => debug('%j', msg);
    this.tableName = tableName || /* istanbul ignore next */ 'undefined';
    this.db = new DynamoDB.DocumentClient({
      httpOptions: {
        timeout,
      },
      logger: {
        log: /* istanbul ignore next */ msg =>
          debug('%s', msg.replace(/\n/g, '\r')),
      },
    });
  }

  update(Key, inputParams) {
    const params = {
      TableName: this.tableName,
      Key,
      ...updateExpression(inputParams),
    };

    return this.db
      .update(params)
      .promise()
      .tap(this.debug)
      .tapCatch(this.debug);
  }

  get(id) {
    const params = {
      TableName: this.tableName,
      Limit: 3,
      ScanIndexForward: false,
      KeyConditionExpression: '#pk = :pk',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      ExpressionAttributeValues: {
        ':pk': id,
      },
      ConsistentRead: true,
    };

    return this.db
      .query(params)
      .promise()
      .tap(this.debug)
      .tapCatch(this.debug)
      .then(data => data.Items);
  }
}

export default Connector;
