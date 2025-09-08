/**
 * Enhanced Fallback compression when Sharp is not available
 * Uses Canvas API or basic file size limits as fallback
 */

function createFallbackCompression() {
  return {
    async compressImage(photoFile, compressionSettings) {
      console.log('⚠️ Using enhanced fallback compression (Sharp not available)');
      console.log(`📊 Original size: ${(photoFile.size / 1024).toFixed(2)} KB`);
      
      try {
        // Try Canvas-based compression if available (browser environment)
        if (typeof window !== 'undefined' && window.HTMLCanvasElement) {
          return await this.canvasCompress(photoFile, compressionSettings);
        }
        
        // Server-side fallback: basic file size management
        return await this.basicCompress(photoFile, compressionSettings);
        
      } catch (error) {
        console.warn('⚠️ Fallback compression failed:', error.message);
        
        // Last resort: return original with size limit
        return this.basicSizeLimit(photoFile, compressionSettings);
      }
    },

    async canvasCompress(photoFile, settings) {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          // Calculate new dimensions
          const { width, height } = this.calculateDimensions(
            img.width, 
            img.height, 
            settings.maxWidth || 2000
          );
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onload = () => {
                const buffer = Buffer.from(reader.result);
                console.log(`✅ Canvas compression: ${photoFile.size} → ${buffer.length} bytes`);
                
                resolve({
                  buffer,
                  size: buffer.length,
                  name: photoFile.name.replace(/\.[^/.]+$/, '.jpg')
                });
              };
              reader.readAsArrayBuffer(blob);
            } else {
              reject(new Error('Canvas compression failed'));
            }
          }, 'image/jpeg', settings.quality || 0.85);
        };
        
        img.onerror = () => reject(new Error('Image load failed'));
        
        // Create object URL from buffer
        const blob = new Blob([photoFile.buffer], { type: photoFile.type });
        img.src = URL.createObjectURL(blob);
      });
    },

    async basicCompress(photoFile, settings) {
      console.log('🔄 Using basic server-side compression fallback');
      
      // Basic compression: if file is too large, we'll need to reject or warn
      const maxSize = 5 * 1024 * 1024; // 5MB limit
      
      if (photoFile.size > maxSize) {
        console.warn(`⚠️ File too large (${(photoFile.size / 1024 / 1024).toFixed(2)}MB), may cause issues`);
      }
      
      // Return original file but with proper naming
      return {
        buffer: photoFile.buffer,
        size: photoFile.size,
        name: photoFile.name.replace(/\.[^/.]+$/, '.jpg'),
        warning: photoFile.size > maxSize ? 'File size exceeds recommended limit' : null
      };
    },

    basicSizeLimit(photoFile, settings) {
      const maxSize = 10 * 1024 * 1024; // 10MB absolute limit
      
      if (photoFile.size > maxSize) {
        throw new Error(`File too large: ${(photoFile.size / 1024 / 1024).toFixed(2)}MB (max: 10MB)`);
      }
      
      return {
        buffer: photoFile.buffer,
        size: photoFile.size,
        name: photoFile.name.replace(/\.[^/.]+$/, '.jpg')
      };
    },

    calculateDimensions(originalWidth, originalHeight, maxWidth) {
      if (originalWidth <= maxWidth) {
        return { width: originalWidth, height: originalHeight };
      }
      
      const ratio = maxWidth / originalWidth;
      return {
        width: maxWidth,
        height: Math.round(originalHeight * ratio)
      };
    }
  };
}

module.exports = createFallbackCompression;
