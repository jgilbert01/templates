module.exports = {
  transform: {
    '^.+\\.(j|t)sx?$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|scss|png|jpg)$': 'identity-obj-proxy',
    '@template-ui/auth': '<rootDir>/src/__test-mocks__/auth.js',
  },
  setupFilesAfterEnv: ['./jest.setup.js'],
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/__test-mocks__/**/*',
    '!src/types/**/*',
  ],
  coverageReporters: ['clover', 'json', 'lcov', 'text', 'text-summary'],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 30,
      lines: 50,
      statements: 40,
    },
  },
};
