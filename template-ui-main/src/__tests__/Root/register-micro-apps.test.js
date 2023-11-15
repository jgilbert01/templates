import nock from 'nock';
import { registerApplication } from 'single-spa';
import { constructLayoutEngine } from 'single-spa-layout';
import registerMicroApps from '../../Root/register-micro-apps';

jest.mock('single-spa', () => ({
  ...jest.requireActual('single-spa'),
  start: jest.fn(),
  registerApplication: jest.fn(),
}));

jest.mock('single-spa-layout', () => ({
  ...jest.requireActual('single-spa-layout'),
  constructLayoutEngine: jest.fn(),
}));

const mock2Response = JSON.stringify({
  main: [
    {
      import: '@template-ui/db',
      order: 50,
      env: [''],
    },
    {
      import: '@template-ui/nav',
      order: 40,
      allow: ['theme-my'],
    },
    {
      import: '@template-ui/nav',
      order: 40,
      deny: ['theme-my'],
    },
  ],
});

describe('register micro apps', () => {
  let activateFnMock;
  global.System = {
    import: jest.fn(),
  };
  process.env.MICRO_APP_METADATA = 'http://localhost/apps.json';
  process.env.MOUNT_POINT_METADATA = 'http://localhost/mount-points.json';
  beforeEach(() => {
    jest.resetAllMocks();
    activateFnMock = jest.fn();
    constructLayoutEngine.mockImplementation(() => ({
      activate: activateFnMock,
    }));
    registerApplication.mockImplementation(() => {});
  });
  afterEach(() => {
    nock.cleanAll();
    delete process.env.ENV;
  });
  it('should load apps configuration and filter out all apps for which isAuthorized returns false', async () => {
    const mockResponse = JSON.stringify({
      routes: [
        {
          type: 'application',
          name: '@template-ui/test',
        },
        {
          type: 'route',
          path: '/user-profile',
          routes: [
            {
              type: 'application',
              name: '@template-ui/profile',
            },
          ],
        },
      ],
    });

    nock('http://localhost').get('/apps.json').reply(200, mockResponse);
    nock('http://localhost')
      .get('/mount-points.json')
      .reply(200, mock2Response);

    const isAuthorizedFn = jest.fn().mockImplementation(() => false);

    await registerMicroApps(isAuthorizedFn);
    expect(isAuthorizedFn).toHaveBeenCalledTimes(2);
    expect(activateFnMock).toHaveBeenCalledTimes(1);
    expect(constructLayoutEngine.mock.calls[0][0].applications).toHaveLength(0);
  });
  it('should load apps configuration and filter based on env', async () => {
    process.env.ENV = 'nomatch';

    const mockResponse = JSON.stringify({
      routes: [
        {
          type: 'application',
          name: '@template-ui/test',
        },
        {
          type: 'route',
          path: '/user-profile',
          routes: [
            {
              type: 'application',
              name: '@template-ui/profile',
            },
          ],
          props: {
            env: ['test1', 'test2'],
          },
        },
      ],
    });

    nock('http://localhost').get('/apps.json').reply(200, mockResponse);
    nock('http://localhost')
      .get('/mount-points.json')
      .reply(200, mock2Response);

    const isAuthorizedFn = jest.fn().mockImplementation(() => true);

    await registerMicroApps(isAuthorizedFn);
    expect(isAuthorizedFn).toHaveBeenCalledTimes(1); // for test
    expect(activateFnMock).toHaveBeenCalledTimes(1);
    expect(constructLayoutEngine.mock.calls[0][0].applications).toHaveLength(1);
    expect(constructLayoutEngine.mock.calls[0][0].applications[0].name).toBe(
      '@template-ui/test'
    );
    expect(typeof registerApplication.mock.calls[0][0].customProps).toBe(
      'function'
    );
  });
  it('should load apps configuration and filter based on roles', async () => {
    process.env.ENV = 'nomatch';

    const mockResponse = JSON.stringify({
      routes: [
        {
          type: 'application',
          name: '@template-ui/test',
          props: {
            roles: ['test1'],
          },
        },
        {
          type: 'application',
          name: '@template-ui/nav',
          props: {
            authorizedForAllRoles: true,
          },
        },
        {
          type: 'route',
          path: '/user-profile',
          routes: [
            {
              type: 'application',
              name: '@template-ui/profile',
            },
          ],
          props: {
            roles: ['test1', 'test2'],
          },
        },
      ],
    });

    nock('http://localhost').get('/apps.json').reply(200, mockResponse);
    nock('http://localhost')
      .get('/mount-points.json')
      .reply(200, mock2Response);

    const isAuthorizedFn = jest
      .fn()
      .mockImplementation(
        param => param.includes('test2') || param.length === 0
      );

    await registerMicroApps(isAuthorizedFn);
    expect(isAuthorizedFn).toHaveBeenCalledTimes(2);
    expect(activateFnMock).toHaveBeenCalledTimes(1);
    expect(constructLayoutEngine.mock.calls[0][0].applications).toHaveLength(2);
    expect(constructLayoutEngine.mock.calls[0][0].applications[0].name).toBe(
      '@template-ui/nav'
    );
    expect(constructLayoutEngine.mock.calls[0][0].applications[1].name).toBe(
      '@template-ui/profile'
    );
  });

  it('should load apps configuration and filter based on roles and custom user expression', async () => {
    process.env.ENV = 'nomatch';

    const mockResponse = JSON.stringify({
      routes: [
        {
          type: 'application',
          name: '@template-ui/test',
          props: {
            roles: ['test1'],
          },
        },
        {
          type: 'application',
          name: '@template-ui/nav',
          props: {
            authorizedForAllRoles: true,
          },
        },
        {
          type: 'route',
          path: '/user-profile',
          routes: [
            {
              type: 'application',
              name: '@template-ui/profile',
            },
          ],
          props: {
            roles: ['test1', 'test2'],
          },
        },
        {
          type: 'route',
          path: '/cas',
          routes: [
            {
              type: 'application',
              name: '@cas-ui/review',
            },
          ],
          props: {
            description: 'CAS Returned',
            roles: [
              'ROLE_ENF_EARM_STANDARD',
              'ROLE_ENF_EARM_READ_ONLY',
              'CAS_REQT',
            ],
            rolesUserCustomExpression:
              'user.principalName.slice(user.principalName.indexOf("@")).toUpperCase().includes("CBP")',
          },
        },
      ],
    });

    nock('http://localhost').get('/apps.json').reply(200, mockResponse);
    nock('http://localhost')
      .get('/mount-points.json')
      .reply(200, mock2Response);

    const isAuthorizedFn = jest.fn().mockImplementation((param1, param2) => {
      if (param1.includes('test2')) return true;
      if (
        param1.includes('ROLE_ENF_EARM_STANDARD') &&
        param2 ===
          'user.principalName.slice(user.principalName.indexOf("@")).toUpperCase().includes("CBP")'
      )
        return true;
      return false;
    });

    await registerMicroApps(isAuthorizedFn);
    expect(isAuthorizedFn).toHaveBeenCalledTimes(3);
    expect(activateFnMock).toHaveBeenCalledTimes(1);
    expect(constructLayoutEngine.mock.calls[0][0].applications).toHaveLength(3);
    expect(constructLayoutEngine.mock.calls[0][0].applications[0].name).toBe(
      '@template-ui/nav'
    );
    expect(constructLayoutEngine.mock.calls[0][0].applications[1].name).toBe(
      '@template-ui/profile'
    );
    expect(constructLayoutEngine.mock.calls[0][0].applications[2].name).toBe(
      '@cas-ui/review'
    );
  });

  it('should load apps configuration and filter based on roles and custom user expression removing routes that do not match', async () => {
    process.env.ENV = 'nomatch';

    const mockResponse = JSON.stringify({
      routes: [
        {
          type: 'application',
          name: '@template-ui/test',
          props: {
            roles: ['test1'],
          },
        },
        {
          type: 'application',
          name: '@template-ui/nav',
          props: {
            authorizedForAllRoles: true,
          },
        },
        {
          type: 'route',
          path: '/user-profile',
          routes: [
            {
              type: 'application',
              name: '@template-ui/profile',
            },
          ],
          props: {
            roles: ['test1', 'test2'],
          },
        },
        {
          type: 'route',
          path: '/cas',
          routes: [
            {
              type: 'application',
              name: '@cas-ui/review',
            },
          ],
          props: {
            description: 'CAS Returned',
            roles: [
              'ROLE_ENF_EARM_STANDARD',
              'ROLE_ENF_EARM_READ_ONLY',
              'CAS_REQT',
            ],
            rolesUserCustomExpression:
              'user.principalName.slice(user.principalName.indexOf("@")).toUpperCase().includes("CBP")',
          },
        },
      ],
    });

    nock('http://localhost').get('/apps.json').reply(200, mockResponse);
    nock('http://localhost')
      .get('/mount-points.json')
      .reply(200, mock2Response);

    const isAuthorizedFn = jest.fn().mockImplementation((param1, param2) => {
      if (param1.includes('test2')) return true;
      if (
        param1.includes('ROLE_ENF_EARM_STANDARD') &&
        param2 !==
          'user.principalName.slice(user.principalName.indexOf("@")).toUpperCase().includes("CBP")'
      )
        return true;
      return false;
    });

    await registerMicroApps(isAuthorizedFn);
    expect(isAuthorizedFn).toHaveBeenCalledTimes(3);
    expect(activateFnMock).toHaveBeenCalledTimes(1);
    expect(constructLayoutEngine.mock.calls[0][0].applications).toHaveLength(2);
    expect(constructLayoutEngine.mock.calls[0][0].applications[0].name).toBe(
      '@template-ui/nav'
    );
    expect(constructLayoutEngine.mock.calls[0][0].applications[1].name).toBe(
      '@template-ui/profile'
    );
  });
});
