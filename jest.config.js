module.exports = {
  collectCoverage: true,
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: 'test',
  moduleFileExtensions: ['ts', 'js'],
  testPathIgnorePatterns: ['_helpers.ts'],
  coverageReporters: ['lcovonly', 'text']
}
