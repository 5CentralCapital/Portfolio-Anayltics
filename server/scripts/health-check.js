const http = require('http');
const path = require('path');

class HealthChecker {
    constructor() {
        this.serverUrl = 'http://localhost:3001';
        this.apiUrl = `${this.serverUrl}/api`;
        this.healthUrl = `${this.serverUrl}/health`;
    }

    async checkServer() {
        console.log('🔍 Checking backend server health...\n');
        
        try {
            // Check if server is responding
            const healthCheck = await this.makeRequest(this.healthUrl);
            
            if (healthCheck.success) {
                console.log('✅ Server is running and healthy');
                console.log(`📊 Server info:`, healthCheck.data);
                
                // Test API endpoints
                await this.testApiEndpoints();
                
                return true;
            } else {
                console.log('❌ Server health check failed');
                console.log('Error:', healthCheck.error);
                return false;
            }
        } catch (error) {
            console.log('❌ Cannot connect to server');
            console.log('Error:', error.message);
            
            // Provide troubleshooting steps
            this.provideTroubleshootingSteps();
            return false;
        }
    }

    async testApiEndpoints() {
        console.log('\n🧪 Testing API endpoints...');
        
        const endpoints = [
            { path: '/api/health', name: 'API Health' },
        ];

        for (const endpoint of endpoints) {
            try {
                const result = await this.makeRequest(`${this.serverUrl}${endpoint.path}`);
                if (result.success) {
                    console.log(`✅ ${endpoint.name}: OK`);
                } else {
                    console.log(`⚠️  ${endpoint.name}: ${result.error}`);
                }
            } catch (error) {
                console.log(`❌ ${endpoint.name}: Failed - ${error.message}`);
            }
        }
    }

    makeRequest(url) {
        return new Promise((resolve) => {
            const request = http.get(url, (response) => {
                let data = '';
                
                response.on('data', (chunk) => {
                    data += chunk;
                });
                
                response.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        resolve({ success: true, data: jsonData });
                    } catch (error) {
                        resolve({ success: false, error: 'Invalid JSON response' });
                    }
                });
            });

            request.on('error', (error) => {
                resolve({ success: false, error: error.message });
            });

            request.setTimeout(5000, () => {
                request.destroy();
                resolve({ success: false, error: 'Request timeout' });
            });
        });
    }

    provideTroubleshootingSteps() {
        console.log('\n🔧 Troubleshooting Steps:');
        console.log('1. Check if the server is running:');
        console.log('   cd server && npm start');
        console.log('');
        console.log('2. Check if port 3001 is available:');
        console.log('   netstat -an | grep 3001');
        console.log('');
        console.log('3. Install dependencies if needed:');
        console.log('   cd server && npm install');
        console.log('');
        console.log('4. Check for error logs:');
        console.log('   cd server && node app.js');
        console.log('');
        console.log('5. Try alternative startup:');
        console.log('   npm run dev:server');
    }

    async checkDependencies() {
        console.log('\n📦 Checking dependencies...');
        
        const fs = require('fs');
        const serverPackagePath = path.join(__dirname, '../package.json');
        
        try {
            if (fs.existsSync(serverPackagePath)) {
                console.log('✅ Server package.json found');
                
                const nodeModulesPath = path.join(__dirname, '../node_modules');
                if (fs.existsSync(nodeModulesPath)) {
                    console.log('✅ Node modules installed');
                } else {
                    console.log('❌ Node modules missing - run: cd server && npm install');
                }
            } else {
                console.log('❌ Server package.json not found');
            }
        } catch (error) {
            console.log('⚠️  Error checking dependencies:', error.message);
        }
    }

    async checkDatabase() {
        console.log('\n🗄️  Checking database...');
        
        const fs = require('fs');
        const dbPath = path.join(__dirname, '../data/analytics.db');
        const dataDir = path.join(__dirname, '../data');
        
        try {
            if (fs.existsSync(dataDir)) {
                console.log('✅ Data directory exists');
                
                if (fs.existsSync(dbPath)) {
                    const stats = fs.statSync(dbPath);
                    console.log(`✅ Database file exists (${stats.size} bytes)`);
                } else {
                    console.log('⚠️  Database file will be created on first run');
                }
            } else {
                console.log('⚠️  Data directory missing - will be created automatically');
            }
        } catch (error) {
            console.log('❌ Error checking database:', error.message);
        }
    }

    async runFullDiagnostic() {
        console.log('🏥 Running Full Backend Diagnostic\n');
        console.log('='.repeat(50));
        
        await this.checkDependencies();
        await this.checkDatabase();
        
        const serverHealthy = await this.checkServer();
        
        console.log('\n' + '='.repeat(50));
        console.log('📋 Diagnostic Summary:');
        
        if (serverHealthy) {
            console.log('✅ Backend is healthy and ready for connections');
            console.log('🌐 Frontend can now connect to: http://localhost:3001');
            console.log('🔐 Admin login available at: http://localhost:5173/admin-login');
        } else {
            console.log('❌ Backend has issues that need to be resolved');
            console.log('📖 See troubleshooting steps above');
        }
        
        return serverHealthy;
    }
}

// Run diagnostic if called directly
if (require.main === module) {
    const checker = new HealthChecker();
    checker.runFullDiagnostic().catch(console.error);
}

module.exports = HealthChecker;