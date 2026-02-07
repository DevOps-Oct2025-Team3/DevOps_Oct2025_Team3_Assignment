# =============================================================================
# Deployment Helper Script
# Quick deployment commands for different environments
# =============================================================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('dev', 'staging', 'production', 'local')]
    [string]$Environment,
    
    [ValidateSet('start', 'stop', 'restart', 'status', 'logs')]
    [string]$Action = 'start',
    
    [switch]$Build,
    [switch]$Pull
)

$ErrorActionPreference = "Stop"

function Print-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Print-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Print-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

Print-Header "Deployment Helper - $Environment Environment"

# Set environment-specific variables
switch ($Environment) {
    'local' {
        $ComposeFile = 'backendserver\docker-compose.yml'
        $EnvFile = 'backendserver\.env'
    }
    'dev' {
        $ComposeFile = 'backendserver\docker-compose.dev.yml'
        $EnvFile = 'backendserver\.env.dev'
    }
    'staging' {
        $ComposeFile = 'backendserver\docker-compose.staging.yml'
        $EnvFile = 'backendserver\.env.staging'
    }
    'production' {
        $ComposeFile = 'backendserver\docker-compose.prod.yml'
        $EnvFile = 'backendserver\.env.production'
    }
}

Push-Location "backendserver"

try {
    # Check if compose file exists, fallback to default
    if (-not (Test-Path $ComposeFile)) {
        Print-Info "Specific compose file not found, using default docker-compose.yml"
        $ComposeFile = "docker-compose.yml"
    }
    
    # Build images if requested
    if ($Build) {
        Print-Info "Building Docker images..."
        docker-compose -f $ComposeFile build
        Print-Success "Images built"
    }
    
    # Pull images if requested
    if ($Pull) {
        Print-Info "Pulling Docker images..."
        docker-compose -f $ComposeFile pull
        Print-Success "Images pulled"
    }
    
    # Execute action
    switch ($Action) {
        'start' {
            Print-Info "Starting services..."
            docker-compose -f $ComposeFile up -d
            Print-Success "Services started"
            
            Print-Info "Service status:"
            docker-compose -f $ComposeFile ps
        }
        
        'stop' {
            Print-Info "Stopping services..."
            docker-compose -f $ComposeFile down
            Print-Success "Services stopped"
        }
        
        'restart' {
            Print-Info "Restarting services..."
            docker-compose -f $ComposeFile restart
            Print-Success "Services restarted"
            
            Print-Info "Service status:"
            docker-compose -f $ComposeFile ps
        }
        
        'status' {
            Print-Info "Service status:"
            docker-compose -f $ComposeFile ps
        }
        
        'logs' {
            Print-Info "Showing logs (Ctrl+C to exit)..."
            docker-compose -f $ComposeFile logs -f
        }
    }
}
finally {
    Pop-Location
}

Write-Host ""
Print-Success "Deployment action completed!"
Write-Host ""
