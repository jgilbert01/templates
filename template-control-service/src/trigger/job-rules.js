import { job } from 'aws-lambda-stream';

export default [
  {
    id: 'job1',
    flavor: job,
    eventType: 'job-created',
    toScanRequest: () => ({
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'APPROVED',
      },
      FilterExpression: '#status = :status',
    }),
    toEvent: () => ({ type: 'xyz' }),
  },
];
