export const debug = (api) => (req, res, next) => {
  api.app({
    debug: require('debug')(`handler${req.app._event.path.split('/').join(':')}`),
  });

  req.namespace.debug('event: %j', req.app._event);
  // req.namespace.debug(`ctx: %j`, req.app._context);
  // req.namespace.debug(`env: %j`, process.env);

  return next();
};

export const cors = (req, res, next) => {
  res.cors();
  return next();
};

export const now = () => Date.now();

export const errorHandler = (err, req, res, next) => {
  // console.log('errorHandler: ', err.code, err);
  if (err.code) {
    res.status(err.code).json({ Message: err.message });
  }
  next();
};

export * from './jwt';
export * from './mapper';
