#!/usr/bin/env node

/**
 * Enhanced EVE Intel Monitor for Linux
 * Optimized version with subsecond response times and comprehensive Linux path detection
 * Monitors EVE chat logs and pushes intel to a remote server.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { watch } from 'chokidar';
// Note: You will need to install chokidar and node-fetch
// npm install chokidar node-fetch
import fetch from 'node-fetch';


class AdvancedIntelMonitor {
    constructor() {
        // Default configuration, will be merged with the JSON config file
        this.config = {
            serverUrl: 'https://intel.thrainkrill.space',
            apiKey: 'desktop-client-api-key-2024',
            pilotName: 'Desktop Client',
            heartbeatInterval: 5 * 60 * 1000, // 5 minutes
            eveLogsPath: null, // Will be auto-detected if null
            inactiveFileTimeout: 2 * 60 * 1000 // 2 minutes to consider a file inactive
        };

        // State management
        this.fileStates = new Map();
        this.activeFiles = new Map(); // Track which files are actively being written to
        this.primaryFile = null; // The currently primary active file
        this.clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        this.heartbeatTimer = null;
        this.running = false;
        this.stats = {
            messagesProcessed: 0,
            intelSent: 0,
            errorsEncountered: 0,
            startTime: new Date()
        };
        this.submittedIntel = new Map(); // Tracks submitted intel to prevent duplicates
        this.monitoringStartTime = null; // Track when monitoring started
        this.watcher = null;

        // Intel detection patterns
        this.intelKeywords = [
            'red', 'hostile', 'enemy', 'neut', 'neutral', 'unknown',
            'clear', 'clr', 'status', 'gate', 'station', 'cyno', 'bridge',
            'dock', 'undock', 'jump', 'warp', 'belt', 'safe', 'pos',
            'titan', 'super', 'dread', 'carrier', 'fax', 'blops'
        ];

        // EVE system name pattern (examples: J164738, 4O-239, M-OEE8, NIDJ-K)
        this.systemPattern = /\b([A-Z0-9]{1,2}-[A-Z0-9]{1,4}|[A-Z]{2,}-[A-Z0-9]{1,4}|J\d{6})\b/g;
    }

    /**
     * Loads configuration from simple-intel-config.json and merges it with defaults.
     */
    loadConfig() {
        try {
            const configPath = path.join(process.cwd(), 'simple-intel-config.json');
            if (fs.existsSync(configPath)) {
                const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                Object.assign(this.config, configData); // Merge settings from file
                console.log('✓ Configuration loaded from simple-intel-config.json');
            } else {
                console.log('ℹ️ No config file found. Using default settings.');
            }
        } catch (error) {
            console.error('⚠️ Error loading configuration:', error.message);
        }
    }

    /**
     * Finds the EVE Online chat log directory by checking Linux-specific locations.
     * Prioritizes the path from the config file if it exists.
     * @returns {string} The path to the chat logs directory.
     */
    findEveLogsDirectory() {
        if (this.config.eveLogsPath && fs.existsSync(this.config.eveLogsPath)) {
            console.log(`✓ Using custom EVE logs path from config: ${this.config.eveLogsPath}`);
            return this.config.eveLogsPath;
        }

        const username = os.userInfo().username;
        const homeDir = os.homedir();
        
        // Linux-specific EVE installation paths
        const possiblePaths = [
            // Native Linux EVE
            path.join(homeDir, '.local', 'share', 'CCP', 'EVE', 'logs', 'Chatlogs'),
            
            // Steam/Proton installations
            path.join(homeDir, '.steam', 'steam', 'steamapps', 'compatdata', '8500', 'pfx', 'drive_c', 'users', 'steamuser', 'Documents', 'EVE', 'logs', 'Chatlogs'),
            path.join(homeDir, '.local', 'share', 'Steam', 'steamapps', 'compatdata', '8500', 'pfx', 'drive_c', 'users', 'steamuser', 'Documents', 'EVE', 'logs', 'Chatlogs'),
            
            // Lutris/Wine installations (common patterns)
            path.join(homeDir, 'Games', 'eve-online', 'drive_c', 'users', username, 'Documents', 'EVE', 'logs', 'Chatlogs'),
            path.join(homeDir, 'Games', 'eve-online', 'drive_c', 'users', 'user', 'Documents', 'EVE', 'logs', 'Chatlogs'),
            path.join(homeDir, 'Games', 'EVE', 'drive_c', 'users', username, 'Documents', 'EVE', 'logs', 'Chatlogs'),
            
            // Standard Wine prefix
            path.join(homeDir, '.wine', 'drive_c', 'users', username, 'Documents', 'EVE', 'logs', 'Chatlogs'),
            path.join(homeDir, '.wine', 'drive_c', 'users', 'user', 'Documents', 'EVE', 'logs', 'Chatlogs'),
            
            // PlayOnLinux/Bottles style
            path.join(homeDir, '.PlayOnLinux', 'wineprefix', 'EVE', 'drive_c', 'users', username, 'Documents', 'EVE', 'logs', 'Chatlogs'),
            path.join(homeDir, '.local', 'share', 'bottles', 'bottles', 'EVE', 'drive_c', 'users', username, 'Documents', 'EVE', 'logs', 'Chatlogs'),
            
            // Flatpak Steam
            path.join(homeDir, '.var', 'app', 'com.valvesoftware.Steam', 'home', '.steam', 'steam', 'steamapps', 'compatdata', '8500', 'pfx', 'drive_c', 'users', 'steamuser', 'Documents', 'EVE', 'logs', 'Chatlogs'),
            
            // Alternative common locations
            path.join(homeDir, 'Documents', 'EVE', 'logs', 'Chatlogs'),
            path.join(homeDir, 'EVE', 'logs', 'Chatlogs'),
        ];

        console.log('🔍 Scanning for EVE Online chat logs...');
        for (const logPath of possiblePaths) {
            console.log(`   Checking: ${logPath}`);
            if (fs.existsSync(logPath)) {
                // Check if directory has chat log files
                try {
                    const files = fs.readdirSync(logPath);
                    const chatLogs = files.filter(f => f.endsWith('.txt') && f.includes('_'));
                    if (chatLogs.length > 0) {
                        console.log(`✓ Found EVE logs at: ${logPath} (${chatLogs.length} files)`);
                        return logPath;
                    }
                } catch (err) {
                    // Permission denied or other error, continue
                    continue;
                }
            }
        }
        
        throw new Error(`EVE logs directory not found! 

Common Linux paths:
• Native Linux: ~/.local/share/CCP/EVE/logs/Chatlogs/
• Steam/Proton: ~/.steam/steam/steamapps/compatdata/8500/pfx/drive_c/users/steamuser/Documents/EVE/logs/Chatlogs/
• Lutris/Wine: ~/Games/eve-online/drive_c/users/${username}/Documents/EVE/logs/Chatlogs/
• Standard Wine: ~/.wine/drive_c/users/${username}/Documents/EVE/logs/Chatlogs/

Please set "eveLogsPath" in your config file, or ensure EVE chat logging is enabled.`);
    }

    /**
     * Gets all Intel channel files and determines which one is currently active
     * @param {string} logsDirectory - The EVE logs directory path
     * @param {boolean} silent - If true, don't log the file list
     * @param {boolean} onlyNewFiles - If true, only return files created after monitoring started
     * @returns {Array} Array of Intel file info objects
     */
    getIntelFiles(logsDirectory, silent = false, onlyNewFiles = false) {
        const files = fs.readdirSync(logsDirectory);
        const intelFiles = [];
        
        // For startup: check last 6 hours. For runtime: only check files created after monitoring started
        const timeThreshold = onlyNewFiles 
            ? this.monitoringStartTime 
            : Date.now() - (6 * 60 * 60 * 1000); // 6 hours ago

        for (const filename of files) {
            // Look for Intel channel files
            if (filename.toLowerCase().includes('intel') && filename.endsWith('.txt')) {
                const filePath = path.join(logsDirectory, filename);
                const stats = fs.statSync(filePath);
                
                // Filter by time threshold
                if (stats.mtime.getTime() < timeThreshold) {
                    continue;
                }
                
                // Extract character ID from filename (last numbers before .txt)
                const characterMatch = filename.match(/_(\d+)\.txt$/);
                const characterId = characterMatch ? characterMatch[1] : 'unknown';
                
                intelFiles.push({
                    filePath,
                    filename,
                    characterId,
                    lastModified: stats.mtime,
                    size: stats.size,
                    channel: this.extractChannelName(filename)
                });
            }
        }

        // Sort by last modified time (most recent first)
        intelFiles.sort((a, b) => b.lastModified - a.lastModified);
        
        if (!silent) {
            const timeDesc = onlyNewFiles ? 'new' : 'recent (last 6 hours)';
            console.log(`📋 Found ${intelFiles.length} ${timeDesc} Intel channel files:`);
            intelFiles.forEach((file, index) => {
                const age = Math.floor((Date.now() - file.lastModified.getTime()) / 1000);
                const status = index === 0 ? '[PRIMARY]' : '[STANDBY]';
                console.log(`   ${status} ${file.filename} (${age}s ago, Character: ${file.characterId})`);
            });
        }

        return intelFiles;
    }

    /**
     * Extracts channel name from filename
     * @param {string} filename - The log filename
     * @returns {string} The channel name
     */
    extractChannelName(filename) {
        // Remove timestamp and character ID from filename
        // Examples: Phoenix_Intel_South_20250907_193309_2122867331.txt -> Phoenix_Intel_South
        //          Phoenix_Intel_20250907_193309_2122867331.txt -> Phoenix_Intel
        const match = filename.match(/^(.+?)_\d{8}_\d{6}_\d+\.txt$/);
        if (match) {
            const channelName = match[1].replace(/_/g, ' '); // Convert underscores to spaces for readability
            return channelName;
        }
        const fallback = path.basename(filename, '.txt');
        return fallback;
    }

    /**
     * Checks if a message contains intel information
     * @param {string} message - The chat message
     * @returns {boolean} True if message appears to contain intel
     */
    isIntelMessage(message) {
        const lowerMessage = message.toLowerCase();
        
        // Skip system messages and common non-intel patterns
        if (lowerMessage.includes('eve system >') || 
            lowerMessage.includes('channel motd') ||
            lowerMessage.includes('welcome to') ||
            lowerMessage.includes('changed topic') ||
            lowerMessage.includes('has joined') ||
            lowerMessage.includes('has left') ||
            lowerMessage.length < 3) {
            return false;
        }

        // Check for intel keywords
        const hasIntelKeyword = this.intelKeywords.some(keyword => 
            lowerMessage.includes(keyword.toLowerCase())
        );

        // Check for system names
        const hasSystemName = this.systemPattern.test(message);

        // Intel if it has keywords or system names
        return hasIntelKeyword || hasSystemName;
    }

    /**
     * Extracts system names from a message
     * @param {string} message - The chat message
     * @returns {Array} Array of system names found
     */
    extractSystemNames(message) {
        const systems = [];
        let match;
        const regex = new RegExp(this.systemPattern.source, 'g');
        
        while ((match = regex.exec(message)) !== null) {
            systems.push(match[1]);
        }
        
        return [...new Set(systems)]; // Remove duplicates
    }

    /**
     * Sends a heartbeat to the server to show the client is active.
     */
    async sendHeartbeat() {
        try {
            const heartbeatData = {
                clientId: this.clientId,
                pilot: this.config.pilotName,
                version: '2.1.0-enhanced-linux',
                platform: `${os.platform()}-${os.arch()}`,
                stats: {
                    uptime: Math.floor((Date.now() - this.stats.startTime.getTime()) / 1000),
                    watchedFiles: this.fileStates.size,
                    activeFiles: this.activeFiles.size,
                    primaryFile: this.primaryFile ? path.basename(this.primaryFile) : 'none',
                    ...this.stats
                }
            };
            const response = await fetch(`${this.config.serverUrl}/api/heartbeat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.config.apiKey}` },
                body: JSON.stringify(heartbeatData)
            });
            
            if (response.ok) {
                console.log('💗 Heartbeat sent successfully.');
            } else {
                console.warn(`⚠️ Heartbeat failed: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.warn(`⚠️ Heartbeat failed: ${error.message}`);
        }
    }

    /**
     * Parses a line from an EVE chat log.
     * @param {string} line - The raw line from the log file.
     * @returns {object|null} A parsed log entry or null if invalid.
     */
    parseLogLine(line) {
        const cleanLine = line.replace(/^[\uFEFF\uFFFE]/, '').replace(/\0/g, '').trim();
        if (!cleanLine) return null;

        // Handle EVE log format: [ 2025.09.07 16:52:50 ] Pilot Name > Message
        const logRegex = /^\[\s*(\d{4}\.\d{2}\.\d{2}\s+\d{2}[:.]\d{2}[:.]\d{2})\s*\]\s*([^>]+)\s*>\s*(.+)$/;
        const match = cleanLine.match(logRegex);
        if (!match) return null;

        const [, timestampStr, pilot, message] = match;
        
        // Convert EVE timestamp format to ISO
        const normalizedTimestamp = new Date(timestampStr.replace(/\./g, '-').replace(' ', 'T') + 'Z');
        if (isNaN(normalizedTimestamp.getTime())) return null;

        return { 
            timestamp: normalizedTimestamp, 
            pilot: pilot.trim(), 
            message: message.trim() 
        };
    }

    /**
     * Reads only the new content from a file since the last read.
     * @param {string} filePath - Path to the file.
     * @param {number} lastSize - The last known size of the file.
     * @returns {Promise<string|null>} New content or null on error.
     */
    async readNewContent(filePath, lastSize) {
        return new Promise((resolve) => {
            // EVE logs are in UTF-16LE encoding on all platforms
            const stream = fs.createReadStream(filePath, { 
                start: lastSize, 
                encoding: 'utf16le' 
            });
            let content = '';
            stream.on('data', chunk => content += chunk);
            stream.on('end', () => resolve(content));
            stream.on('error', (error) => {
                console.warn(`⚠️ Error reading file ${filePath}: ${error.message}`);
                resolve(null);
            });
        });
    }

    /**
     * Submits intel data to the server.
     * @param {object} intelData - The intel payload to send.
     */
    async submitIntel(intelData) {
        try {
            // Debug logging to see what we're sending
            console.log(`🔍 Submitting intel data:`, {
                system: intelData.system,
                intel: intelData.intel,
                pilot: intelData.pilot,
                channel: intelData.channel,
                timestamp: intelData.timestamp
            });

            const response = await fetch(`${this.config.serverUrl}/api/intel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.config.apiKey}` },
                body: JSON.stringify(intelData)
            });

            if (response.ok) {
                console.log(`✅ Intel submitted from ${intelData.channel}: ${intelData.intel}`);
                this.stats.intelSent++;
                return true;
            } else {
                console.error(`❌ Failed to submit intel from ${intelData.channel}: ${response.status} ${response.statusText}`);
                this.stats.errorsEncountered++;
                return false;
            }
        } catch (error) {
            console.error(`❌ Network error submitting intel from ${intelData.channel || 'unknown'}: ${error.message}`);
            this.stats.errorsEncountered++;
            return false;
        }
    }

    /**
     * Processes new lines from a log file, distinguishing between initial load and real-time updates.
     * @param {string} filePath - Path to the log file.
     * @param {string[]} lines - Array of lines to process.
     * @param {boolean} isInitialLoad - True if this is the first time seeing the file.
     */
    async processNewLines(filePath, lines, isInitialLoad = false) {
        // Extract channel name ONCE per file processing session to avoid spam
        const filename = path.basename(filePath);
        const channelName = this.extractChannelName(filename);
        const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
        
        console.log(`📝 Processing ${lines.length} lines from ${filename} (Channel: ${channelName}, isInitial: ${isInitialLoad})`);

        let processedCount = 0;
        let intelCount = 0;

        for (const line of lines) {
            const parsed = this.parseLogLine(line);
            if (!parsed) continue;

            processedCount++;

            // On initial load, we only log recent messages but DO NOT send them.
            if (isInitialLoad) {
                if (parsed.timestamp.getTime() >= tenMinutesAgo) {
                    const age = Math.floor((Date.now() - parsed.timestamp.getTime()) / 1000);
                    console.log(`📋 [INITIAL] Recent message from ${channelName}: "${parsed.message}" (${age}s old) - NOT submitted`);
                }
                continue;
            }
            
            // Log ALL messages for debugging, not just intel
            const age = Math.floor((Date.now() - parsed.timestamp.getTime()) / 1000);
            console.log(`💬 [${age}s old] ${parsed.pilot} in ${channelName}: ${parsed.message}`);
            
            // Skip if not an intel message
            if (!this.isIntelMessage(parsed.message)) {
                console.log(`   ⏭️ Not intel - skipping`);
                continue;
            }
            
            intelCount++;
            this.stats.messagesProcessed++;
            
            // Create a more specific intel ID that includes the channel to prevent cross-channel duplicates
            const intelId = `${channelName}-${parsed.timestamp.toISOString()}-${parsed.pilot}-${parsed.message}`;
            if (this.submittedIntel.has(intelId)) {
                console.log(`   🔄 Already submitted from ${channelName} - skipping duplicate`);
                continue; // Prevent duplicates
            }
            
            console.log(`⚡ INTEL DETECTED in ${channelName}: ${parsed.message} (${age}s old)`);

            // Extract system names from the message
            const systemNames = this.extractSystemNames(parsed.message);
            const primarySystem = systemNames.length > 0 ? systemNames[0] : channelName;

            // Format intel data to match server expectations
            const intelData = {
                system: primarySystem, // Server expects 'system' field
                intel: parsed.message,
                pilot: parsed.pilot,
                timestamp: parsed.timestamp.toISOString(),
                channel: channelName, // Properly formatted channel name
                source: channelName, // Server checks 'source' field first for channel name
                systemMentions: systemNames, // Additional systems mentioned
                confidence: this.calculateIntelConfidence(parsed.message, systemNames.length > 0)
            };
            
            const success = await this.submitIntel(intelData);
            if (success) {
                this.submittedIntel.set(intelId, Date.now()); // Mark as submitted
                console.log(`   ✅ Successfully submitted to ${channelName}`);
            } else {
                console.log(`   ❌ Failed to submit intel from ${channelName}`);
            }
        }
        
        console.log(`✅ Processed ${processedCount} valid messages, found ${intelCount} intel messages in ${channelName}`);
    }

    /**
     * Calculates confidence score for intel messages
     * @param {string} message - The intel message
     * @param {boolean} hasSystemName - Whether message contains system names
     * @returns {number} Confidence score between 0 and 1
     */
    calculateIntelConfidence(message, hasSystemName) {
        let confidence = 0.5; // Base confidence
        const lowerMessage = message.toLowerCase();

        // Higher confidence for specific intel keywords
        if (lowerMessage.includes('red') || lowerMessage.includes('hostile')) confidence += 0.3;
        if (lowerMessage.includes('clear') || lowerMessage.includes('clr')) confidence += 0.2;
        if (lowerMessage.includes('cyno') || lowerMessage.includes('bridge')) confidence += 0.3;
        if (lowerMessage.includes('gate') || lowerMessage.includes('station')) confidence += 0.2;
        if (hasSystemName) confidence += 0.2;

        return Math.min(confidence, 1.0);
    }

    /**
     * Handles a change event for a watched file (enhanced for Linux).
     */
    async handleFileChange(filePath) {
        try {
            const fileState = this.fileStates.get(filePath);
            if (!fileState) {
                // New file detected
                console.log(`🎯 Watching new INTEL channel: ${path.basename(filePath)}`);
                const stats = fs.statSync(filePath);
                this.fileStates.set(filePath, { lastSize: 0 });
                
                // Read entire file for initial load
                const content = await this.readNewContent(filePath, 0);
                if (content) {
                    await this.processNewLines(filePath, content.split('\n'), true);
                }
                this.fileStates.get(filePath).lastSize = stats.size;
                return;
            }

            const stats = await fs.promises.stat(filePath);

            // Handle file truncation/reset
            if (stats.size < fileState.lastSize) {
                console.log(`🔄 File truncated. Resetting watcher for ${path.basename(filePath)}.`);
                fileState.lastSize = 0;
            }

            if (stats.size > fileState.lastSize) {
                console.log(`📈 File size increased: ${path.basename(filePath)} (${fileState.lastSize} → ${stats.size} bytes)`);
                const newContent = await this.readNewContent(filePath, fileState.lastSize);
                if (newContent) {
                    console.log(`📝 New content found: ${newContent.length} chars`);
                    const newLines = newContent.split('\n');
                    await this.processNewLines(filePath, newLines, false);
                }
                fileState.lastSize = stats.size;
            }
        } catch (error) {
            if (error.code !== 'ENOENT') { // Ignore "file not found" errors
                console.error(`❌ Error processing file change for ${path.basename(filePath)}: ${error.message}`);
                this.stats.errorsEncountered++;
            }
        }
    }

    /**
     * Tests the connection to the server's status endpoint.
     */
    async testConnection() {
        this.loadConfig();
        console.log(`🔧 Testing connection to server: ${this.config.serverUrl}`);
        try {
            // Test the status endpoint
            const statusUrl = new URL(this.config.serverUrl);
            statusUrl.pathname = '/api/status';
            
            const response = await fetch(statusUrl.href);
            if (response.ok) {
                console.log('✅ Connection successful!');
                return true;
            }
            console.error(`❌ Connection failed: ${response.status} ${response.statusText}`);
            return false;
        } catch (error) {
            console.error(`❌ Connection error: ${error.message}`);
            return false;
        }
    }

    /**
     * Starts monitoring the EVE chat logs directory (Linux-optimized with chokidar).
     */
    async start() {
        console.log('🚀 Enhanced EVE Intel Monitor Starting...');
        this.loadConfig();
        this.running = true;
        this.monitoringStartTime = Date.now();
        
        console.log(`📡 Server: ${this.config.serverUrl}`);
        console.log(`👤 Pilot: ${this.config.pilotName}`);

        try {
            const logsDirectory = this.findEveLogsDirectory();
            console.log(`✓ Monitoring EVE chat logs in: ${logsDirectory}`);
            
            // Get initial Intel files (from last 6 hours, with full logging)
            const intelFiles = this.getIntelFiles(logsDirectory, false, false);
            
            // Initialize file states for existing intel files
            for (const file of intelFiles) {
                this.fileStates.set(file.filePath, { lastSize: file.size });
            }
            
            this.watcher = watch(path.join(logsDirectory, '*.txt'), {
                persistent: true,
                ignoreInitial: false, // We want to catch existing files
                usePolling: false, // Use native events for better performance on Linux
                interval: 250, // Fast polling interval when native events aren't available
                awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 }, // Very responsive
            });

            this.watcher
                .on('add', (filePath) => {
                    const filename = path.basename(filePath);
                    if (filename.toLowerCase().includes('intel') && filename.endsWith('.txt')) {
                        console.log(`🎯 Detected INTEL channel: ${filename}`);
                        this.handleFileChange(filePath);
                    }
                })
                .on('change', (filePath) => {
                    const filename = path.basename(filePath);
                    if (filename.toLowerCase().includes('intel') && filename.endsWith('.txt')) {
                        console.log(`📁 File system event: change on ${filename} at ${new Date().toISOString()}`);
                        this.handleFileChange(filePath);
                    }
                })
                .on('unlink', (filePath) => {
                    if (this.fileStates.has(filePath)) {
                        console.log(`- File removed, stopped watching: ${path.basename(filePath)}`);
                        this.fileStates.delete(filePath);
                    }
                })
                .on('error', (error) => {
                    console.error(`❌ Watcher error: ${error.message}`);
                    this.stats.errorsEncountered++;
                });

            // Start heartbeat
            this.sendHeartbeat();
            this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), this.config.heartbeatInterval);

            console.log('👀 Ready for REAL-TIME intel monitoring...');
            console.log(`🔥 Watching ${intelFiles.length} Intel channels`);
        } catch (error) {
            console.error(`❌ Failed to start monitoring: ${error.message}`);
            process.exit(1);
        }
    }

    /**
     * Stops the monitor and cleans up resources.
     */
    stop() {
        if (!this.running) return;
        this.running = false;
        
        console.log('\n👋 Shutting down Intel Monitor...');
        
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        
        if (this.watcher) {
            this.watcher.close();
        }
        
        console.log('🛑 Monitor stopped.');
    }
}

// --- Main Execution Logic ---
async function main() {
    const monitor = new AdvancedIntelMonitor();
    const command = process.argv[2];

    const shutdown = () => {
        console.log('\n👋 Shutting down...');
        if (monitor.running) monitor.stop();
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    switch (command) {
        case 'test':
            const connected = await monitor.testConnection();
            process.exit(connected ? 0 : 1);
            break;
        case 'start':
        case undefined:
            await monitor.start();
            break;
        case 'help':
        default:
            console.log('Usage: node simple-intel-monitor.js [command]');
            console.log('  start    Start monitoring (default)');
            console.log('  test     Test the connection to the server');
            break;
    }
}

main().catch(err => {
    console.error("💥 A fatal error occurred:", err);
    process.exit(1);
});
