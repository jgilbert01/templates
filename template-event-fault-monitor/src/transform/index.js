// ------------------------------
// this transform decompresses 
// the events, records metrics and sends notifications
// ------------------------------

exports.handle = async ({ records, ...event }, ctx) => {
  // console.log('batch size: ', records.length);

  const notifications = {};

  const results = records
    .map((record) => ({
      ...event,
      ...record,
      data: undefined,
      originalData: record.data,
      ctx,
      notifications,
    }))
    .map(unbase64Data)
    .map(parseEvent)
    .map(decompressEvent)
    .map(stringifyEvent)
    .map(base64Data)
    .map(addNotification)
    .map(({ recordId, data }) => ({
      recordId,
      result: 'Ok',
      data,
    }));

  // console.log('processed size: ', results.length);

  await sendNotifications(notifications);

  return {
    records: results,
  };
};

const tryCatch = (f, final) => (uow) => {
  try {
    if (uow.err && !final) return uow; // skip
    return f(uow);
  } catch (err) {
    return {
      err, // first for logging
      ...uow,
      data: uow.originalData, // use original unmodified data
    };
  }
};

const unbase64Data = tryCatch((uow) => ({
  ...uow,
  event: Buffer.from(uow.originalData, 'base64').toString('utf8'),
}));

const parseEvent = tryCatch((uow) => ({
  ...uow,
  event: JSON.parse(uow.event),
}));

const zlib = require('zlib');
const COMPRESSION_PREFIX = 'COMPRESSED';
const unzip = (str) => zlib.gunzipSync(Buffer.from(str, 'base64')).toString();
const decompress = (key, value) => (typeof value === 'string' && value.startsWith(COMPRESSION_PREFIX)
  ? JSON.parse(unzip(value.substring(COMPRESSION_PREFIX.length)))
  : value);

const decompressEvent = tryCatch((uow) => ({
  ...uow,
  event: {
    ...uow.event,
    detail: JSON.parse(JSON.stringify(uow.event.detail), decompress),
  },
}));

const stringifyEvent = tryCatch((uow) => {
  const data = JSON.stringify(uow.event);
  return ({
    ...uow,
    data,
  });
});

const base64Data = tryCatch((uow) => ({
  ...uow,
  // decompressed + EOL
  data: Buffer.from(`${uow.data}\n`, 'utf-8').toString('base64'),
}));

const addNotification = tryCatch((uow) => {
  const d = new Date(uow.event.detail.timestamp);
  const t = `${d.getFullYear()}${d.getMonth()}${d.getDate()}${d.getHours()}`;
  const account = uow.event.detail.tags.account || 'undefined';
  const region = uow.event.detail.tags.region || 'undefined';
  const functionname = uow.event.detail.tags.functionname || 'undefined';
  const pipeline = uow.event.detail.tags.pipeline || 'undefined';
  const err = uow.event.detail.err;

  const MessageDeduplicationId = `${functionname}${pipeline}${t}${err.message}`.substring(0, 128);
  const Subject = `Fault: ${account},${region},${functionname},${pipeline}`.substring(0, 100);
  const fault = JSON.stringify(uow.event, null, 2);
  const error = JSON.stringify(err, null, 2);
  const Message = fault.length < 1024 * 256 ? fault : error;

  uow.notifications[MessageDeduplicationId] = {
    Subject,
    MessageDeduplicationId,
    MessageGroupId: Subject,
    Message,
  };

  return uow;
});

const { SNS } = require('aws-sdk');
const topic = new SNS({
  httpOptions: {
    timeout: 1000,
    connectTimeout: 1000,
  },
  logger: { log: (msg) => console.log('%s', msg.replace(/\n/g, '\r')) },
});

const sendNotifications = async (notifications) => {
  return Promise.all(Object.values(notifications)
    .map((params) => topic.publish(params)
      .promise()
      .then((resp) => console.log('%j', resp))
      .catch((err) => console.log('%j', err))
    ));
};
