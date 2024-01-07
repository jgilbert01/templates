import { cdc } from 'aws-lambda-stream';

export default [
  {
    id: 't1',
    flavor: cdc,
    eventType: 'trace-created',
  },
];
