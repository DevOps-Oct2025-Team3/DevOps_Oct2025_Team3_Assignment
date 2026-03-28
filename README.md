# DevOps_Oct2025_Team3_Assignment

## Developer Guide
This guide will help you clone, set up, and deploy the MVP SecureApp project.

---

## 1. Clone and Setup the Project

### Prerequisites
Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **Docker Engine**(for Linux) or **Docker Desktop**(for Windows/Mac)
- **Git**
- **MongoDB Atlas account** (or local MongoDB instance)

### Step 1: Clone the Repository
```bash
git clone https://github.com/DevOps-Oct2025-Team3/DevOps_Oct2025_Team3_Assignment.git

cd DevOps_Oct2025_Team3_Assignment
```

### Step 2: Install Dependencies
Install all required npm packages:
```bash
npm install
```

### Step 3: Configure Environment Variables
Create `.env` files in the respective service directories with the following variables:

**For Users Service** (`backendserver/users/.env`):
```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<database>?retryWrites=true&w=majority

# JWT Secret (use a strong random string)
JWT_SECRET=your-secure-jwt-secret-key

# Server Port (optional)
PORT=4001
```

**For Files Service** (`backendserver/files/.env`):
```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<database>?retryWrites=true&w=majority

# Server Port (optional)
PORT=4002
```

**Note**: Replace `<username>`, `<password>`, and `<database>` with your MongoDB Atlas credentials.

### Step 4: Verify Project Structure
Ensure your project structure looks like this:
```
DevOps_Oct2025_Team3_Assignment/
├── backendserver/
│   ├── docker-compose.yml
│   ├── files/                      # File management service
│   │   ├── app.js
│   │   ├── dbConfig.js
│   │   ├── Dockerfile
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── controller/
│   │   │   └── fileController.js
│   │   ├── middlewares/
│   │   │   └── userValidation.js
│   │   ├── model/
│   │   │   └── fileModel.js
│   │   ├── tests/
│   │   │   ├── file.test.js
│   │   │   ├── fileController.test.js
│   │   │   └── fileController.security.test.js
│   │   ├── coverage/
│   │   └── uploads/
│   ├── gateway/                    # API Gateway service
│   │   ├── Dockerfile
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   └── src/
│   │       ├── app.js
│   │       └── routes.js
│   └── users/                      # User management service
│       ├── app.js
│       ├── dbConfig.js
│       ├── Dockerfile
│       ├── jest.config.js
│       ├── package-lock.json
│       ├── package.json
│       ├── TESTING_GUIDE.md
│       ├── controllers/
│       │   └── userController.js
│       ├── middlewares/
│       │   ├── rateLimiter.js
│       │   └── userValidation.js
│       ├── models/
│       │   ├── counterModel.js
│       │   └── userModel.js
│       ├── tests/
│       │   ├── rateLimiter.test.js
│       │   ├── user.test.js
│       │   ├── userController.test.js
│       │   ├── userController.integration.test.js
│       │   ├── userController.security.test.js
│       │   └── userValidation.test.js
│       └── coverage/
├── frontend/                       # Frontend application
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── index.html
│   ├── userDashboard.html
│   └── js/
│       └── frontend.js
├── coverage/                       # Combined coverage reports
├── .dockerignore
├── .gitignore
├── package-lock.json
├── package.json
├── README.md
└── TEST_ANALYSIS_REPORT.md         # Detailed test analysis
```

### Step 5: Run Tests
Before running the application, verify all tests pass:
```bash
cd backendserver/users
npm test
```

Expected output: **90 tests passing** ✅

```bash
cd backendserver/files
npm test
```

Expected output: **22 tests passing** ✅

**Quick Test Commands:**
```bash
npm test                 # Run all tests
npm run test:coverage    # Run tests with coverage report
```

**Test Coverage Status:**
- ✅ **112 tests passing** - all tests green!
  - 51 unit tests (18 user controller + 2 user model + 20 file controller + 2 file model)
  - 30 middleware validation tests (userValidation + JWT verification)
  - 20 security tests (SQL injection, password hashing, JWT, RBAC, brute force)
  - 8 integration tests (end-to-end API testing with MongoDB Memory Server + cascade delete)
  - 15 rate limiting tests (login, create user, delete user, API limits)
- ✅ **99.14% Overall Code Coverage** (Users service)
  - Controllers: 98.66% statements/lines, 100% branches, 100% functions
  - Middlewares: 100% statements, 100% branches, 100% functions, 100% lines
  - Models: 100% statements, 100% branches, 100% functions, 100% lines
  
