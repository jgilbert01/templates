import _ from 'highland';
import {
  publishToEventBridge as publish, rejectWithFault,
  faulty,
  encryptEvent,
} from 'aws-lambda-stream';

import Connector from '../connectors/s3';

export const cdcS3 = (rule) => (s) => s // eslint-disable-line import/prefer-default-export
  .tap(printStart)
  .through(listVersions(rule))
  .through(headObject(rule))
  .map(toEvent)
  .through(encryptEvent({
    ...rule,
    sourceField: 'emit',
    targetField: 'emit',
  }))
  .through(publish({
    parallel: 10,
    eventField: 'emit', // so we don't overwrite the incoming event in the uow
  }))
  .tap(printEnd);

const printStart = (uow) => uow.debug('start type: %s, key: %s', uow.record.s3.eventName, uow.record.s3.s3.object.key);
const printEnd = (uow) => uow.debug('end type: %s, key: %s, uow: %j', uow.record.s3.eventName, uow.record.s3.s3.object.key, uow);

const listVersions = ({
  debug,
  parallel = Number(process.env.S3_PARALLEL) || Number(process.env.PARALLEL) || 8,
}) => {
  const connector = new Connector(debug);

  const request = (uow) => ({
    ...uow,
    versionRequest: {
      Bucket: uow.record.s3.s3.bucket.name,
      Prefix: uow.record.s3.s3.object.key,
    },
  });

  const invoke = (uow) => {
    const p = connector.listObjectVersions(uow.versionRequest)
      .then((versionResponse) => ({ ...uow, versionResponse: versionResponse.data }))
      .catch(rejectWithFault(uow));

    return _(p); // wrap promise in a stream
  };

  return (s) => s
    .map(request)
    .map(invoke)
    .parallel(parallel);
};

const headObject = ({
  debug,
  parallel = Number(process.env.S3_PARALLEL) || Number(process.env.PARALLEL) || 8,
}) => {
  const connector = new Connector(debug);

  const request = (uow) => ({
    ...uow,
    headObjectRequest: uow.record.s3.eventName === 'ObjectCreated:Put' ? {
      Bucket: uow.record.s3.s3.bucket.name,
      Key: uow.record.s3.s3.object.key,
      VersionId: uow.record.s3.s3.object.versionId,
    } : undefined,
  });

  const invoke = (uow) => {
    if (!uow.headObjectRequest) return _(Promise.resolve(uow));

    const p = connector.headObject(uow.headObjectRequest)
      .then((headObjectResponse) => ({ ...uow, headObjectResponse }))
      .catch(rejectWithFault(uow));

    return _(p); // wrap promise in a stream
  };

  return (s) => s
    .map(request)
    .map(invoke)
    .parallel(parallel);
};

const calcType = (uow) => {
  if (uow.record.s3.eventName === 'ObjectCreated:Put') {
    if (uow.versionResponse.Versions.length === 1) {
      return 'file-created';
    } else {
      return 'file-updated';
    }
  } else {
    return 'file-deleted';
  }
};

const toEvent = faulty((uow) => ({
  ...uow,
  emit: {
    id: uow.record.sqs.messageId,
    type: calcType(uow),
    timestamp: (new Date(uow.record.s3.eventTime)).getTime(),
    partitionKey: uow.headObjectResponse?.Metadata?.entityid || uow.record.s3.s3.object.versionId,
    file: {
      key: {
        bucket: uow.record.s3.s3.bucket.name,
        key: uow.record.s3.s3.object.key,
        versionId: uow.record.s3.s3.object.versionId,
        sequencer: uow.record.s3.s3.object.sequencer,
      },
      ...(uow.headObjectResponse ? {
        ...uow.headObjectResponse.Metadata,
        timestamp: (new Date(uow.headObjectResponse.LastModified)).getTime(),
        lastModified: uow.headObjectResponse.LastModified,
        contentLength: uow.headObjectResponse.ContentLength,
        etag: uow.headObjectResponse.ETag,
        versionId: uow.headObjectResponse.VersionId,
        cacheControl: uow.headObjectResponse.CacheControl,
        contentDisposition: uow.headObjectResponse.ContentDisposition,
        contentType: uow.headObjectResponse.ContentType,
      } : {}),
    },
    raw: {
      s3: uow.record.s3,
      headObject: uow.headObjectResponse,
    },
  },
}));
