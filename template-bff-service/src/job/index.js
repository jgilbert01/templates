import {
  initialize,
  defaultOptions,
  fromCron,
  toPromise,
} from 'aws-lambda-stream';

import { job } from './job';

const OPTIONS = { ...defaultOptions };

const PIPELINES = {
  job,
};

const { debug } = OPTIONS;

export class Handler {
  constructor(options = OPTIONS) {
    this.options = options;
  }

  handle(event, includeErrors = true) {
    return initialize(PIPELINES, this.options)
      .assemble(
        fromCron(event),
        includeErrors,
      );
  }
}

export const handle = async (event, context, int = {}) => {
  debug('event: %j', event);
  debug('context: %j', context);

  return new Handler({ ...OPTIONS, ...int })
    .handle(event)
    .through(toPromise);
};
