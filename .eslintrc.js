module.exports = {
  env: {
    browser: true,
    node: true,
    es2021: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-inner-declarations': 0,
    'no-async-promise-executor': 0,
    'no-constant-condition': 0,
    'no-empty': 0
  },
  globals: {
    Babel: 'readonly'
  }
};
