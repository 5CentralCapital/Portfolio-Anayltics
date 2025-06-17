const http = require('http');
const path = require('path');
const fs = require('fs');

class TestSuite {
    constructor() {
        this.serverUrl = 'http://localhost:3001';
        this.apiUrl = `${this.serverUrl}/api`;
        this.results = {
            database: { passed: 0, failed: 0, tests: [] },
            api: { passed: 0, failed: 0, tests: [] },
            frontend: { passed: 0, failed: 0, tests: [] }
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            'info': '📋',
            'success': '✅',
            'error': '❌',
            'warning': '⚠️'
        }[type] || '📋';
        
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async runTest(category, testName, testFunction) {
        try {
            this.log(`Running: ${testName}`, 'info');
            await testFunction();
            this.results[category].passed++;
            this.results[category].tests.push({ name: testName, status: 'PASSED' });
            this.log(`PASSED: ${testName}`, 'success');
            return true;
        } catch (error) {
            this.results[category].failed++;
            this.results[category].tests.push({ 
                name: testName, 
                status: 'FAILED', 
                error: error.message 
            });
            this.log(`FAILED: ${testName} - ${error.message}`, 'error');
            return false;
        }
    }

    async testDatabaseSchema() {
        this.log('\n🗄️ Testing Database Configuration...', 'info');
        
        await this.runTest('database', 'Schema File Exists', async () => {
            const schemaPath = path.join(__dirname, '../database/schema.sql');
            if (!fs.existsSync(schemaPath)) {
                throw new Error('Schema file not found');
            }
        });

        await this.runTest('database', 'PostgreSQL-Compatible Types', async () => {
            const schemaPath = path.join(__dirname, '../database/schema.sql');
            const schema = fs.readFileSync(schemaPath, 'utf8');
            
            // Check for PostgreSQL-compatible types
            const incompatibleTypes = ['DATETIME'];
            const foundIncompatible = incompatibleTypes.filter(type => 
                schema.includes(type)
            );
            
            if (foundIncompatible.length > 0) {
                throw new Error(`Found incompatible types: ${foundIncompatible.join(', ')}`);
            }
            
            // Verify TIMESTAMP usage
            if (!schema.includes('TIMESTAMP')) {
                throw new Error('TIMESTAMP type not found in schema');
            }
        });

        await this.runTest('database', 'SQLite Database Connection', async () => {
            const dbPath = path.join(__dirname, '../data/analytics.db');
            const dataDir = path.dirname(dbPath);
            
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            // Test database creation/connection
            const sqlite3 = require('sqlite3');
            const db = new sqlite3.Database(dbPath);
            
            return new Promise((resolve, reject) => {
                db.get("SELECT 1", (err) => {
                    db.close();
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    }

    async testApiHealth() {
        this.log('\n🏥 Testing API Health...', 'info');
        
        await this.runTest('api', 'Server Responds to Health Check', async () => {
            const response = await this.makeRequest(`${this.serverUrl}/health`);
            if (!response.success) {
                throw new Error(`Health check failed: ${response.error}`);
            }
            
            if (!response.data || response.data.status !== 'OK') {
                throw new Error('Health check returned invalid status');
            }
        });

        await this.runTest('api', 'API Health Endpoint', async () => {
            const response = await this.makeRequest(`${this.apiUrl}/health`);
            if (!response.success) {
                throw new Error(`API health check failed: ${response.error}`);
            }
        });

        await this.runTest('api', 'CORS Headers Present', async () => {
            const response = await this.makeRequestWithHeaders(`${this.serverUrl}/health`, {
                'Origin': 'http://localhost:5173'
            });
            
            if (!response.headers['access-control-allow-origin']) {
                throw new Error('CORS headers not present');
            }
        });
    }

    async testFrontendIntegration() {
        this.log('\n🌐 Testing Frontend Integration...', 'info');
        
        await this.runTest('frontend', 'API Endpoint Configuration', async () => {
            const apiServicePath = path.join(__dirname, '../../src/services/api.ts');
            if (!fs.existsSync(apiServicePath)) {
                throw new Error('API service file not found');
            }
            
            const apiService = fs.readFileSync(apiServicePath, 'utf8');
            if (!apiService.includes('localhost:3001/api')) {
                throw new Error('API endpoint not configured for localhost:3001/api');
            }
        });

        await this.runTest('frontend', 'Authentication Flow Test', async () => {
            // Test login endpoint
            const loginData = {
                email: 'michael@5central.capital',
                password: 'admin123'
            };
            
            const response = await this.makeRequest(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                body: JSON.stringify(loginData)
            });
            
            if (!response.success) {
                throw new Error(`Login test failed: ${response.error}`);
            }
            
            if (!response.data.token) {
                throw new Error('Login response missing token');
            }
        });

        await this.runTest('frontend', 'Dashboard Data Endpoint', async () => {
            // First login to get token
            const loginResponse = await this.makeRequest(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                body: JSON.stringify({
                    email: 'michael@5central.capital',
                    password: 'admin123'
                })
            });
            
            if (!loginResponse.success) {
                throw new Error('Could not login for dashboard test');
            }
            
            // Test dashboard endpoint with token
            const dashboardResponse = await this.makeRequest(`${this.apiUrl}/analytics/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${loginResponse.data.token}`
                }
            });
            
            if (!dashboardResponse.success) {
                throw new Error(`Dashboard endpoint failed: ${dashboardResponse.error}`);
            }
        });
    }

    makeRequest(url, options = {}) {
        return new Promise((resolve) => {
            const urlObj = new URL(url);
            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            };

            const req = http.request(requestOptions, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        resolve({ 
                            success: res.statusCode >= 200 && res.statusCode < 300, 
                            data: jsonData,
                            headers: res.headers,
                            statusCode: res.statusCode
                        });
                    } catch (error) {
                        resolve({ 
                            success: false, 
                            error: 'Invalid JSON response',
                            data: data,
                            headers: res.headers,
                            statusCode: res.statusCode
                        });
                    }
                });
            });

            req.on('error', (error) => {
                resolve({ success: false, error: error.message });
            });

            req.setTimeout(10000, () => {
                req.destroy();
                resolve({ success: false, error: 'Request timeout' });
            });

            if (options.body) {
                req.write(options.body);
            }
            
            req.end();
        });
    }

    makeRequestWithHeaders(url, headers) {
        return this.makeRequest(url, { headers });
    }

    async runAllTests() {
        console.log('🧪 Starting Development Setup Test Suite\n');
        console.log('='.repeat(60));
        
        // Run all test categories
        await this.testDatabaseSchema();
        await this.testApiHealth();
        await this.testFrontendIntegration();
        
        // Generate summary report
        this.generateReport();
        
        return this.isAllTestsPassed();
    }

    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('='.repeat(60));
        
        let totalPassed = 0;
        let totalFailed = 0;
        
        Object.entries(this.results).forEach(([category, results]) => {
            console.log(`\n${category.toUpperCase()}:`);
            console.log(`  ✅ Passed: ${results.passed}`);
            console.log(`  ❌ Failed: ${results.failed}`);
            
            if (results.failed > 0) {
                console.log('  Failed Tests:');
                results.tests
                    .filter(test => test.status === 'FAILED')
                    .forEach(test => {
                        console.log(`    - ${test.name}: ${test.error}`);
                    });
            }
            
            totalPassed += results.passed;
            totalFailed += results.failed;
        });
        
        console.log('\n' + '='.repeat(60));
        console.log(`OVERALL RESULTS:`);
        console.log(`✅ Total Passed: ${totalPassed}`);
        console.log(`❌ Total Failed: ${totalFailed}`);
        console.log(`📈 Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
        
        if (totalFailed === 0) {
            console.log('\n🎉 ALL TESTS PASSED! Development setup is ready.');
            console.log('✅ Database schema uses PostgreSQL-compatible types');
            console.log('✅ Local server runs without errors');
            console.log('✅ Health endpoint returns successful response');
            console.log('✅ Frontend successfully connects to local API');
            console.log('✅ Login system functions as expected');
        } else {
            console.log('\n⚠️  Some tests failed. Please review and fix issues before proceeding.');
        }
        
        console.log('='.repeat(60));
    }

    isAllTestsPassed() {
        return Object.values(this.results).every(category => category.failed === 0);
    }
}

// Run tests if called directly
if (require.main === module) {
    const testSuite = new TestSuite();
    testSuite.runAllTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test suite failed:', error);
            process.exit(1);
        });
}

module.exports = TestSuite;