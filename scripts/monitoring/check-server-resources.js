#!/usr/bin/env node

/**
 * Server Resource Usage Checker
 * Monitors CPU, Memory, Disk, and Network usage
 */

const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class ServerResourceMonitor {
  constructor() {
    this.startTime = Date.now();
  }

  // Get CPU usage
  getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (let type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    return {
      cores: cpus.length,
      model: cpus[0].model,
      usage: usage,
      loadAverage: os.loadavg()
    };
  }

  // Get Memory usage
  getMemoryUsage() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      total: this.formatBytes(totalMem),
      used: this.formatBytes(usedMem),
      free: this.formatBytes(freeMem),
      usagePercent: ((usedMem / totalMem) * 100).toFixed(2),
      totalBytes: totalMem,
      usedBytes: usedMem,
      freeBytes: freeMem
    };
  }

  // Get Node.js process memory
  getProcessMemory() {
    const memUsage = process.memoryUsage();
    
    return {
      rss: this.formatBytes(memUsage.rss), // Resident Set Size
      heapTotal: this.formatBytes(memUsage.heapTotal),
      heapUsed: this.formatBytes(memUsage.heapUsed),
      external: this.formatBytes(memUsage.external),
      arrayBuffers: this.formatBytes(memUsage.arrayBuffers || 0)
    };
  }

  // Get Disk usage
  async getDiskUsage() {
    try {
      const stats = await fs.stat('.');
      const workspaceSize = await this.getDirectorySize('.');
      
      // Try to get disk space (Linux/Mac)
      let diskInfo = null;
      try {
        if (process.platform !== 'win32') {
          const dfOutput = execSync('df -h .', { encoding: 'utf8' });
          const lines = dfOutput.split('\n');
          if (lines.length > 1) {
            const parts = lines[1].split(/\s+/);
            diskInfo = {
              filesystem: parts[0],
              size: parts[1],
              used: parts[2],
              available: parts[3],
              usePercent: parts[4],
              mountPoint: parts[5]
            };
          }
        }
      } catch (error) {
        console.warn('Could not get disk info:', error.message);
      }

      return {
        workspaceSize: this.formatBytes(workspaceSize),
        workspaceSizeBytes: workspaceSize,
        diskInfo
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Get directory size recursively
  async getDirectorySize(dirPath) {
    let totalSize = 0;
    
    try {
      const items = await fs.readdir(dirPath);
      
      for (const item of items) {
        // Skip node_modules and .git for performance
        if (item === 'node_modules' || item === '.git' || item === '.next') {
          continue;
        }
        
        const itemPath = path.join(dirPath, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          totalSize += await this.getDirectorySize(itemPath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
    
    return totalSize;
  }

  // Get Network info
  getNetworkInfo() {
    const interfaces = os.networkInterfaces();
    const networkInfo = {};
    
    Object.keys(interfaces).forEach(name => {
      const iface = interfaces[name];
      networkInfo[name] = iface.filter(details => {
        return details.family === 'IPv4' && !details.internal;
      });
    });
    
    return networkInfo;
  }

  // Get system uptime
  getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      hostname: os.hostname(),
      uptime: this.formatUptime(os.uptime()),
      nodeVersion: process.version,
      processUptime: this.formatUptime(process.uptime())
    };
  }

  // Check specific application resources
  async getApplicationResources() {
    const resources = {
      nodeModulesSize: 0,
      nextBuildSize: 0,
      publicAssetsSize: 0,
      srcCodeSize: 0,
      totalProjectSize: 0
    };

    try {
      // Check node_modules size
      try {
        resources.nodeModulesSize = await this.getDirectorySize('./node_modules');
      } catch (error) {
        console.warn('Could not check node_modules size');
      }

      // Check .next build size
      try {
        resources.nextBuildSize = await this.getDirectorySize('./.next');
      } catch (error) {
        console.warn('Could not check .next build size');
      }

      // Check public assets
      try {
        resources.publicAssetsSize = await this.getDirectorySize('./public');
      } catch (error) {
        console.warn('Could not check public assets size');
      }

      // Check src code size
      try {
        resources.srcCodeSize = await this.getDirectorySize('./src');
      } catch (error) {
        console.warn('Could not check src code size');
      }

      // Total project size
      resources.totalProjectSize = await this.getDirectorySize('.');

      // Format sizes
      Object.keys(resources).forEach(key => {
        if (typeof resources[key] === 'number') {
          resources[key] = {
            bytes: resources[key],
            formatted: this.formatBytes(resources[key])
          };
        }
      });

    } catch (error) {
      console.error('Error checking application resources:', error);
    }

    return resources;
  }

  // Format bytes to human readable
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Format uptime
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  }

  // Generate recommendations
  generateRecommendations(resources) {
    const recommendations = [];
    const warnings = [];
    const critical = [];

    // Memory recommendations
    const memUsage = parseFloat(resources.memory.usagePercent);
    if (memUsage > 90) {
      critical.push('🔴 CRITICAL: Memory usage > 90% - Immediate action required');
    } else if (memUsage > 80) {
      warnings.push('🟡 WARNING: Memory usage > 80% - Consider optimization');
    } else if (memUsage > 70) {
      recommendations.push('💡 Memory usage > 70% - Monitor closely');
    }

    // CPU recommendations
    if (resources.cpu.usage > 90) {
      critical.push('🔴 CRITICAL: CPU usage > 90% - Performance severely impacted');
    } else if (resources.cpu.usage > 80) {
      warnings.push('🟡 WARNING: CPU usage > 80% - Consider load balancing');
    }

    // Disk recommendations
    if (resources.disk.diskInfo && resources.disk.diskInfo.usePercent) {
      const diskUsage = parseInt(resources.disk.diskInfo.usePercent);
      if (diskUsage > 90) {
        critical.push('🔴 CRITICAL: Disk usage > 90% - Clean up required');
      } else if (diskUsage > 80) {
        warnings.push('🟡 WARNING: Disk usage > 80% - Monitor space');
      }
    }

    // Application-specific recommendations
    const appResources = resources.application;
    
    // Node modules size check
    if (appResources.nodeModulesSize.bytes > 500 * 1024 * 1024) { // 500MB
      recommendations.push('📦 Large node_modules detected - Consider dependency audit');
    }

    // Build size check
    if (appResources.nextBuildSize.bytes > 100 * 1024 * 1024) { // 100MB
      recommendations.push('🏗️ Large build size - Consider code splitting and optimization');
    }

    // Process memory check
    const processHeapUsed = resources.processMemory.heapUsed;
    if (processHeapUsed.includes('GB')) {
      warnings.push('🟡 High Node.js heap usage - Check for memory leaks');
    }

    return { recommendations, warnings, critical };
  }

  // Main monitoring function
  async monitor() {
    console.log('🔍 HafiPortrait Photography - Server Resource Monitor\n');
    console.log('=' .repeat(60));

    const resources = {
      timestamp: new Date().toISOString(),
      system: this.getSystemInfo(),
      cpu: this.getCPUUsage(),
      memory: this.getMemoryUsage(),
      processMemory: this.getProcessMemory(),
      disk: await this.getDiskUsage(),
      network: this.getNetworkInfo(),
      application: await this.getApplicationResources()
    };

    // Display results
    this.displayResults(resources);

    // Generate and display recommendations
    const analysis = this.generateRecommendations(resources);
    this.displayRecommendations(analysis);

    return resources;
  }

  displayResults(resources) {
    console.log('\n📊 SYSTEM INFORMATION:');
    console.log(`Platform: ${resources.system.platform} ${resources.system.arch}`);
    console.log(`Node.js: ${resources.system.nodeVersion}`);
    console.log(`Hostname: ${resources.system.hostname}`);
    console.log(`System Uptime: ${resources.system.uptime}`);
    console.log(`Process Uptime: ${resources.system.processUptime}`);

    console.log('\n🖥️  CPU USAGE:');
    console.log(`Cores: ${resources.cpu.cores}`);
    console.log(`Model: ${resources.cpu.model}`);
    console.log(`Usage: ${resources.cpu.usage}%`);
    console.log(`Load Average: ${resources.cpu.loadAverage.map(l => l.toFixed(2)).join(', ')}`);

    console.log('\n💾 MEMORY USAGE:');
    console.log(`Total: ${resources.memory.total}`);
    console.log(`Used: ${resources.memory.used} (${resources.memory.usagePercent}%)`);
    console.log(`Free: ${resources.memory.free}`);

    console.log('\n🔧 PROCESS MEMORY:');
    console.log(`RSS: ${resources.processMemory.rss}`);
    console.log(`Heap Total: ${resources.processMemory.heapTotal}`);
    console.log(`Heap Used: ${resources.processMemory.heapUsed}`);
    console.log(`External: ${resources.processMemory.external}`);

    console.log('\n💿 DISK USAGE:');
    console.log(`Workspace Size: ${resources.disk.workspaceSize}`);
    if (resources.disk.diskInfo) {
      console.log(`Disk: ${resources.disk.diskInfo.used}/${resources.disk.diskInfo.size} (${resources.disk.diskInfo.usePercent})`);
      console.log(`Available: ${resources.disk.diskInfo.available}`);
    }

    console.log('\n📱 APPLICATION RESOURCES:');
    console.log(`Source Code: ${resources.application.srcCodeSize.formatted}`);
    console.log(`Node Modules: ${resources.application.nodeModulesSize.formatted}`);
    console.log(`Build (.next): ${resources.application.nextBuildSize.formatted}`);
    console.log(`Public Assets: ${resources.application.publicAssetsSize.formatted}`);
    console.log(`Total Project: ${resources.application.totalProjectSize.formatted}`);
  }

  displayRecommendations(analysis) {
    console.log('\n' + '=' .repeat(60));
    console.log('📋 ANALYSIS & RECOMMENDATIONS:');

    if (analysis.critical.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      analysis.critical.forEach(item => console.log(`  ${item}`));
    }

    if (analysis.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      analysis.warnings.forEach(item => console.log(`  ${item}`));
    }

    if (analysis.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      analysis.recommendations.forEach(item => console.log(`  ${item}`));
    }

    if (analysis.critical.length === 0 && analysis.warnings.length === 0) {
      console.log('\n✅ System resources are within normal limits');
    }

    console.log('\n🎯 OPTIMIZATION SUGGESTIONS:');
    console.log('  📦 Run `npm audit` to check for vulnerable dependencies');
    console.log('  🧹 Run `npm prune` to remove unused packages');
    console.log('  🗜️  Consider enabling gzip compression for static assets');
    console.log('  🖼️  Optimize images using WebP format where possible');
    console.log('  ⚡ Implement lazy loading for non-critical components');
    console.log('  📊 Monitor resource usage regularly during peak hours');
  }
}

// Run the monitor
if (require.main === module) {
  const monitor = new ServerResourceMonitor();
  monitor.monitor().catch(console.error);
}

module.exports = ServerResourceMonitor;