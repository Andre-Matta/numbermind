# Theme Images with Base64 Support

This document explains how to use the new Base64 image system for themes in the NumberMind game.

## Overview

The shop system now supports three types of image sources for themes:

1. **`imageData`** - Base64 encoded images (recommended)
2. **`imageAsset`** - Local asset references
3. **`imageUrl`** - External image URLs (fallback)

## Benefits of Base64 Images

- ✅ **Offline functionality** - themes work without internet
- ✅ **Instant loading** - no network delays
- ✅ **Better performance** - images are cached in memory
- ✅ **Reliability** - no broken links or server issues
- ✅ **Security** - complete control over image assets

## Setup Instructions

### 1. Create Theme Images

Create your theme images (recommended size: 60x60 pixels) and save them as PNG files:

```
server/assets/themes/
├── gold_theme_box.png
├── neon_theme_box.png
├── crystal_theme_box.png
├── platinum_theme_box.png
└── rainbow_theme_box.png
```

### 2. Run the Populate Script

```bash
cd server/scripts
node populateShop.js
```

The script will:
- Create the themes directory if it doesn't exist
- Convert your PNG files to Base64 automatically
- Populate the database with theme items
- Show detailed information about each theme

### 3. Verify in Database

Check that your themes have Base64 data:

```javascript
// In MongoDB shell or your database tool
db.shopitems.find({category: 'theme'}, {name: 1, imageData: 1, imageAsset: 1})
```

## Image Requirements

- **Format**: PNG, JPG, or GIF (PNG recommended for transparency)
- **Size**: 60x60 pixels (will be scaled automatically)
- **File naming**: Use the pattern `{theme_name}_theme_box.png`
- **Quality**: Keep file sizes reasonable (< 100KB per image)

## Manual Base64 Conversion

If you want to manually convert images to Base64:

```javascript
// Using Node.js
const fs = require('fs');
const imageBuffer = fs.readFileSync('path/to/image.png');
const base64String = imageBuffer.toString('base64');
const dataUri = `data:image/png;base64,${base64String}`;
```

## Database Schema

The Shop model now includes these fields:

```javascript
{
  name: 'Gold Theme',
  category: 'theme',
  imageUrl: 'https://example.com/gold-theme.png',    // Fallback URL
  imageData: 'data:image/png;base64,iVBORw0...',   // Base64 data
  imageAsset: 'gold_theme_box.png',                 // Local asset
  // ... other fields
}
```

## Testing

1. **Run the populate script** to create sample themes
2. **Start your app** and navigate to the shop
3. **Select different themes** to see them applied
4. **Check console logs** for image loading information

## Troubleshooting

### Images Not Loading
- Check that Base64 data is properly formatted
- Verify image files exist in the themes directory
- Check console for error messages

### Large File Sizes
- Optimize images before conversion
- Consider using WebP format for better compression
- Use image optimization tools

### Performance Issues
- Base64 increases database size by ~33%
- Consider lazy loading for many themes
- Monitor memory usage with large images

## Future Enhancements

- Image compression and optimization
- Multiple image sizes (retina support)
- Theme preview thumbnails
- Image caching strategies
- CDN integration for external images

## Support

For issues or questions about the theme system:
1. Check the console logs for error messages
2. Verify database schema matches the model
3. Test with sample Base64 images first
4. Check file permissions for the themes directory