**Note on Controller Coverage**: Cascade delete is implemented in the controller (not model hooks) for better testability. The single uncovered line (98.66%) is defensive error handling for module loading that cannot be triggered in tests. This is production-ready code with comprehensive real-world scenario coverage.

**Test Framework & Tools:**
- **Jest** - Testing framework with built-in coverage
- **Supertest** - HTTP assertions for integration tests
- **MongoDB Memory Server** - In-memory database for isolated integration tests
- **bcryptjs** - Pure JavaScript password hashing (no native compilation)
- **jsonwebtoken** - JWT token generation and verification tests

**Password Requirements (enforced in tests):**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter  
- At least 1 number

### Step 6: Run the Application Locally

#### Option A: Using Node.js directly
```bash
npm start
```
The server will start on `http://localhost:4001`

#### Option B: Using Docker Compose
```bash
docker compose up --build
```
This will:
- Build the Docker images
- Start the backend service on port 4001
- Connect to MongoDB Atlas

**Note**: Make sure **Docker Desktop/Engine** is running. \
Run ```docker compose down ``` to stop and remove containers created from ```docker compose up```

### Step 7: Access the Application
Open your browser and navigate to:
```
file:///path/to/DevOps_Oct2025_Team3_Assignment/frontend/index.html
```
Or serve the frontend using a local web server:
```bash
# Using Python 3
cd frontend
python -m http.server 8080

# Then open http://localhost:8080
```

### Default Login Credentials
- **Admin Account**: Create via API or database
  - Username: `admin`
  - Password: Must meet criteria (8+ chars, 1 uppercase, 1 lowercase, 1 number)

### Security Features

#### Cascade Delete Protection
When a user is deleted, the system automatically removes their associated files to maintain referential integrity:

**Implementation**:
- Implemented in `deleteUser` controller function (similar to `deleteFile` pattern)
- Deletes **both** database records AND physical files from uploads/ folder
- Gracefully handles microservices architecture (fails silently if Files model unavailable)
- In production, would use message queue/event bus for cross-service coordination

**What Gets Deleted**:
1. **Database records**: File metadata from MongoDB files collection
2. **Physical files**: Actual PDF/document files from `backendserver/files/uploads/` directory

**Benefits**:
- Prevents orphaned files in the database
- Prevents orphaned files in the filesystem (disk space cleanup)
- Maintains data consistency across services
- Automated cleanup reduces manual maintenance
- 100% test coverage (no untestable hooks)

**Testing**: Integration test verifies cascade delete behavior using MongoDB Memory Server

#### Rate Limiting Protection
The application includes comprehensive rate limiting to prevent abuse:

**Login Endpoint** (`POST /login`)
- **Limit**: 5 attempts per 15 minutes per IP
- **Purpose**: Prevents brute force password attacks
- **Response**: `429 Too Many Requests` after limit exceeded

**User Creation** (`POST /admin/create_user`)
- **Limit**: 10 requests per hour per IP
- **Purpose**: Prevents spam account creation
- **Response**: Custom error message

**User Deletion** (`DELETE /admin/delete_user/:id`)
- **Limit**: 20 requests per 15 minutes per IP
- **Purpose**: Prevents abuse of delete operations and potential data loss attacks
- **Response**: `429 Too Many Requests` after limit exceeded

**General API**
- **Limit**: 100 requests per 15 minutes per IP
- **Purpose**: Prevents DoS/DDoS attacks and resource exhaustion
- **Headers**: Includes `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`

**Implementation**: Built with `express-rate-limit` middleware
- Applies to ALL requests (both successful and failed)
- Per-IP tracking
- Standard HTTP 429 status codes
- Includes retry-after information

---

## 2. CI/CD Pipeline Setup and Execution

### Overview
This project uses **GitHub Actions** for automated Continuous Integration and Continuous Deployment with a release-based workflow.

**📄 Workflow Files**:
- [`.github/workflows/build-test.yml`](.github/workflows/build-test.yml) - Continuous Integration
- [`.github/workflows/auto-merge-on-release.yml`](.github/workflows/auto-merge-on-release.yml) - Release Automation
- [`.github/workflows/deploy-staging.yml`](.github/workflows/deploy-staging.yml) - Continuous Deployment

### Pipeline Stages

The CI/CD pipeline consists of 3 automated workflows:

#### 1. **Build & Test** (`build-test.yml`) - Continuous Integration
   - Triggers on pull requests to main
   - Installs dependencies for users and files services
   - Runs all tests (90 user tests + 22 file tests = 112 total)
   - Builds Docker images locally (validation only)
   - Generates test coverage reports
   - Creates draft release with RC version tag
   - Uploads test artifacts (retained for 7 days)

