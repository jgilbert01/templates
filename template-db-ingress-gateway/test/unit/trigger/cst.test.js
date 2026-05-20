import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { toDynamodbRecords, DynamoDBConnector } from 'aws-lambda-stream';

import { Handler } from '../../../src/trigger';

describe('trigger/cst.js', () => {
  beforeEach(() => {
    sinon.stub(DynamoDBConnector.prototype, 'update').resolves({});
  });
  afterEach(sinon.restore);

  it('should invoke trigger pipeline', (done) => {
    new Handler()
      .handle(toDynamodbRecords([
        {
          timestamp: 1617590637,
          keys: {
            pk: 'cst|2303795',
            sk: 'cst',
          },
          newImage: {
            pk: 'cst|2303795',
            sk: 'cst',
            discriminator: 'cst',
            ttl: 1581386290,

            CST_ID: 2303795,
            CST_UPDATE_DT: '2021-08-07T14:55:03Z',
            CST_NM: '5555',
          },
        },
      ]), false)
      .collect()
      // .tap(collected => console.log(JSON.stringify(collected, null, 2)))
      .tap((collected) => {
        expect(collected.length).to.equal(1);
        expect(collected[0].pipeline).to.equal('cst');
        expect(collected[0].updateRequest.Key).to.deep.equal({
          pk: 'cst|2303795',
          sk: 'customer',
        });
        expect(collected[0].updateRequest.ExpressionAttributeValues).to.deep.equal({
          ':discriminator': 'customer',
          ':timestamp': 1628348103000,
          // ':ttl': 1620441837,
          ':id': 2303795,
          ':name': '5555',
        });
      })
      .done(done);
  });
});
