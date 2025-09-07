# EVE Online Intel Monitor Client - Linux

A simple, lightweight desktop client that monitors your EVE Online chat logs and automatically submits intel to the intelligence server. Designed specifically for Linux users running EVE through Wine, Steam Proton, or Lutris.

## 🚀 Quick Start

### Option 1: Simple Launcher (Recommended)
1. **Download the client files** to a folder on your computer
2. **Make the script executable:** `chmod +x LAUNCH-INTEL-MONITOR.sh`
3. **Run the launcher:** `./LAUNCH-INTEL-MONITOR.sh`
4. **Done!** The launcher will automatically install dependencies and start the monitor

### Option 2: Original Launcher
1. **Download the client files** to a folder on your computer  
2. **Make the script executable:** `chmod +x start-intel-monitor.sh`
3. **Run the launcher:** `./start-intel-monitor.sh`
4. **Done!** The monitor will automatically find your EVE logs and start watching for intel

## 📋 Requirements

- **Node.js 16+** (Install via your package manager)
- **EVE Online** running via Wine, Steam Proton, or Lutris
- **Chat logging enabled** in EVE Online
- **Linux** (tested on Ubuntu, Fedora, Arch)

## 🛠️ Setup

### Step 1: Install Node.js

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install nodejs npm
```

**CentOS/RHEL/Fedora:**
```bash
sudo dnf install nodejs npm
```

**Arch Linux:**
```bash
sudo pacman -S nodejs npm
```

### Step 2: Enable EVE Chat Logging
1. In EVE Online, press `ESC` → `Settings`
2. Go to `Chat & Windows` tab  
3. Set `Chat Logging` to `Enabled`
4. Join intel channels (like Phoenix_Intel, Phoenix_Intel_South, etc.)

### Step 3: Configure the Client (Optional)
Edit `simple-intel-config.json` to customize settings:

```json
{
  "serverUrl": "https://intel.thrainkrill.space",
  "apiKey": "desktop-client-api-key-2024", 
  "pilotName": "Your Pilot Name",
  "eveLogsPath": "/home/username/.wine/drive_c/users/username/Documents/EVE/logs/Chatlogs"
}
```

**Most users don't need to change anything!** The client will automatically find your EVE logs.

### Step 4: Run the Client

**Make executable and run:**
```bash
chmod +x start-intel-monitor.sh
./start-intel-monitor.sh
```

**Or run directly:**
```bash
node simple-intel-monitor.js
```

## 📁 Files Included

- `simple-intel-monitor.js` - Main monitoring script (Linux-optimized)
- `start-intel-monitor.sh` - Easy startup script
- `simple-intel-config.json` - Configuration file
- `package.json` - Node.js dependencies
- `README.md` - This file

## 🔧 How It Works

1. **Monitors your EVE chat logs** in real-time via Wine filesystem
2. **Detects intel channels** (anything with "intel" in the name)
3. **Identifies intel messages** (system names, "clr", "red", etc.)
4. **Submits intel** to the server automatically
5. **Shows you what's happening** with live console output

## 📱 What You'll See

```
🚀 Simple EVE Intel Monitor Starting (Linux)...
📡 Server: https://intel.thrainkrill.space
👤 Pilot: Your Pilot Name
🐧 Platform: Linux 5.15.0
✓ Server connection OK: EVE Intel Server v1.0.0
🔍 Scanning for EVE Online chat logs (Linux/Wine)...
✓ Found EVE logs at: /home/user/.wine/drive_c/users/user/Documents/EVE/logs/Chatlogs (47 files)
🎯 Watching INTEL channel: Phoenix_Intel_20250907_040000.txt ⚡
💬 [Phoenix_Intel] Dante Aligeri: P-2TTL clr
⚡ INTEL DETECTED: Phoenix_Intel - P-2TTL clr
✓ Intel sent 🎯: Phoenix_Intel - P-2TTL clr... (420ms)
```

## 🐧 Linux/Wine EVE Log Locations

The client automatically scans these common locations:

### Wine Standard
- `~/.wine/drive_c/users/username/Documents/EVE/logs/Chatlogs`

### Steam Proton
- `~/.steam/steam/steamapps/compatdata/8500/pfx/drive_c/users/steamuser/Documents/EVE/logs/Chatlogs`
- `~/.local/share/Steam/steamapps/compatdata/8500/pfx/drive_c/users/steamuser/Documents/EVE/logs/Chatlogs`

### Lutris
- `~/.local/share/lutris/prefixes/eve-online/drive_c/users/username/Documents/EVE/logs/Chatlogs`

### PlayOnLinux
- `~/.PlayOnLinux/wineprefix/eve-online/drive_c/users/username/Documents/EVE/logs/Chatlogs`

### Flatpak Steam
- `~/.var/app/com.valvesoftware.Steam/home/.steam/steam/steamapps/compatdata/8500/pfx/drive_c/users/steamuser/Documents/EVE/logs/Chatlogs`

## 🎯 Supported Intel Channels

The client automatically detects channels with names containing:
- `intel` (Phoenix_Intel, Alliance_Intel, etc.)
- `military`
- `defense`
- `recon` 
- `standing fleet`

## 🔍 Intel Detection

Automatically detects messages containing:
- **Status**: clear, clr, status, stat
- **Hostiles**: red, hostile, neut, neutral
- **Activity**: spike, gate, station, cyno, fleet
- **Tactical**: bubble, camp, bridge, titan

## ⚙️ Advanced Configuration

### Custom EVE Logs Path
If the client can't find your EVE logs, specify the path in `simple-intel-config.json`:

```json
{
  "eveLogsPath": "/path/to/your/wine/prefix/drive_c/users/username/Documents/EVE/logs/Chatlogs"
}
```

### Command Line Options
```bash
node simple-intel-monitor.js start    # Start monitoring (default)
node simple-intel-monitor.js test     # Test server connection  
node simple-intel-monitor.js help     # Show help
```

### Running as Service
Create a systemd service for automatic startup:

```bash
# Create service file
sudo nano /etc/systemd/system/eve-intel-monitor.service
```

```ini
[Unit]
Description=EVE Intel Monitor
After=network.target

