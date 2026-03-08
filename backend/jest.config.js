// jest configuration for backend testing
module.exports = {
  // test environment
  testEnvironment: 'node',

  // run tests sequentially to avoid database conflicts
  maxWorkers: 1,

  // coverage collection
  collectCoverageFrom: [
    'routes/**/*.js',
    'middleware/**/*.js',
    'models/**/*.js',
    'socket/**/*.js',
    '!**/node_modules/**',
  ],

  // coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // test match patterns
  testMatch: ['**/__tests__/**/*.test.js'],

  // setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],

  // verbose output
  verbose: true,
};
