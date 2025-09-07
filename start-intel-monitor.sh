#!/bin/bash

# EVE Online Intel Monitor Client - Linux Startup Script
# Make executable with: chmod +x start-intel-monitor.sh

set -e

echo "====================================="
echo "    EVE Online Intel Monitor Client"
echo "             Linux Version"
echo "====================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed or not in PATH"
    echo
    echo "To install Node.js on your system:"
    echo
    echo "Ubuntu/Debian:"
    echo "  sudo apt update && sudo apt install nodejs npm"
    echo
    echo "CentOS/RHEL/Fedora:"
    echo "  sudo dnf install nodejs npm"
    echo "  # or: sudo yum install nodejs npm"
    echo
    echo "Arch Linux:"
    echo "  sudo pacman -S nodejs npm"
    echo
    echo "Or download from: https://nodejs.org/"
    echo
    exit 1
fi

# Display Node.js version
print_info "Node.js version: $(node --version)"
print_info "npm version: $(npm --version)"
echo

# Check if the monitor script exists
if [ ! -f "simple-intel-monitor.js" ]; then
    print_error "simple-intel-monitor.js not found!"
    echo "Please make sure all files are in the same directory."
    echo
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies..."
    echo
    if ! npm install chokidar; then
        print_error "Failed to install dependencies"
        echo
        echo "Try manually running: npm install chokidar"
        echo
        exit 1
    fi
    echo
fi

# Test connection first
print_info "Testing connection to server..."
if ! node simple-intel-monitor.js test; then
    echo
    print_error "Cannot connect to server"
    echo "Please check your internet connection and configuration."
    echo
    exit 1
fi

echo
print_status "Starting EVE Intel Monitor..."
echo
print_info "Press Ctrl+C to stop the monitor"
echo
print_warning "Make sure EVE Online chat logging is enabled:"
print_warning "EVE Settings > Chat & Windows > Chat Logging = Enabled"
echo

# Start the monitor
node simple-intel-monitor.js "$@"

echo
print_info "Intel Monitor stopped."
