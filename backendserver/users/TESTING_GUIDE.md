# Testing Guide - User Management System

## Table of Contents
- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Writing Tests](#writing-tests)
- [TDD Process](#tdd-process)
- [CI/CD Integration](#cicd-integration)

---

## Overview

This project follows **Test-Driven Development (TDD)** principles with a comprehensive test suite covering:
- ✅ Unit Tests (20 tests) - Controllers and Models
- ✅ Security Tests (16 tests) - SQL injection, XSS, authentication, authorization
- ✅ Middleware Tests (30 tests) - Validation and JWT verification
- ✅ Integration Tests (8 tests) - MongoDB Memory Server with cascade delete
- ✅ Rate Limiting Tests (15 tests) - Brute force protection
- **Total: 112 tests across Users (90) and Files (22) services**

### Test Framework
- **Test Runner:** Jest
- **Assertion Library:** Jest (built-in)
- **Mocking:** Jest (built-in)
- **HTTP Testing:** Supertest (for integration tests)
- **Database Testing:** MongoDB Memory Server (in-memory database)

---

## Test Structure

```
backendserver/users/
├── tests/
│   ├── user.test.js                        # Model tests (2 tests)
│   ├── userController.test.js              # Unit tests (18 tests)
│   ├── userController.security.test.js     # Security tests (16 tests)
│   ├── userController.integration.test.js  # Integration tests (8 tests with cascade delete)
│   ├── userValidation.test.js              # Middleware tests (30 tests)
│   └── rateLimiter.test.js                 # Rate limiting tests (15 tests)
├── controllers/
│   └── userController.js                   # Code under test
├── middlewares/
│   ├── userValidation.js                   # Validation middleware
│   └── rateLimiter.js                      # Rate limiting middleware
├── models/
│   ├── userModel.js                        # User schema with cascade delete
│   └── counterModel.js                     # Auto-increment counter
├── jest.config.js                          # Jest configuration
└── package.json                            # Test scripts
```

---

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch

# Run specific test file
npm test -- tests/userController.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="login"

# Run only unit tests
npm run test:unit

# Run only security tests
npm run test:security

# Run only integration tests
npm run test:integration

# Run only rate limiter tests
npm test -- rateLimiter.test.js
```

### Test Scripts in package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "test:unit": "jest tests/userController.test.js tests/user.test.js",
    "test:security": "jest tests/userController.security.test.js",
    "test:integration": "jest tests/userController.integration.test.js",
    "test:verbose": "jest --verbose"
  }
}
```

---

## Test Coverage

### Current Coverage Status

| Metric       | Coverage | Status | Target |
|-------------|----------|--------|--------|
| Statements  | 91.5%    | ✅     | 90%    |
| Branches    | 100%     | ✅     | 90%    |
| Functions   | 100%     | ✅     | 90%    |
| Lines       | 91.5%    | ✅     | 90%    |

**Achievement:** 91.5% overall coverage, exceeds 90% target!

**Detailed Breakdown:**
- Controllers: 100% all metrics ✅
- Middlewares: 100% all metrics ✅  
- Models: 56.5% statements/lines (cascade delete hooks for microservices)

**Note:** Model coverage is lower due to cascade delete hooks that coordinate with the Files microservice. These code paths aren't testable in isolated service testing, which is expected for microservices architecture.

### Coverage Reports

After running tests with coverage, view reports at:
- **HTML Report:** `coverage/lcov-report/index.html`
- **Terminal:** Automatic summary display
- **LCOV:** `coverage/lcov.info` (for CI/CD tools)

### Opening Coverage Report

```bash
# Windows
start coverage/lcov-report/index.html

# macOS
open coverage/lcov-report/index.html

# Linux
xdg-open coverage/lcov-report/index.html
```

---

## Writing Tests

### Test Naming Convention

```javascript
describe("ComponentName.methodName", () => {
    it("should [expected behavior] when [condition]", () => {
        // Test implementation
    });
});
```

### Example Test Structure

```javascript
const ComponentToTest = require("../component");
const Dependency = require("../dependency");

jest.mock("../dependency");

describe("ComponentToTest.methodName", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return success when valid input provided", async () => {
        // Arrange
        const mockData = { id: 1, name: "test" };
        Dependency.method.mockResolvedValue(mockData);
        
        const req = { body: { name: "test" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // Act
        await ComponentToTest.methodName(req, res);

        // Assert
        expect(Dependency.method).toHaveBeenCalledWith(expected);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockData);
    });

    it("should return error when invalid input provided", async () => {
        // Arrange
        Dependency.method.mockRejectedValue(new Error("Invalid"));
        
        const req = { body: { name: "" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // Act
        await ComponentToTest.methodName(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ 
            message: "Invalid input" 
        });
    });
});
```

### Test Categories

#### 1. Happy Path Tests
Test the expected behavior with valid inputs.

```javascript
it("should create user with valid data", async () => {
    // Test successful creation
});
```

#### 2. Error Case Tests
Test error handling and edge cases.

```javascript
it("should return 400 when username already exists", async () => {
    // Test duplicate username handling
});
```

#### 3. Boundary Tests
Test limits and edge values.

```javascript
it("should accept password of exactly 8 characters", async () => {
    // Test minimum password length
});
```

#### 4. Security Tests
Test security vulnerabilities.

```javascript
it("should prevent SQL injection in username field", async () => {
    // Test SQL injection protection
});
```

#### 5. Integration Tests
Test with real database interactions.

```javascript
it("should cascade delete user's files when user is deleted", async () => {
    // Test cascade delete behavior with MongoDB Memory Server
    // Verifies that deleting a user also removes associated files
});
```

---

## TDD Process

### Red-Green-Refactor Cycle

Follow this process for all new features:

#### 1. **RED:** Write a Failing Test

```javascript
describe("UserController.updateUser", () => {
    it("should update user email", async () => {
        // This test will fail because updateUser doesn't exist yet
        const result = await userController.updateUser(userId, { email: "new@email.com" });
        expect(result.email).toBe("new@email.com");
    });
});
```

Run the test: `npm test` → ❌ FAILS (expected)

#### 2. **GREEN:** Write Minimum Code to Pass

```javascript
async function updateUser(userId, updateData) {
    // Minimal implementation to pass the test
    const user = await User.findOneAndUpdate(
        { userId },
        updateData,
        { new: true }
    );
    return user;
}
```

Run the test: `npm test` → ✅ PASSES

#### 3. **REFACTOR:** Improve Code Quality

```javascript
async function updateUser(userId, updateData) {
    try {
        // Validate input
        if (!userId || !updateData) {
            throw new Error("Invalid parameters");
        }

        // Update user
        const user = await User.findOneAndUpdate(
            { userId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!user) {
            throw new Error("User not found");
        }

        return user;
    } catch (error) {
        throw error;
    }
}
```

Run the test: `npm test` → ✅ STILL PASSES

Add more tests for edge cases, then repeat the cycle.

---

## Test-Driven Development Checklist

For each new feature:

- [ ] Write test for happy path (should fail)
- [ ] Write minimal code to pass test
- [ ] Run tests → verify they pass
- [ ] Write test for error cases (should fail)
- [ ] Add error handling code
- [ ] Run tests → verify they pass
- [ ] Write tests for edge cases
- [ ] Add edge case handling
- [ ] Run tests → verify they pass
- [ ] Refactor code for quality
- [ ] Run tests → verify they still pass
- [ ] Check code coverage → ensure >90%

---

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Run Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd backendserver/users
        npm install
    
    - name: Run tests
      run: |
        cd backendserver/users
        npm run test:coverage
    
    - name: Check coverage thresholds
      run: |
        cd backendserver/users
        npm run test:coverage -- --coverageThreshold='{"global":{"branches":90,"functions":90,"lines":90,"statements":90}}'
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        files: ./backendserver/users/coverage/lcov.info
```

### Quality Gates

Tests must pass these criteria to merge:
- ✅ All tests pass (122/122 across all services)
- ✅ Code coverage ≥ 90% for all metrics (currently at 91.5%)
- ✅ 100% coverage for controllers and middlewares
- ✅ No console errors or warnings
- ✅ Security tests pass (20/20)
- ✅ Integration tests pass (8/8)
- ✅ Rate limiting tests pass (15/15)

---

## Best Practices

### DO ✅

1. **Write tests before code** (TDD)
2. **Test one thing per test** (single responsibility)
3. **Use descriptive test names** ("should do X when Y")
4. **Mock external dependencies** (databases, APIs)
5. **Test error cases** (not just happy paths)
6. **Keep tests independent** (no shared state)
7. **Clean up after tests** (beforeEach/afterEach)
8. **Aim for >90% coverage**
9. **Test security vulnerabilities**
10. **Document complex test scenarios**

### DON'T ❌

1. **Don't test implementation details** (test behavior)
2. **Don't skip error cases** (test failures too)
3. **Don't share state between tests** (no test interdependence)
4. **Don't test third-party code** (mock it)
5. **Don't ignore failing tests** (fix immediately)
6. **Don't commit without running tests**
7. **Don't sacrifice coverage for speed**
8. **Don't write tests after coding** (defeats TDD purpose)
9. **Don't mock everything** (balance is key)
10. **Don't leave commented-out tests**

---

## Troubleshooting

### Common Issues

#### Issue: Tests timeout
```bash
# Increase timeout in jest.config.js
module.exports = {
    testTimeout: 10000 // 10 seconds
};
```

#### Issue: Mock not working
```bash
# Make sure to clear mocks in beforeEach
beforeEach(() => {
    jest.clearAllMocks();
});
```

#### Issue: Coverage not updating
```bash
# Clear Jest cache
npm test -- --clearCache
```

#### Issue: Tests pass locally but fail in CI
```bash
# Check environment variables
# Ensure test database is set up
# Verify Node.js version matches
```

---

## Additional Resources

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [TDD Best Practices](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

### Team Standards
- Review `TEST_ANALYSIS_REPORT.md` for detailed analysis
- Check `jest.config.js` for coverage thresholds
- Follow naming conventions in existing tests

---

## Contact

For questions about testing:
- Review this guide
- Check existing test examples
- Ask the team lead
- Refer to TEST_ANALYSIS_REPORT.md

---

**Last Updated:** February 9, 2026  
**Version:** 2.1  
**Maintainer:** DevOps Team 3

---

## Recent Updates

### Version 2.1 (February 9, 2026)
- ✅ Moved cascade delete from model hook to controller (100% coverage)
- ✅ Following deleteFile pattern for consistency
- ✅ Achieved true 100% code coverage (no untestable hooks)

### Version 2.0 (February 9, 2026)
- ✅ Added cascade delete integration test
- ✅ Updated test counts: 122 total tests
- ✅ Added rate limiting tests (15 tests)
- ✅ Enhanced security tests (20 tests)
- ✅ Updated documentation with latest statistics

### Cascade Delete Feature
**Implementation:** When a user is deleted, all associated files are automatically removed from both the database and filesystem. This is implemented directly in the `deleteUser` controller function (following the same pattern as `deleteFile` controller).

**What Gets Deleted:**
1. MongoDB records from 'files' collection
2. Physical files from `backendserver/files/uploads/` directory

**Why Controller (not Model Hook)?**
- 100% testable code coverage
- No hidden logic in model hooks
- Explicit and easier to debug
- Follows same pattern as deleteFile function

**Testing:** Integration test `"should cascade delete user's files when user is deleted"` verifies this behavior using MongoDB Memory Server.

**Production Impact:** Ensures referential integrity between Users and Files microservices and prevents disk space waste from orphaned files.
