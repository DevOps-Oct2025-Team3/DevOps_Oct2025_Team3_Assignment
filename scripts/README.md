# CI/CD Scripts Documentation

This directory contains scripts for running the CI/CD pipeline locally and managing deployments.

## 📁 Scripts Overview

| Script | Platform | Purpose |
|--------|----------|---------|
| `ci-cd-local.ps1` | Windows (PowerShell) | Run full CI/CD pipeline locally |
| `ci-cd-local.sh` | Linux/Mac (Bash) | Run full CI/CD pipeline locally |
| `deploy.ps1` | Windows (PowerShell) | Quick deployment to different environments |

---

## 🚀 ci-cd-local Scripts

### Purpose
Simulate the complete CI/CD pipeline locally for testing before pushing to GitHub. Includes all stages: install, lint, test, build, and deploy simulation.

### Windows Usage (PowerShell)

```powershell
# Full pipeline (all stages)
.\ci-cd-local.ps1

# Quick mode (skip integration tests and Docker Compose)
.\ci-cd-local.ps1 -Quick

# Skip Docker stages
.\ci-cd-local.ps1 -SkipDocker

# Skip all tests (not recommended)
.\ci-cd-local.ps1 -SkipTests

# View help
.\ci-cd-local.ps1 -Help
```

### Linux/Mac Usage (Bash)

```bash
# Make executable (first time only)
chmod +x ci-cd-local.sh

# Full pipeline (all stages)
./ci-cd-local.sh

# Quick mode
./ci-cd-local.sh --quick

# Skip Docker stages
./ci-cd-local.sh --skip-docker

# Skip all tests (not recommended)
./ci-cd-local.sh --skip-tests

# View help
./ci-cd-local.sh --help
```

### Pipeline Stages

The local pipeline executes these stages in order:

1. **Install Dependencies** - `npm ci` or `npm install`
2. **Code Linting** - ESLint/Prettier (if configured)
3. **Unit Tests** - Jest unit tests
4. **Security Tests** - Security-focused test suite
5. **Integration Tests** - Full integration tests with in-memory MongoDB
6. **Coverage Report** - Generate test coverage report
7. **Security Audit** - npm audit for vulnerabilities
8. **Docker Build** - Build container images for all services
9. **Docker Compose Test** - Test full stack with docker-compose
10. **Deployment Simulation** - Simulated deployment steps

### Expected Output

```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║           🚀 CI/CD Pipeline - Local Runner 🚀                 ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

======================================================================
  STAGE 1: Installing Dependencies
======================================================================

✅ Dependencies installed

======================================================================
  STAGE 2: Code Linting
======================================================================

⚠️  Linting not configured, skipping...

======================================================================
  STAGE 3: Running Unit Tests
======================================================================

✅ Unit tests passed

[... more stages ...]

╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║              ✅ PIPELINE COMPLETED SUCCESSFULLY ✅            ║
║                                                                ║
║  Duration: 45.2s                                               ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

### Typical Duration
- **Quick mode**: ~15-25 seconds
- **Full pipeline (no Docker)**: ~30-45 seconds
- **Full pipeline (with Docker)**: ~3-5 minutes

---

## 📦 deploy.ps1

### Purpose
Quick deployment helper for starting, stopping, and managing services in different environments.

### Usage

```powershell
# Deploy to local environment
.\deploy.ps1 -Environment local -Action start

# Deploy and build images first
.\deploy.ps1 -Environment local -Action start -Build

# Deploy and pull latest images
.\deploy.ps1 -Environment production -Action start -Pull

# Stop services
.\deploy.ps1 -Environment local -Action stop

# Restart services
.\deploy.ps1 -Environment local -Action restart

# Check service status
.\deploy.ps1 -Environment local -Action status

