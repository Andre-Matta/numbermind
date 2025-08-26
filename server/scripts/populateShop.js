/**
 * Populate Shop Script with Base64 Image Support
 * 
 * This script populates the shop database with theme items that support:
 * - imageUrl: External image URLs (fallback)
 * - imageData: Base64 encoded images (primary)
 * - imageAsset: Local asset references
 * 
 * Features:
 * - Automatically converts image files to Base64
 * - Creates themes directory structure
 * - Provides sample Base64 images for testing
 * - Supports multiple image formats (PNG, JPG, GIF)
 */

const { connectDB, closeDB } = require('../config/database');
const ShopItem = require('../models/Shop');
const fs = require('fs');
const path = require('path');

// Utility function to convert image files to Base64
function imageToBase64(imagePath) {
  try {
    if (fs.existsSync(imagePath)) {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64String = imageBuffer.toString('base64');
      const mimeType = path.extname(imagePath).toLowerCase();
      
      let mimeString;
      switch (mimeType) {
        case '.png': mimeString = 'image/png'; break;
        case '.jpg': mimeString = 'image/jpeg'; break;
        case '.jpeg': mimeString = 'image/jpeg'; break;
        case '.gif': mimeString = 'image/gif'; break;
        default: mimeString = 'image/png';
      }
      
      return `data:${mimeString};base64,${base64String}`;
    }
    return null;
  } catch (error) {
    console.error(`Error converting image to Base64: ${error.message}`);
    return null;
  }
}

// Function to generate a sample Base64 image (1x1 pixel) for testing
function generateSampleBase64Image(color = '#4a90e2') {
  // Convert hex color to RGB values
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Create a minimal 1x1 PNG image with proper structure
  // PNG signature
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk (13 bytes of data)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(1, 0);      // width: 1
  ihdrData.writeUInt32BE(1, 4);      // height: 1
  ihdrData.writeUInt8(8, 8);         // bit depth: 8
  ihdrData.writeUInt8(2, 9);         // color type: RGB
  ihdrData.writeUInt8(0, 10);        // compression: deflate
  ihdrData.writeUInt8(0, 11);        // filter: none
  ihdrData.writeUInt8(0, 12);        // interlace: none
  
  // Create compressed IDAT data (1x1 RGB pixel with filter byte)
  const rawPixelData = Buffer.from([0, r, g, b]); // 0 = filter type, then RGB
  const idatData = Buffer.from([0x78, 0x9C, 0x63, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01]); // Compressed data
  
  // Build chunks
  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', idatData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  
  // Combine all parts
  const pngData = Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
  
  // Convert to Base64
  const base64 = `data:image/png;base64,${pngData.toString('base64')}`;
  return base64;
}

// Helper function to create PNG chunks
function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  
  // Calculate CRC (simplified - in production you'd want proper CRC calculation)
  crc.writeUInt32BE(0, 0);
  
  return Buffer.concat([length, typeBuffer, data, crc]);
}

const sampleShopItems = [
  // Skin/Theme items  
  {
    name: 'Gold Theme',
    description: 'Elegant gold-styled input boxes with shimmer effect',
    category: 'Theme',
    price: 100,
    originalPrice: 150,
    discount: 33,
    isActive: true,
    stock: 50,
    imageUrl: 'https://example.com/gold-theme.png',
    imageData: generateSampleBase64Image('#FFD700'), // Gold color
    imageAsset: 'gold_theme_box.png'
  },
  {
    name: 'Neon Theme',
    description: 'Bright neon-styled input boxes with glow effect',
    category: 'Theme',
    price: 200,
    originalPrice: 250,
    discount: 20,
    isActive: true,
    stock: 30,
    imageUrl: 'https://example.com/neon-theme.png',
    imageData: generateSampleBase64Image('#00FFFF'), // Cyan/Neon color
    imageAsset: 'neon_theme_box.png'
  },
  {
    name: 'Crystal Theme',
    description: 'Transparent crystal-styled input boxes with refraction effect',
    category: 'Theme',
    price: 300,
    originalPrice: 400,
    discount: 25,
    isActive: true,
    stock: 20,
    imageUrl: 'https://example.com/crystal-theme.png',
    imageData: generateSampleBase64Image('#8A2BE2'), // Purple/Crystal color
    imageAsset: 'crystal_theme_box.png'
  },
  {
    name: 'Platinum Theme',
    description: 'Premium platinum-styled input boxes with metallic finish',
    category: 'Theme',
    price: 500,
    originalPrice: 600,
    discount: 17,
    isActive: true,
    stock: 10,
    imageUrl: 'https://example.com/platinum-theme.png',
    imageData: generateSampleBase64Image('#E5E4E2'), // Platinum color
    imageAsset: 'platinum_theme_box.png'
  },
  {
    name: 'Rainbow Theme',
    description: 'Colorful rainbow-styled input boxes with gradient effect',
    category: 'Theme',
    price: 150,
    originalPrice: 200,
    discount: 25,
    isActive: true,
    stock: 40,
    imageUrl: 'https://example.com/rainbow-theme.png',
    imageData: generateSampleBase64Image('#FF69B4'), // Pink/Rainbow color
    imageAsset: 'rainbow_theme_box.png'
  },
  
  // Power-up items
  {
    name: 'Hint Token',
    description: 'Get a hint about your opponent\'s number',
    category: 'Powerup',
    price: 50,
    originalPrice: 75,
    discount: 33,
    isActive: true,
    stock: 100,
    imageUrl: 'https://example.com/hint-token.png'
  },
  {
    name: 'Extra Guess',
    description: 'Add one more guess to your limit',
    category: 'Powerup',
    price: 75,
    originalPrice: 100,
    discount: 25,
    isActive: true,
    stock: 80,
    imageUrl: 'https://example.com/extra-guess.png'
  },
  {
    name: 'Time Freeze',
    description: 'Freeze the timer for 30 seconds',
    category: 'Powerup',
    price: 60,
    originalPrice: 80,
    discount: 25,
    isActive: true,
    stock: 90,
    imageUrl: 'https://example.com/time-freeze.png'
  },
  {
    name: 'Double XP',
    description: 'Earn double experience points for 24 hours',
    category: 'Powerup',
    price: 120,
    originalPrice: 150,
    discount: 20,
    isActive: true,
    stock: 60,
    imageUrl: 'https://example.com/double-xp.png'
  },
  {
    name: 'Coin Multiplier',
    description: 'Earn 1.5x coins for 12 hours',
    category: 'Powerup',
    price: 80,
    originalPrice: 100,
    discount: 20,
    isActive: true,
    stock: 70,
    imageUrl: 'https://example.com/coin-multiplier.png'
  },
  {
    name: 'Win Streak Bonus',
    description: 'Maintain your win streak even after a loss',
    category: 'Powerup',
    price: 200,
    originalPrice: 250,
    discount: 20,
    isActive: true,
    stock: 25,
    imageUrl: 'https://example.com/win-streak-bonus.png'
  }
];