#### 2. **Auto Merge on Release** (`auto-merge-on-release.yml`) - Release Trigger
   - Triggers when a release is published in GitHub
   - Automatically merges the associated PR to main
   - Acts as the gate between CI and CD

#### 3. **Deploy to Staging** (`deploy-staging.yml`) - Continuous Deployment
   - Triggers after auto-merge workflow completes successfully
   - Builds and pushes Docker images to GitHub Container Registry (GHCR)
   - Pulls images and starts services using docker-compose
   - Runs health checks on all services
   - Executes smoke tests
   - Posts deployment notification
   - Automatic rollback on failure

### Prerequisites for CI/CD
- GitHub repository with Actions enabled
- MongoDB Atlas cluster for production
- Container registry access (GitHub Container Registry used by default)
- Secrets configured in GitHub repository settings

### Step 1: Configure GitHub Secrets
Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**, then add:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | JWT signing secret | `super-secret-jwt-key-2026` |

**Note**: The pipeline uses GitHub Container Registry (ghcr.io) by default, which doesn't require additional secrets. The `GITHUB_TOKEN` is automatically provided.

### Step 2: Understand the Pipeline Workflow

The pipeline uses a **release-based deployment model**:

**Trigger Events:**
- **Pull Request to `main`**: Runs CI (build & test only)
- **Release Published**: Triggers auto-merge → deployment

**Complete Workflow Flow:**
```
   ┌──────────────────────────────────────────────┐
   │     Developer opens Pull Request to main     │
   └────────────────────┬─────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
    ┌─────────┐    ┌─────────┐    ┌──────────┐
    │pr-checks│    │build-   │    │security  │
    │.yml     │    │test.yml │    │scans     │
    │         │    │         │    │          │
    │✅ Tests │    │✅ Tests │   │✅ CodeQL │
    │✅ Sec   │    │✅ Docker│   │✅ Deps   │
    │✅ Build │    │✅ Draft │   │✅ DAST   │
    │✅ Deploy│    │ Release │    │          │
    │   Test  │    │         │    │          │
    └────┬────┘    └────┬────┘    └────┬─────┘
         │              │              │
         └──────────────┼──────────────┘
                        │
   ✅ All checks pass + Security scans complete
                        │
                        ▼
           Team reviews PR and approves
                        │
                        ▼
           Team publishes draft release
                        │
                        ▼
    ┌──────────────────────────────────────────────────────┐
    │  auto-merge-on-release.yml                           │
    │  ✓ Finds PR associated with release branch           │
    │  ✓ Verifies PR approved + all checks passed          │
    │  ✓ Automatically merges PR to main                   │
    │  ✓ Posts confirmation comment                        │
    └───────────────────┬──────────────────────────────────┘
                        │ ✅ Merge Successful
                        ▼
    ┌──────────────────────────────────────────────────────┐
    │  deploy-staging.yml (CD)                             │
    │  ✓ Build Docker images (users, gateway, files)       │
    │  ✓ Push to GitHub Container Registry (GHCR)          │
    │  ✓ Pull images and start services                    │
    │  ✓ Run health checks (all services)                  │
    │  ✓ Execute smoke tests (login, gateway routing)      │
    │  ✓ Post deployment notification                      │
    │  ✓ Automatic rollback on failure                     │
    └───────────────────┬──────────────────────────────────┘
                        │
                        ▼
            ✅ Staging Deployment Complete
```

**Parallel Execution (Phase 1 & 2):**
- `pr-checks.yml` runs immediately (Test → Security → Build → Test Deployment)
- `build-test.yml` runs in parallel  
- Security scans (`sast-scanning.yml`, `sca-dependency-check.yml`, `dast-zap.yml`) run in parallel
- **All provide feedback on PR before team review**

**Sequential Execution (Phase 3-5):**
- Team reviews PR with all check results and security findings
- Team approves PR
- Team publishes the draft release (created by build-test.yml)
- Auto-merge workflow triggers after release published
- Deploy workflow triggers after auto-merge succeeds

### GitHub Container Registry (GHCR)
The deployment workflow pushes Docker images to GHCR at:
```
ghcr.io/devops-oct2025-team3/devops_oct2025_team3_assignment-users:latest
ghcr.io/devops-oct2025-team3/devops_oct2025_team3_assignment-gateway:latest
ghcr.io/devops-oct2025-team3/devops_oct2025_team3_assignment-files:latest
```

**Benefits of GHCR:**
- Free container storage integrated with GitHub
- Automatic authentication using `GITHUB_TOKEN`
- Images stored alongside your code
- Security scanning included

