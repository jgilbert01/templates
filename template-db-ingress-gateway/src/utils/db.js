import _ from 'highland';

import Connector from '../connectors/db';

export const select = (/* istanbul ignore next */{ // eslint-disable-line import/prefer-default-export
  debug,
  CONNECTION_STRING,
  USER_NAME,
  PWD,
  // timeout = Number(process.env.ORACLE_TIMEOUT) || Number(process.env.TIMEOUT) || 1000,
  selectRequestField = 'sqlRequest',
  selectResponseField = 'sqlResponse',
  parallel = Number(process.env.QUERY_PARALLEL) || Number(process.env.PARALLEL) || 4,
} = {}) => {
  const connector = new Connector({
    debug,
    user: USER_NAME,
    password: PWD,
    connectString: CONNECTION_STRING,
  });

  const invoke = (uow) => {
    let Marker;

    return _((push, next) => {
      connector.select(uow[selectRequestField].sql, uow[selectRequestField].bindParams)
        .then((data) => {
          debug('select: %j', data);

          // if (data.IsTruncated) {
          //   Marker = data.NextMarker;
          // } else {
          //   Marker = undefined;
          // }

          data.forEach((row) => {
            push(null, {
              ...uow,
              // [selectRequestField]: params,
              [selectResponseField]: {
                count: data.length,
                row,
              },
            });
          });
        })
        .catch(/* istanbul ignore next */(err) => {
          err.uow = uow;
          push(err, null);
        })
        .finally(() => {
          /* istanbul ignore if */
          if (Marker) {
            next();
          } else {
            push(null, _.nil);
          }
        });
    });
  };

  return (s) => s
    .map(invoke)
    .parallel(parallel);
};
