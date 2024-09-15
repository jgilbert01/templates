/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
import { config, SQS } from 'aws-sdk';
import Promise from 'bluebird';

config.setPromisesDependency(Promise);

class Connector {
  constructor(
    debug,
    timeout = Number(process.env.SQS_TIMEOUT) || Number(process.env.TIMEOUT) || 1000 * 21,
  ) {
    this.debug = debug;
    this.sqs = new SQS({
      httpOptions: {
        timeout,
        // agent: sslAgent,
      },
      logger: { log: /* istanbul ignore next */ (msg) => this.debug(msg) },
    });
  }

  createQueue(params) {
    return this.sqs.createQueue(params).promise()
      .tap(this.debug)
      .tapCatch(this.debug);
  }

  deleteQueue(params) {
    return this.sqs.deleteQueue(params).promise()
      .tap(this.debug)
      .tapCatch(this.debug);
  }

  receiveMessage(params) {
    return this.sqs.receiveMessage(params).promise()
      .tap(this.debug)
      .tapCatch(this.debug);
  }

  deleteMessageBatch(params) {
    // TODO retry
    return this.sqs.deleteMessageBatch(params).promise()
      .tap(this.debug)
      .tapCatch(this.debug);
  }
}

export default Connector;
