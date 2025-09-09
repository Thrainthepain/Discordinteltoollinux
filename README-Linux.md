# EVE Online Intel Monitor - Linux Setup Guide

## Quick Start

1. **Make the script executable:**
   ```bash
   chmod +x start-intel-monitor.sh
   ```

2. **Run the setup:**
   ```bash
   ./start-intel-monitor.sh
   ```

3. **Follow the prompts to configure your settings**

## Configuration

Edit `simple-intel-config.json` with your settings:

```json
{
  "serverUrl": "https://intel.thrainkrill.space",
  "apiKey": "desktop-client-api-key-2024",
  "pilotName": "Your Actual Pilot Name",
  "eveLogsPath": "/path/to/your/eve/logs"
}
```

## Finding Your EVE Logs Path

The EVE logs path depends on how you installed EVE Online:

### Native Linux EVE
```
~/.local/share/CCP/EVE/logs/Chatlogs/
```

### Steam/Proton
```
~/.steam/steam/steamapps/compatdata/8500/pfx/drive_c/users/steamuser/Documents/EVE/logs/Chatlogs/
```

### Lutris/Wine (most common)
```
~/Games/eve-online/drive_c/users/USERNAME/Documents/EVE/logs/Chatlogs/
```

### Custom Wine Prefix
```
~/.wine/drive_c/users/USERNAME/Documents/EVE/logs/Chatlogs/
```

**Replace `USERNAME` with your actual Linux username.**

## Enable Chat Logging in EVE

Make sure chat logging is enabled in EVE Online:
1. Open EVE Settings
2. Go to **Chat & Windows**
3. Set **Chat Logging** to **Enabled**

## Troubleshooting

### "EVE logs directory not found"
- Double-check your `eveLogsPath` in the config file
- Make sure EVE chat logging is enabled
- Verify the path exists: `ls -la /path/to/your/eve/logs`

### "Cannot connect to server"
- Check your internet connection
- Verify the server URL is correct
- Try running: `curl https://intel.thrainkrill.space`

### "Node.js not found"
Install Node.js for your distribution:

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

## Running the Monitor

Once configured, simply run:
```bash
./start-intel-monitor.sh
```

The monitor will:
- Test the connection to the server
- Verify your configuration
- Start monitoring your EVE chat logs
- Send intel reports to Discord automatically

Press `Ctrl+C` to stop the monitor.

## Advanced Usage

You can also run the monitor directly:
```bash
node simple-intel-monitor.js
```

Or test just the connection:
```bash
node simple-intel-monitor.js test
```
