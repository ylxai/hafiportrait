# 🔄 HafiPortrait Production Rollback Guide

## 🚨 Emergency Situations

### **CRITICAL: Site Down (Use This First)**
```bash
# 30-second emergency rollback
bash scripts/ci-cd/quick-rollback.sh
```

### **URGENT: Major Issues**
```bash
# Smart automatic rollback (2-3 minutes)
bash scripts/ci-cd/rollback-production.sh auto
```

### **PLANNED: Controlled Rollback**
```bash
# GitHub-based rollback (5-10 minutes, proper audit trail)
bash scripts/ci-cd/rollback-github.sh
```

## 📋 Rollback Methods Comparison

| Method | Speed | Safety | Audit Trail | Use Case |
|--------|-------|--------|-------------|----------|
| **quick-rollback.sh** | 30s | Medium | No | Site down emergency |
| **rollback-production.sh auto** | 2-3min | High | Yes | Major issues |
| **rollback-github.sh** | 5-10min | Highest | Full | Planned rollback |

## 🛠️ Detailed Usage

### 1. Quick Emergency Rollback
```bash
# Fastest possible rollback
bash scripts/ci-cd/quick-rollback.sh

# What it does:
# - Tries latest backup first
# - Falls back to git HEAD~1
# - Last resort: restart current
```

### 2. Smart Production Rollback
```bash
# Automatic smart rollback
bash scripts/ci-cd/rollback-production.sh auto

# Rollback to specific commit
bash scripts/ci-cd/rollback-production.sh git HEAD~2
bash scripts/ci-cd/rollback-production.sh git abc123

# Use specific backup
bash scripts/ci-cd/rollback-production.sh backup
bash scripts/ci-cd/rollback-production.sh backup .next.backup.20250822_120000

# Emergency mode (no questions)
bash scripts/ci-cd/rollback-production.sh emergency
```

### 3. GitHub-based Rollback
```bash
# Rollback latest commit
bash scripts/ci-cd/rollback-github.sh

# Rollback specific commits
bash scripts/ci-cd/rollback-github.sh HEAD~1
bash scripts/ci-cd/rollback-github.sh HEAD~3
bash scripts/ci-cd/rollback-github.sh abc123def

# What it does:
# - Creates git revert commit
# - Pushes to GitHub main branch
# - Triggers GitHub Actions deployment
# - Monitors deployment progress
```

## 🔍 Troubleshooting

### **Script Not Working?**
```bash
# Check if you're in the right directory
cd /home/ubuntu/stable

# Check script permissions
chmod +x scripts/ci-cd/*.sh

# Manual emergency rollback
git checkout HEAD~1
pm2 restart ecosystem.config.js --env production
```

### **Health Check Failing?**
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs hafiportrait-app --lines 50

# Manual restart
pm2 restart ecosystem.config.js --env production
```

### **Git Issues?**
```bash
# Reset to clean state
git reset --hard HEAD
git clean -fd

# Force checkout
git checkout -f HEAD~1
```

## 📊 Rollback Decision Tree

```
🚨 Is the site completely down?
├─ YES → Use quick-rollback.sh (30 seconds)
└─ NO ↓

⚠️ Are there major functional issues?
├─ YES → Use rollback-production.sh auto (2-3 minutes)
└─ NO ↓

📋 Is this a planned rollback?
├─ YES → Use rollback-github.sh (5-10 minutes)
└─ NO → Monitor and decide later
```

## 🔧 Manual Rollback Commands

### **Fastest Manual Rollback (Emergency)**
```bash
ssh ubuntu@147.251.255.227
cd /home/ubuntu/stable
git checkout HEAD~1
pm2 restart ecosystem.config.js --env production
```

### **Backup-based Manual Rollback**
```bash
ssh ubuntu@147.251.255.227
cd /home/ubuntu/stable
ls -t .next.backup.*  # See available backups
rm -rf .next
cp -r .next.backup.YYYYMMDD_HHMMSS .next
pm2 restart ecosystem.config.js --env production
```

### **GitHub Manual Rollback**
```bash
# From local machine or server
git revert HEAD --no-edit
git push origin main
# Wait 5-10 minutes for GitHub Actions deployment
```

## 📈 Monitoring After Rollback

### **Health Checks**
```bash
# Application health
curl http://localhost:3000/api/health

# PM2 status
pm2 status

# Application logs
pm2 logs hafiportrait-app --lines 20
```

### **URLs to Check**
- **Production**: http://147.251.255.227:3000
- **Health API**: http://147.251.255.227:3000/api/health
- **GitHub Actions**: https://github.com/ylxai/hafiportrait/actions

## 🛡️ Prevention & Best Practices

### **Before Deployment**
1. Test thoroughly in development environment
2. Ensure backups are recent and working
3. Have rollback plan ready
4. Monitor deployment closely

### **After Rollback**
1. Investigate root cause of issues
2. Fix problems in development first
3. Test fixes thoroughly
4. Deploy with extra monitoring

### **Regular Maintenance**
```bash
# Clean old backups (keep last 5)
ls -t .next.backup.* | tail -n +6 | xargs rm -rf

# Check backup integrity
ls -la .next.backup.*

# Test rollback scripts (dry run)
bash scripts/ci-cd/rollback-production.sh help
```

## 🆘 Emergency Contacts

If all rollback methods fail:
1. Check PM2 logs: `pm2 logs`
2. Check system resources: `htop`, `df -h`
3. Restart entire system if needed: `sudo reboot`
4. Contact system administrator

## 📞 Quick Reference

| Situation | Command | Time |
|-----------|---------|------|
| Site down | `bash scripts/ci-cd/quick-rollback.sh` | 30s |
| Major issues | `bash scripts/ci-cd/rollback-production.sh auto` | 2-3min |
| Planned rollback | `bash scripts/ci-cd/rollback-github.sh` | 5-10min |
| Manual emergency | `git checkout HEAD~1 && pm2 restart ecosystem.config.js --env production` | 1min |