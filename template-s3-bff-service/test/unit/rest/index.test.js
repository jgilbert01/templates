import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { handle } from '../../../src/rest';
import Model from '../../../src/models/file';

describe('rest/index.js', () => {
  afterEach(sinon.restore);

  it('should test successful handle call', async () => {
    const spy = sinon.stub(Model.prototype, 'get').resolves({
      last: undefined,
      data: [
        {
          Key: 'files/123/test.txt',
          VersionId: '1',
          LastModified: '2022-06-22T13:10:33.000Z',
          Size: 399863,
          SignedUrl: 'https://123/456',
          Type: 'txt',
          CacheControl: 'private, max-age=300',
          ContentDisposition: 'inline; filename="test.txt"',
          ContentType: 'text/plain',
          Metadata: {
            discriminator: 'files',
            entityId: '123',
            fileId: 'test.txt',
            lastmodifiedby: 'system',
            awsregion: 'us-west-2',
          },
        },
      ],
    });

    const res = await handle(REQUEST, {});

    expect(spy).to.have.been.calledWithMatch({
      discriminator: 'files',
      entityId: '123',
      fileId: 'test.txt',
    });
    expect(res).to.deep.equal(RESPONSE);
  });
});

const REQUEST = {
  body: null,
  headers: {
    'Host': 'localhost:3001', 'Accept-Encoding': 'gzip, deflate', 'User-Agent': 'node-superagent/3.8.3', 'Connection': 'close',
  },
  httpMethod: 'GET',
  multiValueHeaders: {
    'Host': ['localhost:3001'], 'Accept-Encoding': ['gzip, deflate'], 'User-Agent': ['node-superagent/3.8.3'], 'Connection': ['close'],
  },
  multiValueQueryStringParameters: null,
  path: '/files/files/123/test.txt/versions',
  pathParameters: { proxy: 'files/files/123/test.txt/versions' },
  queryStringParameters: null,
  requestContext: {
    accountId: 'offlineContext_accountId',
    apiId: 'offlineContext_apiId',
    authorizer: { principalId: 'offlineContext_authorizer_principalId' },
    httpMethod: 'GET',
    identity: {
      accountId: 'offlineContext_accountId',
      apiKey: 'offlineContext_apiKey',
      caller: 'offlineContext_caller',
      cognitoAuthenticationProvider: 'offlineContext_cognitoAuthenticationProvider',
      cognitoAuthenticationType: 'offlineContext_cognitoAuthenticationType',
      cognitoIdentityId: 'offlineContext_cognitoIdentityId',
      cognitoIdentityPoolId: 'offlineContext_cognitoIdentityPoolId',
      sourceIp: '127.0.0.1',
      user: 'offlineContext_user',
      userAgent: 'node-superagent/3.8.3',
      userArn: 'offlineContext_userArn',
    },
    protocol: 'HTTP/1.1',
    requestId: 'offlineContext_requestId_ckf9tmzj800011vzrhoekcly8',
    requestTimeEpoch: 1600528993747,
    resourceId: 'offlineContext_resourceId',
    resourcePath: '/{proxy*}',
    stage: 'stg',
  },
  resource: '/{proxy*}',
  stageVariables: null,
  isOffline: true,
};

const RESPONSE = {
  isBase64Encoded: false,
  multiValueHeaders: {
    'content-type': ['application/json'],
    // 'content-length': [''],
    'cache-control': ['private, max-age=300'],
    'access-control-allow-origin': ['*'],
    'access-control-allow-methods': ['GET, PUT, POST, DELETE, OPTIONS'],
    'access-control-allow-headers': ['Content-Type, Authorization, Content-Length, X-Requested-With'],
  },
  statusCode: 200,
  body: JSON.stringify({
    last: undefined,
    data: [
      {
        Key: 'files/123/test.txt',
        VersionId: '1',
        LastModified: '2022-06-22T13:10:33.000Z',
        Size: 399863,
        SignedUrl: 'https://123/456',
        Type: 'txt',
        CacheControl: 'private, max-age=300',
        ContentDisposition: 'inline; filename="test.txt"',
        ContentType: 'text/plain',
        Metadata: {
          discriminator: 'files',
          entityId: '123',
          fileId: 'test.txt',
          lastmodifiedby: 'system',
          awsregion: 'us-west-2',
        },
      },
    ],
  }),
};
