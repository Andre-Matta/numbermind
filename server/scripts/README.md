# Database Population Scripts

This directory contains scripts to populate the database with sample data for testing and development.

## Scripts Overview

### 1. `populateUsers.js`
Populates the database with sample users including:
- Various skill levels and ratings
- Different win rates and game statistics
- Sample coins for testing shop functionality
- Calculated win rates for leaderboard testing

**Usage:**
```bash
npm run populate-users
```

### 2. `populateShop.js`
Populates the shop with various items organized by categories:

#### Theme Category (Cosmetic Skins)
- **Gold Theme**: Elegant gold-styled input boxes (100 coins, 33% off)
- **Neon Theme**: Bright neon-styled input boxes (200 coins, 20% off)
- **Crystal Theme**: Transparent crystal-styled input boxes (300 coins, 25% off)
- **Platinum Theme**: Premium platinum-styled input boxes (500 coins, 17% off)
- **Rainbow Theme**: Colorful rainbow-styled input boxes (150 coins, 25% off)

#### Powerup Category (Gameplay Items)
- **Hint Token**: Get a hint about opponent's number (50 coins, 33% off)
- **Extra Guess**: Add one more guess to your limit (75 coins, 25% off)
- **Time Freeze**: Freeze the timer for 30 seconds (60 coins, 25% off)

#### Booster Category (Progression Items)
- **Double XP**: Earn double experience points for 24 hours (120 coins, 20% off)
- **Coin Multiplier**: Earn 1.5x coins for 12 hours (80 coins, 20% off)
- **Win Streak Bonus**: Maintain win streak even after a loss (200 coins, 20% off)

**Usage:**
```bash
npm run populate-shop
```

### 3. `testUsers.js`
Tests the user population by:
- Displaying all created users
- Testing various database queries
- Verifying calculated win rates

**Usage:**
```bash
npm run test-users
```

### 4. `testLeaderboard.js`
Tests leaderboard functionality by:
- Testing different sorting categories (rating, level, wins, win rate)
- Verifying aggregation pipeline for win rate calculations
- Displaying sorted results

**Usage:**
```bash
npm run test-leaderboard
```

### 5. `run-all.bat` (Windows)
Runs all scripts sequentially:
1. Populate users
2. Populate shop
3. Test users
4. Test leaderboard

**Usage:**
```bash
run-all.bat
```

## Prerequisites

1. **MongoDB Connection**: Ensure your MongoDB connection string is properly configured in `server/config/database.js`
2. **Environment Variables**: Make sure your `.env` file contains the necessary database credentials
3. **Dependencies**: Install server dependencies with `npm install`

## Environment Variables

Create a `.env` file in the `server/` directory with:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

## Running Scripts

### Individual Scripts
```bash
cd server
npm run populate-users
npm run populate-shop
npm run test-users
npm run test-leaderboard
```

### All Scripts at Once
```bash
cd server/scripts
run-all.bat
```

## Expected Output

After running the scripts, you should see:
- **Users**: 10+ sample users with various statistics
- **Shop Items**: 12+ items across 3 categories
- **Leaderboard**: Working sorting by different criteria
- **Skin System**: Theme items that can be purchased and applied to input boxes

## Troubleshooting

### Common Issues

1. **Connection Failed**: Check your MongoDB connection string and network access
2. **Authentication Error**: Verify your JWT secrets are properly set
3. **Missing Dependencies**: Run `npm install` in the server directory
4. **Permission Denied**: Ensure you have write access to the database

### Debug Mode

Add console.log statements to scripts for debugging:
```javascript
console.log('Database connection:', mongoose.connection.readyState);
console.log('Environment variables:', process.env.MONGODB_URI);
```

## Integration with Frontend

The populated data enables:
- **Shop Component**: Displays items by category with 3 items per row
- **Skin System**: Users can purchase and apply themes to input boxes
- **Leaderboard**: Shows real user data with proper sorting
- **User Profiles**: Displays actual statistics and available skins

## Next Steps

After running these scripts:
1. Test the shop functionality in the frontend
2. Verify skin selection works in local and multiplayer games
3. Check leaderboard sorting by different categories
4. Test user authentication and profile updates
