import get from 'lodash/get';

export const getClaims = (requestContext) => ({
  ...(requestContext.authorizer?.claims || requestContext.authorizer || {}),
  username: getUsername(requestContext),
  userGroups: getUserGroups(requestContext),
});

export const getUsername = (requestContext) => get(requestContext, 'authorizer.claims.sub', requestContext.authorizer?.principalId || '');

export const getUserGroups = (requestContext) => {
  const groups = get(requestContext, 'authorizer.claims.cognito:groups', []);
  if (typeof groups === 'string') {
    return groups.split(',');
  }
  return groups;
};

export const forRole = (role) => (req, res, next) => { // eslint-disable-line consistent-return
  const groups = getUserGroups(req.requestContext);
  if (groups.includes(role)) {
    return next();
  } else {
    res.error(401, 'Unauthorized');
  }
};
