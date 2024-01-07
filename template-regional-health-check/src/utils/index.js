// eslint-disable-next-line global-require
export const debug = cat => require('debug')(cat);

export const now = () => Date.now();

export function roundToNearestMinute(epoch) {
  const minutes = 1;
  const ms = 1000 * 60 * minutes;
  return new Date(Math.floor(epoch / ms) * ms).getTime();
}

export const errorHandler = (err, req, res, next) => {
  // console.log('errorHandler: ', err.code, err);
  if (err.code) {
    res.status(err.code).json({ Message: err.message });
  }
  next();
};
