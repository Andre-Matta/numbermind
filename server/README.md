# 🎯 NumberMind - Backend Server

A robust, scalable backend server for the NumberMind multiplayer game, built with Node.js, Express, MongoDB, and Socket.IO.

## 🚀 Features

### **Core Functionality**
- **User Authentication** - JWT-based login/signup system
- **Real-time Multiplayer** - WebSocket-based game communication
- **Matchmaking System** - Ranked and casual matchmaking
- **Game State Management** - Complete game lifecycle handling
- **Data Persistence** - MongoDB database with Mongoose ODM

### **Advanced Features**
- **Payment Processing** - Stripe integration for in-game purchases
- **Push Notifications** - Firebase Cloud Messaging
- **Ad System** - Configurable ad display after games
- **Leaderboards** - Global and regional rankings
- **Tournament System** - Competitive play structure
- **Friend System** - Social features and invitations

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO
- **Authentication**: JWT + bcrypt
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting
- **Email**: Nodemailer
- **Payments**: Stripe
- **Notifications**: Firebase Admin
- **File Storage**: Cloudinary
- **Testing**: Jest + Supertest

## 📋 Prerequisites

- Node.js 18+ installed
- MongoDB instance (local or cloud)
- Email service account (Gmail, SendGrid, etc.)
- Stripe account (for payments)
- Firebase project (for notifications)
- Cloudinary account (for file uploads)

## 🚀 Quick Start

### 1. **Clone and Install**
```bash
cd server
npm install
```

### 2. **Environment Configuration**
```bash
# Copy the example environment file
cp env.example .env

# Edit .env with your actual values
nano .env
```

### 3. **Database Setup**
```bash
# Start MongoDB (if local)
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env
```

### 4. **Start Development Server**
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## ⚙️ Environment Variables

### **Required Variables**
```env
# Server
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/numbermind

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-here

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## 🧪 Testing

### **Quick Setup for Testing**
```bash
# 1. Setup environment (creates .env file)
npm run setup-env

# 2. Create test user
npm run create-test-user

# 3. Test basic socket connection
npm run test-socket

# 4. Test full multiplayer functionality
npm run test-multiplayer
```

### **Automated Setup (Windows)**
```bash
# Run the batch file for automatic setup
scripts\setup-and-test.bat

# Or use PowerShell
scripts\setup-and-test.ps1
```

### **Available Test Scripts**
- `npm run test-socket` - Basic socket connection test
- `npm run test-multiplayer` - Full multiplayer game test
- `npm run test-auth` - Authentication system test
- `npm run test-users` - User management test
- `npm run test-leaderboard` - Leaderboard functionality test

### **Troubleshooting**
See `scripts/TROUBLESHOOTING.md` for detailed troubleshooting guide.

### **Optional Variables**
```env
# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Firebase (for notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 🗄️ Database Models

### **User Model**
- Authentication credentials
- Game statistics and progression
- Virtual currency (coins)
- Settings and preferences
- Social connections
- Ad system tracking

### **Game Model**
- Game state and configuration
- Player information
- Guess history and feedback
- Game statistics
- Chat and replay data

## 🔌 API Endpoints

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset
- `GET /api/auth/me` - Get current user profile

### **Users**
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/leaderboard` - Get leaderboard
- `POST /api/users/friend-request` - Send friend request
- `PUT /api/users/friend-request` - Accept/reject friend request

### **Games**
- `GET /api/games/active` - Get active games
- `GET /api/games/history` - Get game history
- `GET /api/games/:id` - Get specific game
- `POST /api/games/:id/chat` - Send chat message

### **Payments**
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/history` - Get payment history

### **Notifications**
- `POST /api/notifications/send` - Send notification
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/read` - Mark as read

## 🔌 WebSocket Events

### **Client to Server**
- `createPrivateRoom` - Create private game room
- `joinPrivateRoom` - Join private game room
- `joinRankedQueue` - Join ranked matchmaking
- `joinCasualQueue` - Join casual matchmaking
- `leaveQueue` - Leave matchmaking queue
- `startGame` - Start the game
- `submitGuess` - Submit a guess
- `sendChatMessage` - Send chat message

### **Server to Client**
- `matchFound` - Match found notification
- `playerJoined` - Player joined room
- `playerLeft` - Player left room
- `gameStarted` - Game started notification
- `guessSubmitted` - Guess submitted notification
- `gameEnded` - Game ended notification
- `playerDisconnected` - Player disconnected

## 🧪 Testing

### **Run Tests**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### **Test Structure**
- Unit tests for models and utilities
- Integration tests for API endpoints
- WebSocket event testing
- Database operation testing

## 🚀 Deployment

### **Render (Recommended)**
1. Connect your GitHub repository
2. Set build command: `cd server && npm install`
3. Set start command: `cd server && npm start`
4. Configure environment variables
5. Deploy!

### **Heroku**
```bash
# Create Heroku app
heroku create your-app-name

# Add MongoDB addon
heroku addons:create mongolab

# Set environment variables
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### **Docker**
```bash
# Build image
docker build -t numbermind-server .

# Run container
docker run -p 5000:5000 numbermind-server
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **Rate Limiting** - Prevent abuse and DDoS
- **CORS Protection** - Cross-origin request control
- **Input Validation** - Sanitize all user inputs
- **Helmet Security** - Security headers
- **Request Size Limits** - Prevent large payload attacks

## 📊 Monitoring & Logging

- **Morgan** - HTTP request logging
- **Error Handling** - Centralized error management
- **Health Checks** - Server status monitoring
- **Performance Metrics** - Response time tracking
- **Database Monitoring** - Connection status

## 🔧 Development

### **Code Structure**
```
server/
├── config/          # Configuration files
├── models/          # Database models
├── routes/          # API route handlers
├── socket/          # WebSocket management
├── utils/           # Utility functions
├── middleware/      # Custom middleware
├── tests/           # Test files
├── server.js        # Main server file
└── package.json     # Dependencies
```

### **Scripts**
```bash
npm run dev          # Start development server
npm start            # Start production server
npm test             # Run tests
npm run lint         # Lint code
npm run format       # Format code
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check this README and code comments
- **Issues**: Create an issue on GitHub
- **Discord**: Join our community server
- **Email**: support@numbermindnumbers.com

## 🎯 Roadmap

### **Phase 1** ✅
- [x] Basic authentication system
- [x] WebSocket multiplayer
- [x] Game state management
- [x] Database models

### **Phase 2** 🚧
- [ ] Payment processing
- [ ] Push notifications
- [ ] Ad system integration
- [ ] Tournament system

### **Phase 3** 📋
- [ ] Advanced analytics
- [ ] AI opponents
- [ ] Mobile app optimization
- [ ] Social features

---

**Happy Coding! 🎮✨** 