### How to Execute the CI/CD Pipeline

Follow these steps to trigger the complete CI/CD workflow:

#### Step 1: Create a Feature Branch and Make Changes
```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Make your code changes
# (edit files, add features, fix bugs, etc.)

# Commit your changes
git add .
git commit -m "Add new feature"

# Push to GitHub
git push origin feature/your-feature-name
```

#### Step 2: Open a Pull Request
1. Go to your GitHub repository
2. Click **"Pull requests"** → **"New pull request"**
3. Select your feature branch as the source
4. Select `main` as the target
5. Click **"Create pull request"**
6. Add description and click **"Create pull request"**

**What happens automatically:**
- ✅ `build-test.yml` workflow triggers
- ✅ Installs dependencies for users and files services
- ✅ Runs 112 tests (90 users + 22 files)
- ✅ Builds Docker images (validation only)
- ✅ Generates coverage reports
- ✅ Creates a draft release with RC version tag (e.g., `v0.0.0-rc.20260214_123456.abc1234`)

#### Step 3: Review Test Results
1. In your PR, click the **"Checks"** tab
2. Wait for `Build & Test` workflow to complete
3. Review test results and coverage reports
4. If tests fail, fix issues and push new commits (workflow re-runs automatically)

#### Step 4: Get PR Approval
1. Request code review from team members
2. Address any feedback
3. Ensure all checks pass ✅

#### Step 5: Publish the Release
1. Go to **"Releases"** tab in your GitHub repository
2. Find the draft release created by `build-test.yml`
3. Click **"Edit"** on the draft release
4. Review the release notes
5. Click **"Publish release"**

**What happens automatically:**
- ✅ `auto-merge-on-release.yml` workflow triggers
- ✅ Finds the PR associated with the release branch
- ✅ Verifies PR has required approvals
- ✅ Automatically merges the PR to `main`
- ✅ Triggers the deployment workflow

#### Step 6: Deployment to Staging
After the auto-merge completes:
- ✅ `deploy-staging.yml` workflow triggers automatically
- ✅ Builds Docker images for all services (users, gateway, files)
- ✅ Pushes images to GitHub Container Registry
- ✅ Pulls images and starts services
- ✅ Runs health checks on all services
- ✅ Executes smoke tests
- ✅ Posts deployment notification

#### Step 7: Verify Deployment
Check the deployment notification comment on your commit or:
```bash
# Pull the deployed images
docker pull ghcr.io/devops-oct2025-team3/devops_oct2025_team3_assignment-users:latest
docker pull ghcr.io/devops-oct2025-team3/devops_oct2025_team3_assignment-gateway:latest
docker pull ghcr.io/devops-oct2025-team3/devops_oct2025_team3_assignment-files:latest

# Run locally to test
cd backendserver
docker-compose up -d
```

### Manual Deployment (Optional)
If you need to deploy without going through the full pipeline:
1. Go to **Actions** tab in GitHub
2. Click on **"Deploy to Staging"** workflow
3. Click **"Run workflow"** button
4. Select the branch (usually `main`)
5. Click **"Run workflow"**

### Step 4: Monitor Pipeline Execution
1. Navigate to the **Actions** tab in your GitHub repository
2. View the three workflows that run in sequence:
   
   **Workflow 1: Build & Test** (triggers on PR)
   - ✅ Install dependencies for users and files services
   - ✅ Run 112 tests (90 users + 22 files)
   - ✅ Build Docker images for validation
   - ✅ Generate coverage reports
   - ✅ Create draft release with RC version
   
   **Workflow 2: Auto Merge PR on Release Publish** (triggers on release publish)
   - ✅ Find associated PR
   - ✅ Verify approvals
   - ✅ Merge PR to main
   
   **Workflow 3: Deploy to Staging** (triggers after auto-merge succeeds)
   - ✅ Build and push Docker images to GHCR
   - ✅ Start services with docker-compose
   - ✅ Run health checks
   - ✅ Execute smoke tests
   - ✅ Post deployment notification

### Step 5: Verify Deployment
After successful pipeline execution:

1. **Check Container Registry**:
   ```bash
   # Images are available at ghcr.io
   docker pull ghcr.io/devops-oct2025-team3/devops_oct2025_team3_assignment-users:latest
   docker pull ghcr.io/devops-oct2025-team3/devops_oct2025_team3_assignment-gateway:latest
   docker pull ghcr.io/devops-oct2025-team3/devops_oct2025_team3_assignment-files:latest
   ```

2. **Test the application**:
   ```bash
   # Health check
   curl http://your-server:4001/api/users
   
   # Or locally
   docker-compose up -d
   ```

