// Copyright 2024, University of Colorado Boulder
// @author Jonathan Olson <jonathan.olson@colorado.edu>

module.exports = {
  root: true,
  rules: {
    'no-bitwise': 'off'
  },
  globals: {},
  ignorePatterns: [ 'dist' ],
  overrides: [
    {
      files: [
        '**/*.ts'
      ],
      parserOptions: {
        sourceType: 'module'
      }
    }
  ],
  env: {
    browser: true,
    es6: true
  },
  parserOptions: {
    ecmaVersion: 8,
    sourceType: 'module'
  }
};
