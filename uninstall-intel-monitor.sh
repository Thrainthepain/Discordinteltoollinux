#!/bin/bash

# EVE Intel Monitor - Uninstaller for Linux
# Make executable with: chmod +x uninstall-intel-monitor.sh

set -e

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

echo "========================================"
echo "   EVE Intel Monitor - Uninstaller"
echo "========================================"
echo
echo "This will remove all Intel Monitor files and data."
echo

# Check if we're in the right directory
if [ ! -f "simple-intel-monitor.js" ]; then
    print_error "This script must be run from the Intel Monitor directory"
    echo "containing simple-intel-monitor.js"
    echo
    exit 1
fi

echo "Current directory: $(pwd)"
echo
echo "The following will be removed:"
echo "  • All Intel Monitor files"
echo "  • Node.js dependencies (node_modules)"
echo "  • Configuration files"
echo "  • Log files (if any)"
echo

read -p "Are you sure you want to uninstall the Intel Monitor? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Uninstallation cancelled. No changes were made."
    exit 0
fi

echo
echo "=========================================="
echo "   Uninstalling EVE Intel Monitor..."
echo "=========================================="
echo

# Stop any running Node.js processes (Intel Monitor)
print_step "[1/6] Stopping any running Intel Monitor processes..."
if pgrep -f "simple-intel-monitor.js" > /dev/null; then
    print_info "Found running Intel Monitor processes. Stopping them..."
    pkill -f "simple-intel-monitor.js" || true
    sleep 2
    print_status "Intel Monitor processes stopped."
else
    print_status "No running Intel Monitor processes found."
fi
echo

# Remove node_modules directory
print_step "[2/6] Removing Node.js dependencies..."
if [ -d "node_modules" ]; then
    print_info "Removing node_modules directory..."
    rm -rf "node_modules"
    print_status "node_modules directory removed."
else
    print_status "No node_modules directory found."
fi
echo

# Remove package-lock.json
print_step "[3/6] Removing package lock file..."
if [ -f "package-lock.json" ]; then
    rm -f "package-lock.json"
    print_status "package-lock.json removed."
else
    print_status "No package-lock.json found."
fi
echo

# Backup configuration before removal (optional)
print_step "[4/6] Backing up configuration..."
if [ -f "simple-intel-config.json" ]; then
    cp "simple-intel-config.json" "simple-intel-config.json.backup"
    print_status "Configuration backed up to simple-intel-config.json.backup"
else
    print_status "No configuration file found."
fi
echo

# List files to be removed
print_step "[5/6] Preparing to remove Intel Monitor files..."
echo
echo "Files that will be removed:"
[ -f "simple-intel-monitor.js" ] && echo "  • simple-intel-monitor.js"
[ -f "package.json" ] && echo "  • package.json"
[ -f "simple-intel-config.json" ] && echo "  • simple-intel-config.json"
[ -f "start-intel-monitor.sh" ] && echo "  • start-intel-monitor.sh"
[ -f "LAUNCH-INTEL-MONITOR.sh" ] && echo "  • LAUNCH-INTEL-MONITOR.sh"
[ -f "uninstall-intel-monitor.sh" ] && echo "  • uninstall-intel-monitor.sh"
[ -f "README.md" ] && echo "  • README.md"
[ -f "README-Linux.md" ] && echo "  • README-Linux.md"
[ -f "SETUP.md" ] && echo "  • SETUP.md"
[ -f "FIXES_SUMMARY.md" ] && echo "  • FIXES_SUMMARY.md"
echo

read -p "Proceed with file removal? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "File removal cancelled. Only dependencies were cleaned up."
    echo "The Intel Monitor files remain intact."
    exit 0
fi

print_step "[6/6] Removing Intel Monitor files..."

# Remove main files
files_removed=0

remove_file() {
    if [ -f "$1" ]; then
        rm -f "$1"
        print_status "Removed $1"
        ((files_removed++))
    fi
}

remove_file "simple-intel-monitor.js"
remove_file "package.json"
remove_file "simple-intel-config.json"
remove_file "start-intel-monitor.sh"
remove_file "LAUNCH-INTEL-MONITOR.sh"
remove_file "README.md"
remove_file "README-Linux.md"
remove_file "SETUP.md"
remove_file "FIXES_SUMMARY.md"

echo
echo "=========================================="
echo "   Uninstallation Complete!"
echo "=========================================="
echo
print_status "The EVE Intel Monitor has been successfully removed."
echo
echo "What was removed:"
echo "  • $files_removed Intel Monitor application files"
echo "  • Node.js dependencies"
echo "  • Configuration files"
echo
echo "What was preserved:"
echo "  • simple-intel-config.json.backup (if it existed)"
echo "  • This uninstall script (for reference)"
echo
echo "To completely remove all traces, you can:"
echo "  1. Delete this entire directory: rm -rf $(pwd)"
echo "  2. Remove the backup configuration file"
echo
print_info "Thank you for using the EVE Intel Monitor!"
echo

# Self-destruct this uninstall script (optional)
read -p "Remove this uninstall script as well? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Removing uninstaller..."
    SCRIPT_PATH="$(realpath "$0")"
    (sleep 2; rm -f "$SCRIPT_PATH") &
    exit 0
fi

print_info "Uninstaller kept for future reference."
exit 0
