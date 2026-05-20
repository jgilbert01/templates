import {
  initialize,
  initializeFrom,
  getSecrets,
  defaultOptions,
  toPromise,
} from 'aws-lambda-stream';
import _ from 'highland';

import RULES from './rules';

const OPTIONS = {
  ...defaultOptions,
  ...process.env,
  tableName: process.env.EVENT_TABLE_NAME,
};

const PIPELINES = {
  ...initializeFrom(RULES),
};

const { debug } = OPTIONS;

export class Handler {
  constructor(options = OPTIONS) {
    this.options = options;
  }

  handle(event, includeErrors = true) {
    return initialize(PIPELINES, this.options)
      .assemble(
        _([{ event }]),
        includeErrors,
      );
  }
}

export const handle = async (event, context, int = {}) => {
  debug('event: %j', event);
  debug('context: %j', context);

  const options = await getSecrets(OPTIONS);

  return new Handler({ ...options, ...int })
    .handle(event)
    .tap(debug)
    .through(toPromise);
};
