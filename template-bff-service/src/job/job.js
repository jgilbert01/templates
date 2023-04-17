import {
  faulty, updateDynamoDB as update, updateExpression, ttl,
} from 'aws-lambda-stream';
import moment from 'moment';

export const job = (options) => (s) => s // eslint-disable-line import/prefer-default-export
  .filter((uow) => uow.event?.time)
  .tap((uow) => options.debug('start: %j', uow))

  .map(toUpdateRequest(options))
  .through(update(options))

  .tap((uow) => options.debug('end: %j', uow));

const toUpdateRequest = (options) => faulty((uow) => ({
  ...uow,
  updateRequest: {
    Key: {
      // job will only execute in region that creates the record
      pk: moment(uow.event.time).utc().format('YYYYMMDDHH'),
      sk: 'job',
    },
    ...updateExpression({
      discriminator: 'job',
      ttl: ttl(moment(uow.event.time).utc(), 33),
      awsregion: process.env.AWS_REGION,

      time: uow.event.time,
    }),
    // other regions will not execute the job
    // if it was successful started and
    // replicated from the primary region
    ConditionExpression: 'attribute_not_exists(pk)',
  },
}));
