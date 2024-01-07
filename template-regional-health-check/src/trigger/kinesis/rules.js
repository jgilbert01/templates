import { upd as update } from 'aws-lambda-stream';

import { toUpdateRequest } from '../../models/trace';

export default [
  {
    id: 't1',
    flavor: update,
    eventType: 'trace-created',
    toUpdateRequest,
  },
];
