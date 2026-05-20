import _omit from 'lodash/omit';
import merge from 'lodash/merge';
import moment from 'moment';

export const toTimestamp = (prefix, data, metadata) => {
  if (metadata?.operation === 'delete') {
    const date = new Date(metadata.timestamp);
    return date.getTime();
  } else {
    const key1 = `${prefix.toUpperCase()}_UPDATE_DT`;
    const key2 = `${prefix.toUpperCase()}_CREATE_DT`;
    const value = data[key1] || data[key2];
    const date = new Date(value);
    return date.getTime();
  }
};

export const formatDates = (row) => Object.keys(row).reduce((a, c) => {
  /* istanbul ignore else */
  if (row[c] instanceof Date) {
    a[c] = moment(row[c]).utc().format('yyyy-MM-DDTHH:mm:ss[Z]');
  } else {
    a[c] = row[c];
  }
  return a;
}, {});

export const DEFAULT_OMIT_FIELDS = [
  'pk',
  'sk',
  'data',
  'discriminator',
  'ttl',
  'latched',
  'deleted',
  'aws:rep:updateregion',
  'aws:rep:updatetime',
  'aws:rep:deleting',
];

export const DEFAULT_RENAME = { pk: 'id' };

export const sortKeyTransform = (v) => v.split('|')[1];

export const deletedFilter = (i) => !i.deleted;

export const mapper = ({
  defaults = {},
  rename = DEFAULT_RENAME,
  omit = DEFAULT_OMIT_FIELDS,
  transform = {},
} = {}) => async (o, ctx = {}) => {
  const transformed = {
    ...o,
    ...(await Object.keys(transform).reduce(async (a, k) => {
      a = await a;
      if (o[k]) a[k] = await transform[k](o[k], ctx);
      return a;
    }, {})),
  };

  const renamed = {
    ...o,
    ...Object.keys(rename).reduce((a, k) => {
      if (transformed[k]) a[rename[k]] = transformed[k];
      return a;
    }, {}),
  };

  return ({
    ...defaults,
    ..._omit(renamed, omit),
  });
};

// https://advancedweb.hu/how-to-use-async-functions-with-array-reduce-in-javascript/

export const aggregateMapper = ({
  aggregate,
  cardinality,
  mappers,
  delimiter = '|',
}) => async (items, ctx = {}) => items
  .filter(deletedFilter)
  .reduce(async (a, c) => {
    a = await a;
    const mappings = mappers[c.discriminator] || /* istanbul ignore next */ (async (o) => o);
    const mapped = await mappings(c, ctx);

    if (c.discriminator === aggregate) {
      return {
        ...mapped,
        ...a,
      };
    } else {
      const role = c.sk.split(delimiter)[0];
      if (!a[role]) {
        if (cardinality[role] > 1) {
          a[role] = [mapped];
        } else {
          a[role] = mapped;
        }
      } else {
        // TODO check cardinality and throw
        a[role].push(mapped);
      }

      return a;
    }
  }, {});

export const updateExpression = (Item) => {
  const { pk, sk, ...rest } = Item;
  const keys = Object.keys(rest);

  const ExpressionAttributeNames = keys
    .filter((attrName) => Item[attrName] !== undefined)
    .map((attrName) => ({ [`#${attrName}`]: attrName }))
    .reduce(merge, {});

  const ExpressionAttributeValues = keys
    .filter((attrName) => Item[attrName] !== undefined && Item[attrName] !== null)
    .map((attrName) => ({ [`:${attrName}`]: Item[attrName] }))
    .reduce(merge, {});

  let UpdateExpression = `SET ${keys
    .filter((attrName) => Item[attrName] !== undefined && Item[attrName] !== null)
    .map((attrName) => `#${attrName} = :${attrName}`)
    .join(', ')}`;

  const UpdateExpressionRemove = keys
    .filter((attrName) => Item[attrName] === null)
    .map((attrName) => `#${attrName}`)
    .join(', ');

  if (UpdateExpressionRemove.length) {
    UpdateExpression = `${UpdateExpression} REMOVE ${UpdateExpressionRemove}`;
  }

  return {
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    UpdateExpression,
    ReturnValues: 'ALL_NEW',
  };
};
