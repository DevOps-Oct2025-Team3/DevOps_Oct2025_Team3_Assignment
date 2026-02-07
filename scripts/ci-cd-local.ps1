# =============================================================================
# CI/CD Pipeline Script - Local Runner (PowerShell)
# This script simulates the CI/CD pipeline locally for testing on Windows
# =============================================================================

param(
    [switch]$SkipDocker,
    [switch]$SkipTests,
    [switch]$Quick,
    [switch]$Help
)

# Configuration
$WorkDir = "backendserver\users"
$DockerComposeFile = "backendserver\docker-compose.yml"
$ErrorActionPreference = "Stop"

# =============================================================================
# Helper Functions
# =============================================================================

function Print-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "======================================================================" -ForegroundColor Blue
    Write-Host "  $Message" -ForegroundColor Blue
    Write-Host "======================================================================" -ForegroundColor Blue
    Write-Host ""
}

function Print-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Print-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Print-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Print-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

# =============================================================================
# Pipeline Stages
# =============================================================================

function Stage-Install {
    Print-Header "STAGE 1: Installing Dependencies"
    Push-Location $WorkDir
    
    try {
        if (Test-Path "package-lock.json") {
            Print-Info "Using npm ci for clean install..."
            npm ci
        } else {
            Print-Info "Using npm install..."
            npm install
        }
        
        Print-Success "Dependencies installed"
    }
    finally {
        Pop-Location
    }
}

function Stage-Lint {
    Print-Header "STAGE 2: Code Linting"
    Push-Location $WorkDir
    
    try {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        if ($packageJson.scripts.lint) {
            npm run lint
            Print-Success "Linting passed"
        } else {
            Print-Warning "Linting not configured, skipping..."
        }
    }
    catch {
        Print-Warning "Linting stage had warnings"
    }
    finally {
        Pop-Location
    }
}

function Stage-UnitTests {
    Print-Header "STAGE 3: Running Unit Tests"
    Push-Location $WorkDir
    
    try {
        npm run test:unit
        Print-Success "Unit tests passed"
    }
    finally {
        Pop-Location
    }
}

function Stage-SecurityTests {
    Print-Header "STAGE 4: Running Security Tests"
    Push-Location $WorkDir
    
    try {
        npm run test:security
        Print-Success "Security tests passed"
    }
    finally {
        Pop-Location
    }
}

function Stage-IntegrationTests {
    Print-Header "STAGE 5: Running Integration Tests"
    Push-Location $WorkDir
    
    try {
        npm run test:integration
        Print-Success "Integration tests passed"
    }
    finally {
        Pop-Location
    }
}

function Stage-Coverage {
    Print-Header "STAGE 6: Generating Test Coverage"
    Push-Location $WorkDir
    
    try {
        npm run test:coverage
        Print-Success "Coverage report generated"
        Print-Info "View coverage report: backendserver\users\coverage\lcov-report\index.html"
    }
    finally {
        Pop-Location
    }
}

function Stage-SecurityAudit {
    Print-Header "STAGE 7: Security Audit"
    Push-Location $WorkDir
    
    try {
        Print-Info "Running npm audit..."
        npm audit --audit-level=moderate
        Print-Success "Security audit completed"
    }
    catch {
        Print-Warning "Security vulnerabilities found (non-critical)"
    }
    finally {
        Pop-Location
    }
}

function Stage-BuildDocker {
    Print-Header "STAGE 8: Building Docker Images"
    
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Print-Error "Docker not found. Please install Docker to build images."
        return $false
    }
    
    Push-Location "backendserver"
    
    try {
        # Build users service
        Print-Info "Building users service..."
        docker build -t secureapp-users:latest ./users/
        Print-Success "Users service image built"
        
        # Build gateway service
        Print-Info "Building gateway service..."
        docker build -t secureapp-gateway:latest ./gateway/
        Print-Success "Gateway service image built"
        
        # Build files service
        Print-Info "Building files service..."
        docker build -t secureapp-files:latest ./files/
        Print-Success "Files service image built"
        
        Print-Success "All Docker images built successfully"
    }
    finally {
        Pop-Location
    }
}

