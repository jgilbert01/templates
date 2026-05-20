import {
  printStartPipeline, printEndPipeline,
  update, updateExpression,
  filterOnEventType,
  faulty,
} from 'aws-lambda-stream';

import { formatDates } from '../utils';
import { select } from '../utils/db';

const pipeline1 = (rule) => (stream) => stream
  .filter(onEventType(rule))
  .tap(printStartPipeline)

  .map(toSelectRequest(rule))
  .through(select(rule))

  .map(toUpdateRequest(rule))
  .through(update({ ...rule, parallel: 10 }))

  .tap(printEndPipeline);

const onEventType = (rule) => faulty((uow) => filterOnEventType(rule, uow));

const toSelectRequest = (rule) => faulty((uow) => ({
  ...uow,
  sqlRequest: {
    sql: rule.table.load,
    bindParams: uow.event.bindParams,
  },
}));

const toUpdateRequest = (rule) => faulty((uow) => {
  const data = formatDates(uow.sqlResponse.row);

  return {
    ...uow,
    updateRequest: {
      Key: {
        pk: `${rule.table.discriminator}|${uow.sqlResponse.row[rule.table.idColumn]}`,
        sk: rule.table.discriminator,
      },
      ...updateExpression({
        discriminator: rule.table.discriminator,
        timestamp: Date.now(),
        ttl: null, // TODO rule.table.ttl
        latched: false, // touches the record so it will publish if not already false
        ...data,
      }),
    },
  };
});

export default pipeline1;
