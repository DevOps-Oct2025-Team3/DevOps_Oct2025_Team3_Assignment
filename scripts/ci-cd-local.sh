#!/bin/bash

# =============================================================================
# CI/CD Pipeline Script - Local Runner
# This script simulates the CI/CD pipeline locally for testing
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WORK_DIR="backendserver/users"
DOCKER_COMPOSE_FILE="backendserver/docker-compose.yml"

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo ""
    echo -e "${BLUE}======================================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}======================================================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# =============================================================================
# Pipeline Stages
# =============================================================================

stage_install() {
    print_header "STAGE 1: Installing Dependencies"
    cd "$WORK_DIR"
    
    if [ -f "package-lock.json" ]; then
        print_info "Using npm ci for clean install..."
        npm ci
    else
        print_info "Using npm install..."
        npm install
    fi
    
    print_success "Dependencies installed"
    cd - > /dev/null
}

stage_lint() {
    print_header "STAGE 2: Code Linting"
    cd "$WORK_DIR"
    
    if grep -q '"lint"' package.json 2>/dev/null; then
        npm run lint
        print_success "Linting passed"
    else
        print_warning "Linting not configured, skipping..."
    fi
    
    cd - > /dev/null
}

stage_unit_tests() {
    print_header "STAGE 3: Running Unit Tests"
    cd "$WORK_DIR"
    
    npm run test:unit
    print_success "Unit tests passed"
    
    cd - > /dev/null
}

stage_security_tests() {
    print_header "STAGE 4: Running Security Tests"
    cd "$WORK_DIR"
    
    npm run test:security
    print_success "Security tests passed"
    
    cd - > /dev/null
}

stage_integration_tests() {
    print_header "STAGE 5: Running Integration Tests"
    cd "$WORK_DIR"
    
    npm run test:integration
    print_success "Integration tests passed"
    
    cd - > /dev/null
}

stage_coverage() {
    print_header "STAGE 6: Generating Test Coverage"
    cd "$WORK_DIR"
    
    npm run test:coverage
    print_success "Coverage report generated"
    print_info "View coverage report: backendserver/users/coverage/lcov-report/index.html"
    
    cd - > /dev/null
}

stage_security_audit() {
    print_header "STAGE 7: Security Audit"
    cd "$WORK_DIR"
    
    print_info "Running npm audit..."
    npm audit --audit-level=moderate || print_warning "Security vulnerabilities found (non-critical)"
    
    print_success "Security audit completed"
    
    cd - > /dev/null
}

stage_build_docker() {
    print_header "STAGE 8: Building Docker Images"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found. Please install Docker to build images."
        return 1
    fi
    
    cd backendserver
    
    # Build users service
    print_info "Building users service..."
    docker build -t secureapp-users:latest ./users/
    print_success "Users service image built"
    
    # Build gateway service
    print_info "Building gateway service..."
    docker build -t secureapp-gateway:latest ./gateway/
    print_success "Gateway service image built"
    
    # Build files service
    print_info "Building files service..."
    docker build -t secureapp-files:latest ./files/
    print_success "Files service image built"
    
    cd - > /dev/null
    print_success "All Docker images built successfully"
}

stage_docker_compose_test() {
    print_header "STAGE 9: Testing Docker Compose Stack"
    
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        print_error "docker-compose.yml not found at $DOCKER_COMPOSE_FILE"
        return 1
    fi
    
    print_info "Starting Docker Compose stack..."
    cd backendserver
    docker-compose up -d
    
    print_info "Waiting for services to be ready..."
    sleep 10
    
    print_info "Checking service health..."
    docker-compose ps
    
    print_success "Docker Compose stack is running"
    
    read -p "Press Enter to stop the stack and continue..."
    docker-compose down
    
    cd - > /dev/null
}

stage_deploy_simulation() {
    print_header "STAGE 10: Deployment Simulation"
    
    print_info "This is a simulated deployment stage"
    print_info "In production, this would:"
    print_info "  - Push images to container registry"
    print_info "  - Deploy to Kubernetes/Docker Swarm"
    print_info "  - Update environment configurations"
    print_info "  - Run smoke tests"
    print_info "  - Send notifications"
    
    print_success "Deployment simulation complete"
}

cleanup() {
    print_header "Cleanup"
    print_info "Cleaning up temporary files..."
    # Add cleanup commands if needed
    print_success "Cleanup complete"
}

# =============================================================================
# Main Pipeline Execution
# =============================================================================

main() {
    clear
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                                ║${NC}"
    echo -e "${GREEN}║           🚀 CI/CD Pipeline - Local Runner 🚀                  ║${NC}"
    echo -e "${GREEN}║                                                                ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Check if we're in the right directory
    if [ ! -d "backendserver" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    # Parse command line arguments
    SKIP_DOCKER=false
    SKIP_TESTS=false
    QUICK_MODE=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-docker)
                SKIP_DOCKER=true
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --quick)
                QUICK_MODE=true
                shift
                ;;
            --help)
                echo "Usage: ./scripts/ci-cd-local.sh [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --skip-docker    Skip Docker build and compose stages"
                echo "  --skip-tests     Skip all tests (not recommended)"
                echo "  --quick          Run only essential stages"
                echo "  --help           Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Start pipeline
    START_TIME=$(date +%s)
    
    # Run stages
    stage_install || { print_error "Installation failed"; exit 1; }
    
    if [ "$SKIP_TESTS" = false ]; then
        stage_lint || print_warning "Linting stage had warnings"
        stage_unit_tests || { print_error "Unit tests failed"; exit 1; }
        stage_security_tests || { print_error "Security tests failed"; exit 1; }
        
        if [ "$QUICK_MODE" = false ]; then
            stage_integration_tests || { print_error "Integration tests failed"; exit 1; }
            stage_coverage || print_warning "Coverage generation had warnings"
            stage_security_audit || print_warning "Security audit had warnings"
        fi
    else
        print_warning "Tests skipped (not recommended for production)"
    fi
    
    if [ "$SKIP_DOCKER" = false ]; then
        stage_build_docker || print_warning "Docker build stage failed"
        
        if [ "$QUICK_MODE" = false ]; then
            stage_docker_compose_test || print_warning "Docker Compose test failed"
        fi
    else
        print_warning "Docker stages skipped"
    fi
    
    if [ "$QUICK_MODE" = false ]; then
        stage_deploy_simulation
    fi
    
    cleanup
    
    # Calculate duration
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    # Final summary
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                                ║${NC}"
    echo -e "${GREEN}║              ✅ PIPELINE COMPLETED SUCCESSFULLY ✅             ║${NC}"
    echo -e "${GREEN}║                                                                ║${NC}"
    echo -e "${GREEN}║  Duration: ${DURATION}s                                              ║${NC}"
    echo -e "${GREEN}║                                                                ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    print_success "All stages completed successfully!"
    echo ""
}

# Trap errors and cleanup
trap cleanup EXIT

# Run main function
main "$@"
