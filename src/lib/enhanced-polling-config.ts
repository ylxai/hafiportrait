/**
 * Enhanced Polling Configuration
 * Optimized polling frequencies for better responsiveness when WebSocket is unavailable
 */

import { useEffect } from 'react';

export interface PollingConfig {
  interval: number;
  priority: 'high' | 'medium' | 'low';
  adaptiveScaling: boolean;
  maxInterval: number;
  minInterval: number;
}

export interface ComponentPollingSettings {
  [key: string]: PollingConfig;
}

// Enhanced polling intervals (reduced from original for better responsiveness)
export const ENHANCED_POLLING_CONFIG: ComponentPollingSettings = {
  // High Priority - Critical real-time data
  'backup-status-monitor': {
    interval: 5000,        // 5s (was 30s) - Active backups need frequent updates
    priority: 'high',
    adaptiveScaling: true,
    maxInterval: 15000,    // Max 15s when no active operations
    minInterval: 2000      // Min 2s during active backups
  },
  
  'dslr-monitor': {
    interval: 10000,       // 10s (was 30s) - Camera status important for photographers
    priority: 'high',
    adaptiveScaling: true,
    maxInterval: 30000,    // Max 30s when camera disconnected
    minInterval: 3000      // Min 3s during active uploads
  },
  
  // Medium Priority - Important but less time-sensitive
  'event-backup-manager': {
    interval: 3000,        // 3s during active backup operations
    priority: 'medium',
    adaptiveScaling: true,
    maxInterval: 10000,    // Max 10s when no backup running
    minInterval: 1000      // Min 1s for progress updates
  },
  
  'system-monitor': {
    interval: 30000,       // 30s (was 120s) - System metrics
    priority: 'medium',
    adaptiveScaling: true,
    maxInterval: 60000,    // Max 1min during normal operation
    minInterval: 15000     // Min 15s during high load
  },
  
  // Low Priority - Background data
  'notification-center': {
    interval: 15000,       // 15s for notifications
    priority: 'low',
    adaptiveScaling: false,
    maxInterval: 30000,
    minInterval: 10000
  },
  
  'performance-monitor': {
    interval: 20000,       // 20s for performance metrics
    priority: 'low',
    adaptiveScaling: true,
    maxInterval: 45000,
    minInterval: 10000
  }
};

// Adaptive polling logic
export class AdaptivePollingManager {
  private static instance: AdaptivePollingManager;
  private activeIntervals: Map<string, NodeJS.Timeout> = new Map();
  private currentConfigs: Map<string, PollingConfig> = new Map();
  private wsConnected: boolean = false;
  
  static getInstance(): AdaptivePollingManager {
    if (!AdaptivePollingManager.instance) {
      AdaptivePollingManager.instance = new AdaptivePollingManager();
    }
    return AdaptivePollingManager.instance;
  }
  
  /**
   * Set WebSocket connection status to adjust polling behavior
   */
  setWebSocketStatus(connected: boolean): void {
    this.wsConnected = connected;
    
    // Adjust all active polling intervals based on connection status
    this.currentConfigs.forEach((config, componentId) => {
      if (config.adaptiveScaling) {
        this.adjustPollingInterval(componentId, 'active');
      }
    });
  }
  
  /**
   * Start adaptive polling for a component
   */
  startPolling(
    componentId: string, 
    callback: () => Promise<void> | void,
    customConfig?: Partial<PollingConfig>
  ): void {
    // Stop existing polling if any
    this.stopPolling(componentId);
    
    // Get or create config
    const baseConfig = ENHANCED_POLLING_CONFIG[componentId] || {
      interval: 30000,
      priority: 'medium',
      adaptiveScaling: true,
      maxInterval: 60000,
      minInterval: 10000
    };
    
    const config = { ...baseConfig, ...customConfig };
    this.currentConfigs.set(componentId, config);
    
    // Start polling with initial interval
    const startPollingLoop = () => {
      const interval = setInterval(async () => {
        try {
          await callback();
        } catch (error) {
          console.error(`Polling error for ${componentId}:`, error);
        }
      }, config.interval);
      
      this.activeIntervals.set(componentId, interval);
    };
    
    startPollingLoop();
    console.log(`📊 Started enhanced polling for ${componentId}: ${config.interval}ms`);
  }
  
