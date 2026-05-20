import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import _ from 'highland';
import debug from 'debug';

import { select } from '../../../src/utils/db';

// import Connector from '../../../src/connectors/oracle';
const Connector = {};

describe.skip('utils/db.js', () => {
  afterEach(sinon.restore);

  it('should select', (done) => {
    const stub = sinon.stub(Connector.prototype, 'select').resolves([{ ID: 1 }]);

    const uows = [{
      sqlRequest: {
        sql: 'select * from PRODUCTS',
        bindParams: {},
      },
    }];

    _(uows)
      .through(select({
        CONNECTION_STRING: '',
        USER_NAME: '',
        PWD: 'pwd',
        debug: debug('orcl'),
      }))
      .collect()
      .tap((collected) => {
        // console.log(JSON.stringify(collected, null, 2));

        expect(collected.length).to.equal(1);
        expect(collected[0]).to.deep.equal({
          sqlRequest: { sql: 'select * from PRODUCTS', bindParams: {} },
          sqlResponse: {
            count: 1,
            row: {
              ID: 1,
            },
          },
        });
        expect(stub).to.have.been.calledWith('select * from PRODUCTS', {});
      })
      .stopOnError(done)
      .done(done);
  });
});