# View logs (live tail)
.\deploy.ps1 -Environment local -Action logs
```

### Available Environments

| Environment | Description | Compose File |
|-------------|-------------|--------------|
| `local` | Local development | `docker-compose.yml` |
| `dev` | Development server | `docker-compose.dev.yml` |
| `staging` | Staging/QA | `docker-compose.staging.yml` |
| `production` | Production | `docker-compose.prod.yml` |

### Available Actions

| Action | Description |
|--------|-------------|
| `start` | Start services (default) |
| `stop` | Stop and remove services |
| `restart` | Restart running services |
| `status` | Show service status |
| `logs` | Show and follow logs |

### Flags

- `-Build` - Build images before deploying
- `-Pull` - Pull images from registry before deploying

### Examples

```powershell
# First time setup - build and start
.\deploy.ps1 -Environment local -Action start -Build

# Daily development - just start
.\deploy.ps1 -Environment local -Action start

# Debug issues - check logs
.\deploy.ps1 -Environment local -Action logs

# Production deployment - pull and start
.\deploy.ps1 -Environment production -Action start -Pull

# Clean restart
.\deploy.ps1 -Environment local -Action stop
.\deploy.ps1 -Environment local -Action start -Build
```

---

## 🔧 Prerequisites

### All Scripts
- Node.js 18+ installed
- npm installed and in PATH
- Git repository initialized

### Docker-related stages
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2+
- At least 4GB free disk space for images

### Environment Variables
Create `.env` files in `backendserver/` directory:

```env
# backendserver/.env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=your-secret-key-here
PORT=4001
```

---

## 🐛 Troubleshooting

### "npm not found"
```powershell
# Windows - Install Node.js from nodejs.org
# Or use winget
winget install OpenJS.NodeJS

# Linux
sudo apt install nodejs npm  # Debian/Ubuntu
sudo yum install nodejs npm  # RHEL/CentOS
```

### "docker not found"
```powershell
# Windows/Mac - Install Docker Desktop
# https://www.docker.com/products/docker-desktop

# Linux - Install Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### Tests Failing
```powershell
# Run tests manually to see detailed errors
cd backendserver\users
npm test -- --verbose

# Check specific test suite
npm run test:unit
npm run test:security
npm run test:integration
```

### Docker Build Failing
```powershell
# Clean Docker system
docker system prune -a

# Check disk space
docker system df

# Rebuild without cache
docker build --no-cache -t test-image ./backendserver/users
```

### Permission Errors (Linux/Mac)
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run with sudo if needed
sudo ./scripts/ci-cd-local.sh
```

### MongoDB Connection Issues
```powershell
# Test MongoDB connection
cd backendserver\users
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(err => console.error(err))"
```

---

## 📊 Success Criteria

A successful pipeline run should show:

- ✅ All dependencies installed
- ✅ 83 tests passing (23 unit + 16 security + 30 middleware + 7 integration + 7 integration active)
- ✅ 100% code coverage (controllers, models, middlewares)
- ✅ No critical security vulnerabilities
- ✅ All Docker images built successfully
- ✅ All services started and healthy

---

## 🔗 Related Documentation

- [Main README](../README.md) - Project setup and deployment
- [Testing Guide](../backendserver/users/TESTING_GUIDE.md) - Detailed testing documentation
- [Test Analysis Report](../TEST_ANALYSIS_REPORT.md) - Test coverage analysis
- [CI/CD Workflow](../.github/workflows/ci-cd-pipeline.yml) - GitHub Actions pipeline

---

## 💡 Tips

1. **Run locally before pushing** - Catch issues early
2. **Use Quick mode during development** - Faster feedback
3. **Run full pipeline before PR** - Ensure everything works
4. **Monitor Docker disk usage** - Clean up regularly
5. **Keep .env files secure** - Never commit secrets

---

## 📝 Adding Custom Scripts

To add your own scripts to this directory:

1. Create script file (`.ps1` for PowerShell, `.sh` for Bash)
2. Add execute permissions (Linux/Mac): `chmod +x script.sh`
3. Document usage in this README
4. Follow naming convention: `<purpose>-<environment>.<ext>`

---

**Last Updated**: February 2026
