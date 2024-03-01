import {
  initialize,
  initializeFrom,
  defaultOptions,
  decryptEvent,
  fromKinesis,
  fromSqsEvent,
  getSecrets,
  prefilterOnEventTypes,
  toPromise,
} from 'aws-lambda-stream';

import RULES from './rules';

const OPTIONS = {
  ...defaultOptions,
  // ...process.env,
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
        fromSqsEvent(event)
        // fromKinesis(event)
          .through(decryptEvent({
            ...this.options,
            prefilter: prefilterOnEventTypes(RULES),
          })),
        includeErrors,
      );
  }
}

export const handle = async (event, context) => {
  debug('event: %j', event);
  debug('context: %j', context);

  // const options = await getSecrets(OPTIONS);

  return new Handler(OPTIONS)
    .handle(event)
    .through(toPromise);
};
