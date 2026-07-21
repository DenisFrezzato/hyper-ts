module.exports = {
  collectCoverage: true,
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: 'test',
  moduleFileExtensions: ['ts', 'js'],
  testPathIgnorePatterns: ['_helpers.ts', 'type-tests'],
  coverageReporters: ['lcovonly', 'text'],
}
