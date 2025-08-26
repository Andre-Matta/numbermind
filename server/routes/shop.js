const express = require('express');
const router = express.Router();
const { verifyToken } = require('../utils/jwtUtils');
const ShopItem = require('../models/Shop');
const User = require('../models/User');

// Get all shop items
router.get('/active', verifyToken, async (req, res) => {
  try {
    const items = await ShopItem.getActiveItems();
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get shop items organized by categories
router.get('/categories', verifyToken, async (req, res) => {
  try {
    const items = await ShopItem.find({ isActive: true }).sort({ category: 1, name: 1 });
    
    // Group items by category
    const categories = {};
    items.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    });
    
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get shop items by category
router.get('/category/:category', verifyToken, async (req, res) => {
  try {
    const { category } = req.params;
    const items = await ShopItem.getItemsByCategory(category);
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get featured items
router.get('/featured', verifyToken, async (req, res) => {
  try {
    const items = await ShopItem.getFeaturedItems();
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get discounted items
router.get('/discounted', verifyToken, async (req, res) => {
  try {
    const items = await ShopItem.getDiscountedItems();
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Purchase item
router.post('/purchase/:itemId', verifyToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    // Get the item
    const item = await ShopItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Get the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if item is available for user
    if (!item.isAvailableForUser(user)) {
      return res.status(400).json({ error: 'Item not available for this user' });
    }

    // Check if user has enough coins
    const finalPrice = item.hasDiscount ? item.discountedPrice : item.price;
    if (user.coins < finalPrice) {
      return res.status(400).json({ error: 'Not enough coins' });
    }

    // Check stock
    if (item.stock !== -1 && item.stock <= 0) {
      return res.status(400).json({ error: 'Item out of stock' });
    }

    // Process purchase
    user.coins -= finalPrice;
    item.salesCount += 1;
    if (item.stock !== -1) {
      item.stock -= 1;
    }

    // Add skin to user's available skins if it's a skin item
    if (item.type === 'cosmetic' && item.category === 'theme') {
      const skinName = item.name.toLowerCase().replace(/\s+/g, '');
      if (!user.availableSkins.includes(skinName)) {
        user.availableSkins.push(skinName);
      }
    }

    // Save changes
    await Promise.all([user.save(), item.save()]);

    res.json({ 
      message: 'Purchase successful!',
      remainingCoins: user.coins,
      item: item.name
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's available skins
router.get('/my-skins', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('availableSkins');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ availableSkins: user.availableSkins });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
