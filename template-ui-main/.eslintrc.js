const config = {
  extends: [
    'plugin:react/recommended',
    'plugin:jest/recommended',
    'airbnb',
    'plugin:prettier/recommended',
  ],
  parser: '@babel/eslint-parser',
  plugins: ['react', 'react-hooks', 'prettier', 'jest'],
  env: {
    browser: true,
    node: true,
    commonjs: true,
    'jest/globals': true,
  },
  parserOptions: {
    ecmaVersion: 13,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'react/require-default-props': 0,
    'react/jsx-indent-props': 1,
    'react/jsx-props-no-spreading': 0,
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
    'prettier/prettier': 'error',
  },
  globals: {
    System: true,
    jest: true,
  },
};

module.exports = config;
