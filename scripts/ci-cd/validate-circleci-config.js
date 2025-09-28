#!/usr/bin/env node

/**
 * 🔍 CircleCI Configuration Validator for HafiPortrait
 * Validates CircleCI config and environment setup
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Required environment variables for CircleCI
const requiredEnvVars = [
  // Core Application
  'NODE_ENV',
  'NEXT_PUBLIC_ENV_MODE',
  'NEXT_PUBLIC_APP_URL',
  
  // Authentication
  'JWT_SECRET',
  'SESSION_SECRET',
  
  // Supabase
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  
  // Cloudflare R2
  'CLOUDFLARE_R2_ACCOUNT_ID',
  'CLOUDFLARE_R2_ACCESS_KEY_ID',
  'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
  'CLOUDFLARE_R2_BUCKET_NAME',
  
  // Socket.IO
  'NEXT_PUBLIC_SOCKETIO_URL',
  'SOCKETIO_PORT',
  
  // Cloudflare Deployment
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID'
];

async function validateCircleCIConfig() {
  log('\n🚀 HafiPortrait CircleCI Configuration Validator', 'cyan');
  log('='.repeat(50), 'cyan');
  
  let hasErrors = false;
  
  // Check if .circleci/config.yml exists
  const configPath = '.circleci/config.yml';
  if (!fs.existsSync(configPath)) {
    logError(`CircleCI config file not found: ${configPath}`);
    hasErrors = true;
  } else {
    logSuccess('CircleCI config file found');
    
    try {
      // Validate YAML syntax
      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = yaml.load(configContent);
      
      logSuccess('CircleCI config YAML syntax is valid');
      
      // Check required sections
      const requiredSections = ['version', 'jobs', 'workflows'];
      requiredSections.forEach(section => {
        if (config[section]) {
          logSuccess(`Required section '${section}' found`);
        } else {
          logError(`Required section '${section}' missing`);
          hasErrors = true;
        }
      });
      
      // Check required jobs
      if (config.jobs) {
        const requiredJobs = ['test', 'build', 'deploy-cloudflare', 'health-check'];
        requiredJobs.forEach(job => {
          if (config.jobs[job]) {
            logSuccess(`Required job '${job}' found`);
          } else {
            logWarning(`Recommended job '${job}' not found`);
          }
        });
      }
      
    } catch (error) {
      logError(`Invalid YAML syntax in CircleCI config: ${error.message}`);
      hasErrors = true;
    }
  }
  
  // Check if env-circleci.md exists
  const envFilePath = 'env-circleci.md';
  if (!fs.existsSync(envFilePath)) {
    logError(`Environment file not found: ${envFilePath}`);
    hasErrors = true;
  } else {
    logSuccess('Environment file found');
    
    // Read and validate environment variables
    const envContent = fs.readFileSync(envFilePath, 'utf8');
    
    log('\n📋 Checking required environment variables:', 'blue');
    requiredEnvVars.forEach(envVar => {
      if (envContent.includes(envVar)) {
        logSuccess(`${envVar} found in env-circleci.md`);
      } else {
        logError(`${envVar} missing in env-circleci.md`);
        hasErrors = true;
      }
    });
  }
  
  // Check package.json scripts
  const packageJsonPath = 'package.json';
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    log('\n📦 Checking package.json scripts:', 'blue');
    const requiredScripts = ['build', 'lint', 'test:db', 'test:storage', 'env:validate'];
    requiredScripts.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        logSuccess(`Script '${script}' found`);
      } else {
        logWarning(`Recommended script '${script}' not found`);
      }
    });
  }
  
  // Check ecosystem.config.js for PM2
  const ecosystemPath = 'ecosystem.config.js';
  if (fs.existsSync(ecosystemPath)) {
    logSuccess('PM2 ecosystem config found');
  } else {
    logWarning('PM2 ecosystem config not found');
  }
  
  // Summary
  log('\n📊 Validation Summary:', 'magenta');
  log('='.repeat(30), 'magenta');
  
  if (hasErrors) {
    logError('Validation failed! Please fix the errors above.');
    log('\n🔧 Next steps:', 'yellow');
    log('1. Fix all errors listed above');
    log('2. Ensure all environment variables are set in CircleCI');
    log('3. Test the configuration with a test commit');
    process.exit(1);
  } else {
    logSuccess('All validations passed!');
    log('\n🎉 Your CircleCI configuration is ready!', 'green');
    log('\n🔗 Next steps:', 'blue');
    log('1. Push your changes to GitHub');
    log('2. Set up environment variables in CircleCI dashboard');
    log('3. Trigger your first build');
    log('4. Monitor the build process');
  }
  
  // Additional recommendations
  log('\n💡 Recommendations:', 'cyan');
  log('• Set up Slack notifications for build status');
  log('• Configure branch protection rules');
  log('• Set up monitoring for deployed application');
  log('• Test the entire pipeline with a feature branch first');
}

// Run validation
validateCircleCIConfig().catch(error => {
  logError(`Validation failed: ${error.message}`);
  process.exit(1);
});