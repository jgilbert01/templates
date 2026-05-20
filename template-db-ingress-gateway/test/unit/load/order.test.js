import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import _ from 'highland';

import { SecretsMgrConnector, DynamoDBConnector } from 'aws-lambda-stream';

import { Handler } from '../../../src/load';
import Connector from '../../../src/connectors/db';

describe.skip('load/order.js', () => {
  beforeEach(() => {
    sinon.stub(SecretsMgrConnector.prototype, 'get').resolves({});
    sinon.stub(DynamoDBConnector.prototype, 'update').resolves({});
    sinon.stub(Date, 'now').returns(1624730058088);
  });
  afterEach(sinon.restore);

  it('should verify load rule', (done) => {
    const stub = sinon.stub(Connector.prototype, 'select').resolves([{
      ORD_ID: 1473110,
      ORD_UPDATE_DT: '2025-08-07T14:55:03Z',
      ORD_CUST_ID: 2303795,
      ORD_NBR: '5555',
    }]);

    new Handler()
      .handle({ type: 'ord' }, false)
      .collect()
      // .tap((collected) => console.log(JSON.stringify(collected, null, 2)))
      .tap((collected) => {
        expect(collected.length).to.equal(1);
        expect(collected[0].pipeline).to.equal('agt-load');
        expect(collected[0].updateRequest.Key).to.deep.equal({
          pk: 'agt|1',
          sk: 'agt',
        });
        expect(collected[0].updateRequest.ExpressionAttributeValues).to.deep.equal({
          ':ORD_ID': 1473110,
          ':ORD_UPDATE_DT': '2025-08-07T14:55:03Z',
          ':ORD_CUST_ID': 2303795,
          ':ORD_NBR': '5555',
          ':discriminator': 'ord',
          ':timestamp': 1624730058088,
          ':latched': false,
        });
        expect(collected[0].updateRequest.UpdateExpression).to.equal('');
        expect(stub).to.have.been.calledWith('select * from MY.ORDERS where ORD_ID > :offset order by ORD_ID fetch first :max rows only', undefined);
      })
      .done(done);
  });
});
