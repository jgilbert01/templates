import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import {
  getUsername, getClaims, getUserGroups, forRole,
} from '../../../src/utils';

class Response {
  constructor() {
    this.status = sinon.stub().returns(this);
    this.json = sinon.spy((data) => data);
  }
}

describe('utils/index.js', () => {
  afterEach(sinon.restore);

  it('should get claims', () => {
    expect(getClaims({
      authorizer: {
        claims: {
          sub: 'offlineContext_authorizer_principalId',
        },
      },
    })).to.deep.equal({
      sub: 'offlineContext_authorizer_principalId',
      userGroups: [],
      username: 'offlineContext_authorizer_principalId',
    });

    expect(getClaims({ authorizer: {} })).to.deep.equal({
      userGroups: [],
      username: '',
    });
    expect(getClaims({})).to.deep.equal({
      userGroups: [],
      username: '',
    });
  });

  it('should get username', () => {
    expect(getUsername({
      authorizer: {
        claims: {
          sub: 'offlineContext_authorizer_principalId',
        },
      },
    })).to.equal('offlineContext_authorizer_principalId');
  });

  it('should get user groups', () => {
    expect(getUserGroups({
      authorizer: {
        claims: {
          'cognito:groups': ['r1', 'r2'],
        },
      },
    })).to.deep.equal(['r1', 'r2']);

    expect(getUserGroups({
      authorizer: {
        claims: {
          'cognito:groups': 'r1,r2',
        },
      },
    })).to.deep.equal(['r1', 'r2']);

    expect(getUserGroups({
      authorizer: {
        claims: {
          'cognito:groups': 'r1',
        },
      },
    })).to.deep.equal(['r1']);
  });

  it('should check role to succeed', () => {
    const req = {
      requestContext: {
        authorizer: {
          claims: {
            'cognito:groups': 'r1,r2',
          },
        },
      },
    };
    const resp = {};
    const next = sinon.spy();

    forRole('r1')(req, resp, next);

    expect(next).to.have.been.calledWith();
  });

  it('should check role to raise error', () => {
    const req = {
      requestContext: {
        authorizer: {
          claims: {
            'cognito:groups': 'r3',
          },
        },
      },
    };
    const resp = {
      error: sinon.spy((data) => data),
    };
    const next = sinon.spy();

    forRole('r1')(req, resp, next);

    expect(resp.error).to.have.been.calledWith(401, 'Unauthorized');
  });
});
