# MongoDB Setup Guide for NumberMind

## Quick Start Options

### Option 1: Local MongoDB (Development)
1. **Install MongoDB Community Server**
   - Download from: https://www.mongodb.com/try/download/community
   - Run installer and follow setup wizard
   - Install MongoDB Compass (GUI) if desired

2. **Start MongoDB Service**
   ```powershell
   net start MongoDB
   ```

3. **Test Connection**
   ```bash
   cd server
   npm install
   node test-mongodb.js
   ```

### Option 2: MongoDB Atlas (Production/Cloud)
1. **Create Atlas Account**
   - Go to: https://www.mongodb.com/atlas
   - Sign up for free account
   - Create new cluster (free tier available)

2. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy connection string
   - Update `server/env.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/numbermind
   ```

3. **Test Connection**
   ```bash
   cd server
   npm install
   node test-mongodb.js
   ```

### Option 3: Docker (Quick Setup)
```bash
# Pull and run MongoDB
docker run -d --name mongodb -p 27017:27017 mongo:latest

# Check status
docker ps

# Test connection
cd server
npm install
node test-mongodb.js
```

## Environment Configuration

Your `server/env.env` file should contain:
```env
MONGODB_URI=mongodb://localhost:27017/numbermind
```

For Atlas (cloud):
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/numbermind
```

## Troubleshooting

### Common Issues:

1. **Connection Refused (ECONNREFUSED)**
   - MongoDB service not running
   - Wrong port number
   - Firewall blocking connection

2. **Authentication Failed**
   - Wrong username/password
   - User doesn't have access to database
   - Network access not configured (Atlas)

3. **ENOTFOUND**
   - Wrong hostname in URI
   - DNS resolution issues
   - Network connectivity problems

### Solutions:

1. **Check MongoDB Status**
   ```powershell
   # Windows
   net start MongoDB
   
   # Check if running
   netstat -an | findstr 27017
   ```

2. **Verify URI Format**
   - Local: `mongodb://localhost:27017/database-name`
   - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/database-name`

3. **Test Network**
   ```bash
   # Test if port is reachable
   telnet localhost 27017
   
   # Or use PowerShell
   Test-NetConnection -ComputerName localhost -Port 27017
   ```

## Database Structure

Once connected, MongoDB will automatically create:
- `numbermind` database
- Collections for users, games, etc.

## Next Steps

After successful MongoDB connection:
1. Start your server: `npm start`
2. Test API endpoints
3. Integrate with your mobile app
4. Deploy to cloud service (Render, Heroku, etc.)

## Useful Commands

```bash
# Install dependencies
npm install

# Test MongoDB connection
node test-mongodb.js

# Start server
npm start

# Run in development mode
npm run dev
```

## MongoDB Compass (GUI)

If you want a visual interface:
1. Download MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. Browse databases and collections visually
4. Execute queries and view data
