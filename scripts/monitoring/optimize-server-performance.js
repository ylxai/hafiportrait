#!/usr/bin/env node

/**
 * Server Performance Optimization Script
 * Provides automated optimization suggestions and cleanup
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class ServerOptimizer {
  constructor() {
    this.optimizations = [];
    this.cleanupActions = [];
  }

  // Check and optimize package.json
  async optimizePackageJson() {
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      const suggestions = [];

      // Check for unused dependencies
      suggestions.push('📦 Dependency Optimization:');
      suggestions.push('  - Run `npm audit` to check vulnerabilities');
      suggestions.push('  - Run `npm outdated` to check for updates');
      suggestions.push('  - Consider using `npm-check-updates` for bulk updates');

      // Check scripts optimization
      if (packageJson.scripts) {
        if (!packageJson.scripts['build:analyze']) {
          suggestions.push('  - Add bundle analyzer: "build:analyze": "ANALYZE=true npm run build"');
        }
        if (!packageJson.scripts['start:prod']) {
          suggestions.push('  - Add production start: "start:prod": "NODE_ENV=production npm start"');
        }
      }

      this.optimizations.push(...suggestions);
    } catch (error) {
      console.warn('Could not analyze package.json:', error.message);
    }
  }

  // Check Next.js configuration
  async optimizeNextConfig() {
    try {
      const nextConfigPath = 'next.config.js';
      const exists = await fs.access(nextConfigPath).then(() => true).catch(() => false);
      
      if (exists) {
        const content = await fs.readFile(nextConfigPath, 'utf8');
        const suggestions = [];

        suggestions.push('⚡ Next.js Optimization:');
        
        if (!content.includes('compress')) {
          suggestions.push('  - Enable compression: compress: true');
        }
        
        if (!content.includes('swcMinify')) {
          suggestions.push('  - Enable SWC minification: swcMinify: true');
        }
        
        if (!content.includes('images')) {
          suggestions.push('  - Configure image optimization domains');
        }

        if (!content.includes('experimental')) {
          suggestions.push('  - Consider experimental features: esmExternals, serverComponentsExternalPackages');
        }

        this.optimizations.push(...suggestions);
      }
    } catch (error) {
      console.warn('Could not analyze next.config.js:', error.message);
    }
  }

  // Check for large files and cleanup opportunities
  async findCleanupOpportunities() {
    const suggestions = [];
    
    try {
      // Check for large files in public directory
      const publicFiles = await this.findLargeFiles('./public', 1024 * 1024); // 1MB+
      if (publicFiles.length > 0) {
        suggestions.push('🗜️  Large Public Files Found:');
        publicFiles.forEach(file => {
          suggestions.push(`  - ${file.path} (${this.formatBytes(file.size)}) - Consider compression`);
        });
      }

      // Check for unoptimized images
      const imageFiles = await this.findImageFiles('./public');
      if (imageFiles.length > 0) {
        suggestions.push('🖼️  Image Optimization:');
        suggestions.push(`  - Found ${imageFiles.length} images in public directory`);
        suggestions.push('  - Consider converting to WebP format');
        suggestions.push('  - Use next/image for automatic optimization');
      }

      // Check for temporary files
      const tempFiles = await this.findTempFiles('.');
      if (tempFiles.length > 0) {
        suggestions.push('🧹 Cleanup Opportunities:');
        tempFiles.forEach(file => {
          suggestions.push(`  - Remove: ${file}`);
          this.cleanupActions.push(() => fs.unlink(file));
        });
      }

      this.optimizations.push(...suggestions);
    } catch (error) {
      console.warn('Could not analyze cleanup opportunities:', error.message);
    }
  }

  // Find large files
  async findLargeFiles(dirPath, minSize) {
    const largeFiles = [];
    
    try {
      const items = await fs.readdir(dirPath);
      
      for (const item of items) {
        if (item === 'node_modules' || item === '.git' || item === '.next') continue;
        
        const itemPath = path.join(dirPath, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          const subFiles = await this.findLargeFiles(itemPath, minSize);
          largeFiles.push(...subFiles);
        } else if (stats.size > minSize) {
          largeFiles.push({
            path: itemPath,
            size: stats.size
          });
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
    
    return largeFiles.sort((a, b) => b.size - a.size);
  }

  // Find image files
  async findImageFiles(dirPath) {
    const imageFiles = [];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    
    try {
      const items = await fs.readdir(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          const subFiles = await this.findImageFiles(itemPath);
          imageFiles.push(...subFiles);
        } else {
          const ext = path.extname(item).toLowerCase();
          if (imageExtensions.includes(ext)) {
            imageFiles.push({
              path: itemPath,
              size: stats.size,
              extension: ext
            });
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
    
    return imageFiles;
  }

  // Find temporary files
  async findTempFiles(dirPath) {
    const tempFiles = [];
    const tempPatterns = [
      /\.tmp$/,
      /\.temp$/,
      /~$/,
      /\.log$/,
      /\.cache$/,
      /tmp_rovodev_/
    ];
    
    try {
      const items = await fs.readdir(dirPath);
      
      for (const item of items) {
        if (item === 'node_modules' || item === '.git' || item === '.next') continue;
        
        const itemPath = path.join(dirPath, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          const subFiles = await this.findTempFiles(itemPath);
          tempFiles.push(...subFiles);
        } else {
          const isTemp = tempPatterns.some(pattern => pattern.test(item));
          if (isTemp) {
            tempFiles.push(itemPath);
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
    
    return tempFiles;
  }

  // Generate environment-specific optimizations
  generateEnvironmentOptimizations() {
    const suggestions = [];
    
    suggestions.push('🌍 Environment Optimizations:');
    
    // Production optimizations
    suggestions.push('  📊 Production:');
    suggestions.push('    - Set NODE_ENV=production');
    suggestions.push('    - Enable PM2 for process management');
    suggestions.push('    - Configure reverse proxy (Nginx)');
    suggestions.push('    - Enable HTTP/2 and gzip compression');
    suggestions.push('    - Set up CDN for static assets');
    
    // Development optimizations
    suggestions.push('  🔧 Development:');
    suggestions.push('    - Use SWC instead of Babel for faster builds');
    suggestions.push('    - Enable Fast Refresh');
    suggestions.push('    - Configure source maps for debugging');
    
    // Memory optimizations
    suggestions.push('  💾 Memory:');
    suggestions.push('    - Set --max-old-space-size for Node.js');
    suggestions.push('    - Implement proper garbage collection');
    suggestions.push('    - Use streaming for large file operations');
    
    this.optimizations.push(...suggestions);
  }

  // Generate database optimizations
  generateDatabaseOptimizations() {
    const suggestions = [];
    
    suggestions.push('🗄️  Database Optimizations:');
    suggestions.push('  - Add database indexes for frequently queried fields');
    suggestions.push('  - Implement connection pooling');
    suggestions.push('  - Use database query optimization');
    suggestions.push('  - Consider read replicas for heavy read operations');
    suggestions.push('  - Implement proper caching strategy (Redis)');
    suggestions.push('  - Monitor slow queries and optimize them');
    
    this.optimizations.push(...suggestions);
  }

  // Generate storage optimizations
  generateStorageOptimizations() {
    const suggestions = [];
    
    suggestions.push('☁️  Storage Optimizations:');
    suggestions.push('  - Implement CDN for Cloudflare R2 assets');
    suggestions.push('  - Use WebP format for images where supported');
    suggestions.push('  - Implement progressive image loading');
    suggestions.push('  - Set up automatic image compression pipeline');
    suggestions.push('  - Configure proper cache headers');
    suggestions.push('  - Implement lazy loading for images');
    
    this.optimizations.push(...suggestions);
  }

  // Format bytes
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Execute cleanup actions
  async executeCleanup() {
    if (this.cleanupActions.length === 0) {
      console.log('✅ No cleanup actions needed');
      return;
    }

    console.log(`\n🧹 Executing ${this.cleanupActions.length} cleanup actions...`);
    
    for (const action of this.cleanupActions) {
      try {
        await action();
        console.log('✅ Cleanup action completed');
      } catch (error) {
        console.warn('⚠️ Cleanup action failed:', error.message);
      }
    }
  }

  // Main optimization function
  async optimize() {
    console.log('🚀 HafiPortrait Photography - Server Performance Optimizer\n');
    console.log('=' .repeat(60));

    // Run all optimization checks
    await this.optimizePackageJson();
    await this.optimizeNextConfig();
    await this.findCleanupOpportunities();
    this.generateEnvironmentOptimizations();
    this.generateDatabaseOptimizations();
    this.generateStorageOptimizations();

    // Display all optimizations
    console.log('\n📋 OPTIMIZATION RECOMMENDATIONS:\n');
    this.optimizations.forEach(suggestion => {
      console.log(suggestion);
    });

    // Offer to execute cleanup
    if (this.cleanupActions.length > 0) {
      console.log(`\n🧹 Found ${this.cleanupActions.length} cleanup opportunities.`);
      console.log('Run with --cleanup flag to execute automatic cleanup.');
    }

    console.log('\n' + '=' .repeat(60));
    console.log('💡 QUICK WINS:');
    console.log('1. Enable gzip compression in production');
    console.log('2. Optimize images to WebP format');
    console.log('3. Implement proper caching headers');
    console.log('4. Use CDN for static assets');
    console.log('5. Monitor and optimize database queries');
    console.log('6. Set up proper error monitoring');
  }
}

// Run the optimizer
if (require.main === module) {
  const optimizer = new ServerOptimizer();
  const shouldCleanup = process.argv.includes('--cleanup');
  
  optimizer.optimize().then(() => {
    if (shouldCleanup) {
      return optimizer.executeCleanup();
    }
  }).catch(console.error);
}

module.exports = ServerOptimizer;