#!/bin/bash

# EVE Online Intel Monitor Client - Enhanced Linux Startup Script
# Version 3.0.0 - Durable Objects with Auto-Setup
# Make executable with: chmod +x start-intel-monitor.sh

set -e

echo "====================================="
echo "    EVE Online Intel Monitor Client"
echo "       Enhanced Linux Version 3.0.0"
echo "    Auto-Setup & Durable Objects"
echo "====================================="
echo

# Check if running from a temporary/extracted location that might cause issues
if [[ "$PWD" == *"/tmp/"* ]] || [[ "$PWD" == *".zip"* ]]; then
    echo
    echo "================================================================"
    echo "                        IMPORTANT NOTICE"
    echo "================================================================"
    echo
    echo "It looks like you're running this script from a temporary"
    echo "location or zip file. This might cause issues!"
    echo
    echo "Please follow these steps:"
    echo "1. Extract the downloaded archive to a permanent location"
    echo "2. Navigate to that folder in terminal"
    echo "3. Run this script from there"
    echo
    echo "Current location: $PWD"
    echo
    echo "================================================================"
    read -p "Press Enter to continue anyway or Ctrl+C to exit..."
    echo
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

print_step() {
    echo -e "${CYAN}►${NC} $1"
}

# Check for required files
print_step "[1/5] Checking required files..."

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found!"
    echo
    echo "This script needs a package.json file to install dependencies."
    echo "Please make sure you have all the required files:"
    echo "  • simple-intel-monitor.js"
    echo "  • package.json"
    echo "  • start-intel-monitor.sh"
    echo
    echo "Make sure you extracted all files from the archive properly."
    echo
    exit 1
fi

# Check if the monitor script exists
if [ ! -f "simple-intel-monitor.js" ]; then
    print_error "simple-intel-monitor.js not found!"
    echo "Please make sure all files are in the same directory."
    echo
    exit 1
fi

print_status "All required files found"
echo

# Check if Node.js is installed
print_step "[2/5] Checking Node.js installation..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed or not in PATH"
    echo
    echo "To install Node.js on your system:"
    echo
    echo "Ubuntu/Debian:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    echo
    echo "CentOS/RHEL/Fedora:"
    echo "  sudo dnf install nodejs npm"
    echo "  # or: sudo yum install nodejs npm"
    echo
    echo "Arch Linux:"
    echo "  sudo pacman -S nodejs npm"
    echo
    echo "macOS (with Homebrew):"
    echo "  brew install node"
    echo
    echo "Or download from: https://nodejs.org/"
    echo
    exit 1
fi

# Display Node.js version
print_status "Node.js found: $(node --version)"
print_info "npm version: $(npm --version)"
echo

# Install dependencies if needed
print_step "[3/5] Checking dependencies..."

if [ ! -d "node_modules" ]; then
    print_info "node_modules directory not found. Installing required packages..."
    echo "This may take a few moments on the first run..."
    echo
    
    if ! npm install; then
        print_error "Failed to install dependencies"
        echo
        echo "Possible solutions:"
        echo "1. Check your internet connection"
        echo "2. Try running: sudo npm install"
        echo "3. Clear npm cache: npm cache clean --force"
        echo "4. Make sure you have write permissions in this directory"
        echo
        exit 1
    fi
    
    print_status "Dependencies installed successfully"
    echo
else
    print_status "Dependencies already installed"
    echo
fi

# Test connection first
print_step "[4/5] Testing connection to intel server..."
if node simple-intel-monitor.js test 2>/dev/null; then
    print_status "Connection test successful!"
else
    print_error "Connection test failed"
    echo "Please check your internet connection and firewall settings."
    echo
    exit 1
fi
    exit 1
fi

echo
print_step "[5/5] Starting the EVE Intel Monitor..."

# Check if configuration exists and is complete
CONFIG_FILE="simple-intel-config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    print_error "Configuration file not found!"
    exit 1
fi

# Check if EVE logs path is configured
EVE_LOGS_PATH=$(node -p "JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8')).eveLogsPath" 2>/dev/null || echo "")
PILOT_NAME=$(node -p "JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8')).pilotName" 2>/dev/null || echo "")

if [ -z "$EVE_LOGS_PATH" ] || [ "$EVE_LOGS_PATH" = "" ]; then
    print_info "Auto-detecting EVE logs directory..."
    echo
    echo "The monitor will automatically search for EVE logs in common locations:"
    echo "  • Native Linux: ~/.local/share/CCP/EVE/logs/Chatlogs/"
    echo "  • Steam/Proton: ~/.steam/steam/steamapps/compatdata/8500/pfx/"
    echo "  • Lutris/Wine: ~/Games/eve-online/drive_c/users/*/Documents/EVE/logs/Chatlogs/"
    echo "  • Standard Wine: ~/.wine/drive_c/users/*/Documents/EVE/logs/Chatlogs/"
    echo "  • PlayOnLinux/Bottles and more..."
    echo
elif [ "$PILOT_NAME" = "Your Pilot Name" ]; then
    echo
    print_warning "Configuration needs pilot name update!"
    echo
    echo "Please edit simple-intel-config.json and set your pilot name"
    echo
    exit 1
fi

# If path is configured, verify it exists
if [ ! -z "$EVE_LOGS_PATH" ] && [ "$EVE_LOGS_PATH" != "" ] && [ ! -d "$EVE_LOGS_PATH" ]; then
    print_warning "Configured EVE logs directory not found: $EVE_LOGS_PATH"
    echo
    echo "The monitor will attempt auto-discovery instead."
    echo
fi

echo
print_status "Starting Enhanced EVE Intel Monitor..."
echo
print_info "Features: Real-time intel, auto-discovery, duplicate prevention"
print_info "Connected to: EVE Intel Network v3.0.0 (Durable Objects)"
if [ ! -z "$PILOT_NAME" ] && [ "$PILOT_NAME" != "Your Pilot Name" ]; then
    print_info "Monitoring pilot: $PILOT_NAME"
fi
if [ ! -z "$EVE_LOGS_PATH" ] && [ "$EVE_LOGS_PATH" != "" ]; then
    print_info "Logs directory: $EVE_LOGS_PATH"
else
    print_info "Auto-discovering EVE logs directory..."
fi
echo
print_info "Press Ctrl+C to stop the monitor"
echo "================================================="
echo

# Start the monitor
node simple-intel-monitor.js start

echo
echo "================================================="
print_info "Intel Monitor has stopped"
echo
