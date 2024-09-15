export const debug = require('debug')('handler');

export const getClaims = (requestContext) => ({
  ...(requestContext.authorizer?.claims || requestContext.authorizer || {}),
});
