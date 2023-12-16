// ------------------------------
// this transform decompresses 
// the events and records metrics
// ------------------------------

exports.handle = async ({ records, ...event }, ctx) => {
  // console.log('batch size: ', records.length);

  const results = records
      .map((record) => ({
        ...event,
        ...record,
        data: undefined,
        originalData: record.data,
        ctx,
      }))
      .map(unbase64Data)
      .map(parseEvent)
      .map(decompressEvent)
      .map(stringifyEvent)
      .map(base64Data)
      .map(formatMetrics)
      .map(logMetrics)
        .map(({ recordId, data }) => ({
        recordId,
        result: 'Ok',
        data,
      }));

  // console.log('processed size: ', results.length);

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
    size: data.length, // metric
    data,
  });
});

const base64Data = tryCatch((uow) => ({
  ...uow,
  // decompressed
  data: Buffer.from(JSON.stringify(uow.data), 'utf-8').toString('base64'),
}));

// https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format_Specification.html
const Namespace = process.env.NAMESPACE;
const Dimensions = [[
  'type',
  'pipeline',
  'functionname',
  'source',
  'stage',
  'region',
  'account',
]];
const Metrics = [
  {
    Name: 'domain.event.count',
    Unit: 'Count',
  },
  {
    Name: 'domain.event.size',
    Unit: 'Bytes',
  },
];

const formatMetrics = tryCatch((uow) => ({
  ...uow,
  emf: {
    '_aws': {
      Timestamp: uow.event.detail.timestamp,
      CloudWatchMetrics: [
        {
          Namespace,
          Dimensions,
          Metrics,
        },
      ],
    },
    'type': uow.event.detail.type,
    'pipeline': uow.event.detail.tags?.pipeline || 'not-specified',
    'functionname': uow.event.detail.tags?.functionname || 'not-specified',
    'source': uow.event.detail.tags?.source || 'not-specified',
    'stage': uow.event.detail.tags?.stage || process.env.STAGE || 'not-specified',
    'region': uow.event.detail.tags?.region || uow.region || 'not-specified',
    'account': uow.event.detail.tags?.account || process.env.ACCOUNT_NAME || 'not-specified',
    'domain.event.count': 1,
    'domain.event.size': uow.size,
  },
}));

const logMetrics = tryCatch(({ emf, ...uow }) => {
  if (emf) {
    console.log(JSON.stringify(emf));
  }

  if (process.env.DEBUG === 'true' || uow.err) {
    console.log(JSON.stringify(uow));
  }

  return uow;
}, true); // final
