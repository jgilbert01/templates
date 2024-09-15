import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { handle } from '../../../src/rest';
import Model from '../../../src/models/subscription';

describe('rest/index.js', () => {
  afterEach(sinon.restore);

  it('should test successful handle call', async () => {
    const spy = sinon.stub(Model.prototype, 'longPoll').resolves({
      Messages: [{ MessageId: '1' }],
    });

    const res = await handle(REQUEST, {});

    expect(spy).to.have.been.calledWith({
      ack: [
        {
          Id: 'e9fd559d-ca23-4515-b24a-4adf471799f1',
          ReceiptHandle: 'AQEBvi77N8ma7KK8ad+oJZeyPeVmZTo8/5nTUEOk5KoJGloQFZwYaREST9w8pC2syAxi/6GL1T6wdhjq+2gHKhVnTkz6m54qS7sZoSqkoqhpkJj4s1kNLyqztaGYzf7eE1cmDOTWukYiJ/Tz1F5m00iDBH3wPG4pR1OQcBpDFp/UTAy8xGnX5yx9rGZ2HNk2d+myRhFQh0TE0uazP5XSBJAdnpid/XuibpuMso1LVGnOxbNh+8uivX6SqsWGGT/Kndx8z3JwdOjLxv18VdvjGWe4s8K5IXo4eZYlm/+kUhMlQRzd7Te8zXIKC1P/YM2Cal4uJ9gurtAYk7gu17Puq4iQqxBS1FB8UHChzbQ/j7E9A+hurDi+RU3Z40vmC4p9+6m3tuKY8/3sLCvea8D+gSygNQ==',
        },
      ],
    });

    expect(res).to.deep.equal(RESPONSE);
  });
});

const REQUEST = {
  body: JSON.stringify({
    ack: [{
      Id: 'e9fd559d-ca23-4515-b24a-4adf471799f1',
      ReceiptHandle: 'AQEBvi77N8ma7KK8ad+oJZeyPeVmZTo8/5nTUEOk5KoJGloQFZwYaREST9w8pC2syAxi/6GL1T6wdhjq+2gHKhVnTkz6m54qS7sZoSqkoqhpkJj4s1kNLyqztaGYzf7eE1cmDOTWukYiJ/Tz1F5m00iDBH3wPG4pR1OQcBpDFp/UTAy8xGnX5yx9rGZ2HNk2d+myRhFQh0TE0uazP5XSBJAdnpid/XuibpuMso1LVGnOxbNh+8uivX6SqsWGGT/Kndx8z3JwdOjLxv18VdvjGWe4s8K5IXo4eZYlm/+kUhMlQRzd7Te8zXIKC1P/YM2Cal4uJ9gurtAYk7gu17Puq4iQqxBS1FB8UHChzbQ/j7E9A+hurDi+RU3Z40vmC4p9+6m3tuKY8/3sLCvea8D+gSygNQ==',
    }],
  }),
  headers: {
    'Host': 'localhost:3001', 'Accept-Encoding': 'gzip, deflate', 'User-Agent': 'node-superagent/3.8.3', 'Connection': 'close',
  },
  httpMethod: 'POST',
  multiValueHeaders: {
    'Host': ['localhost:3001'], 'Accept-Encoding': ['gzip, deflate'], 'User-Agent': ['node-superagent/3.8.3'], 'Connection': ['close'],
  },
  multiValueQueryStringParameters: null,
  path: '/events',
  pathParameters: { },
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
  multiValueHeaders: {
    'content-type': ['application/json'],
    'access-control-allow-origin': ['*'],
    'access-control-allow-methods': ['GET, PUT, POST, DELETE, OPTIONS'],
    'access-control-allow-headers': ['Content-Type, Authorization, Content-Length, X-Requested-With'],
  },
  statusCode: 200,
  body: JSON.stringify({
    Messages: [{ MessageId: '1' }],
  }),
  isBase64Encoded: false,
};
