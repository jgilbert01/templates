import {
  initialize,
  initializeFrom,
  defaultOptions,
  decryptChangeEvent,
  fromDynamodb,
  toPromise,
} from 'aws-lambda-stream';

import RULES from './rules';

const OPTIONS = {
  ...defaultOptions,
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

  handle(event, includeErrors = !process.env.IS_OFFLINE) {
    return initialize(PIPELINES, this.options)
      .assemble(
        fromDynamodb(event, this.options)
          .through(decryptChangeEvent({
            ...this.options,
          })),
        includeErrors,
      );
  }
}

export const handle = async (event, context) => {
  debug('event: %j', event);
  debug('context: %j', context);

  return new Handler(OPTIONS)
    .handle(event)
    .through(toPromise);
};
