export default {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'scheduler/**/*.js',
    'utils/**/*.js',
    'middlewares/**/*.js',
    'models/**/*.js',
    '!**/__tests__/**',
    '!config/**',
    '!node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {},
  testTimeout: 10000,
  verbose: true
};
