import { debug as d } from 'debug';

import SnsConnector from '../connectors/sns';
import SqsConnector from '../connectors/sqs';
import Model from '../models/subscription';
import { subscribe, unsubscribe, longPoll } from './routes/subscription';
import { getClaims } from '../utils';

const api = require('lambda-api')();

api.use((req, res, next) => {
  res.cors();
  next();
});

api.post('/events', /* forRole('power'), */ longPoll);
api.put('/subscriptions', /* forRole('power'), */ subscribe);
api.delete('/subscriptions', /* forRole('admin'), */ unsubscribe);

export const handle = async (event, context) => { // eslint-disable-line import/prefer-default-export
  const debug = d(`handler${event.path.split('/').join(':')}`);
  debug('event: %j', event);
  // debug(`ctx: %j`, context);
  // debug(`env: %j`, process.env);

  const claims = { sub: event.headers.Authorization }; // getClaims(event.requestContext);

  api.app({
    debug,
    models: {
      subscription: new Model(
        debug,
        new SqsConnector(
          debug,
        ),
        new SnsConnector(
          debug,
        ),
        claims,
      ),
    },
  });

  return api.run(event, context);
};
