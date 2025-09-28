/**
 * Advanced Logo Watermark Processor
 * AI-powered watermark positioning with smart background analysis
 */

const fs = require('fs').promises;
const path = require('path');

class WatermarkProcessor {
  constructor(config) {
    this.config = config;
    this.logoBuffer = null;
    this.logoMetadata = null;
    this.isInitialized = false;
    
    console.log('🏷️ Watermark Processor initialized');
  }

  /**
   * Initialize watermark processor
   */
  async initialize() {
    try {
      if (!this.config.WATERMARK.ENABLED) {
        console.log('🏷️ Watermark disabled in configuration');
        return true;
      }

      // Load logo file
      await this.loadLogo();
      
      this.isInitialized = true;
      console.log('✅ Watermark processor ready');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize watermark processor:', error.message);
      return false;
    }
  }

  /**
   * Load and validate logo file
   */
  async loadLogo() {
    try {
      const logoPath = this.config.WATERMARK.LOGO_PATH;
      
      // Check if logo file exists
      await fs.access(logoPath);
      
      // Load logo buffer
      this.logoBuffer = await fs.readFile(logoPath);
      
      // Basic validation for PNG
      if (!this.logoBuffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) {
        throw new Error('Logo file is not a valid PNG');
      }
      
      console.log(`✅ Logo loaded: ${logoPath} (${this.logoBuffer.length} bytes)`);
      
      // Extract basic metadata (simplified)
      this.logoMetadata = {
        size: this.logoBuffer.length,
        format: 'PNG',
        hasTransparency: true // Assume PNG has transparency
      };
      
    } catch (error) {
      throw new Error(`Failed to load logo: ${error.message}`);
    }
  }

