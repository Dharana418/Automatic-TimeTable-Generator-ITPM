module.exports = {
  testEnvironment: 'node',
  // This tells Jest to look for tests in YOUR folder structure
  testMatch: [
    '**/_tests_/**/*.test.js',     // Your current folder: _tests_
    '**/tests/**/*.test.js',        // Alternative folder name
    '**/__tests__/**/*.test.js'     // Standard folder name
  ],
  verbose: true,
  testTimeout: 10000
};