import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { toDynamodbRecords, DynamoDBConnector } from 'aws-lambda-stream';

import { Handler } from '../../../src/trigger';

describe('trigger/ord.js', () => {
  beforeEach(() => {
    sinon.stub(DynamoDBConnector.prototype, 'update').resolves({});
  });
  afterEach(sinon.restore);

  it('should invoke trigger pipeline', (done) => {
    sinon.stub(DynamoDBConnector.prototype, 'batchGet').resolves({
      Responses: {
        undefined: [{
          pk: 'cst|2303795',
          sk: 'cst',
          discriminator: 'cst',
          ttl: 1581386290,

          CST_ID: '2303795',
          CST_NM: 'Other',
          CST_UPDATE_DT: '2021-08-07T14:55:03Z',
        }],
      },
      UnprocessedKeys: {},
    });

    new Handler()
      .handle(toDynamodbRecords([
        {
          timestamp: 1617590637,
          keys: {
            pk: 'ord|1473110',
            sk: 'ord',
          },
          newImage: {
            pk: 'ord|1473110',
            sk: 'ord',
            discriminator: 'ord',
            ttl: 1581386290,

            ORD_ID: 1473110,
            ORD_UPDATE_DT: '2021-08-07T14:55:03Z',
            ORD_NBR: '5555',
            ORD_CUST_ID: 2303795,
          },
        },
      ]), false)
      .collect()
      // .tap(collected => console.log(JSON.stringify(collected, null, 2)))
      .tap((collected) => {
        expect(collected.length).to.equal(1);
        expect(collected[0].pipeline).to.equal('ord');
        expect(collected[0].updateRequest.Key).to.deep.equal({
          pk: 'ord|1473110',
          sk: 'order',
        });
        expect(collected[0].updateRequest.ExpressionAttributeValues).to.deep.equal({
          ':discriminator': 'order',
          ':timestamp': 1628348103000,
          // ':ttl': 1620441837,
          ':id': 1473110,
          ':number': '5555',
          ':customer': {
            id: '2303795',
            name: 'Other',
          },
        });
      })
      .done(done);
  });
});
