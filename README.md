# NumberMind 🎯

A modern mobile game based on the classic Mastermind/Codebreaker game, built with React Native and Expo.

## 🎮 Game Overview

**NumberMind** is a two-player logic puzzle game where players take turns guessing each other's secret 5-digit numbers. After each guess, players receive feedback to help them make better guesses on their next turn.

### Game Rules

1. **Setup**: Each player secretly chooses a 5-digit number (0-9, digits can repeat)
2. **Gameplay**: Players take turns guessing the opponent's number
3. **Feedback**: After each guess, the opponent provides feedback
4. **Winning**: First player to correctly guess the opponent's number wins!

### Game Modes

- **Standard Mode**: Shows exact matches (correct digit in correct position) and misplaced matches (correct digit in wrong position)
- **Hard Mode**: Only shows the total number of correct digits (no placement information)

## 🚀 Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for Mac) or Android Emulator

### Multiplayer Setup

#### Option 1: Local Server (Laptop Required)
1. **Navigate to the server directory**
   ```bash
   cd server
   npm install
   npm start
   ```

2. **The server will run on port 3000 by default**
   - Local play: Use your computer's IP address
   - Internet play: Deploy to a cloud service

#### Option 2: Cloud Deployment (No Laptop Needed!)
Deploy your server to free cloud services for 24/7 internet play:

1. **Quick Deploy to Render** (Recommended)
   - Fork this repository
   - Connect to [render.com](https://render.com)
   - Deploy automatically

2. **Other Free Options**
   - Railway: $5 monthly credit
   - Fly.io: 3 free VMs
   - See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions

3. **Get your server URL** and share with friends!

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd numbermind
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   expo start
   ```

4. **Run on your device/simulator**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on your phone

## 📱 Features

- **Beautiful UI**: Modern, dark theme with gradient backgrounds
- **Two Game Modes**: Standard and Hard difficulty levels
- **Multiplayer Support**: LAN and internet multiplayer gameplay
- **Real-time Communication**: WebSocket-based instant updates
- **Room System**: Create and join game rooms with unique IDs
- **Auto-fill**: Generate random numbers for quick setup
- **Guess History**: Track all guesses and feedback
- **Haptic Feedback**: Tactile responses for better user experience
- **Responsive Design**: Works on all screen sizes
- **Game Rules**: Built-in help system

## 🎯 How to Play

### Game Modes

#### Local Game
- Play with someone sitting next to you on the same device
- Perfect for quick games or when offline

#### Multiplayer Game
- Play over LAN or internet with friends
- Real-time updates and room-based matchmaking

### Setup Phase
1. Choose your game mode (Standard or Hard)
2. Enter your secret 5-digit number or use auto-fill
3. Both players must enter numbers before starting

### Gameplay
1. Take turns guessing your opponent's number
2. Enter a 5-digit guess
3. Receive feedback from your opponent
4. Use the feedback to make better guesses
5. First to guess correctly wins!

### Feedback System
- **Green indicator**: Exact match (correct digit in correct position)
- **Yellow indicator**: Misplaced match (correct digit in wrong position)
- **Hard mode**: Only shows total correct digits

### Multiplayer Features
- **Room Creation**: Host creates a room and gets a unique room ID
- **Room Joining**: Players join using the room ID shared by the host
- **Real-time Updates**: Instant game state updates across all players
- **Automatic Turn Management**: Server handles player turns and game flow

## 🛠️ Technical Details

- **Framework**: React Native with Expo
- **Language**: JavaScript/JSX
- **Styling**: React Native StyleSheet
- **Icons**: Expo Vector Icons
- **Haptics**: Expo Haptics for tactile feedback
- **Gradients**: Expo Linear Gradient for beautiful backgrounds
- **Multiplayer**: WebSocket-based real-time communication
- **Server**: Node.js with Express and Socket.IO
- **Networking**: Cross-platform network connectivity

## 📁 Project Structure

```
numbermind/
├── App.js                 # Main app entry point
├── src/screens/
│   ├── MainMenu.js        # Main menu with game mode selection
│   ├── GameScreen.js      # Local game screen
│   └── MultiplayerLobby.js # Multiplayer lobby and connection
├── src/components/
│   ├── NumberInput.js     # Custom number input
│   ├── GuessHistory.js    # Move history
│   ├── FeedbackDisplay.js # Visual feedback
│   └── GameRules.js       # Help system
├── src/services/
│   └── NetworkService.js  # Multiplayer networking service
├── server/                # Multiplayer server
│   ├── server.js          # WebSocket server
│   ├── package.json       # Server dependencies
│   └── README.md          # Server documentation
├── package.json           # Mobile app dependencies
├── app.json              # Expo config
└── README.md             # Complete documentation
```

## 🎨 Customization

The game is highly customizable:

- **Colors**: Modify the color scheme in the StyleSheet files
- **Game Length**: Change the number of digits (currently 5)
- **Feedback**: Add new feedback types or modify existing ones
- **UI**: Customize the visual design and layout

## 📱 Platform Support

- ✅ iOS (iPhone & iPad)
- ✅ Android
- ✅ Web (with some limitations)

## 🤝 Contributing

Feel free to contribute to this project by:

1. Reporting bugs
2. Suggesting new features
3. Improving the UI/UX
4. Adding new game modes
5. Optimizing performance

## 📄 License

This project is open source and available under the MIT License.

## 🎯 Future Enhancements

- [ ] Single-player mode against AI
- [ ] Statistics and leaderboards
- [ ] Customizable game settings
- [ ] Sound effects and music
- [ ] Multiplayer over network
- [ ] Different difficulty levels
- [ ] Achievement system

---

**Enjoy playing NumberMind! 🎉**

*Built with ❤️ using React Native and Expo* 