[Service] 
Type=simple
User=yourusername
WorkingDirectory=/path/to/IntelClientLinux
ExecStart=/usr/bin/node simple-intel-monitor.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable eve-intel-monitor
sudo systemctl start eve-intel-monitor
```

## 🔧 Troubleshooting

### "EVE logs directory not found!"
- Make sure EVE Online is running via Wine/Proton/Lutris
- Enable chat logging in EVE settings
- Join some chat channels to create log files
- Check Wine prefix location with `winecfg`
- Specify custom path in config if needed

### "Cannot connect to server"
- Check your internet connection
- Verify the server URL in config
- Make sure you're not behind a restrictive firewall
- Test with: `curl https://intel.thrainkrill.space/health`

### "Node.js is not installed"
- Install Node.js via your package manager
- On older systems, you may need to install from NodeSource

### No intel being detected
- Make sure you're in intel channels in EVE
- Check that channel names contain "intel"
- Try typing some test messages with "red" or "clear"
- Verify EVE chat logging is enabled and working

### Wine/Proton Issues
- Check your Wine prefix is working: `wine --version`
- For Steam Proton, make sure EVE has been run at least once
- Lutris users: check prefix in Lutris configuration
- File permissions: ensure logs directory is readable

## 📊 Statistics

The client shows stats every 5 minutes:
```
📊 === Intel Monitor Stats ===
⏱️  Uptime: 2h 15m
📨 Messages processed: 1,247
🎯 Intel sent: 89
❌ Errors: 0  
=============================
```

## 🛑 Stopping the Client

- **Terminal**: Press `Ctrl+C`
- **Background**: `pkill -f simple-intel-monitor`
- **Service**: `sudo systemctl stop eve-intel-monitor`

## 🔐 Security & Privacy

- **No personal data** is collected
- **Only intel messages** are sent to the server
- **Your pilot name** is included with intel submissions
- **Chat logs stay local** on your computer
- **HTTPS connections** to intel server

## 🐛 Need Help?

If you encounter issues:
1. Check this README
2. Look at the console output for error messages
3. Try running `node simple-intel-monitor.js test`
4. Check Wine logs if EVE log detection fails
5. Contact Thrain Krill in EVE Online

## 📝 Gaming Platform Notes

### Steam Proton
- EVE logs are in the compatdata folder for app ID 8500
- Make sure to run EVE at least once to create the prefix
- Use Steam's built-in Proton, not system Wine

### Lutris
- Check the Wine prefix path in Lutris configuration
- Ensure the prefix has proper read permissions
- Some Lutris Wine versions may require additional setup

### Standard Wine
- Use `winecfg` to check your Wine prefix location
- Ensure Windows version is set to Windows 7 or higher
- Install required Windows components if needed

## 📝 Version History

- **v1.0.0** - Initial Linux release with Wine/Proton support and UTF-16 log compatibility

---

**Fly safe! o7**

*For Windows users, see the Windows client package instead.*
