import {
  now, ttl, mapper, sortKeyTransform,
} from '../utils';

export const DISCRIMINATOR = 'element';
export const ALIAS = 'elements';

export const MAPPER = mapper({
  transform: { sk: sortKeyTransform },
  rename: {
    sk: 'id',
  },
});

class Model {
  constructor({
    connector,
    debug,
    claims = { username: 'system' },
  } = {}) {
    this.claims = claims;
    this.debug = debug;
    this.connector = connector;
  }

  save({ id, elementId }, element) {
    const timestamp = now();
    return this.connector.update(
      {
        pk: id,
        sk: `${ALIAS}|${elementId}`,
      },
      {
        timestamp,
        lastModifiedBy: this.claims.username,
        ...element,
        discriminator: DISCRIMINATOR,
        deleted: null,
        latched: null,
        ttl: ttl(timestamp, 66),
        awsregion: process.env.AWS_REGION,
      },
    );
  }

  delete({ id, elementId }) {
    const timestamp = now();
    return this.connector.update(
      {
        pk: id,
        sk: `${ALIAS}|${elementId}`,
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
