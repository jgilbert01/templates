import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { EventBridgeConnector } from 'aws-lambda-stream';

import { Handler } from '../../../src/trigger';
import S3Connector from '../../../src/connectors/s3';

import { EVENT, HEAD_OBJECT_RESPONSE, LIST_OBJECT_VERSIONS_RESPONSE } from '../../fixtures';

describe('trigger/rules.js', () => {
  beforeEach(() => {
    sinon.stub(EventBridgeConnector.prototype, 'putEvents').resolves({ FailedEntryCount: 0 });
    sinon.stub(S3Connector.prototype, 'headObject').resolves(HEAD_OBJECT_RESPONSE);
    sinon.stub(S3Connector.prototype, 'listObjectVersions').callsFake(() => Promise.resolve((LIST_OBJECT_VERSIONS_RESPONSE.shift())));
  });
  afterEach(sinon.restore);

  it('should verify cdc rule cdc1', (done) => {
    new Handler()
      .handle(EVENT, false)
      .collect()
      // .tap((collected) => console.log(JSON.stringify(collected, null, 2)))
      .tap((collected) => {
        expect(collected.length).to.equal(3);
        expect(collected[0].pipeline).to.equal('t1');
        expect(collected[0].emit).to.deep.equal({
          id: 'd7335650-d31b-4238-b64f-4a31180a3acd',
          type: 'file-created',
          timestamp: 1677853166655,
          partitionKey: 'e82fa80f-0448-4a1f-a15b-bf27d56eb1ec',
          tags: {
            account: 'undefined',
            region: 'us-west-2',
            stage: 'undefined',
            source: 'undefined',
            functionname: 'undefined',
            pipeline: 't1',
            skip: true,
          },
          file: {
            key: {
              bucket: 'my-template-s3-bff-service-stg-us-west-2',
              key: 'file/e82fa80f-0448-4a1f-a15b-bf27d56eb1ec/login-gov.png',
              versionId: 'COE5iyDeRVsJxEkhOPkelivGhdRGxXCn',
              sequencer: '00640201EE974121B6',
            },
            awsregion: 'us-west-2',
            discriminator: 'file',
            fileid: 'login-gov.png',
            entityid: 'e82fa80f-0448-4a1f-a15b-bf27d56eb1ec',
            lastmodifiedby: 'john.gilbert@example.com',
            timestamp: 1677853167000,
            lastModified: '2023-03-03T14:19:27.000Z',
            contentLength: 8913,
            etag: '2de9cfd92e8b288ac6ebc263471ab500',
            versionId: 'COE5iyDeRVsJxEkhOPkelivGhdRGxXCn',
            cacheControl: 'private, max-age=300',
            contentDisposition: 'inline; filename="login-gov.png"',
            contentType: 'image/png',
          },
          raw: {
            headObject: {
              AcceptRanges: 'bytes',
              LastModified: '2023-03-03T14:19:27.000Z',
              ContentLength: 8913,
              ETag: '2de9cfd92e8b288ac6ebc263471ab500',
              VersionId: 'COE5iyDeRVsJxEkhOPkelivGhdRGxXCn',
              CacheControl: 'private, max-age=300',
              ContentDisposition: 'inline; filename="login-gov.png"',
              ContentType: 'image/png',
              ServerSideEncryption: 'AES256',
              Metadata: {
                awsregion: 'us-west-2',
                discriminator: 'file',
                fileid: 'login-gov.png',
                entityid: 'e82fa80f-0448-4a1f-a15b-bf27d56eb1ec',
                lastmodifiedby: 'john.gilbert@example.com',
              },
            },
            s3: {
              eventVersion: '2.1',
              eventSource: 'aws:s3',
              awsRegion: 'us-west-2',
              eventTime: '2023-03-03T14:19:26.655Z',
              eventName: 'ObjectCreated:Put',
              userIdentity: {
                principalId: 'AWS:AROAS7TXAMV3XQTXOQPGO:template-s3-bff-service-stg-rest',
              },
              requestParameters: {
                sourceIPAddress: '96.255.48.5',
              },
              responseElements: {
                'x-amz-request-id': '2YM6N0G1XMNN4MKS',
                'x-amz-id-2': 't1F10zcK2mP/YlI3k1fuUt1K90l8/nLukHwD8c0H8jeKKM/JLW4+dnJ0MHxGd1v8u3QicxnGRM567SdEcSNaTpy9RIrrSCiF',
              },
              s3: {
                s3SchemaVersion: '1.0',
                configurationId: '25e27fc7-e35c-4081-83ca-1feef388c5fd',
                bucket: {
                  name: 'my-template-s3-bff-service-stg-us-west-2',
                  ownerIdentity: {
                    principalId: 'A2J5X61LJ23DB3',
                  },
                  arn: 'arn:aws:s3:::my-template-s3-bff-service-stg-us-west-2',
                },
                object: {
                  key: 'file/e82fa80f-0448-4a1f-a15b-bf27d56eb1ec/login-gov.png',
                  size: 8913,
                  eTag: '2de9cfd92e8b288ac6ebc263471ab500',
                  versionId: 'COE5iyDeRVsJxEkhOPkelivGhdRGxXCn',
                  sequencer: '00640201EE974121B6',
                },
              },
            },
          },
        });
        expect(collected[1].emit).to.deep.equal({
          id: '00246ac4-5737-466c-9a87-fa74e5e56651',
          type: 'file-updated',
          timestamp: 1677853313546,
          partitionKey: 'e82fa80f-0448-4a1f-a15b-bf27d56eb1ec',
          tags: {
            account: 'undefined',
            region: 'us-west-2',
            stage: 'undefined',
            source: 'undefined',
            functionname: 'undefined',
            pipeline: 't1',
            skip: true,
          },
          file: {
            key: {
              bucket: 'my-template-s3-bff-service-stg-us-west-2',
              key: 'file/e82fa80f-0448-4a1f-a15b-bf27d56eb1ec/login-gov.png',
              versionId: 'KLvnFF0R8i.biiFJjwUltq5rmSATPHVc',
              sequencer: '00640202817AF63B5D',
            },
            awsregion: 'us-west-2',
            discriminator: 'file',
            fileid: 'login-gov.png',
            entityid: 'e82fa80f-0448-4a1f-a15b-bf27d56eb1ec',
            lastmodifiedby: 'john.gilbert@example.com',
            timestamp: 1677853167000,
            lastModified: '2023-03-03T14:19:27.000Z',
            contentLength: 8913,
            etag: '2de9cfd92e8b288ac6ebc263471ab500',
            versionId: 'COE5iyDeRVsJxEkhOPkelivGhdRGxXCn',
            cacheControl: 'private, max-age=300',
            contentDisposition: 'inline; filename="login-gov.png"',
            contentType: 'image/png',
          },
          raw: {
            headObject: {
              AcceptRanges: 'bytes',
              LastModified: '2023-03-03T14:19:27.000Z',
              ContentLength: 8913,
              ETag: '2de9cfd92e8b288ac6ebc263471ab500',
              VersionId: 'COE5iyDeRVsJxEkhOPkelivGhdRGxXCn',
              CacheControl: 'private, max-age=300',
              ContentDisposition: 'inline; filename="login-gov.png"',
              ContentType: 'image/png',
              ServerSideEncryption: 'AES256',
              Metadata: {
                awsregion: 'us-west-2',
                discriminator: 'file',
                fileid: 'login-gov.png',
                entityid: 'e82fa80f-0448-4a1f-a15b-bf27d56eb1ec',
                lastmodifiedby: 'john.gilbert@example.com',
              },
            },
            s3: {
              eventVersion: '2.1',
              eventSource: 'aws:s3',
              awsRegion: 'us-west-2',
              eventTime: '2023-03-03T14:21:53.546Z',
              eventName: 'ObjectCreated:Put',
              userIdentity: {
                principalId: 'AWS:AROAS7TXAMV3XQTXOQPGO:template-s3-bff-service-stg-rest',
              },
              requestParameters: {
                sourceIPAddress: '96.255.48.5',
              },
              responseElements: {
                'x-amz-request-id': '77XZATS2ZKYPCWP3',
                'x-amz-id-2': 'OyY6O59WMi0ZCpMIhHrJZtvNrzxyxxasHi7ALa0DuVk+Qi/47fXMd4OX2w3RSsCA69iVRCIahdKunUq5WZ0GxfjsUcGT4g3i',
              },
              s3: {
                s3SchemaVersion: '1.0',
                configurationId: '25e27fc7-e35c-4081-83ca-1feef388c5fd',
                bucket: {
                  name: 'my-template-s3-bff-service-stg-us-west-2',
                  ownerIdentity: {
                    principalId: 'A2J5X61LJ23DB3',
                  },
                  arn: 'arn:aws:s3:::my-template-s3-bff-service-stg-us-west-2',
                },
                object: {
                  key: 'file/e82fa80f-0448-4a1f-a15b-bf27d56eb1ec/login-gov.png',
                  size: 8913,
                  eTag: '2de9cfd92e8b288ac6ebc263471ab500',
                  versionId: 'KLvnFF0R8i.biiFJjwUltq5rmSATPHVc',
                  sequencer: '00640202817AF63B5D',
                },
              },
            },
          },
        });
        expect(collected[2].emit).to.deep.equal({
          id: '0a259fb5-24e7-4fa5-af08-275b51abea8d',
          type: 'file-deleted',
          timestamp: 1677853329976,
          partitionKey: '6r3D2azF1Y3ndS6u9ENaE02XywDAgVO2',
          tags: {
            account: 'undefined',
            region: 'us-west-2',
            stage: 'undefined',
            source: 'undefined',
            functionname: 'undefined',
            pipeline: 't1',
            skip: true,
          },
          file: {
            key: {
              bucket: 'my-template-s3-bff-service-stg-us-west-2',
              key: 'file/e82fa80f-0448-4a1f-a15b-bf27d56eb1ec/login-gov.png',
              versionId: '6r3D2azF1Y3ndS6u9ENaE02XywDAgVO2',
              sequencer: '0064020291F26CC673',
            },
          },
          raw: {
            s3: {
              eventVersion: '2.1',
              eventSource: 'aws:s3',
              awsRegion: 'us-west-2',
              eventTime: '2023-03-03T14:22:09.976Z',
              eventName: 'ObjectRemoved:DeleteMarkerCreated',
              userIdentity: {
                principalId: 'AWS:AROAS7TXAMV3XQTXOQPGO:template-s3-bff-service-stg-rest',
              },
              requestParameters: {
                sourceIPAddress: '172.31.0.171',
              },
              responseElements: {
                'x-amz-request-id': 'CKJTHNTJ3PR820A3',
                'x-amz-id-2': 'Zw7Uy/t2ttGyKgoAavdsUNuneSNIZdJsffDf+byDut4F/EyZ/oLRDmPdoDRZoPRAKTwgjGJyXxfUneGZDcQ+yjOeADK3Hq9C',
              },
              s3: {
                s3SchemaVersion: '1.0',
                configurationId: '6e48580d-a6f3-48a3-97e6-2d5b2a46f03a',
                bucket: {
                  name: 'my-template-s3-bff-service-stg-us-west-2',
                  ownerIdentity: {
                    principalId: 'A2J5X61LJ23DB3',
                  },
                  arn: 'arn:aws:s3:::my-template-s3-bff-service-stg-us-west-2',
                },
                object: {
                  key: 'file/e82fa80f-0448-4a1f-a15b-bf27d56eb1ec/login-gov.png',
                  eTag: 'd41d8cd98f00b204e9800998ecf8427e',
                  versionId: '6r3D2azF1Y3ndS6u9ENaE02XywDAgVO2',
                  sequencer: '0064020291F26CC673',
                },
              },
            },
            headObject: undefined,
          },
        });
      })
      .done(done);
  });
});
