import 'mocha';
import { expect } from 'chai';

import { handle } from '../../../src/job';

describe('job/index.js', () => {
  before(() => {
    require('baton-vcr-replay-for-aws-sdk'); // eslint-disable-line global-require
  });

  it('should test job integration', async () => {
    const res = await handle(EVENT, {});
    expect(res).to.equal('Success');
  });
});

const EVENT = {
  time: '2022-06-04T00:05:03Z',
};
