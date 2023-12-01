import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { KmsConnector, MOCK_GEN_DK_RESPONSE, MOCK_ENCRYPT_DK_RESPONSE } from 'aws-kms-ee';

import {
  EventBridgeConnector, defaultOptions,
} from 'aws-lambda-stream';

import { Handler } from '../../../src/trigger';

describe('trigger/stream/publish.js', () => {
  beforeEach(() => {
    sinon.stub(EventBridgeConnector.prototype, 'putEvents').resolves({ FailedEntryCount: 0 });
    sinon.stub(KmsConnector.prototype, 'generateDataKey').resolves(MOCK_GEN_DK_RESPONSE);
    sinon.stub(KmsConnector.prototype, 'encryptDataKey').resolves(MOCK_ENCRYPT_DK_RESPONSE);
  });
  afterEach(sinon.restore);

  it('should verify ingress rule', (done) => {
    new Handler({ ...defaultOptions, AES: false })
      .handle(EVENT, false)
      .collect()
      // .tap((collected) => console.log(JSON.stringify(collected, null, 2)))
      .tap((collected) => {
        expect(collected.length).to.equal(1);
        expect(collected[0].pipeline).to.equal('ingress');
        expect(collected[0].event).to.deep.equal({
          id: 'shardId-000000000000:49623716769364395500137335110776038519259508308501856258',
          type: 'my-things-updated',
          timestamp: 1642092643075,
          partitionKey: 'MY.THINGS',
          tags: {
            account: 'undefined',
            region: 'us-west-2',
            stage: 'np',
            source: 'undefined',
            functionname: 'undefined',
            pipeline: 'ingress',
            skip: true,
          },
          raw: {
            data: 'eyJUSEdfSUQiOjIzNTAwNTgsIlRIR19GTkFNRSI6IkYxIiwiVEhHX0xOQU1FIjoiTDEifQ==',
            // data: {
            //   THG_ID: 2350058,
            //   THG_FNAME: 'F1',
            //   THG_LNAME: 'L1',
            // },
            beforeImage: 'eyJUSEdfSUQiOiIyMzUwMDU4IiwiVEhHX0ZOQU1FIjoiZjEiLCJUSEdfTE5BTUUiOiJMMSJ9',
            // beforeImage: {
            //   THG_ID: '2350058',
            //   THG_FNAME: 'f1',
            //   THG_LNAME: 'L1',
            // },
            metadata: {
              'timestamp': '2022-01-13T16:50:43.075155Z',
              'record-type': 'data',
              'operation': 'update',
              'partition-key-type': 'schema-table',
              'schema-name': 'MY',
              'table-name': 'THINGS',
              'transaction-id': 1114118,
            },
          },
          eem: EEM,
        });
      })
      .done(done);
  });
});

const EEM = {
  masterKeyAlias: 'alias/template-global-resources-np',
  dataKeys: {
    'us-east-1': 'AQICAHg5lIgUTrMBJZSEOmrJ/GqVqgcTMUj+cIw/EBA4XAX5TgGCa7r9+35ZGuWiahOeGSLIAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMN56ScPtKnUQGQIA/AgEQgDtB72fGYIf+kD+eb9wBj3Ptk+BdocPbHzCvvNtvjsp+n8x6BirJN2xR/MzkZ+e0Ktq9yDENqGyPJlvXDQ==',
    'us-west-2': 'AQIDAHg5lIgUTrMBJZSEOmrJ/GqVqgcTMUj+cIw/EBA4XAX5TgG+mTJFoKz0VU0tljNQLcGwAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMWhuPTg3e+GjnWx6rAgEQgDsRc7csVqQxagsvXLPx/hAePtadw2GziixRC/UT3FpYU58/NHC8PvFdJDVQ3LkK8XYGLeowpHlC9CaqgA==',
  },
  fields: [
    'data',
    'beforeImage',
  ],
};

const EVENT = {
  Records: [
    {
      kinesis: {
        kinesisSchemaVersion: '1.0',
        partitionKey: 'MY.THINGS',
        sequenceNumber: '49623716769364395500137334210776038519259508308501856258',
        data: Buffer.from(JSON.stringify({
          data: {
            THG_ID: 2350058,
            THG_FNAME: 'F1',
            THG_LNAME: 'L1',
          },
          beforeImage: {
            THG_ID: '2350058',
            THG_FNAME: 'f1',
            THG_LNAME: 'L1',
          },
          metadata: {
            'timestamp': '2022-01-13T16:50:43.075155Z',
            'record-type': 'data',
            'operation': 'update',
            'partition-key-type': 'schema-table',
            'schema-name': 'MY',
            'table-name': 'THINGS',
            'transaction-id': 1114118,
          },
        })).toString('base64'),
      },
      eventSource: 'aws:kinesis',
      eventVersion: '1.0',
      eventID: 'shardId-000000000000:49623716769364395500137335110776038519259508308501856258',
      eventName: 'aws:kinesis:record',
      invokeIdentityArn: 'arn:aws-us-gov:iam::123456789012:role/template-dms-ingress-gateway-np-us-west-2-lambdaRole',
      awsRegion: 'us-west-2',
      eventSourceARN: 'arn:aws-us-gov:kinesis:us-west-2:123456789012:stream/template-dms-ingress-gateway-np',
    },
  ],
};
