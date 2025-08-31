// Test script for notifications
// Run this in your browser console or Node.js environment

const testNotifications = async () => {
  console.log('🧪 Testing NumberMind Notifications...');
  
  // Test data
  const testCases = [
    {
      name: 'Game Invite',
      title: 'Game Invite 🎮',
      body: 'TestPlayer invited you to play NumberMind!',
      data: { type: 'game_invite', roomId: 'TEST123', inviterName: 'TestPlayer' }
    },
    {
      name: 'Match Found',
      title: 'Match Found! 🎯',
      body: 'You\'ve been matched with TestOpponent. Tap to join the game!',
      data: { type: 'match_found', gameId: 'GAME456', opponentName: 'TestOpponent' }
    },
    {
      name: 'Your Turn',
      title: 'Your Turn! 🎲',
      body: 'It\'s your turn to make a guess!',
      data: { type: 'your_turn', gameId: 'GAME789' }
    },
    {
      name: 'Game Result (Victory)',
      title: 'Victory! 🏆',
      body: 'Congratulations! You beat TestOpponent with 150 points!',
      data: { type: 'game_result', won: true, opponentName: 'TestOpponent', score: 150 }
    },
    {
      name: 'Achievement',
      title: 'Achievement Unlocked! 🏅',
      body: 'Test Achievement: You unlocked a test achievement!',
      data: { type: 'achievement', achievementName: 'Test Achievement', description: 'You unlocked a test achievement!' }
    }
  ];

  console.log('📋 Test cases prepared:', testCases.length);
  
  // Simulate notification sending
  testCases.forEach((testCase, index) => {
    setTimeout(() => {
      console.log(`✅ ${testCase.name}:`, {
        title: testCase.title,
        body: testCase.body,
        data: testCase.data
      });
    }, index * 1000);
  });

  console.log('🎉 Test simulation complete!');
  console.log('📱 Open your app in Expo Go to test actual notifications');
};

// Export for use in other environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testNotifications };
} else {
  // Browser environment
  window.testNotifications = testNotifications;
}

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  console.log('🔔 NumberMind Notification Test Script Loaded');
  console.log('💡 Run testNotifications() to simulate notifications');
}
