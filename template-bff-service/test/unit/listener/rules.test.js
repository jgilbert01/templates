import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { toKinesisRecords, DynamoDBConnector, toSqsEventRecords } from 'aws-lambda-stream';

import { Handler } from '../../../src/listener';

describe('listener/rules.js', () => {
  beforeEach(() => {
    sinon.stub(DynamoDBConnector.prototype, 'update').resolves({});
  });
  afterEach(sinon.restore);

  it('should verify materialize rules', (done) => {
    new Handler()
      // .handle(toKinesisRecords([
      .handle(toSqsEventRecords([
        {
          type: 'thing-created',
          timestamp: 1548967023,
          thing: {
            id: '00000000-0000-0000-0000-000000000000',
            name: 'thing0',
          },
        },
      ]), false)
      .collect()
      // .tap(collected => console.log(JSON.stringify(collected, null, 2)))
      .tap((collected) => {
        expect(collected.length).to.equal(1);
        expect(collected[0].pipeline).to.equal('m1');
        expect(collected[0].event.type).to.equal('thing-created');
        expect(collected[0].updateRequest).to.deep.equal({
          Key: {
            pk: '00000000-0000-0000-0000-000000000000',
            sk: 'thing',
          },
          ExpressionAttributeNames: {
            '#id': 'id',
            '#name': 'name',
            '#discriminator': 'discriminator',
            '#lastModifiedBy': 'lastModifiedBy',
            '#timestamp': 'timestamp',
            '#deleted': 'deleted',
            '#latched': 'latched',
            '#ttl': 'ttl',
            '#awsregion': 'awsregion',
          },
          ExpressionAttributeValues: {
            ':id': '00000000-0000-0000-0000-000000000000',
            ':name': 'thing0',
            ':discriminator': 'thing',
            ':lastModifiedBy': 'system',
            ':timestamp': 1548967023,
            ':latched': true,
            ':ttl': 4400167,
            ':awsregion': 'us-west-2',
          },
          UpdateExpression: 'SET #id = :id, #name = :name, #discriminator = :discriminator, #lastModifiedBy = :lastModifiedBy, #timestamp = :timestamp, #latched = :latched, #ttl = :ttl, #awsregion = :awsregion REMOVE #deleted',
          ReturnValues: 'ALL_NEW',
          ConditionExpression: 'attribute_not_exists(#timestamp) OR #timestamp < :timestamp',
        });
      })
      .done(done);
  });
});
