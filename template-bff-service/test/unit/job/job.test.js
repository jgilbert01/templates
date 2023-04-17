import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { DynamoDBConnector } from 'aws-lambda-stream';

import { Handler } from '../../../src/job';

describe('job/rules.js', () => {
  beforeEach(() => {
    sinon.stub(DynamoDBConnector.prototype, 'update').resolves({});
  });
  afterEach(sinon.restore);

  it('should verify cdc rule cdc1', (done) => {
    new Handler()
      .handle({
        time: '2022-06-04T00:05:03Z',
      }, false)
      .collect()
      // .tap((collected) => console.log(JSON.stringify(collected, null, 2)))
      .tap((collected) => {
        expect(collected.length).to.equal(1);
        expect(collected[0].pipeline).to.equal('job');
        expect(collected[0].updateRequest).to.deep.equal({
          Key: {
            pk: '2022060400',
            sk: 'job',
          },
          ExpressionAttributeNames: {
            '#discriminator': 'discriminator',
            '#ttl': 'ttl',
            '#awsregion': 'awsregion',
            '#time': 'time',
          },
          ExpressionAttributeValues: {
            ':discriminator': 'job',
            ':ttl': 1657152303,
            ':awsregion': 'us-west-2',
            ':time': '2022-06-04T00:05:03Z',
          },
          UpdateExpression: 'SET #discriminator = :discriminator, #ttl = :ttl, #awsregion = :awsregion, #time = :time',
          ReturnValues: 'ALL_NEW',
          ConditionExpression: 'attribute_not_exists(pk)',
        });
      })
      .done(done);
  });
});
