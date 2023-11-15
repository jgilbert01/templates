module.exports = {
  transform: {
    "^.+\\.(j|t)sx?$": "babel-jest",
  },
  moduleNameMapper: {
    "\\.(css|scss|png|jpg)$": "identity-obj-proxy",
    "@template-ui/main": "<rootDir>/src/__test-mocks__/main.js",
    "@template-ui/auth": "<rootDir>/src/__test-mocks__/auth.js",
    "single-spa-react/parcel": "single-spa-react/lib/cjs/parcel.cjs",
  },
  setupFilesAfterEnv: ["./jest.setup.js"],
  testEnvironment: "jsdom",
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/__test-mocks__/**/*",
    "!src/types/**/*",
  ],
  coverageReporters: ["clover", "json", "lcov", "text", "text-summary"],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      statements: 30,
      branches: 30,
      functions: 20,
      lines: 30,
    }
  },
};
