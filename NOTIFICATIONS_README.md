# 🔔 NumberMind Notifications System

A comprehensive notification system for the NumberMind game, supporting both local and push notifications.

## 🚀 Features

### **Notification Types**
- **Game Invites** - When someone invites you to play
- **Match Found** - When ranked/casual matchmaking succeeds
- **Friend Requests** - When someone wants to be your friend
- **Your Turn** - When it's your turn in multiplayer games
- **Game Results** - Victory/defeat notifications with scores
- **Achievements** - When you unlock new achievements
- **Connection Status** - Network connectivity updates
- **System Notifications** - App updates and maintenance alerts

### **Platform Support**
- ✅ **iOS** - Full push notification support
- ✅ **Android** - Full push notification support
- ✅ **Web** - Local notifications only
- ✅ **Cross-platform** - Unified API across all platforms

## 🛠️ Implementation

### **Client-Side (React Native)**

#### **1. Notification Service (`client/src/services/NotificationService.js`)**
- Handles permission requests
- Manages push tokens
- Sends local notifications
- Processes incoming notifications
- Provides game-specific notification methods

#### **2. Notification Center (`client/src/components/NotificationCenter.js`)**
- Beautiful UI for viewing notifications
- Pull-to-refresh functionality
- Mark as read/unread
- Delete notifications
- Infinite scroll pagination

#### **3. Notification Badge (`client/src/components/NotificationBadge.js`)**
- Shows unread notification count
- Auto-updates every 30 seconds
- Displays on main menu

### **Server-Side (Node.js)**

#### **1. Notification Model (`server/models/Notification.js`)**
- MongoDB schema for notifications
- Support for different notification types
- Read/unread status tracking
- Push token management
- Retry logic for failed notifications

#### **2. Notification Routes (`server/routes/notifications.js`)**
- `POST /api/notifications/register` - Register push token
- `POST /api/notifications/send` - Send notification
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `GET /api/notifications/unread-count` - Get unread count

#### **3. User Model Updates (`server/models/User.js`)**
- Added `pushTokens` array for multiple devices
- Platform-specific token storage
- Token activity tracking

## 📱 Usage Examples

### **Sending Game Invite Notification**
```javascript
// Client-side
await NotificationService.notifyGameInvite('PlayerName', 'room123');

// Server-side
await Notification.createGameInvite(userId, 'PlayerName', 'room123', pushToken);
```

### **Sending Match Found Notification**
```javascript
// Client-side
await NotificationService.notifyMatchFound('OpponentName', 'game456');

// Server-side
await Notification.createMatchFound(userId, 'OpponentName', 'game456', pushToken);
```

### **Sending Achievement Notification**
```javascript
// Client-side
await NotificationService.notifyAchievement('First Win', 'Win your first game!');

// Server-side
await Notification.createAchievement(userId, 'First Win', 'Win your first game!', pushToken);
```

## 🔧 Setup Instructions

### **1. Install Dependencies**
```bash
# Client
cd client
npm install expo-notifications expo-device

# Server (already included)
# firebase-admin is already in package.json
```

### **2. Configure Expo Project**
- Update `client/app.json` with notification permissions
- Add notification plugin configuration
- Set up Expo project ID in config

### **3. Environment Variables**
```bash
# Server .env
EXPO_PROJECT_ID=your-expo-project-id
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
```

### **4. Initialize Notifications**
```javascript
// In your main App.js
import NotificationService from './src/services/NotificationService';

useEffect(() => {
  if (isAuthenticated && user) {
    NotificationService.initialize();
  }
}, [isAuthenticated, user]);
```

## 🎯 Integration Points

### **Multiplayer Lobby**
- Send notifications when players join/leave
- Notify when match is found
- Alert for connection status changes

### **Game Screens**
- Notify when it's player's turn
- Send game result notifications
- Alert for opponent disconnections

### **Friend System**
- Send friend request notifications
- Notify when friends come online
- Alert for friend activity

### **Achievement System**
- Send achievement unlock notifications
- Notify for milestone completions
- Alert for rank promotions

## 🔒 Security & Privacy

### **Permission Handling**
- Explicit permission requests
- Graceful fallback for denied permissions
- User preference settings

### **Data Protection**
- Encrypted push tokens
- Secure API endpoints
- User consent management

### **Rate Limiting**
- Prevent notification spam
- Respect user preferences
- Configurable frequency limits

## 📊 Analytics & Monitoring

### **Delivery Tracking**
- Success/failure rates
- Platform-specific metrics
- User engagement tracking

### **Performance Monitoring**
- Notification delivery times
- API response times
- Error rate tracking

## 🚀 Future Enhancements

### **Planned Features**
- **Rich Notifications** - Images and actions
- **Scheduled Notifications** - Reminders and events
- **Notification Groups** - Categorize by type
- **Custom Sounds** - Game-specific audio
- **Deep Linking** - Navigate to specific screens
- **A/B Testing** - Optimize notification content

### **Advanced Features**
- **Smart Notifications** - AI-powered timing
- **Personalization** - User preference learning
- **Cross-platform Sync** - Unified notification state
- **Offline Support** - Queue notifications when offline

## 🐛 Troubleshooting

### **Common Issues**

#### **Push Notifications Not Working**
1. Check Expo project configuration
2. Verify push token registration
3. Test with Expo push tool
4. Check device permissions

#### **Notifications Not Showing**
1. Verify notification permissions
2. Check notification settings
3. Test local notifications first
4. Review server logs

#### **High Battery Usage**
1. Optimize polling frequency
2. Use efficient notification batching
3. Implement smart refresh logic
4. Monitor background processes

## 📚 API Reference

### **NotificationService Methods**
```javascript
// Initialize notifications
await NotificationService.initialize()

// Send local notification
await NotificationService.sendLocalNotification(title, body, data)

// Game-specific notifications
await NotificationService.notifyMatchFound(opponentName, gameId)
await NotificationService.notifyGameInvite(inviterName, roomId)
await NotificationService.notifyYourTurn(gameId)
await NotificationService.notifyGameResult(won, opponentName, score)
await NotificationService.notifyAchievement(name, description)

// Token management
const token = await NotificationService.getPushToken()
await NotificationService.registerPushToken(userId, token)

// Cleanup
NotificationService.cleanup()
```

### **Server API Endpoints**
```javascript
// Register push token
POST /api/notifications/register
{
  "pushToken": "ExponentPushToken[...]",
  "platform": "ios|android|web",
  "deviceId": "optional-device-id"
}

// Send notification
POST /api/notifications/send
{
  "userId": "user-id",
  "title": "Notification Title",
  "body": "Notification body text",
  "type": "game_invite|match_found|friend_request|...",
  "data": { "custom": "data" }
}

// Get notifications
GET /api/notifications?page=1&limit=20&type=game_invite&unreadOnly=false

// Mark as read
PUT /api/notifications/read
{
  "notificationIds": ["id1", "id2", "id3"]
}
```

## 🤝 Contributing

When adding new notification types:

1. **Update Notification Model** - Add new type to enum
2. **Create Static Method** - Add helper method in model
3. **Update Client Service** - Add notification method
4. **Update UI Components** - Add icon and color mapping
5. **Test Thoroughly** - Verify on all platforms
6. **Update Documentation** - Add to this README

## 📄 License

This notification system is part of the NumberMind game project and follows the same license terms.

