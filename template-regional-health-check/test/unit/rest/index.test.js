import { handle } from '../../../src/rest';
import Model from '../../../src/models/trace';

describe('rest/index.js', () => {
  afterEach(jest.restoreAllMocks);

  it('should test successful handle call', async () => {
    const spy = jest.spyOn(Model.prototype, 'check').mockResolvedValue({
      statusCode: 200,
      timestamp: 1668251778001,
      region: 'us-west-2',
    });

    const res = await handle(REQUEST, {});

    expect(spy).toHaveBeenCalledWith();
    expect(res).toEqual(RESPONSE);
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
  path: '/check',
  pathParameters: { proxy: 'check' },
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
    'cache-control': ['no-cache, no-store, must-revalidate'],
  },
  statusCode: 200,
  body: JSON.stringify({
    statusCode: 200,
    timestamp: 1668251778001,
    region: 'us-west-2',
  }),
  isBase64Encoded: false,
};
