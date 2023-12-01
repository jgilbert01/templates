import {
  initialize,
  initializeFrom,
  defaultOptions,
  fromKinesis,
  toPromise,
} from 'aws-lambda-stream';

import RULES from './rules';

const OPTIONS = {
  ...defaultOptions,
  source: 'external',
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
        fromKinesis(event),
        includeErrors,
      );
  }
}

export const handle = async (event, context, int = {}) => { // eslint-disable-line import/prefer-default-export
  debug('event: %j', event);
  debug('context: %j', context);

  return new Handler({ ...OPTIONS, ...int })
    .handle(event)
    .tap(debug)
    .through(toPromise);
};
