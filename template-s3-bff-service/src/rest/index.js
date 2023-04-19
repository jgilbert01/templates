import Connector from '../connectors/s3';
import Model from '../models/file';
import {
  queryFiles, getHistory, getFileSignedUrl, saveFile, deleteFile,
} from './routes/file';
import {
  debug,
  cors,
  errorHandler,
  getClaims, /* , forRole */
} from '../utils';

const api = require('lambda-api')({
  logger: {
    level: 'trace',
    access: true,
    detail: true,
    stack: true,
  },
});

const models = (req, res, next) => {
  const claims = getClaims(req.requestContext);
  const connector = new Connector(
    req.namespace.debug,
    process.env.BUCKET_NAME,
  );

  api.app({
    debug: req.namespace.debug,
    models: {
      file: new Model({
        debug: req.namespace.debug,
        connector,
        claims,
      }),
    },
  });

  return next();
};

api.use(cors);
api.use(debug(api));
api.use(errorHandler);
api.use(models);

['', `/api-${process.env.PROJECT}`]
  .forEach((prefix) => api.register((api) => { // eslint-disable-line no-shadow
    api.get('/files', queryFiles);
    api.get('/files/:discriminator', queryFiles);
    api.get('/files/:discriminator/:entityId', queryFiles);

    api.get('/files/:discriminator/:entityId/:fileId', getFileSignedUrl);

    api.get('/files/:discriminator/:entityId/:fileId/versions', getHistory);

    api.put('/files/:discriminator/:entityId/:fileId', /* forRole('power'), */ saveFile);
    api.delete('/files/:discriminator/:entityId/:fileId', /* forRole('admin'), */ deleteFile);
  }, { prefix }));

// eslint-disable-next-line import/prefer-default-export
export const handle = async (event, context) => api.run(event, context);
