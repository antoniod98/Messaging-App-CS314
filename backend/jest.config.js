module.exports = {
  testEnvironment: 'node',

  // run one at a time so tests don't mess with each other's database
  maxWorkers: 1,

  collectCoverageFrom: [
    'routes/**/*.js',
    'middleware/**/*.js',
    'models/**/*.js',
    'socket/**/*.js',
    '!**/node_modules/**',
  ],

  coverageThreshold: {
    global: {
      branches: 69,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  testMatch: ['**/__tests__/**/*.test.js'],

  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],

  verbose: true,
};
