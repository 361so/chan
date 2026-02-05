/**
 * Mock Watermark utility
 * In a real app, this would use Canvas to draw text over the image
 */
export function addWatermark(imagePath, text) {
  return new Promise((resolve) => {
    // Return original path for mock
    console.log(`Adding watermark "${text}" to ${imagePath}`);
    resolve(imagePath);
  });
}

/**
 * Mock Compression utility
 */
export function compressImage(imagePath) {
  return new Promise((resolve) => {
    console.log(`Compressing ${imagePath}`);
    resolve(imagePath);
  });
}
