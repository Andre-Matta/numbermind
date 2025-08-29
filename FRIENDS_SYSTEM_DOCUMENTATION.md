# Friends System Documentation

## Overview

The Friends System is a comprehensive, modular solution that allows players to connect, manage friendships, and interact with each other in real-time. It includes both backend API functionality and frontend React Native components, with Socket.IO integration for real-time updates.

## Features

✅ **Send friend requests** by username or ID  
✅ **View pending friend requests** with accept/decline options  
✅ **Friends list** with online/offline status  
✅ **Real-time notifications** for friend activities  
✅ **User search** to find new friends  
✅ **Modular design** for easy integration  
✅ **Socket.IO support** for real-time updates  
✅ **REST API** for all friend operations  
✅ **Responsive UI** components  
✅ **Database storage** with MongoDB  

---

## Backend Implementation

### 1. Database Schema

The friend system extends the existing User model with the following fields:

```javascript
// User model fields (server/models/User.js)
{
  friends: [ObjectId], // Array of friend user IDs
  friendRequests: [{
    from: ObjectId,      // User who sent the request
    status: String,      // 'pending', 'accepted', 'rejected'
    createdAt: Date,     // When request was sent
    respondedAt: Date    // When request was responded to
  }],
  blockedUsers: [{      // Optional: for blocking functionality
    user: ObjectId,
    reason: String,
    blockedAt: Date
  }]
}
```

### 2. API Endpoints

#### **Send Friend Request**
```
POST /api/friends/request
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "username": "target_username"  // OR
  "userId": "target_user_id"
}

Response:
{
  "success": true,
  "message": "Friend request sent successfully",
  "data": {
    "targetUser": {
      "id": "user_id",
      "username": "username"
    }
  }
}
```

#### **Get Friend Requests**
```
GET /api/friends/requests
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "request_id",
        "from": {
          "id": "user_id",
          "username": "sender_username",
          "avatar": "avatar_url",
          "level": 5
        },
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "count": 1
  }
}
```

#### **Respond to Friend Request**
```
PUT /api/friends/request/:requestId
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "action": "accept"  // or "decline"
}

Response:
{
  "success": true,
  "message": "Friend request accepted",
  "data": {
    "newFriend": {
      "id": "friend_id",
      "username": "friend_username",
      "avatar": "avatar_url",
      "level": 10,
      "isOnline": true,
      "lastActive": "2024-01-15T10:30:00Z"
    }
  }
}
```

#### **Get Friends List**
```
GET /api/friends?page=1&limit=20&search=username
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "friends": [
      {
        "id": "friend_id",
        "username": "friend_username",
        "avatar": "avatar_url",
        "level": 15,
        "rating": 1200,
        "isOnline": true,
        "lastActive": "2024-01-15T10:30:00Z"
      }
    ],
    "totalCount": 50,
    "page": 1,
    "totalPages": 3,
    "hasMore": true
  }
}
```

#### **Remove Friend**
```
DELETE /api/friends/:friendId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Friend removed successfully"
}
```

#### **Search Users**
```
GET /api/friends/search?q=search_term&page=1&limit=10
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_id",
        "username": "username",
        "avatar": "avatar_url",
        "level": 8,
        "relationshipStatus": "none" // "friends", "pending_incoming", "pending_outgoing"
      }
    ],
    "totalCount": 25,
    "page": 1,
    "totalPages": 3,
    "hasMore": true
  }
}
```

### 3. Socket.IO Events

#### **Server → Client Events**

```javascript
// Friend request received
socket.on('friendRequest', (data) => {
  // data: { type, from: { id, username, avatar }, message }
});

// Friend request accepted
socket.on('friendRequestAccepted', (data) => {
  // data: { type, from: { id, username, avatar }, message }
});

// Friend status update (online/offline)
socket.on('friendStatusUpdate', (data) => {
  // data: { friendId, username, isOnline, lastActive }
});

// Friend removed
socket.on('friendRemoved', (data) => {
  // data: { type, from: { id, username }, message }
});
```

#### **Client → Server Events**

```javascript
// Send friend request
socket.emit('sendFriendRequest', { username: 'target_user' }, (response) => {
  // response: { success, message, data }
});

// Respond to friend request
socket.emit('respondToFriendRequest', { requestId, action: 'accept' }, (response) => {
  // response: { success, message, data }
});

// Remove friend
socket.emit('removeFriend', { friendId }, (response) => {
  // response: { success, message }
});

// Get friend status
socket.emit('getFriendStatus', { friendId }, (response) => {
  // response: { success, data: { friendId, isOnline, lastActive } }
});
```

---

## Frontend Implementation

### 1. FriendsService

The `FriendsService` handles all friend-related API calls and real-time updates:

