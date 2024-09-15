import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import {
  getClaims,
} from '../../../src/utils';

describe('utils/index.js', () => {
  afterEach(sinon.restore);

  it('should get claims', () => {
    expect(getClaims({
      authorizer: {
        claims: {
          'cognito:username': 'offlineContext_authorizer_principalId',
        },
      },
    })).to.deep.equal({
      'cognito:username': 'offlineContext_authorizer_principalId',
    });

    expect(getClaims({ authorizer: {} })).to.deep.equal({});
    expect(getClaims({})).to.deep.equal({});
  });
});
