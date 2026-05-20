import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { toDynamodbRecords, DynamoDBConnector } from 'aws-lambda-stream';

import { Handler } from '../../../src/trigger';

describe('trigger/li.js', () => {
  beforeEach(() => {
    sinon.stub(DynamoDBConnector.prototype, 'update').resolves({});
  });
  afterEach(sinon.restore);

  it('should invoke trigger pipeline', (done) => {
    sinon.stub(DynamoDBConnector.prototype, 'batchGet').resolves({
      Responses: {
        undefined: [{
          pk: 'prd|2305895',
          sk: 'prd',
          discriminator: 'prd',
          ttl: 1581386290,

          PRD_ID: '2305895',
          PRD_NM: '7777',
          PRD_UPDATE_DT: '2021-08-07T14:55:03Z',
        }, {
          pk: 'ord|1473110',
          sk: 'ord',
          discriminator: 'ord',
          ttl: 1581386290,

          ORD_ID: '2305895',
          ORD_NBR: '5555',
          ORD_CUST_ID: 2303795,
          ORD_UPDATE_DT: '2021-08-07T14:55:03Z',
        }],
      },
      UnprocessedKeys: {},
    });

    new Handler()
      .handle(toDynamodbRecords([
        {
          timestamp: 1617590637,
          keys: {
            pk: 'li|1474010',
            sk: 'li',
          },
          newImage: {
            pk: 'li|1473110',
            sk: 'li',
            discriminator: 'li',
            ttl: 1581386290,

            LI_ID: 1474010,
            LI_UPDATE_DT: '2025-08-07T14:55:03Z',
            LI_ORD_ID: 1473110,
            LI_PRD_ID: 2305895,
            LI_QTY: 1,
          },
        },
      ]), false)
      .collect()
      // .tap(collected => console.log(JSON.stringify(collected, null, 2)))
      .tap((collected) => {
        expect(collected.length).to.equal(1);
        expect(collected[0].pipeline).to.equal('line-item');
        expect(collected[0].updateRequest.Key).to.deep.equal({
          pk: '1473110',
          sk: 'lineItems|1474010',
        });
        expect(collected[0].updateRequest.ExpressionAttributeValues).to.deep.equal({
          ':discriminator': 'line-item',
          ':timestamp': 1754578503000,
          ':ttl': 1620441837,
          ':id': 1474010,
          ':quantity': 1,
          ':product': {
            id: '2305895',
            name: '7777',
          },
        });
      })
      .done(done);
  });
});
