import { materializeS3 } from 'aws-lambda-stream';

import { toS3PutRequest } from '../../models/trace';

// add encription if needed

export default [
  {
    id: 't1',
    flavor: materializeS3,
    eventType: 'trace-created',
    toPutRequest: toS3PutRequest,
  },
];
