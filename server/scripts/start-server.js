const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class ServerManager {
    constructor() {
        this.serverProcess = null;
        this.serverPath = path.join(__dirname, '..');
        this.logFile = path.join(this.serverPath, 'server.log');
    }

    async checkPrerequisites() {
        console.log('🔍 Checking prerequisites...');
        
        // Check if package.json exists
        const packagePath = path.join(this.serverPath, 'package.json');
        if (!fs.existsSync(packagePath)) {
            throw new Error('package.json not found in server directory');
        }
        
        // Check if node_modules exists
        const nodeModulesPath = path.join(this.serverPath, 'node_modules');
        if (!fs.existsSync(nodeModulesPath)) {
            console.log('📦 Installing dependencies...');
            await this.runCommand('npm', ['install'], this.serverPath);
        }
        
        // Ensure data directory exists
        const dataDir = path.join(this.serverPath, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log('📁 Created data directory');
        }
        
        console.log('✅ Prerequisites checked');
    }

    runCommand(command, args, cwd) {
        return new Promise((resolve, reject) => {
            const process = spawn(command, args, { 
                cwd, 
                stdio: 'inherit',
                shell: true 
            });
            
            process.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Command failed with code ${code}`));
                }
            });
            
            process.on('error', reject);
        });
    }

    async startServer() {
        try {
            await this.checkPrerequisites();
            
            console.log('🚀 Starting server...');
            
            // Clear previous log
            if (fs.existsSync(this.logFile)) {
                fs.unlinkSync(this.logFile);
            }
            
            // Start server process
            this.serverProcess = spawn('node', ['app.js'], {
                cwd: this.serverPath,
                stdio: ['inherit', 'pipe', 'pipe'],
                shell: true
            });
            
            // Create log file stream
            const logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
            
            // Pipe output to both console and log file
            this.serverProcess.stdout.on('data', (data) => {
                const message = data.toString();
                process.stdout.write(message);
                logStream.write(message);
                
                // Check for successful startup
                if (message.includes('Server running on port 3001')) {
                    console.log('✅ Server started successfully!');
                    console.log('🌐 API available at: http://localhost:3001/api');
                    console.log('🏥 Health check: http://localhost:3001/health');
                    console.log('📊 Admin login: http://localhost:5173/admin-login');
                }
            });
            
            this.serverProcess.stderr.on('data', (data) => {
                const message = data.toString();
                process.stderr.write(message);
                logStream.write(`ERROR: ${message}`);
            });
            
            this.serverProcess.on('close', (code) => {
                logStream.end();
                if (code !== 0) {
                    console.log(`❌ Server exited with code ${code}`);
                } else {
                    console.log('🛑 Server stopped');
                }
            });
            
            this.serverProcess.on('error', (error) => {
                console.error('❌ Failed to start server:', error.message);
                logStream.end();
            });
            
            // Handle graceful shutdown
            process.on('SIGINT', () => {
                console.log('\n🛑 Shutting down server...');
                if (this.serverProcess) {
                    this.serverProcess.kill('SIGTERM');
                }
                process.exit(0);
            });
            
        } catch (error) {
            console.error('❌ Error starting server:', error.message);
            process.exit(1);
        }
    }

    async stopServer() {
        if (this.serverProcess) {
            console.log('🛑 Stopping server...');
            this.serverProcess.kill('SIGTERM');
            this.serverProcess = null;
        }
    }

    async restartServer() {
        await this.stopServer();
        setTimeout(() => {
            this.startServer();
        }, 2000);
    }

    async checkServerStatus() {
        const http = require('http');
        
        return new Promise((resolve) => {
            const request = http.get('http://localhost:3001/health', (response) => {
                resolve(response.statusCode === 200);
            });
            
            request.on('error', () => {
                resolve(false);
            });
            
            request.setTimeout(3000, () => {
                request.destroy();
                resolve(false);
            });
        });
    }
}

// CLI interface
if (require.main === module) {
    const manager = new ServerManager();
    const command = process.argv[2] || 'start';
    
    switch (command) {
        case 'start':
            manager.startServer();
            break;
        case 'stop':
            manager.stopServer();
            break;
        case 'restart':
            manager.restartServer();
            break;
        case 'status':
            manager.checkServerStatus().then(isRunning => {
                console.log(isRunning ? '✅ Server is running' : '❌ Server is not running');
                process.exit(isRunning ? 0 : 1);
            });
            break;
        default:
            console.log('Usage: node start-server.js [start|stop|restart|status]');
            process.exit(1);
    }
}

module.exports = ServerManager;