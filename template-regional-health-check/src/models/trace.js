import { updateExpression, timestampCondition, ttl } from 'aws-lambda-stream';

import { now, roundToNearestMinute } from '../utils';

export const DISCRIMINATOR = 'trace';

class Model {
  constructor({ debug, connector, unhealthyFlag } = {}) {
    this.debug = debug;
    this.connector = connector;
    this.unhealthyFlag = unhealthyFlag;
  }

  async check() {
    const timestamp = roundToNearestMinute(now());
    const region = process.env.AWS_REGION;

    if (this.unhealthyFlag === true) {
      return {
        statusCode: 503,
        timestamp,
        region,
      };
    } else {
      const get = await this.get();
      const save = await this.save();

      const incomplete = get[0]?.status === 'STARTED';
      const elapsed =
        (timestamp - Number(get[0]?.sk || /* istanbul ignore next */ 0)) /
        1000 /
        60;

      // is the most recent trace complete and is it from 1 minute ago
      const unhealthyCheck = incomplete || elapsed > 1;

      return {
        statusCode: unhealthyCheck === true ? 503 : 200,
        timestamp,
        region,
        incomplete,
        elapsed,
        get,
        save,
      };
    }
  }

  get() {
    return this.connector.get(process.env.AWS_REGION);
  }

  save() {
    const timestamp = now();
    const _ttl = ttl(timestamp, 92);
    const awsregion = process.env.AWS_REGION;

    return this.connector.update(
      {
        pk: awsregion,
        sk: `${roundToNearestMinute(timestamp)}`,
      },
      {
        timestamp,
        status: 'STARTED',
        discriminator: DISCRIMINATOR,
        latched: null,
        ttl: _ttl,
        awsregion,
      },
    );
  }
}

export default Model;

export const toUpdateRequest = uow => {
  const timestamp = now();

  return {
    Key: {
      pk: process.env.AWS_REGION,
      sk: `${uow.event.raw.new.sk}`,
    },
    ...updateExpression({
      status: 'COMPLETED',
      discriminator: DISCRIMINATOR,
      timestamp,
      latency: (timestamp - uow.event.raw.new.timestamp) / 1000,
      latched: true,
      ttl: ttl(uow.event.timestamp, 92),
      awsregion: process.env.AWS_REGION,
    }),
    ...timestampCondition(),
  };
};

export const toS3PutRequest = uow => ({
  Key: `${uow.event.raw.new.pk}/${uow.event.raw.new.sk}`,
  Body: JSON.stringify(uow.event),
});
