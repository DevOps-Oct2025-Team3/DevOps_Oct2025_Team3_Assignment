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
Create a `.env` file in the backend folder with the following variables:
```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<database>?retryWrites=true&w=majority

# JWT Secret (use a strong random string)
JWT_SECRET=your-secure-jwt-secret-key

```

**Note**: Replace `<username>`, `<password>`, and `<database>` with your MongoDB Atlas credentials.

### Step 4: Verify Project Structure
Ensure your project structure looks like this:
```
DevOps_Oct2025_Team3_Assignment/
├── backendserver/
│   ├── .env
│   ├── docker-compose.yml
│   └── users/
│       ├── controllers/
│       ├── middlewares/
│       ├── models/
│       ├── tests/
│       ├── app.js
│       ├── dbConfig.js
│       ├── Dockerfile
│       ├── package-lock.json
│       └── package.json
├── frontend/
│   ├── index.html
│   └── js/
│       └── frontend.js
├── .dockerignore
├── .gitignore
├── package-lock.json
├── package.json
└── README.md
```

### Step 5: Run Tests
Before running the application, verify all tests pass:
```bash
cd backendserver/users
npm test
```

Expected output: **86 tests passing** ✅

**Quick Test Commands:**
```bash
npm test                 # Run all tests
npm run test:coverage    # Run tests with coverage report
```

**Test Coverage Status:**
- ✅ **86 tests passing** - all tests green!
  - 31 unit tests (user controller + user model)
  - 30 middleware validation tests (userValidation + JWT verification)
  - 16 security tests (SQL injection, password hashing, JWT, RBAC, brute force)
  - 7 integration tests (end-to-end API testing with MongoDB Memory Server)
  - 15 rate limiting tests (login, create user, delete user, API limits)
- ✅ **100% Code Coverage**
  - Controllers: 100% statements, 100% branches, 100% functions, 100% lines
  - Models: 100% statements, 100% branches, 100% functions, 100% lines
  - Middlewares: 100% statements, 100% branches, 100% functions, 100% lines

**Test Framework & Tools:**
- **Jest** - Testing framework with built-in coverage
- **Supertest** - HTTP assertions for integration tests
- **MongoDB Memory Server** - In-memory database for isolated integration tests
- **bcrypt** - Password hashing security tests
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
   - ✅ **Build & Test**: Runs all 83 tests with 100% coverage
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
Testing Documentation

This project includes comprehensive test coverage and documentation:

### 📚 Available Documentation:
- **[TESTING_GUIDE.md](backendserver/users/TESTING_GUIDE.md)** - Complete guide to running and writing tests
- **[TEST_ANALYSIS_REPORT.md](TEST_ANALYSIS_REPORT.md)** - Detailed analysis of test coverage and quality

### 🧪 Test Statistics:
- **Total Tests:** 46 passing tests
- **Test Types:** Unit (23) + Security (16) + Integration templates (7)
- **Coverage:** 100% for controllers and models
- **Security:** Comprehensive tests for SQL injection, authentication, and authorization

### ⚡ Quick Test Commands:
```bash
cd backendserver/users

# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run specific test suites
npm run test:security      # Security tests
npm run test:unit          # Unit tests

# Development mode
npm run test:watch         # Auto-rerun on changes
```

---

## Contact & Support

For issues or questions:
1. Check existing GitHub Issues
2. Review [TESTING_GUIDE.md](backendserver/users/TESTING_GUIDE.md) for testing help
3. Review [TEST_ANALYSIS_REPORT.md](TEST_ANALYSIS_REPORT.md) for test analysis
4. Create a new issue with detailed description
5 **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with 1-hour expiration
- **Testing**: Jest with module mocking
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions

---

## Contact & Support

For issues or questions:
1. Check existing GitHub Issues
2. Create a new issue with detailed description
3. Contact the development team

---

**Last Updated**: February 2026