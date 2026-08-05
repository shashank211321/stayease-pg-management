/**
 * Compresses an image file by resizing it using HTML Canvas.
 * This ensures base64 representations stay small (under ~30KB) so we can store multiple guest records in localStorage.
 * 
 * @param {File} file The uploaded image file
 * @param {number} maxDimension The maximum width or height in pixels
 * @returns {Promise<string>} Resolve with the compressed base64 string
 */
export const compressImage = (file, maxDimension = 400) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('');
      return;
    }
    
    // Read the file as data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions preserving aspect ratio
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Export to JPEG with 0.7 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.onerror = () => {
        reject(new Error('Failed to load image into element'));
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
};
