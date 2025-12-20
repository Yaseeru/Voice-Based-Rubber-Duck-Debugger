module.exports = {
     preset: 'ts-jest',
     testEnvironment: 'jsdom',
     roots: ['<rootDir>/src'],
     testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
     collectCoverageFrom: [
          'src/**/*.{ts,tsx}',
          '!src/**/*.d.ts',
          '!src/**/*.test.{ts,tsx}'
     ],
     moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
     transform: {
          '^.+\\.tsx?$': 'ts-jest'
     },
     setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts']
};