```javascript
import FriendsService from '../services/FriendsService';

// Initialize the service
await FriendsService.initialize();

// Send friend request
const result = await FriendsService.sendFriendRequest('username');
if (result.success) {
  console.log('Friend request sent!');
}

// Get friends list
const friends = await FriendsService.getFriends({ page: 1, limit: 20 });

// Set up real-time listeners
const unsubscribe = FriendsService.onFriendRequest((data) => {
  console.log('New friend request:', data.from.username);
});

// Cleanup
unsubscribe();
FriendsService.cleanup();
```

### 2. React Native Components

#### **FriendsList Component**

```javascript
import { FriendsList } from '../components';

function MyScreen() {
  const handleFriendPress = (friend) => {
    navigation.navigate('Profile', { userId: friend.id });
  };

  const handleInviteToGame = (friend) => {
    navigation.navigate('GameLobby', { inviteUser: friend });
  };

  return (
    <FriendsList
      onFriendPress={handleFriendPress}
      onInviteToGame={handleInviteToGame}
      showGameInvite={true}
      refreshTrigger={refreshCounter}
    />
  );
}
```

#### **FriendRequests Component**

```javascript
import { FriendRequests } from '../components';

function RequestsScreen() {
  return (
    <FriendRequests
      refreshTrigger={refreshCounter}
    />
  );
}
```

#### **UserSearch Component**

```javascript
import { UserSearch } from '../components';

function SearchScreen() {
  const handleUserPress = (user) => {
    navigation.navigate('Profile', { userId: user.id });
  };

  return (
    <UserSearch
      onUserPress={handleUserPress}
    />
  );
}
```

#### **Complete Friends Screen**

```javascript
import FriendsScreen from '../screens/FriendsScreen';

// Add to your navigation stack
<Stack.Screen 
  name="Friends" 
  component={FriendsScreen}
  options={{ title: 'Friends' }}
/>
```

---

## Integration Guide

### Step 1: Backend Setup

1. **Install dependencies** (already in your package.json):
   ```bash
   npm install mongoose socket.io jsonwebtoken
   ```

2. **Add routes to server.js**:
   ```javascript
   const friendRoutes = require('./routes/friends');
   app.use('/api/friends', friendRoutes);
   ```

3. **Database is ready** - The User model already includes friend fields

### Step 2: Frontend Setup

1. **Install dependencies** (if needed):
   ```bash
   npm install react-native-tab-view
   ```

2. **Initialize FriendsService** in your app:
   ```javascript
   // In your main app component or AuthContext
   import FriendsService from './src/services/FriendsService';

   useEffect(() => {
     if (user && isAuthenticated) {
       FriendsService.initialize();
     }
     
     return () => {
       FriendsService.cleanup();
     };
   }, [user, isAuthenticated]);
   ```

3. **Add to navigation**:
   ```javascript
   import FriendsScreen from './src/screens/FriendsScreen';

   <Stack.Screen name="Friends" component={FriendsScreen} />
   ```

### Step 3: Adding Friend Button to Your Game

```javascript
// In your main menu or profile screen
import { TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function MainMenu() {
  return (
    <TouchableOpacity 
      style={styles.friendsButton}
      onPress={() => navigation.navigate('Friends')}
    >
      <Ionicons name="people" size={24} color="#4CAF50" />
      <Text style={styles.friendsText}>Friends</Text>
    </TouchableOpacity>
  );
}
```

---

## Usage Examples

### Example 1: Simple Friend Integration

```javascript
// Add friend button to any user profile
import FriendsService from '../services/FriendsService';

function UserProfile({ userId, username }) {
  const [relationshipStatus, setRelationshipStatus] = useState('none');

  const sendFriendRequest = async () => {
    const result = await FriendsService.sendFriendRequest(username);
    if (result.success) {
      setRelationshipStatus('pending_outgoing');
      Alert.alert('Success', 'Friend request sent!');
    }
  };

  return (
    <View>
      {relationshipStatus === 'none' && (
        <TouchableOpacity onPress={sendFriendRequest}>
          <Text>Add Friend</Text>
        </TouchableOpacity>
      )}
      {relationshipStatus === 'friends' && (
        <Text style={styles.friendsBadge}>Friends ✓</Text>
      )}
    </View>
  );
}
```

### Example 2: Game Invitation System

```javascript
// Invite friends to multiplayer games
import FriendsService from '../services/FriendsService';

function GameLobby() {
  const [onlineFriends, setOnlineFriends] = useState([]);

  useEffect(() => {
    const loadOnlineFriends = async () => {
      const result = await FriendsService.getFriends();
      if (result.success) {
        const online = result.data.friends.filter(f => f.isOnline);
        setOnlineFriends(online);
      }
    };

    loadOnlineFriends();
  }, []);

  const inviteFriend = (friend) => {
    // Send game invitation via your existing multiplayer system
    NetworkService.inviteToGame(friend.id);
  };

  return (
    <View>
      <Text>Invite Friends:</Text>
      {onlineFriends.map(friend => (
        <TouchableOpacity 
          key={friend.id} 
          onPress={() => inviteFriend(friend)}
        >
          <Text>{friend.username} (Online)</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

### Example 3: Real-time Notifications

```javascript
// Show friend notifications in your app
import FriendsService from '../services/FriendsService';

