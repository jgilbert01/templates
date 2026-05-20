import { ttl, updateExpression, timestampCondition } from 'aws-lambda-stream';
import {
  toTimestamp, formatDates, mapper, sortKeyTransform, DEFAULT_OMIT_FIELDS,
} from '../utils';

export const getField = (uow, fieldName) => (uow.event.raw.new || /* istanbul ignore next */ uow.event.raw.old)[fieldName];

export const toTableGetRequest = (uow, rule) => {
  const data = uow.event.raw.new || /* istanbul ignore next */ uow.event.raw.old;

  const Keys = Object.keys(rule.table.columns)
    .reduce((a, columnName) => {
      const metadata = rule.table.columns[columnName];
      if (metadata.fk) {
        const value = data[columnName];
        /* istanbul ignore else */
        if (value) {
          const { discriminator } = rule.tablesByName[metadata.fk.tableName];
          return [...a, {
            pk: `${discriminator}|${value}`,
            sk: discriminator,
          }];
        }
      }

      return a;
    }, []);

  return {
    RequestItems: {
      [rule.tableName]: {
        Keys,
      },
    },
  };
};

export const toTableUpdateRequest = (uow, rule) => {
  const { discriminator, idColumn } = rule.table;
  const data = formatDates(uow.event.raw.data);

  return {
    Key: {
      pk: `${discriminator}|${uow.event.raw.data[idColumn]}`,
      sk: discriminator,
    },
    ...updateExpression({
      discriminator,
      timestamp: toTimestamp(discriminator, data, uow.event.raw.metadata),
      ttl: rule.ttl < 0 ? /* istanbul ignore next */ null : ttl(uow.event.timestamp, rule.ttl || /* istanbul ignore next */ 33),
      deleted: uow.event.type.endsWith('-deleted') ? /* istanbul ignore next */ true : null,
      pull: null,
      // data: rule.gsk1 ? data[rule.gsk1] : undefined,
      ...data,
      metadata: uow.event.raw.metadata,
    }),
    // ...(rule.ifExists
    //   ? {
    //     ConditionExpression: 'attribute_exists(#timestamp) AND #timestamp < :timestamp',
    //   }
    //   : timestampCondition()),
    ...timestampCondition(),
  };
};

export const toDomainUpdateRequest = (uow, rule) => {
  const data = uow.event.raw.new || /* istanbul ignore next */ uow.event.raw.old;

  const deleted = uow.event.type.endsWith('-deleted') || data.deleted || null;

  let mapped = mapObject(rule, uow, rule.table, data);
  if (rule.attribute) {
    mapped = {
      [rule.attribute]: mapped,
    };
  }

  return {
    Key: {
      pk: rule.pkPrefix ? `${rule.pkPrefix}|${data[rule.pkColumn]}` : `${data[rule.pkColumn]}`,
      sk: rule.alias ? `${rule.alias}|${data[rule.table.idColumn]}` : rule.discriminator,
    },
    ...updateExpression({
      discriminator: rule.discriminator,
      timestamp: toTimestamp(rule.table.prefix, data, uow.event.raw.metadata),
      ttl: rule.ttl < 0 ? null : ttl(uow.event.timestamp, rule.ttl || /* istanbul ignore next */ 33),
      deleted,
      ...mapped,
    }),
  };
};

const mapObject = (rule, uow, { columns }, src) => Object.keys(columns)
  .reduce((tgt, k) => {
    mapAttribute(rule, uow, src, tgt, k, columns[k]);
    return tgt;
  }, {});

const mapAttribute = (rule, uow, src, tgt, k, metadata) => {
  const { attribute, transform } = metadata;

  if (attribute || transform) {
    let value = src[k];

    if (transform) {
      value = transform({
        rule, uow, value, src, metadata, mapObject,
      });
    }

    tgt[attribute] = value;
  }
};

export const toDomainEvent = async (uow, rule) => {
  const data = uow.event.raw.new || /* istanbul ignore next */ uow.event.raw.old;

  // omit any old fields in the rows
  const junkKeys = Object.keys(data).filter((k) => k.startsWith(rule.table.prefix));
  const MAPPER = mapper({
    transform: { pk: sortKeyTransform },
    omit: [...DEFAULT_OMIT_FIELDS, ...junkKeys],
  });

  return {
    [rule.domainName]: await MAPPER(data),
    raw: undefined,
  };
};
