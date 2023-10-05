import { updateExpression, timestampCondition } from 'aws-lambda-stream';
import invert from 'lodash/invert';

import {
  now, ttl, deletedFilter, aggregateMapper, mapper,
} from '../utils';

import * as Element from './element';

export const DISCRIMINATOR = 'thing';

export const MAPPER = mapper();

const AGGREGATE_MAPPER = aggregateMapper({
  aggregate: DISCRIMINATOR,
  cardinality: {
    [Element.ALIAS]: 999,
  },
  mappers: {
    [DISCRIMINATOR]: MAPPER,
    [Element.DISCRIMINATOR]: Element.MAPPER,
  },
});

class Model {
  constructor({
    debug,
    connector,
    claims = { username: 'system' },
  } = {}) {
    this.debug = debug;
    this.connector = connector;
    this.claims = claims;
  }

  query({ last, limit /* more params here */ }) {
    return this.connector
      .query({
        index: 'gsi1',
        keyName: 'discriminator',
        keyValue: DISCRIMINATOR,
        last,
        limit,
      })
      .then(async (response) => ({
        ...response,
        data: await Promise.all(response.data
          .filter(deletedFilter)
          .map((e) => MAPPER(e))),
      }));
  }

  get(id) {
    return this.connector.get(id)
      .then((data) => AGGREGATE_MAPPER(data));
  }

  save(id, input) {
    const { elements, ...thing } = input;
    const timestamp = now();
    const lastModifiedBy = this.claims.username;
    const deleted = null;
    const latched = null;
    const _ttl = ttl(timestamp, 33);
    const awsregion = process.env.AWS_REGION;

    return this.connector.batchUpdate([
      {
        key: {
          pk: id,
          sk: DISCRIMINATOR,
        },
        inputParams: {
          ...thing,
          discriminator: DISCRIMINATOR,
          timestamp,
          lastModifiedBy,
          deleted,
          latched,
          ttl: _ttl,
          awsregion,
        },
      },
      // elements are optional
      // they can be added/updated here but not deleted
      // they must be deleted individually
      ...(elements || []).map((d) => {
        const { id: elementId, ...element } = d;

        return {
          key: {
            pk: id.toString(),
            sk: `${Element.ALIAS}|${elementId}`,
          },
          inputParams: {
            lastModifiedBy,
            timestamp,
            ...element,
            discriminator: Element.DISCRIMINATOR,
            deleted,
            latched,
            ttl: _ttl,
            awsregion,
          },
        };
      }),
    ]);
  }

  delete(id) {
    const timestamp = now();
    return this.connector.update(
      {
        pk: id,
        sk: DISCRIMINATOR,
      },
      {
        discriminator: DISCRIMINATOR,
        deleted: true,
        lastModifiedBy: this.claims.username,
        latched: null,
        ttl: ttl(timestamp, 11),
        timestamp,
        awsregion: process.env.AWS_REGION,
      },
    );
  }
}

export default Model;

const STATUS_EVENT_MAP = {
  SUBMITTED: 'thing-submitted',
  RESUBMITTED: 'thing-resubmitted',
  REJECTED: 'thing-rejected',
  APPROVED: 'thing-approved',
};

const EVENT_STATUS_MAP = invert(STATUS_EVENT_MAP);

const OUTCOME_STATUS_MAP = {
  resubmitted: 'RESUBMITTED',
  rejected: 'REJECTED',
  approved: 'APPROVED',
};

export const toUpdateRequest = (uow) => ({
  Key: {
    pk: uow.event.thing.id,
    sk: DISCRIMINATOR,
  },
  ...updateExpression({
    ...uow.event.thing,
    status: EVENT_STATUS_MAP[uow.event.type] || uow.event.thing.status,
    discriminator: DISCRIMINATOR,
    lastModifiedBy: uow.event.thing.lastModifiedBy || 'system',
    timestamp: uow.event.timestamp,
    deleted: uow.event.type === 'thing-deleted' ? true : null,
    latched: true,
    ttl: ttl(uow.event.timestamp, 33),
    awsregion: process.env.AWS_REGION,
  }),
  ...timestampCondition(),
});

export const toEvent = async (uow) => {
  const data = uow.event.raw.new || /* istanbul ignore next */ uow.event.raw.old;
  const records = uow.queryResponse.map((r) => (r.discriminator === DISCRIMINATOR ? data : r));
  const thing = await AGGREGATE_MAPPER(records);
  return {
    type: uow.event.type === 'thing-deleted'
      ? /* istanbul ignore next */ uow.event.type
      : STATUS_EVENT_MAP[data.status] || /* istanbul ignore next */ uow.event.type,
    timestamp: data.timestamp || uow.event.timestamp,
    thing,
    raw: undefined,
  };
};
