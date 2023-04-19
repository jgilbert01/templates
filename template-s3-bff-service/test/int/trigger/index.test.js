import 'mocha';
import { expect } from 'chai';

import { handle } from '../../../src/trigger';

import { EVENT } from '../../fixtures';

describe('trigger/index.js', () => {
  before(() => {
    require('baton-vcr-replay-for-aws-sdk'); // eslint-disable-line global-require
  });

  it('should test trigger integration', async () => {
    const res = await handle(EVENT, {});
    expect(res).to.equal('Success');
  });
});
