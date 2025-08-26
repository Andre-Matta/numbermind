const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const ShopItem = require('../models/Shop');
const { connectDB } = require('../config/database');

async function testShop() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Test creating a shop item
    const testItem = new ShopItem({
      name: 'Test Avatar',
      description: 'A test avatar for testing',
      type: 'cosmetic',
      category: 'avatar',
      price: 100,
      originalPrice: 100,
      tags: ['test', 'avatar']
    });

    await testItem.save();
    console.log('✅ Test item created:', testItem.name);

    // Test fetching items
    const items = await ShopItem.getActiveItems();
    console.log(`✅ Found ${items.length} active items`);

    // Test discount functionality
    await testItem.applyDiscount(20, new Date(Date.now() + 24 * 60 * 60 * 1000)); // 20% off for 24 hours
    console.log('✅ Applied 20% discount');

    console.log('🎉 Shop test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Shop test failed:', error);
    process.exit(1);
  }
}

testShop();
