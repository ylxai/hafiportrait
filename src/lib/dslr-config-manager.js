/**
 * DSLR Configuration Manager
 * Runtime configuration management and validation
 */

const fs = require('fs').promises;
const path = require('path');

class DSLRConfigManager {
  constructor(config) {
    this.config = config;
    this.configFile = './dslr-runtime.json';
    this.listeners = new Map();
  }

  /**
   * Load runtime configuration from file
   */
  async loadRuntimeConfig() {
    try {
      const data = await fs.readFile(this.configFile, 'utf8');
      const runtimeConfig = JSON.parse(data);
      
      // Merge with current config
      this.updateConfig(runtimeConfig);
      console.log('✅ Runtime configuration loaded');
      
      return runtimeConfig;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn('⚠️ Failed to load runtime config:', error.message);
      }
      return null;
    }
  }

  /**
   * Save current configuration to file
   */
  async saveRuntimeConfig() {
    try {
      const configToSave = {
        EVENT: this.config.EVENT,
        CAMERA: this.config.CAMERA,
        PERFORMANCE: this.config.PERFORMANCE,
        NOTIFICATIONS: this.config.NOTIFICATIONS,
        lastUpdated: new Date().toISOString()
      };

      await fs.writeFile(this.configFile, JSON.stringify(configToSave, null, 2));
      console.log('✅ Runtime configuration saved');
    } catch (error) {
      console.error('❌ Failed to save runtime config:', error.message);
    }
  }

  /**
   * Update configuration with validation
   */
  updateConfig(updates) {
    const oldConfig = { ...this.config };
    
    // Validate updates
    const validationErrors = this.validateUpdates(updates);
    if (validationErrors.length > 0) {
      throw new Error(`Configuration validation failed: ${validationErrors.join(', ')}`);
    }

    // Apply updates
    Object.keys(updates).forEach(key => {
      if (this.config[key] && typeof this.config[key] === 'object') {
        this.config[key] = { ...this.config[key], ...updates[key] };
      } else {
        this.config[key] = updates[key];
      }
    });

    // Notify listeners
    this.notifyListeners('config_updated', { oldConfig, newConfig: this.config, updates });
    
    console.log('📝 Configuration updated:', Object.keys(updates));
  }

  /**
   * Validate configuration updates
   */
  validateUpdates(updates) {
    const errors = [];

    // Validate EVENT updates
    if (updates.EVENT) {
      if (updates.EVENT.ID && updates.EVENT.ID.length < 3) {
        errors.push('Event ID must be at least 3 characters');
      }
      if (updates.EVENT.UPLOADER_NAME && updates.EVENT.UPLOADER_NAME.length < 2) {
        errors.push('Uploader name must be at least 2 characters');
      }
    }

    // Validate CAMERA updates
    if (updates.CAMERA) {
      if (updates.CAMERA.WATCH_FOLDER && !path.isAbsolute(updates.CAMERA.WATCH_FOLDER)) {
        errors.push('Watch folder must be an absolute path');
      }
      if (updates.CAMERA.CONNECTION_CHECK_INTERVAL && updates.CAMERA.CONNECTION_CHECK_INTERVAL < 5000) {
        errors.push('Connection check interval must be at least 5 seconds');
      }
    }

    // Validate PERFORMANCE updates
    if (updates.PERFORMANCE) {
      if (updates.PERFORMANCE.batchSize && updates.PERFORMANCE.batchSize > 10) {
        errors.push('Batch size should not exceed 10');
      }
      if (updates.PERFORMANCE.stabilityThreshold && updates.PERFORMANCE.stabilityThreshold < 500) {
        errors.push('Stability threshold should be at least 500ms');
      }
    }

    // Validate API updates
    if (updates.API) {
      if (updates.API.BASE_URL && !updates.API.BASE_URL.startsWith('http')) {
        errors.push('API base URL must start with http or https');
      }
      if (updates.API.TIMEOUT && updates.API.TIMEOUT < 5000) {
        errors.push('API timeout should be at least 5 seconds');
      }
    }

    return errors;
  }

  /**
   * Get configuration value by path
   */
  get(path) {
    const keys = path.split('.');
    let value = this.config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Set configuration value by path
   */
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = this.config;
    
    for (const key of keys) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }
    
    const oldValue = target[lastKey];
    target[lastKey] = value;
    
    // Notify listeners
    this.notifyListeners('config_changed', { path, oldValue, newValue: value });
    
    console.log(`📝 Config updated: ${path} = ${value}`);
  }

  /**
   * Add configuration change listener
   */
  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove configuration change listener
   */
  removeListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Notify listeners
   */
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ Error in config listener:', error);
        }
      });
    }
  }

  /**
   * Get configuration summary
   */
  getSummary() {
    return {
      camera: {
        model: this.config.CAMERA.MODEL,
        watchFolder: this.config.CAMERA.WATCH_FOLDER,
        autoDetect: this.config.CAMERA.AUTO_DETECT
      },
      event: {
        id: this.config.EVENT.ID,
        uploader: this.config.EVENT.UPLOADER_NAME,
        album: this.config.EVENT.ALBUM_NAME
      },
      performance: {
        profile: this.config.PERFORMANCE.PROFILE,
        batchSize: this.config.PERFORMANCE.batchSize,
        stabilityThreshold: this.config.PERFORMANCE.stabilityThreshold
      },
      api: {
        baseUrl: this.config.API.BASE_URL,
        timeout: this.config.API.TIMEOUT
      },
      notifications: {
        enabled: this.config.NOTIFICATIONS.ENABLED,
        localLogging: this.config.NOTIFICATIONS.LOCAL_LOGGING,
        milestones: this.config.NOTIFICATIONS.MILESTONES
      },
      storage: {
        enableBackup: this.config.STORAGE.ENABLE_BACKUP,
        backupFolder: this.config.STORAGE.BACKUP_FOLDER,
        maxBackupSizeGB: this.config.STORAGE.MAX_BACKUP_SIZE_GB
      }
    };
  }

  /**
   * Export configuration for backup
   */
  exportConfig() {
    return {
      config: this.config,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * Import configuration from backup
   */
  importConfig(configData) {
    if (!configData.config) {
      throw new Error('Invalid configuration data');
    }

    const validationErrors = this.validateUpdates(configData.config);
    if (validationErrors.length > 0) {
      throw new Error(`Configuration validation failed: ${validationErrors.join(', ')}`);
    }

    this.config = { ...configData.config };
    this.notifyListeners('config_imported', { configData });
    
    console.log('✅ Configuration imported successfully');
  }

  /**
   * Reset configuration to defaults
   */
  resetToDefaults() {
    const { config: defaultConfig } = require('../../dslr.config.js');
    this.config = { ...defaultConfig };
    this.notifyListeners('config_reset', { config: this.config });
    
    console.log('🔄 Configuration reset to defaults');
  }

  /**
   * Auto-detect camera configuration
   */
  async autoDetectCamera() {
    const { getCameraConfig } = require('../../dslr.config.js');
    
    try {
      // Try to detect camera by checking common folders
      const cameraModels = ['NIKON_D7100', 'CANON_EOS', 'SONY_ALPHA'];
      
      for (const model of cameraModels) {
        const cameraConfig = getCameraConfig(model);
        try {
          await fs.access(cameraConfig.WATCH_FOLDER);
          
          // Camera found, update configuration
          this.updateConfig({
            CAMERA: {
              MODEL: model,
              WATCH_FOLDER: cameraConfig.WATCH_FOLDER
            }
          });
          
          console.log(`📷 Auto-detected camera: ${model} at ${cameraConfig.WATCH_FOLDER}`);
          return model;
        } catch (error) {
          // Camera not found, continue
        }
      }
      
      console.log('📷 No camera auto-detected, using default configuration');
      return null;
    } catch (error) {
      console.error('❌ Error during camera auto-detection:', error);
      return null;
    }
  }
}

module.exports = { DSLRConfigManager };