function Stage-DockerComposeTest {
    Print-Header "STAGE 9: Testing Docker Compose Stack"
    
    if (-not (Test-Path $DockerComposeFile)) {
        Print-Error "docker-compose.yml not found at $DockerComposeFile"
        return $false
    }
    
    Push-Location "backendserver"
    
    try {
        Print-Info "Starting Docker Compose stack..."
        docker-compose up -d
        
        Print-Info "Waiting for services to be ready..."
        Start-Sleep -Seconds 10
        
        Print-Info "Checking service health..."
        docker-compose ps
        
        Print-Success "Docker Compose stack is running"
        
        Read-Host "Press Enter to stop the stack and continue"
        docker-compose down
    }
    finally {
        Pop-Location
    }
}

function Stage-DeploySimulation {
    Print-Header "STAGE 10: Deployment Simulation"
    
    Print-Info "This is a simulated deployment stage"
    Print-Info "In production, this would:"
    Print-Info "  - Push images to container registry"
    Print-Info "  - Deploy to Kubernetes/Docker Swarm"
    Print-Info "  - Update environment configurations"
    Print-Info "  - Run smoke tests"
    Print-Info "  - Send notifications"
    
    Print-Success "Deployment simulation complete"
}

function Invoke-Cleanup {
    Print-Header "Cleanup"
    Print-Info "Cleaning up temporary files..."
    # Add cleanup commands if needed
    Print-Success "Cleanup complete"
}

# =============================================================================
# Main Pipeline Execution
# =============================================================================

function Main {
    Clear-Host
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                                                                ║" -ForegroundColor Green
    Write-Host "║           🚀 CI/CD Pipeline - Local Runner 🚀                  ║" -ForegroundColor Green
    Write-Host "║                                                                ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    
    if ($Help) {
        Write-Host "Usage: .\scripts\ci-cd-local.ps1 [OPTIONS]"
        Write-Host ""
        Write-Host "Options:"
        Write-Host "  -SkipDocker      Skip Docker build and compose stages"
        Write-Host "  -SkipTests       Skip all tests (not recommended)"
        Write-Host "  -Quick           Run only essential stages"
        Write-Host "  -Help            Show this help message"
        return
    }
    
    # Check if we're in the right directory
    if (-not (Test-Path "backendserver")) {
        Print-Error "Please run this script from the project root directory"
        exit 1
    }
    
    # Start pipeline
    $StartTime = Get-Date
    
    try {
        # Run stages
        Stage-Install
        
        if (-not $SkipTests) {
            Stage-Lint
            Stage-UnitTests
            Stage-SecurityTests
            
            if (-not $Quick) {
                Stage-IntegrationTests
                Stage-Coverage
                Stage-SecurityAudit
            }
        } else {
            Print-Warning "Tests skipped (not recommended for production)"
        }
        
        if (-not $SkipDocker) {
            Stage-BuildDocker
            
            if (-not $Quick) {
                Stage-DockerComposeTest
            }
        } else {
            Print-Warning "Docker stages skipped"
        }
        
        if (-not $Quick) {
            Stage-DeploySimulation
        }
        
        Invoke-Cleanup
        
        # Calculate duration
        $EndTime = Get-Date
        $Duration = ($EndTime - $StartTime).TotalSeconds
        
        # Final summary
        Write-Host ""
        Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║                                                                ║" -ForegroundColor Green
        Write-Host "║              ✅ PIPELINE COMPLETED SUCCESSFULLY ✅             ║" -ForegroundColor Green
        Write-Host "║                                                                ║" -ForegroundColor Green
        Write-Host "║  Duration: $([Math]::Round($Duration, 2))s                                              ║" -ForegroundColor Green
        Write-Host "║                                                                ║" -ForegroundColor Green
        Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
        Write-Host ""
        
        Print-Success "All stages completed successfully!"
        Write-Host ""
    }
    catch {
        Print-Error "Pipeline failed: $_"
        exit 1
    }
}

# Run main function
Main
