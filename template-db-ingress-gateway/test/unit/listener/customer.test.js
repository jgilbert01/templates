import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { KmsConnector, MOCK_DECRYPT_DK_RESPONSE } from 'aws-kms-ee';
import { toKinesisRecords, DynamoDBConnector, defaultOptions } from 'aws-lambda-stream';

import { Handler } from '../../../src/listener';

describe('listener/customer.js', () => {
  beforeEach(() => {
    sinon.stub(DynamoDBConnector.prototype, 'update').resolves({});
    sinon.stub(KmsConnector.prototype, 'decryptDataKey').resolves(MOCK_DECRYPT_DK_RESPONSE);
  });
  afterEach(sinon.restore);

  it('should verify collect', (done) => {
    new Handler({ ...defaultOptions, AES: false })
      .handle(toKinesisRecords([
        {
          type: 'my-customers-created',
          timestamp: 1628348103001,
          raw: {
            data: {
              CST_ID: 2303795,
              CST_UPDATE_DT: '2025-08-07T14:55:03Z',
              CST_NM: '5555',
            },
          },
        },
      ]), false)
      .collect()
      // .tap((collected) => console.log(JSON.stringify(collected, null, 2)))
      .tap((collected) => {
        expect(collected.length).to.equal(1);
        expect(collected[0].pipeline).to.equal('cst');
        expect(collected[0].event.type).to.equal('my-customers-created');
        expect(collected[0].updateRequest.Key).to.deep.equal({
          pk: 'cst|2303795',
          sk: 'cst',
        });
        expect(collected[0].updateRequest.ExpressionAttributeValues).to.deep.equal({
          ':discriminator': 'cst',
          ':timestamp': 1754578503000,
          ':ttl': 1631199303,
          ':CST_ID': 2303795,
          ':CST_NM': '5555',
          ':CST_UPDATE_DT': '2025-08-07T14:55:03Z',
        });
        expect(collected[0].updateRequest.UpdateExpression)
          .to.equal('SET #discriminator = :discriminator, #timestamp = :timestamp, #ttl = :ttl, #CST_ID = :CST_ID, #CST_UPDATE_DT = :CST_UPDATE_DT, #CST_NM = :CST_NM REMOVE #deleted, #pull');
      })
      .done(done);
  });
});

const EEM = {
  masterKeyAlias: 'alias/template-global-resources-stg',
  dataKeys: {
    'us-gov-east-1': 'AQICAHg5lIgUTrMBJZSEOmrJ/GqVqgcTMUj+cIw/EBA4XAX5TgGCa7r9+35ZGuWiahOeGSLIAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMN56ScPtKnUQGQIA/AgEQgDtB72fGYIf+kD+eb9wBj3Ptk+BdocPbHzCvvNtvjsp+n8x6BirJN2xR/MzkZ+e0Ktq9yDENqGyPJlvXDQ==',
    'us-gov-west-1': 'AQIDAHg5lIgUTrMBJZSEOmrJ/GqVqgcTMUj+cIw/EBA4XAX5TgG+mTJFoKz0VU0tljNQLcGwAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMWhuPTg3e+GjnWx6rAgEQgDsRc7csVqQxagsvXLPx/hAePtadw2GziixRC/UT3FpYU58/NHC8PvFdJDVQ3LkK8XYGLeowpHlC9CaqgA==',
  },
  fields: [
    'data',
  ],
};
