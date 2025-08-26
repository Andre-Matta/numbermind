const mongoose = require('mongoose');

const shopItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Theme', 'Powerup', 'Avatar', 'Bundle'],
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  discountEndDate: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isLimited: {
    type: Boolean,
    default: false
  },
  stock: {
    type: Number,
    default: -1 // -1 means unlimited
  },
  imageUrl: {
    type: String,
    default: null
  },
  imageData: {
    type: String,
    default: null,
    // Base64 encoded image data
  },
  imageAsset: {
    type: String,
    default: null,
    // Local asset reference (e.g., "gold_theme.png")
  },
  effects: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  requirements: {
    minLevel: {
      type: Number,
      default: 1
    },
    minRank: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
      default: 'Bronze'
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  popularity: {
    type: Number,
    default: 0
  },
  salesCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual for discounted price
shopItemSchema.virtual('discountedPrice').get(function() {
  if (this.discount > 0 && this.discountEndDate && new Date() < this.discountEndDate) {
    return Math.round(this.price * (1 - this.discount / 100));
  }
  return this.price;
});

// Virtual for discount status
shopItemSchema.virtual('hasDiscount').get(function() {
  return this.discount > 0 && this.discountEndDate && new Date() < this.discountEndDate;
});

// Indexes for better query performance
shopItemSchema.index({ type: 1, isActive: 1 });
shopItemSchema.index({ category: 1, isActive: 1 });
shopItemSchema.index({ isFeatured: 1, isActive: 1 });
shopItemSchema.index({ 'requirements.minLevel': 1, isActive: 1 });
shopItemSchema.index({ popularity: -1, isActive: 1 });

// Methods
shopItemSchema.methods.isAvailableForUser = function(user) {
  if (!this.isActive) return false;
  if (this.stock === 0) return false;
  if (user.gameStats.level < this.requirements.minLevel) return false;
  
  // Check rank requirement (convert rank to numeric value)
  const rankOrder = { 'Bronze': 1, 'Silver': 2, 'Gold': 3, 'Platinum': 4, 'Diamond': 5 };
  const userRankValue = rankOrder[user.gameStats.rank] || 1;
  const requiredRankValue = rankOrder[this.requirements.minRank] || 1;
  
  return userRankValue >= requiredRankValue;
};

shopItemSchema.methods.applyDiscount = function(discountPercent, endDate) {
  this.discount = discountPercent;
  this.discountEndDate = endDate;
  this.price = Math.round(this.originalPrice * (1 - discountPercent / 100));
  return this.save();
};

shopItemSchema.methods.removeDiscount = function() {
  this.discount = 0;
  this.discountEndDate = null;
  this.price = this.originalPrice;
  return this.save();
};

// Statics
shopItemSchema.statics.getActiveItems = function() {
  return this.find({ isActive: true }).sort({ isFeatured: -1, popularity: -1 });
};

shopItemSchema.statics.getItemsByCategory = function(category) {
  return this.find({ category, isActive: true }).sort({ popularity: -1 });
};

shopItemSchema.statics.getFeaturedItems = function() {
  return this.find({ isFeatured: true, isActive: true }).sort({ popularity: -1 });
};

shopItemSchema.statics.getDiscountedItems = function() {
  return this.find({
    isActive: true,
    discount: { $gt: 0 },
    discountEndDate: { $gt: new Date() }
  }).sort({ discount: -1 });
};

module.exports = mongoose.model('ShopItem', shopItemSchema);
