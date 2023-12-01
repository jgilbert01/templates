import _ from 'highland';

import {
  printStartPipeline, printEndPipeline,
  filterOnContent,
  faulty, encryptEvent,
} from 'aws-lambda-stream';

export const publish = (rule) => (s) => s // eslint-disable-line import/prefer-default-export

  // .filter(onEventType(rule))
  .filter(forData)
  .tap(printStartPipeline)

  .filter(onContent(rule))

  .map(toEvent(rule))

  .through(encryptEvent(rule))
  .through(rule.publish(rule))

  .tap(printEndPipeline);

const forData = (uow) => uow.event.metadata['record-type'] === 'data';

const onContent = (rule) => faulty((uow) => filterOnContent(rule, uow));

const toEvent = (rule) => faulty((uow) => ({
  ...uow,
  event: {
    id: uow.record.eventID,
    // id: uow.event.metadata['transaction-id'] || uow.record.eventID,
    type: `${uow.event.metadata['schema-name'].toLowerCase()}-${uow.event.metadata['table-name'].toLowerCase()}-${calculateEventTypeSuffix(uow.event.metadata.operation)}`,
    timestamp: (new Date(uow.event.metadata.timestamp)).getTime(),
    partitionKey: uow.record.kinesis.partitionKey,
    tags: {},
    raw: {
      data: uow.event.data,
      beforeImage: uow.event.beforeImage || /* istanbul ignore next */ {},
      metadata: uow.event.metadata,
    },
  },
}));

const calculateEventTypeSuffix = (operation) => ({
  insert: 'created',
  update: 'updated',
  delete: 'deleted',
}[operation]);
