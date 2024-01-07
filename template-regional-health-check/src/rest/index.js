import Connector from '../connectors/dynamodb';
import Model from '../models/trace';
import { check } from './routes/trace';
import { debug as d, errorHandler } from '../utils';

const api = require('lambda-api')({
  logger: {
    level: 'trace',
    access: true,
    detail: true,
    stack: true,
  },
});

api.use(errorHandler);

api.get('/check', check);

export const handle = async (event, context) => {
  const debug = d('handler');
  debug('event: %j', event);
  // debug('ctx: %j', context);
  // debug('env: %j', process.env);

  const connector = new Connector({
    debug,
    tableName: process.env.ENTITY_TABLE_NAME,
  });

  api.app({
    debug,
    models: {
      trace: new Model({
        debug,
        connector,
        unhealthyFlag: process.env.UNHEALTHY === 'true',
      }),
    },
  });

  return api.run(event, context);
};
