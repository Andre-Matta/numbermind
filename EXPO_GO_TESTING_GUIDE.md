# 🧪 Expo Go Notification Testing Guide

This guide will help you test the NumberMind notification system using Expo Go.

## 🚀 Quick Start

### **1. Install Expo Go**
- **iOS**: Download from [App Store](https://apps.apple.com/app/expo-go/id982107779)
- **Android**: Download from [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

### **2. Start Your App**
```bash
cd client
npm start
# or
expo start
```

### **3. Open in Expo Go**
- Scan the QR code with your device's camera (iOS) or Expo Go app (Android)
- Or press `i` for iOS simulator or `a` for Android emulator

## 📱 Testing Notifications

### **Step 1: Grant Permissions**
When you first open the app, you'll be prompted to allow notifications:
- Tap **"Allow"** when prompted
- If you accidentally denied, go to Settings → NumberMind → Notifications → Allow

### **Step 2: Access Notification Tester**
1. Open the NumberMind app
2. On the main menu, tap the **"Test Notifications"** button (flask icon)
3. You'll see a comprehensive testing interface

### **Step 3: Test Different Notification Types**

#### **🎮 Game Notifications**
- **Game Invite**: Simulates receiving a game invitation
- **Match Found**: Simulates finding a multiplayer match
- **Your Turn**: Simulates it being your turn in a game
- **Game Result**: Simulates winning a game

#### **🏆 Other Notifications**
- **Achievement**: Simulates unlocking an achievement
- **Connection Status**: Simulates connection status changes

#### **🔧 Custom Notifications**
- Enter your own title and message
- Test with custom data

#### **⚙️ Utility Functions**
- **Get Push Token**: View your device's push token (logged to console)
- **Clear All Notifications**: Remove all notifications from your device

## 🔍 What to Look For

### **Immediate Feedback**
- ✅ Success alerts when notifications are sent
- ✅ Haptic feedback (vibration) on supported devices
- ✅ Console logs showing notification details

### **Device Notifications**
- 📱 Check your device's notification center/shade
- 🔔 Listen for notification sounds
- 📳 Feel for vibration (if enabled)

### **Console Output**
Open your terminal/console to see:
- Push token information
- Notification service initialization status
- Error messages (if any)

## 🐛 Troubleshooting

### **Notifications Not Appearing**

#### **Check Permissions**
```javascript
// In your browser console or React Native debugger
import * as Notifications from 'expo-notifications';

// Check current permission status
const { status } = await Notifications.getPermissionsAsync();
console.log('Permission status:', status);
```

#### **Check Device Settings**
- **iOS**: Settings → NumberMind → Notifications → Allow
- **Android**: Settings → Apps → NumberMind → Notifications → Allow

#### **Check Do Not Disturb**
- Make sure Do Not Disturb is off
- Check if Focus modes are blocking notifications

### **Push Token Issues**
In Expo Go, push tokens might not be available. This is normal and expected:
- Local notifications will still work
- Push tokens are only available in development builds or production

### **App Not Loading**
- Make sure you're using the latest version of Expo Go
- Try clearing Expo Go cache: Settings → Clear Cache
- Restart Expo Go and scan the QR code again

## 📊 Testing Checklist

### **Basic Functionality**
- [ ] App loads without errors
- [ ] Notification permissions are requested
- [ ] Notification tester screen is accessible
- [ ] Test buttons respond to taps

### **Notification Types**
- [ ] Custom notifications work
- [ ] Game invite notifications work
- [ ] Match found notifications work
- [ ] Your turn notifications work
- [ ] Game result notifications work
- [ ] Achievement notifications work
- [ ] Connection status notifications work

### **Device Integration**
- [ ] Notifications appear in notification center
- [ ] Notification sounds play (if enabled)
- [ ] Haptic feedback works (if supported)
- [ ] Notifications can be tapped/swiped

### **Error Handling**
- [ ] Graceful handling of permission denial
- [ ] Console logs show helpful error messages
- [ ] App doesn't crash on notification errors

## 🎯 Advanced Testing

### **Test Different Scenarios**
1. **Background App**: Send notification while app is in background
2. **Locked Screen**: Send notification while device is locked
3. **Multiple Notifications**: Send several notifications quickly
4. **Long Messages**: Test with very long notification text
5. **Special Characters**: Test with emojis and special characters

### **Performance Testing**
- Send 10+ notifications rapidly
- Check for memory leaks
- Monitor battery usage
- Test on different device types

### **Edge Cases**
- Test with very slow network
- Test with no network connection
- Test with low battery mode
- Test with different notification settings

## 🔧 Development Tips

### **Console Logging**
Enable detailed logging by adding this to your app:
```javascript
// In your main App.js or index.js
if (__DEV__) {
  console.log('🔔 Notification testing mode enabled');
}
```

### **Debug Mode**
Add a debug flag to show more information:
```javascript
const DEBUG_NOTIFICATIONS = true;

if (DEBUG_NOTIFICATIONS) {
  console.log('Notification details:', {
    title,
    body,
    data,
    timestamp: new Date().toISOString()
  });
}
```

### **Testing on Multiple Devices**
- Test on both iOS and Android
- Test on different screen sizes
- Test on older device models
- Test with different OS versions

## 📱 Expo Go Limitations

### **What Works in Expo Go**
- ✅ Local notifications
- ✅ Notification permissions
- ✅ Notification listeners
- ✅ Basic notification UI

### **What Doesn't Work in Expo Go**
- ❌ Push notifications (requires development build)
- ❌ Custom notification sounds
- ❌ Rich notifications with images
- ❌ Notification actions

### **For Full Testing**
To test push notifications and advanced features:
1. Create a development build: `expo build:development`
2. Install the development build on your device
3. Test push notifications using Expo's push notification tool

## 🎉 Success Criteria

Your notification system is working correctly if:
- ✅ All notification types appear on device
- ✅ Notifications are properly formatted
- ✅ No console errors during testing
- ✅ App performance remains smooth
- ✅ Notifications can be interacted with
- ✅ Permission handling works correctly

## 📞 Getting Help

If you encounter issues:
1. Check the console for error messages
2. Verify Expo Go is up to date
3. Try clearing Expo Go cache
4. Test on a different device
5. Check the [Expo documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)

Happy testing! 🎮🔔
