# 🚀 Hafiportrait Photography Platform - Production Deployment

## 📁 Deployment Structure

```
deployment/
├── README.md                           # This file
├── PRODUCTION-SETUP-COMPLETE.md        # Complete setup checklist
├── nginx/                              # Nginx configurations
│   ├── hafiportrait.photography.conf   # Main domain config
│   └── socketio.hafiportrait.photography.conf  # Socket.IO config
├── redis/                              # Redis configurations
│   ├── redis.production.conf           # Production Redis config
│   ├── install-redis-vps.sh           # Redis installation script
│   ├── health-check.sh                # Redis health check
│   └── backup-redis.sh                # Redis backup script
└── scripts/                            # Deployment scripts
    ├── health-check.sh                # System health check
    └── ssl-setup.sh                   # SSL certificate setup
```

## ✅ Setup Status

### Infrastructure
- ✅ **Redis Server**: Running with authentication
- ✅ **Nginx Server**: Configured for 2 domains
- ✅ **Firewall (UFW)**: Properly secured
- ✅ **SSL Ready**: Certbot installed
- ✅ **Environment**: Production variables configured

### Configuration Files Applied
- ✅ `/etc/nginx/sites-available/hafiportrait.photography`
- ✅ `/etc/nginx/sites-available/socketio.hafiportrait.photography`
- ✅ `/etc/redis/redis.conf` (with authentication)
- ✅ `.env.production` (Redis password configured)

## 🎯 Quick Start

### 1. Run Health Check
```bash
bash deployment/scripts/health-check.sh
```

### 2. Build Application
```bash
npm run build
```

### 3. Start Services with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. Configure DNS Records
Point your domains to this VPS IP:
```
A Record: hafiportrait.photography → YOUR_VPS_IP
A Record: www.hafiportrait.photography → YOUR_VPS_IP
A Record: socketio.hafiportrait.photography → YOUR_VPS_IP
```

### 5. Setup SSL Certificates
```bash
sudo bash deployment/scripts/ssl-setup.sh
```

## 🔐 Security Information

### Redis Password
```
Gtdd09BOfKm0+PZLtrHWjTMdojJLVS+WLVtAhDzq30M=
```

**Test Redis:**
```bash
redis-cli -a "Gtdd09BOfKm0+PZLtrHWjTMdojJLVS+WLVtAhDzq30M=" ping
```

### Firewall Ports
- ✅ Port 22 (SSH) - Open
- ✅ Port 80 (HTTP) - Open
- ✅ Port 443 (HTTPS) - Open
- ❌ Port 6379 (Redis) - Closed (localhost only)

## 📊 Monitoring

### System Health Check
```bash
bash deployment/scripts/health-check.sh
```

### Service Status
```bash
# Nginx
sudo systemctl status nginx

# Redis
sudo systemctl status redis-server

# PM2 Applications
pm2 status
pm2 logs
```

### Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/hafiportrait_access.log
sudo tail -f /var/log/nginx/socketio_access.log

# Error logs
sudo tail -f /var/log/nginx/hafiportrait_error.log
sudo tail -f /var/log/nginx/socketio_error.log
```

### Redis Monitoring
```bash
# Connect to Redis CLI
redis-cli -a "Gtdd09BOfKm0+PZLtrHWjTMdojJLVS+WLVtAhDzq30M="

# Check memory usage
redis-cli -a "Gtdd09BOfKm0+PZLtrHWjTMdojJLVS+WLVtAhDzq30M=" INFO memory

# Monitor commands in real-time
redis-cli -a "Gtdd09BOfKm0+PZLtrHWjTMdojJLVS+WLVtAhDzq30M=" MONITOR
```

## 🔧 Common Commands

| Command | Description |
|---------|-------------|
| `sudo systemctl reload nginx` | Reload Nginx config |
| `sudo systemctl restart redis-server` | Restart Redis |
| `sudo nginx -t` | Test Nginx configuration |
| `pm2 restart all` | Restart all PM2 apps |
| `pm2 logs` | View PM2 logs |
| `sudo ufw status` | Check firewall status |

## 📚 Documentation

For complete setup instructions, see:
- **[PRODUCTION-SETUP-COMPLETE.md](./PRODUCTION-SETUP-COMPLETE.md)** - Full deployment checklist

For Redis-specific documentation, see:
- **[redis/README.md](./redis/README.md)** - Redis configuration guide

## 🆘 Troubleshooting

### Nginx Issues
```bash
sudo nginx -t                    # Test configuration
sudo tail -50 /var/log/nginx/error.log  # Check errors
sudo systemctl restart nginx     # Restart service
```

### Redis Issues
```bash
sudo systemctl status redis-server
sudo tail -50 /var/log/redis/redis-server.log
redis-cli -a "PASSWORD" ping
```

### Application Issues
```bash
pm2 list                         # List all processes
pm2 logs [app-name]             # View app logs
pm2 restart [app-name]          # Restart specific app
```

## 🎉 Production Ready!

Your VPS is fully configured and ready for production deployment!

**Next Steps:**
1. ✅ Configure DNS records
2. ✅ Run SSL setup script
3. ✅ Start your application
4. ✅ Monitor and enjoy! 🚀
