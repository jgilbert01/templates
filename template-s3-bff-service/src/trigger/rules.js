import { cdcS3 } from './cdcS3';

export default [
  // --------------
  // produce events based on state and status changes
  // --------------
  {
    id: 't1',
    flavor: cdcS3,
  },
];
