#!/bin/bash

# EVE Intel Monitor - Linux Launcher
# Simple launcher that checks requirements and starts the monitor

echo
echo "==============================================="
echo "        EVE INTEL MONITOR LAUNCHER"
echo "==============================================="
echo

# Change to script directory
cd "$(dirname "$0")"

# Check for Node.js
echo "Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found!"
    echo "Please install Node.js from https://nodejs.org/"
    echo "Or use your package manager:"
    echo "  Ubuntu/Debian: sudo apt install nodejs npm"
    echo "  CentOS/RHEL: sudo yum install nodejs npm"
    echo "  Arch: sudo pacman -S nodejs npm"
    echo
    exit 1
fi
echo "Node.js: OK ($(node --version))"

# Check for npm
echo "Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm not found! Please reinstall Node.js."
    echo
    exit 1
fi
echo "npm: OK ($(npm --version))"

# Install dependencies
echo
echo "Installing dependencies..."
npm install --no-audit --no-fund
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies!"
    echo
    exit 1
fi

echo
echo "================================================"
echo "  STARTING EVE INTEL MONITOR"
echo "================================================"
echo

# Start the monitor
node simple-intel-monitor.js

# Handle exit
echo
echo "Monitor stopped."
echo "Press Enter to exit..."
read
