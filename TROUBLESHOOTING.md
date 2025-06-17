# Backend Connection Troubleshooting Guide

## 🚨 Error: "Failed to connect to server. Please ensure the backend is running on port 3001."

### 1. 🔍 **Verify Backend Server Status**

#### Quick Status Check:
```bash
# Check if port 3001 is in use
netstat -an | grep 3001
# OR on Windows:
netstat -an | findstr 3001

# Check if Node.js processes are running
ps aux | grep node
# OR on Windows:
tasklist | findstr node
```

#### Health Check:
```bash
# Test direct connection to backend
curl http://localhost:3001/health
# OR
curl http://localhost:3001/api/health

# Expected response:
# {"status":"OK","timestamp":"...","uptime":...}
```

### 2. 🚀 **Start the Backend Server**

#### Method 1: Individual Server Start
```bash
# Navigate to server directory
cd server

# Install dependencies (if needed)
npm install

# Start the server
npm start
# OR
node app.js
```

#### Method 2: Full Stack Start
```bash
# From project root - start both frontend and backend
npm run dev:full

# OR start backend only
npm run dev:server
```

#### Method 3: Manual Start with Debugging
```bash
cd server
DEBUG=* node app.js
```

### 3. 🔧 **Common Causes & Solutions**

#### A. **Port Already in Use**
```bash
# Find what's using port 3001
lsof -i :3001
# OR on Windows:
netstat -ano | findstr :3001

# Kill the process if needed
kill -9 <PID>
# OR on Windows:
taskkill /PID <PID> /F
```

#### B. **Missing Dependencies**
```bash
cd server
npm install
# Check for any missing packages
npm audit
```

#### C. **Environment Variables**
```bash
# Check if .env file exists in server directory
ls -la server/.env

# Create .env if missing
cd server
echo "NODE_ENV=development" > .env
echo "JWT_SECRET=your-super-secret-jwt-key" >> .env
echo "PORT=3001" >> .env
```

#### D. **Database Issues**
```bash
# Check if database directory exists
ls -la server/data/

# Create data directory if missing
mkdir -p server/data

# Check database file permissions
ls -la server/data/analytics.db
```

### 4. 🌐 **Client-Server Configuration Checks**

#### A. **Frontend API Configuration**
Check `src/services/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
```

#### B. **CORS Configuration**
Verify in `server/app.js`:
```javascript
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
        : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));
```

#### C. **Environment Variables**
Create `.env` in project root:
```
VITE_API_URL=http://localhost:3001/api
```

### 5. 🐛 **Advanced Debugging**

#### A. **Verbose Logging**
```bash
# Start server with debug logging
cd server
DEBUG=express:* node app.js

# OR with custom logging
NODE_ENV=development DEBUG=* node app.js
```

#### B. **Network Diagnostics**
```bash
# Test network connectivity
ping localhost
telnet localhost 3001

# Check firewall settings (if applicable)
# Windows: Check Windows Firewall
# Mac/Linux: Check iptables or ufw
```

#### C. **Process Monitoring**
```bash
# Monitor server startup
cd server
node app.js 2>&1 | tee server.log

# Check for error patterns
grep -i error server.log
grep -i "EADDRINUSE" server.log
```

### 6. 📋 **Step-by-Step Resolution**

#### Step 1: Clean Start
```bash
# Kill any existing processes
pkill -f "node.*app.js"

# Clean install
cd server
rm -rf node_modules package-lock.json
npm install
```

#### Step 2: Manual Server Start
```bash
cd server
node app.js
```

Expected output:
```
Connected to SQLite database
Database schema initialized
Admin user created/updated: michael@5central.capital
Server running on port 3001
Environment: development
API available at: http://localhost:3001/api
Health check at: http://localhost:3001/health
```

#### Step 3: Test Connection
```bash
# In another terminal
curl http://localhost:3001/health

# Should return:
# {"status":"OK","timestamp":"...","uptime":...}
```

#### Step 4: Test Frontend Connection
```bash
# Start frontend (in project root)
npm run dev

# Navigate to: http://localhost:5173/admin-login
# Try logging in with: michael@5central.capital / admin123
```

### 7. 🔍 **Specific Error Patterns**

#### "EADDRINUSE" Error:
```bash
# Port is already in use
lsof -ti:3001 | xargs kill -9
```

#### "ECONNREFUSED" Error:
```bash
# Server not running or wrong port
# Verify server is actually started on 3001
```

#### "MODULE_NOT_FOUND" Error:
```bash
cd server
npm install
```

#### Database Connection Error:
```bash
# Check database file exists and is writable
ls -la server/data/analytics.db
chmod 644 server/data/analytics.db
```

### 8. 🚨 **Emergency Recovery**

If all else fails:
```bash
# Complete reset
rm -rf server/node_modules
rm -rf server/data
rm server/package-lock.json

# Reinstall and restart
cd server
npm install
mkdir -p data
node app.js
```

### 9. 📊 **Monitoring & Prevention**

#### Health Check Script:
```bash
#!/bin/bash
# save as check-backend.sh
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is down - starting..."
    cd server && npm start &
fi
```

#### Automated Startup:
Add to your shell profile:
```bash
# Add to ~/.bashrc or ~/.zshrc
alias start-5central="cd /path/to/project && npm run dev:full"
```

### 10. 🎯 **Quick Reference Commands**

```bash
# Check if backend is running
curl http://localhost:3001/health

# Start backend only
cd server && npm start

# Start full stack
npm run dev:full

# Kill all node processes
pkill node

# Check port usage
lsof -i :3001

# View server logs
cd server && tail -f server.log
```

---

## 📞 **Still Having Issues?**

If the problem persists:
1. Check the browser's Network tab for detailed error messages
2. Verify no antivirus/firewall is blocking port 3001
3. Try a different port by changing PORT in server/.env
4. Restart your computer to clear any port conflicts
5. Check if you're behind a corporate firewall

Remember: The backend must be running BEFORE attempting to login!