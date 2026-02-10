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
├── scripts/                        # CI/CD and deployment scripts
│   ├── ci-cd-local.ps1            # Windows pipeline script
│   ├── ci-cd-local.sh             # Linux/Mac pipeline script
│   ├── deploy.ps1                 # Deployment helper
│   └── README.md
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
This project includes a comprehensive CI/CD pipeline using **GitHub Actions** for automated testing, building, and deployment.

**📄 Pipeline File**: [`.github/workflows/ci-cd-pipeline.yml`](.github/workflows/ci-cd-pipeline.yml)

### Pipeline Stages

The CI/CD pipeline consists of 6 automated stages:

1. **Build & Test** - Install dependencies, run all tests (unit, integration, security), generate coverage
2. **Security Scanning** - npm audit and security test execution
3. **Build Docker Images** - Build and push container images for all services
4. **Deploy to Staging** - Automated deployment to staging environment (optional)
5. **Deploy to Production** - Deployment to production with smoke tests
6. **Cleanup** - Remove old container images

### Quick Start - Local Pipeline Testing

#### Windows (PowerShell)
```powershell
# Run full pipeline locally
.\scripts\ci-cd-local.ps1

# Quick mode (skip integration tests and Docker)
.\scripts\ci-cd-local.ps1 -Quick

# Skip Docker stages
.\scripts\ci-cd-local.ps1 -SkipDocker

# View help
.\scripts\ci-cd-local.ps1 -Help
```

#### Linux/Mac (Bash)
```bash
# Make script executable
chmod +x scripts/ci-cd-local.sh

# Run full pipeline locally
./scripts/ci-cd-local.sh

# Quick mode
./scripts/ci-cd-local.sh --quick

# Skip Docker stages
./scripts/ci-cd-local.sh --skip-docker

# View help
./scripts/ci-cd-local.sh --help
```

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

The pipeline automatically triggers on:
- **Push to `main`/`master`**: Full pipeline including deployment
- **Push to `develop`**: Build, test, and deploy to staging
- **Pull Requests**: Build and test only (no deployment)

**Pipeline Flow:**
```
┌─────────────────┐
│  Push to main   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  STAGE 1: Build & Test                                  │
│  • Install dependencies                                 │
│  • Run linting                                          │
│  • Run unit tests                                       │
│  • Run integration tests                                │
│  • Generate coverage report                             │
└────────┬────────────────────────────────────────────────┘
         │ ✅ Tests Pass
         ▼
┌─────────────────────────────────────────────────────────┐
│  STAGE 2: Security Scanning                             │
│  • npm audit                                            │
│  • Security tests                                       │
└────────┬────────────────────────────────────────────────┘
         │ ✅ No Critical Issues
         ▼
┌─────────────────────────────────────────────────────────┐
│  STAGE 3: Build Docker Images                           │
│  • Build users service image                            │
│  • Build gateway service image                          │
│  • Build files service image                            │
│  • Push to ghcr.io                                      │
└────────┬────────────────────────────────────────────────┘
         │ ✅ Images Built
         ▼
┌─────────────────────────────────────────────────────────┐
│  STAGE 4: Deploy to Production                          │
│  • Pull latest images                                   │
│  • Update services                                      │
│  • Run smoke tests                                      │
│  • Send notifications                                   │
└─────────────────────────────────────────────────────────┘
```

### Step 3: Deployment Commands

#### Quick Deployment (Windows)
```powershell
# Deploy to local environment
.\scripts\deploy.ps1 -Environment local -Action start

# Deploy to production (requires configuration)
.\scripts\deploy.ps1 -Environment production -Action start -Build

# View logs
.\scripts\deploy.ps1 -Environment local -Action logs

# Stop services
.\scripts\deploy.ps1 -Environment local -Action stop

# Restart services
.\scripts\deploy.ps1 -Environment local -Action restart
```

#### Available Environments
- `local` - Local development with docker-compose
- `dev` - Development environment
- `staging` - Staging/QA environment
- `production` - Production environment

### Step 4: Monitor Pipeline Execution
1. Navigate to the **Actions** tab in your GitHub repository
2. Click on the latest workflow run
3. View real-time progress of each job:
   - ✅ **Build & Test**: Runs all 112 tests with 99%+ coverage
   - ✅ **Security Scanning**: npm audit + security tests
   - ✅ **Build Docker**: Creates container images for 3 services
   - ✅ **Deploy**: Automated deployment with smoke tests

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
│   ├── ci-cd-pipeline.yml        # Main CI/CD pipeline
│   ├── sca-dependency-check.yml  # OWASP dependency scanning
│   ├── Sast-Scanning.yml         # CodeQL security analysis
│   ├── dast-zap.yml              # OWASP ZAP dynamic testing
│   └── codeql.yml                # Code quality analysis
│
├── scripts/
│   ├── ci-cd-local.ps1           # Local pipeline runner (Windows)
│   ├── ci-cd-local.sh            # Local pipeline runner (Linux/Mac)
│   └── deploy.ps1                # Deployment helper script
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
