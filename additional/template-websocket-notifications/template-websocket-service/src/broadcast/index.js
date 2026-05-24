import {
  initialize,
  initializeFrom,
  defaultOptions,
  fromEventBridge,
  toPromise,
} from 'aws-lambda-stream';

import RULES from './rules';

const OPTIONS = { ...defaultOptions };

const PIPELINES = {
  ...initializeFrom(RULES),
};

const { debug } = OPTIONS;

/**
 * Handler class for the broadcast Lambda function.
 */
export class Handler {
  constructor(options = OPTIONS) {
    this.options = options;
  }

  handle(event, includeErrors = true) {
    return initialize(PIPELINES, this.options)
      .assemble(
        fromEventBridge(event),
        includeErrors,
      );
  }
}

/**
 * The Lambda handler function, which initializes the Handler class and invokes the handle() method.
 * The handle() method returns a stream, which is converted to a Promise that resolves when the stream completes.
 * The broadcast pipeline defined in RULES will query the SUBSCRIPTIONS_TABLE for any connections subscribed to the event's type, and post the event data to those connections using the ApiGatewayManagementApiClient.
 * The event data is also persisted to the EVENTS_TABLE with a TTL, so that it can be replayed to new connections that subscribe to the event type after the fact.
 * The handler returns a 200 status code to the client regardless of whether the PostToConnectionCommand calls succeed or fail, since the client will trigger the replay route to receive any missed events after connection.
 */
export const handle = async (event, context, int = {}) => {
  debug('event: %j', event);
  debug('context: %j', context);

  return new Handler({ ...OPTIONS, ...int })
    .handle(event)
    .through(toPromise);
};
