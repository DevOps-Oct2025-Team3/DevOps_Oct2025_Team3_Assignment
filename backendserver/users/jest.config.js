module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'controllers/**/*.js',
        'models/**/*.js',
        'middlewares/**/*.js',
        '!**/*.test.js',
        '!**/node_modules/**'
    ],
    coverageReporters: [
        'text',
        'text-summary',
        'html',
        'lcov',
        'json'
    ],
    coverageThreshold: {
        global: {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90
        },
        // Specific thresholds for tested components
        './controllers/**/*.js': {
            branches: 95,
            functions: 100,
            lines: 100,
            statements: 100
        },
        './models/**/*.js': {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100
        }
    },
    testMatch: [
        '**/tests/**/*.test.js'
    ],
    verbose: true,
    collectCoverage: true
};