function App() {
  useEffect(() => {
    const unsubscribeRequest = FriendsService.onFriendRequest((data) => {
      // Show in-app notification
      showNotification({
        title: 'New Friend Request',
        message: `${data.from.username} wants to be your friend!`,
        action: () => navigation.navigate('Friends', { tab: 'requests' })
      });
    });

    const unsubscribeAccepted = FriendsService.onFriendAccepted((data) => {
      showNotification({
        title: 'Friend Request Accepted',
        message: `${data.from.username} accepted your friend request!`
      });
    });

    return () => {
      unsubscribeRequest();
      unsubscribeAccepted();
    };
  }, []);

  return <YourAppComponents />;
}
```

---

## API Response Examples

### Successful Friend Request
```json
{
  "success": true,
  "message": "Friend request sent successfully",
  "data": {
    "targetUser": {
      "id": "507f1f77bcf86cd799439011",
      "username": "player123"
    }
  }
}
```

### Friends List Response
```json
{
  "success": true,
  "data": {
    "friends": [
      {
        "id": "507f1f77bcf86cd799439011",
        "username": "player123",
        "avatar": "https://example.com/avatar.jpg",
        "level": 15,
        "rating": 1200,
        "isOnline": true,
        "lastActive": "2024-01-15T10:30:00.000Z"
      }
    ],
    "totalCount": 1,
    "page": 1,
    "totalPages": 1,
    "hasMore": false
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "User not found"
}
```

---

## Customization Options

### 1. Styling Components

All components use StyleSheet and can be customized:

```javascript
// Custom styles for FriendsList
const customStyles = StyleSheet.create({
  friendItem: {
    backgroundColor: '#f0f0f0', // Custom background
    borderRadius: 8,           // Rounded corners
    marginVertical: 4,         // Spacing
  }
});

// Apply via ResponsiveWrapper or theme system
```

### 2. Adding Custom Fields

Extend the User model to include more friend-related data:

```javascript
// In User model
friendMetadata: {
  favoriteGames: [String],
  playTimes: [String],
  notes: String
}
```

### 3. Custom Notifications

Integrate with your existing notification system:

```javascript
// Replace default alerts with custom notifications
FriendsService.onFriendRequest((data) => {
  YourNotificationSystem.show({
    type: 'friend_request',
    data: data,
    customAction: () => handleFriendRequest(data)
  });
});
```

---

## Troubleshooting

### Common Issues

1. **Socket connection not working**
   ```javascript
   // Ensure NetworkService is connected before initializing FriendsService
   await NetworkService.connect();
   await FriendsService.initialize();
   ```

2. **Real-time updates not received**
   ```javascript
   // Check if user is properly authenticated
   const token = AuthService.getToken();
   if (!token) {
     // Handle authentication error
   }
   ```

3. **Components not updating**
   ```javascript
   // Use refreshTrigger prop to force updates
   const [refreshTrigger, setRefreshTrigger] = useState(0);
   
   const refreshData = () => {
     setRefreshTrigger(prev => prev + 1);
   };
   ```

### Testing

```javascript
// Test the friend system
const testFriendSystem = async () => {
  try {
    // Test sending friend request
    const result = await FriendsService.sendFriendRequest('testuser');
    console.log('Send request result:', result);
    
    // Test getting friends
    const friends = await FriendsService.getFriends();
    console.log('Friends:', friends);
    
    // Test search
    const search = await FriendsService.searchUsers('test');
    console.log('Search results:', search);
    
  } catch (error) {
    console.error('Friend system test failed:', error);
  }
};
```

---

## Security Considerations

1. **Authentication**: All API endpoints require valid JWT tokens
2. **Rate Limiting**: Prevents spam friend requests
3. **Privacy Settings**: Users can disable friend requests
4. **Validation**: Input validation on usernames and IDs
5. **Sanitization**: Prevents injection attacks

---

## Performance Tips

1. **Caching**: FriendsService caches data to reduce API calls
2. **Pagination**: Large friend lists are paginated
3. **Debouncing**: Search input is debounced for better performance
4. **Lazy Loading**: Components load data on demand
5. **Memory Management**: Proper cleanup of listeners and timers

---

This friends system is now ready to integrate into your NumberMind game! The modular design makes it easy to customize and extend based on your specific needs.
