/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
import { config, SNS } from 'aws-sdk';
import Promise from 'bluebird';

config.setPromisesDependency(Promise);

class Connector {
  constructor(
    debug,
    timeout = Number(process.env.SQS_TIMEOUT) || Number(process.env.TIMEOUT) || 1000,
  ) {
    this.debug = debug;
    this.sns = new SNS({
      httpOptions: {
        timeout,
        // agent: sslAgent,
      },
      logger: { log: /* istanbul ignore next */ (msg) => this.debug(msg) },
    });
  }

  subscribe(params) {
    return this.sns.subscribe(params).promise()
      .tap(this.debug)
      .tapCatch(this.debug);
  }

  unsubscribe(params) {
    return this.sns.unsubscribe(params).promise()
      .tap(this.debug)
      .tapCatch(this.debug);
  }
}

export default Connector;