3. **View logs**:
   ```bash
   docker-compose logs -f users
   ```

### Pipeline Architecture

```
CI/CD Pipeline Structure
│
├── .github/workflows/
│   ├── build-test.yml            # CI: Build and test on PRs
│   ├── auto-merge-on-release.yml # Release automation and PR merge
│   ├── deploy-staging.yml        # CD: Deploy to staging environment
│   ├── sca-dependency-check.yml  # OWASP dependency scanning
│   ├── sast-scanning.yml         # CodeQL security analysis
│   ├── dast-zap.yml              # OWASP ZAP dynamic testing
│   └── codeql.yml                # Code quality analysis
│
└── backendserver/
    ├── docker-compose.yml         # Local deployment config
    └── */Dockerfile               # Service-specific Docker configs
```

### Troubleshooting CI/CD Issues

**Tests Failing**:
```bash
# Run tests locally to debug
cd backendserver/users
npm test -- --verbose

# Run specific test suite
npm run test:integration
```

**Docker Build Failing**:
```bash
# Test Docker build locally
cd backendserver/users
docker build -t test-image .

# Check logs
docker logs <container-id>
```

**Secrets Not Working**:
- Verify secrets are set in GitHub repository settings
- Check secret names match exactly (case-sensitive)
- GITHUB_TOKEN is automatically provided, no configuration needed

**Deployment Issues**:
- Check deployment logs in Actions tab
- Verify server/platform credentials in repository secrets
- Test deployment script locally first
- Ensure firewall rules allow required ports

### Manual Deployment Steps

If automatic deployment fails, deploy manually:

```bash
# 1. Pull latest code
git pull origin main

# 2. Build images locally
cd backendserver
docker-compose build

# 3. Start services
docker-compose up -d

# 4. Verify services are running
docker-compose ps
docker-compose logs -f

# 5. Test the application
curl http://localhost:4001/api/users
```

---

## Additional Resources

### Running Tests with Coverage
```bash
cd backendserver/users
npm run test:coverage

# View coverage report
start coverage/lcov-report/index.html  # Windows
open coverage/lcov-report/index.html   # macOS
```

**Test Suite Details:**
- **46 passing tests** covering all functionality
- **Security tests:** SQL injection, password validation, JWT security
- **Unit tests:** All controller methods with pass/fail scenarios
- **Integration tests:** Templates ready for database connection

For comprehensive testing documentation, see [TESTING_GUIDE.md](backendserver/users/TESTING_GUIDE.md)

### Development Mode (Auto-reload)
```bash
npm run dev
```

### Stopping Docker Containers
```bash
docker-compose down
```

### Viewing Docker Logs
```bash
docker-compose logs -f
```

### Database Connection Test
```bash
# Test MongoDB connection
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(err => console.error(err))"
```

---

## Testing Documentation

This project includes comprehensive test coverage and documentation:

### 📚 Available Documentation
- **[TESTING_GUIDE.md](backendserver/users/TESTING_GUIDE.md)** - Complete guide to running and writing tests
- **[TEST_ANALYSIS_REPORT.md](TEST_ANALYSIS_REPORT.md)** - Detailed analysis of test coverage and quality

### 🧪 Test Statistics
- **Total Tests:** 109 passing tests
- **Test Types:** Unit (49) + Middleware (30) + Security (20) + Integration (8) + Rate Limiting (15)
- **Coverage:** 91.5% overall (100% controllers/middlewares, 56.5% models with cross-service hooks)
- **Security:** Comprehensive tests for SQL injection, authentication, authorization, brute force protection, and cascade delete

### ⚡ Quick Test Commands
```bash
# Users service tests (90 tests)
cd backendserver/users
npm test                  # Run all tests
npm run test:coverage     # Run with coverage report

# Files service tests (22 tests)
cd backendserver/files
npm test                  # Run all tests
npm run test:coverage     # Run with coverage report
```

---

## Technology Stack

- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with 1-hour expiration
- **Security**: Rate limiting, bcrypt password hashing, input validation
- **Testing**: Jest with Supertest and MongoDB Memory Server
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Container Registry**: GitHub Container Registry (ghcr.io)

---

## Contact & Support

For issues or questions:
1. Check existing GitHub Issues
2. Review [TESTING_GUIDE.md](backendserver/users/TESTING_GUIDE.md) for testing help
3. Review [TEST_ANALYSIS_REPORT.md](TEST_ANALYSIS_REPORT.md) for test analysis
4. Create a new issue with detailed description
5. Contact the development team

---

**Last Updated**: February 2026