// Function to demonstrate loading actual image files
async function loadActualThemeImages() {
  const themesDir = path.join(__dirname, '../assets/themes');
  
  // Check if themes directory exists
  if (!fs.existsSync(themesDir)) {
    console.log('Themes directory not found. Using sample Base64 images.');
    return;
  }
  
  console.log('Loading actual theme images from:', themesDir);
  
  // Update theme items with actual image files
  for (let item of sampleShopItems) {
    if (item.category === 'theme' && item.imageAsset) {
      const imagePath = path.join(themesDir, item.imageAsset);
      const base64Data = imageToBase64(imagePath);
      
      if (base64Data) {
        item.imageData = base64Data;
        console.log(`✓ Loaded actual image for ${item.name}`);
      } else {
        console.log(`⚠ Using sample image for ${item.name}`);
      }
    }
  }
}

// Function to create themes directory and sample images
function createThemesDirectory() {
  const themesDir = path.join(__dirname, '../assets/themes');
  
  if (!fs.existsSync(themesDir)) {
    fs.mkdirSync(themesDir, { recursive: true });
    console.log('Created themes directory:', themesDir);
    console.log('You can now place your theme image files here:');    
    console.log('- default_theme_box.png');
    console.log('- gold_theme_box.png');
    console.log('- neon_theme_box.png');
    console.log('- crystal_theme_box.png');
    console.log('- platinum_theme_box.png');
    console.log('- rainbow_theme_box.png');
  }
}

async function populateShop() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    // Create themes directory if it doesn't exist
    createThemesDirectory();
    
    // Load actual theme images if available
    await loadActualThemeImages();
    
    console.log('Clearing existing shop items...');
    await ShopItem.deleteMany({});
    
    console.log('Creating new shop items...');
    const createdItems = await ShopItem.insertMany(sampleShopItems);
    
    console.log(`Successfully created ${createdItems.length} shop items:`);
    createdItems.forEach(item => {
      console.log(`- ${item.name} (${item.category}): ${item.price} coins`);
      if (item.category === 'theme') {
        const hasImage = item.imageData ? '✓ Base64' : item.imageUrl ? '✓ URL' : '✗ No image';
        console.log(`  Image: ${hasImage}`);
      }
    });
    
    console.log('\n=== Database Schema Information ===');
    console.log('Shop items now support:');
    console.log('- imageUrl: External image URLs');
    console.log('- imageData: Base64 encoded images (recommended)');
    console.log('- imageAsset: Local asset references');
    console.log('\n=== Usage Instructions ===');
    console.log('1. Place theme images in: server/assets/themes/');
    console.log('2. Images will be automatically converted to Base64');
    console.log('3. Base64 images provide offline functionality');
    console.log('4. Fallback to URLs if Base64 not available');
    
    console.log('\nShop population completed successfully!');
    
  } catch (error) {
    console.error('Error populating shop:', error);
  } finally {
    await closeDB();
  }
}

// Run the script
populateShop();
