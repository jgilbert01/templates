import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { toDynamodbRecords, DynamoDBConnector, EventBridgeConnector } from 'aws-lambda-stream';

import { Handler } from '../../../src/trigger';

describe('trigger/job.js', () => {
  beforeEach(() => {
    sinon.stub(EventBridgeConnector.prototype, 'putEvents').resolves({ FailedEntryCount: 0 });
  });
  afterEach(sinon.restore);

  it('should verify job rule job1', (done) => {
    sinon.stub(DynamoDBConnector.prototype, 'scan').resolves({
      Items: [
        {
          pk: '00000000-0000-0000-0000-000000000000',
          sk: 'thing',
          discriminator: 'thing',
          timestamp: 1600144863435,
          name: 'thing0',
        },
      ],
    });

    new Handler()
      .handle(toDynamodbRecords([
        {
          timestamp: 1548967023,
          keys: {
            pk: '1',
            sk: 'job',
          },
          newImage: {
            pk: '1',
            sk: 'job',
            discriminator: 'job',
          },
        },
      ]), false)
      .collect()
      // .tap((collected) => console.log(JSON.stringify(collected, null, 2)))
      .tap((collected) => {
        expect(collected.length).to.equal(1);
        expect(collected[0].pipeline).to.equal('job1');
        expect(collected[0].emit).to.deep.equal({
          type: 'xyz',
          tags: {
            account: 'undefined',
            region: 'us-west-2',
            stage: 'undefined',
            source: 'undefined',
            functionname: 'undefined',
            pipeline: 'job1',
            skip: true,
          },

        });
      })
      .done(done);
  });
});