  /**
   * Stop polling for a component
   */
  stopPolling(componentId: string): void {
    const interval = this.activeIntervals.get(componentId);
    if (interval) {
      clearInterval(interval);
      this.activeIntervals.delete(componentId);
      this.currentConfigs.delete(componentId);
      console.log(`⏹️ Stopped polling for ${componentId}`);
    }
  }
  
  /**
   * Adjust polling interval based on activity and connection status
   */
  adjustPollingInterval(componentId: string, activityLevel: 'idle' | 'active' | 'critical' = 'idle'): void {
    const config = this.currentConfigs.get(componentId);
    if (!config || !config.adaptiveScaling) return;
    
    let newInterval = config.interval;
    
    // Adjust based on WebSocket status
    if (this.wsConnected) {
      // WebSocket available - reduce polling frequency
      newInterval = Math.min(config.maxInterval, config.interval * 2);
    } else {
      // WebSocket unavailable - increase polling frequency based on activity
      switch (activityLevel) {
        case 'critical':
          newInterval = config.minInterval;
          break;
        case 'active':
          newInterval = Math.max(config.minInterval, config.interval * 0.5);
          break;
        case 'idle':
          newInterval = config.maxInterval;
          break;
      }
    }
    
    // Update interval if changed significantly (>20% difference)
    if (Math.abs(newInterval - config.interval) / config.interval > 0.2) {
      config.interval = newInterval;
      
      // Restart polling with new interval
      const callback = this.getCallbackForComponent(componentId);
      if (callback) {
        this.stopPolling(componentId);
        this.startPolling(componentId, callback, config);
      }
    }
  }
  
  /**
   * Get current polling status for all components
   */
  getPollingStatus(): { [componentId: string]: { interval: number; active: boolean; priority: string } } {
    const status: { [componentId: string]: { interval: number; active: boolean; priority: string } } = {};
    
    this.currentConfigs.forEach((config, componentId) => {
      status[componentId] = {
        interval: config.interval,
        active: this.activeIntervals.has(componentId),
        priority: config.priority
      };
    });
    
    return status;
  }
  
  /**
   * Optimize all polling intervals based on system load
   */
  optimizeForSystemLoad(cpuUsage: number, memoryUsage: number): void {
    const isHighLoad = cpuUsage > 80 || memoryUsage > 85;
    
    this.currentConfigs.forEach((config, componentId) => {
      if (config.adaptiveScaling) {
        if (isHighLoad && config.priority === 'low') {
          // Reduce low priority polling during high load
          this.adjustPollingInterval(componentId, 'idle');
        } else if (!isHighLoad && config.priority === 'high') {
          // Increase high priority polling during normal load
          this.adjustPollingInterval(componentId, 'active');
        }
      }
    });
  }
  
  private getCallbackForComponent(componentId: string): (() => Promise<void> | void) | null {
    // This would need to be implemented based on your component architecture
    // For now, return null - components should re-register their callbacks
    return null;
  }
  
  /**
   * Clean up all polling intervals
   */
  cleanup(): void {
    this.activeIntervals.forEach((interval, componentId) => {
      clearInterval(interval);
    });
    this.activeIntervals.clear();
    this.currentConfigs.clear();
  }
}

// Hook for using adaptive polling in React components
export function useAdaptivePolling(
  componentId: string,
  callback: () => Promise<void> | void,
  dependencies: any[] = [],
  customConfig?: Partial<PollingConfig>
) {
  const pollingManager = AdaptivePollingManager.getInstance();
  
  // Start polling when component mounts or dependencies change
  useEffect(() => {
    pollingManager.startPolling(componentId, callback, customConfig);
    
    return () => {
      pollingManager.stopPolling(componentId);
    };
  }, dependencies);
  
  // Return control functions
  return {
    adjustActivity: (level: 'idle' | 'active' | 'critical') => 
      pollingManager.adjustPollingInterval(componentId, level),
    stopPolling: () => pollingManager.stopPolling(componentId),
    getStatus: () => pollingManager.getPollingStatus()[componentId]
  };
}

// Export singleton instance
export const adaptivePollingManager = AdaptivePollingManager.getInstance();