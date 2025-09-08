# 📁 Scripts Directory Organization

## 📂 Directory Structure

### 🤖 `ci-cd/` - CI/CD & GitHub Actions
- `auto-merge-dev-to-main.sh` - Basic auto-merge from dev to main
- `smart-auto-merge.sh` - Advanced auto-merge with health checks
- `deploy-production.sh` - Production deployment script
- `deploy.sh` - General deployment script
- `export-env-for-github-secrets.sh` - Export env vars for GitHub Secrets
- `github-secrets-batch-add.sh` - Batch add secrets to GitHub
- `test-circleci-api.sh` - CircleCI API testing (legacy)
- `validate-circleci-config.js` - CircleCI config validation (legacy)

### 🔧 `development/` - Development & Environment
- `auto-env-switcher.js` - Automatic environment switching
- `env-detector.js` - Environment detection utility
- `env-status.js` - Environment status checker
- `setup-dev-env.js` - Development environment setup
- `setup-enhanced-env.js` - Enhanced environment setup
- `setup-prod-env.js` - Production environment setup
- `setup-staging-env.js` - Staging environment setup
- `check-missing-env-vars.sh` - Check for missing environment variables

### 📊 `monitoring/` - Monitoring & Health
- `alert-manager.js` - Alert management system
- `automated-monitoring.js` - Automated monitoring setup
- `enhanced-health-monitor.js` - Enhanced health monitoring
- `health-check.sh` - Basic health check script
- `monitor-zeabur-socketio.js` - Zeabur Socket.IO monitoring
- `realtime-performance-monitor.js` - Real-time performance monitoring
- `setup-monitoring.sh` - Monitoring system setup
- `check-server-resources.js` - Server resource monitoring


### 🗄️ `database/` - Database & Storage
- `add-event-status-columns.sql` - Database schema update
- `create-session-monitoring-tables.sql` - Session monitoring tables
- `update-database-schema.sql` - General schema updates
- `setup-cloud-storage.js` - Cloud storage configuration

### 🛠️ `utils/` - Utilities & Testing
- `cleanup*.sh` - Various cleanup scripts
- `clean-all-and-test.sh` - Complete cleanup and test
- `fast-build-test.sh` - Fast build testing
- `quick-test.sh` - Quick testing script
- `setup-cloudflare-pages.js` - Cloudflare Pages setup
- `setup-external-websocket.js` - External WebSocket setup
- `start-*.js` - Various startup scripts
- `test-*.sh` - Various testing scripts
- `integrate-external-websocket.js` - WebSocket integration

## 🚀 Quick Usage

### Development Workflow
```bash
# Environment setup
bash scripts/development/setup-dev-env.js

# Check environment status
node scripts/development/env-status.js

# Auto-merge to production
bash scripts/ci-cd/smart-auto-merge.sh
```

### Monitoring & Health
```bash
# Start monitoring
bash scripts/monitoring/setup-monitoring.sh

# Health check
bash scripts/monitoring/health-check.sh

# Check server resources
node scripts/monitoring/check-server-resources.js
```

### CI/CD Operations
```bash
# Export GitHub Secrets
bash scripts/ci-cd/export-env-for-github-secrets.sh

# Batch add secrets
bash scripts/ci-cd/github-secrets-batch-add.sh

# Deploy to production
bash scripts/ci-cd/deploy-production.sh
```

## ⚠️ Important Notes

- All scripts maintain their original functionality
- Paths in GitHub Actions and other references need to be updated
- Scripts are organized by primary function
- Cross-category dependencies are documented below

## 🔗 Dependencies & References

### GitHub Actions References
- `.github/workflows/ci-cd.yml` uses `scripts/ci-cd/deploy-production.sh`

### Package.json References
- Check `package.json` scripts section for any script references

### Internal Script Dependencies
- Some scripts may reference other scripts - check before moving