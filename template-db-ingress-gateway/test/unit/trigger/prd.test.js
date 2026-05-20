import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { toDynamodbRecords, DynamoDBConnector } from 'aws-lambda-stream';

import { Handler } from '../../../src/trigger';

describe('trigger/prd.js', () => {
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
            pk: 'prd|2305895',
            sk: 'prd',
          },
          newImage: {
            pk: 'prd|2305895',
            sk: 'prd',
            discriminator: 'prd',
            ttl: 1581386290,

            PRD_ID: 2305895,
            PRD_UPDATE_DT: '2021-08-07T14:55:03Z',
            PRD_NM: '7777',
          },
        },
      ]), false)
      .collect()
      // .tap(collected => console.log(JSON.stringify(collected, null, 2)))
      .tap((collected) => {
        expect(collected.length).to.equal(1);
        expect(collected[0].pipeline).to.equal('prd');
        expect(collected[0].updateRequest.Key).to.deep.equal({
          pk: 'prd|2305895',
          sk: 'product',
        });
        expect(collected[0].updateRequest.ExpressionAttributeValues).to.deep.equal({
          ':discriminator': 'product',
          ':timestamp': 1628348103000,
          // ':ttl': 1620441837,
          ':id': 2305895,
          ':name': '7777',
        });
      })
      .done(done);
  });
});
