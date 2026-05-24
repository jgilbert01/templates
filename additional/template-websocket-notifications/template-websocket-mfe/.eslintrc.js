module.exports = {
  extends: [
    'plugin:react/recommended',
    'plugin:jest/recommended',
  ],
  parser: '@babel/eslint-parser',
  plugins: ['react', 'react-hooks', 'jest'],
  env: {
    browser: true,
    node: true,
    'jest/globals': true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    requireConfigFile: false,
  },
  rules: {
    'react/react-in-jsx-scope': 0,
    'react/prop-types': 0,
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
    'no-unused-vars': [1, { vars: 'local', args: 'none' }],
  },
};