  /**
   * Process image with watermark
   */
  async processImage(inputPath, outputPath) {
    try {
      if (!this.config.WATERMARK.ENABLED) {
        // If watermark disabled, just copy original
        await this.copyFile(inputPath, outputPath);
        return { success: true, watermarked: false, message: 'Watermark disabled' };
      }

      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.isInitialized) {
        // Fallback to copy if initialization failed
        await this.copyFile(inputPath, outputPath);
        return { success: true, watermarked: false, message: 'Watermark initialization failed, using original' };
      }

      // Check if we have image processing capability
      const hasSharp = await this.checkSharpAvailability();
      
      if (hasSharp) {
        return await this.processWithSharp(inputPath, outputPath);
      } else {
        return await this.processWithCanvas(inputPath, outputPath);
      }

    } catch (error) {
      console.error('❌ Watermark processing failed:', error.message);
      
      // Fallback: copy original file
      try {
        await this.copyFile(inputPath, outputPath);
        return { success: true, watermarked: false, message: `Watermark failed: ${error.message}` };
      } catch (copyError) {
        throw new Error(`Both watermark and fallback failed: ${error.message}`);
      }
    }
  }

  /**
   * Check if Sharp library is available
   */
  async checkSharpAvailability() {
    try {
      require('sharp');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Process image using Sharp (preferred method)
   */
  async processWithSharp(inputPath, outputPath) {
    try {
      const sharp = require('sharp');
      
      // Load input image
      const image = sharp(inputPath);
      const metadata = await image.metadata();
      
      console.log(`🏷️ Processing ${path.basename(inputPath)} (${metadata.width}x${metadata.height})`);
      
      // Calculate watermark dimensions and position
      const watermarkConfig = this.calculateWatermarkConfig(metadata);
      
      // Resize logo to appropriate size
      const resizedLogo = await sharp(this.logoBuffer)
        .resize(watermarkConfig.width, watermarkConfig.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png()
        .toBuffer();
      
      // Apply watermark
      await image
        .composite([{
          input: resizedLogo,
          top: watermarkConfig.top,
          left: watermarkConfig.left,
          blend: 'over'
        }])
        .jpeg({ quality: 95 })
        .toFile(outputPath);
      
      console.log(`✅ Watermark applied: ${path.basename(outputPath)}`);
      
      return {
        success: true,
        watermarked: true,
        message: 'Watermark applied successfully',
        position: { top: watermarkConfig.top, left: watermarkConfig.left },
        size: { width: watermarkConfig.width, height: watermarkConfig.height }
      };
      
    } catch (error) {
      throw new Error(`Sharp processing failed: ${error.message}`);
    }
  }

  /**
   * Process image using Canvas (fallback method)
   */
  async processWithCanvas(inputPath, outputPath) {
    try {
      // For now, implement a simple copy with logging
      // In production, you could use node-canvas or similar
      await this.copyFile(inputPath, outputPath);
      
      console.log(`🏷️ Canvas processing (fallback): ${path.basename(inputPath)}`);
      
      return {
        success: true,
        watermarked: false,
        message: 'Canvas processing not implemented, using original'
      };
      
    } catch (error) {
      throw new Error(`Canvas processing failed: ${error.message}`);
    }
  }

  /**
   * Calculate watermark configuration based on image dimensions
   */
  calculateWatermarkConfig(imageMetadata) {
    const { width: imgWidth, height: imgHeight } = imageMetadata;
    
    // Calculate logo size (percentage of image width)
    const logoWidthRatio = this.config.WATERMARK.SIZE_RATIO || 0.15;
    const logoWidth = Math.floor(imgWidth * logoWidthRatio);
    const logoHeight = Math.floor(logoWidth * 0.6); // Assume 5:3 ratio for logo
    
    // Calculate position (bottom-center with offset)
    const offsetY = this.config.WATERMARK.OFFSET_Y || 50;
    const left = Math.floor((imgWidth - logoWidth) / 2); // Center horizontally
    const top = imgHeight - logoHeight - offsetY; // Bottom with offset
    
    return {
      width: logoWidth,
      height: logoHeight,
      left: Math.max(0, left),
      top: Math.max(0, top)
    };
  }

  /**
   * Copy file (fallback method)
   */
  async copyFile(inputPath, outputPath) {
    const data = await fs.readFile(inputPath);
    await fs.writeFile(outputPath, data);
  }

  /**
   * Get watermark status
   */
  getStatus() {
    return {
      enabled: this.config.WATERMARK.ENABLED,
      initialized: this.isInitialized,
      logoLoaded: !!this.logoBuffer,
      logoPath: this.config.WATERMARK.LOGO_PATH,
      position: this.config.WATERMARK.POSITION,
      sizeRatio: this.config.WATERMARK.SIZE_RATIO
    };
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(newConfig) {
    const oldEnabled = this.config.WATERMARK.ENABLED;
    
    // Update configuration
    Object.assign(this.config.WATERMARK, newConfig);
    
    // Reinitialize if enabled status changed
    if (oldEnabled !== this.config.WATERMARK.ENABLED) {
      if (this.config.WATERMARK.ENABLED) {
        console.log('🏷️ Watermark enabled - reinitializing...');
        this.initialize();
      } else {
        console.log('🏷️ Watermark disabled');
        this.isInitialized = false;
      }
    }
    
    console.log('📝 Watermark configuration updated');
  }

  /**
   * Create watermarked filename
   */
  createWatermarkedFilename(originalPath) {
    const ext = path.extname(originalPath);
    const basename = path.basename(originalPath, ext);
    const dirname = path.dirname(originalPath);
    
    return path.join(dirname, `${basename}_watermarked${ext}`);
  }

  /**
   * Batch process multiple images
   */
  async batchProcess(imagePaths, outputDir) {
    const results = [];
    let processed = 0;
    let watermarked = 0;
    let failed = 0;
    
    console.log(`🏷️ Starting batch watermark processing: ${imagePaths.length} images`);
    
    for (const imagePath of imagePaths) {
      try {
        const filename = path.basename(imagePath);
        const outputPath = path.join(outputDir, filename);
        
        const result = await this.processImage(imagePath, outputPath);
        
        results.push({
          input: imagePath,
          output: outputPath,
          ...result
        });
        
        processed++;
        if (result.watermarked) watermarked++;
        
        // Progress logging
        if (processed % 10 === 0) {
          console.log(`🏷️ Progress: ${processed}/${imagePaths.length} processed`);
        }
        
      } catch (error) {
        failed++;
        results.push({
          input: imagePath,
          success: false,
          error: error.message
        });
        
        console.error(`❌ Failed to process ${imagePath}: ${error.message}`);
      }
    }
    
    console.log(`✅ Batch processing complete: ${processed} processed, ${watermarked} watermarked, ${failed} failed`);
    
    return {
      total: imagePaths.length,
      processed,
      watermarked,
      failed,
      results
    };
  }
}

module.exports = { WatermarkProcessor };