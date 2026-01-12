const axios = require('axios');
const Jimp = require('jimp');
const { parseICO } = require('icojs');

/**
 * Get favicon URL for a feed URL
 */
function getFaviconUrl(feedUrl) {
  try {
    const url = new URL(feedUrl);
    return `${url.protocol}//${url.host}/favicon.ico`;
  } catch (e) {
    return null;
  }
}

/**
 * Extract dominant color from image buffer
 */
async function extractColorFromImage(imageBuffer, isIco = false) {
  try {
    let imageToProcess = imageBuffer;
    
    // Convert .ico to PNG first if needed
    if (isIco) {
      try {
        const images = await parseICO(imageBuffer, 'image/png');
        if (images && images.length > 0) {
          // Use the largest image
          const largestImage = images.reduce((prev, current) => 
            (prev.width > current.width ? prev : current)
          );
          // icojs returns a Buffer directly
          imageToProcess = largestImage.buffer ? Buffer.from(largestImage.buffer) : Buffer.from(largestImage);
        }
      } catch (icoError) {
        console.log('Could not parse .ico file:', icoError.message, '- using default color');
        return '#3b82f6';
      }
    }
    
    const image = await Jimp.read(imageToProcess);
    
    // Resize to 50x50 for performance
    image.resize(50, 50);
    
    let r = 0, g = 0, b = 0, count = 0;
    
    // Scan all pixels
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      const alpha = this.bitmap.data[idx + 3];
      
      // Skip transparent pixels and very light/dark pixels
      if (alpha > 128) {
        const brightness = (red + green + blue) / 3;
        if (brightness > 30 && brightness < 225) {
          r += red;
          g += green;
          b += blue;
          count++;
        }
      }
    });
    
    if (count > 0) {
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      
      // Convert to hex
      const color = '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
      
      return color;
    }
    
    return '#3b82f6'; // Default blue
  } catch (error) {
    console.error('Error extracting color:', error.message);
    return '#3b82f6';
  }
}

/**
 * Fetch icon and detect color from feed URL
 */
async function detectIconAndColor(feedUrl) {
  try {
    const iconUrl = getFaviconUrl(feedUrl);
    
    if (!iconUrl) {
      return { success: false, error: 'Invalid feed URL' };
    }
    
    // Try to fetch the favicon
    try {
      const response = await axios.get(iconUrl, {
        responseType: 'arraybuffer',
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const imageBuffer = Buffer.from(response.data);
      
      // Check if it's an .ico file
      const contentType = response.headers['content-type'] || '';
      const isIco = contentType.includes('x-icon') || iconUrl.endsWith('.ico');
      
      // Try to extract color
      let color = '#3b82f6';
      try {
        color = await extractColorFromImage(imageBuffer, isIco);
      } catch (colorError) {
        console.log('Could not extract color, using default');
      }
      
      return {
        success: true,
        iconUrl: iconUrl,
        color: color,
      };
    } catch (fetchError) {
      // If favicon.ico doesn't exist, try alternative locations
      try {
        const url = new URL(feedUrl);
        const alternativeIconUrl = `${url.protocol}//${url.host}/apple-touch-icon.png`;
        
        const response = await axios.get(alternativeIconUrl, {
          responseType: 'arraybuffer',
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        const imageBuffer = Buffer.from(response.data);
        const color = await extractColorFromImage(imageBuffer);
        
        return {
          success: true,
          iconUrl: alternativeIconUrl,
          color: color,
        };
      } catch (altError) {
        // Return default values if no icon can be fetched
        console.log(`Could not fetch any icon for ${feedUrl}`);
        return {
          success: true,
          iconUrl: iconUrl,
          color: '#3b82f6',
          warning: 'Could not fetch icon, using defaults'
        };
      }
    }
  } catch (error) {
    console.error('Error detecting icon:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  detectIconAndColor,
  extractColorFromImage,
  getFaviconUrl,
};
