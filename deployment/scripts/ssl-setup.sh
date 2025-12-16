#!/bin/bash
# =============================================================================
# SSL Certificate Setup Script for Hafiportrait Photography Platform
# =============================================================================

echo "🔒 SSL Certificate Setup"
echo "========================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

echo "📋 Prerequisites Check:"
echo "   ✓ Certbot installed"
echo "   ✓ Nginx configured"
echo "   ✓ Firewall allows ports 80 & 443"
echo ""

echo "⚠️  IMPORTANT: Before running this script:"
echo "   1. Ensure DNS records are pointed to this server:"
echo "      - hafiportrait.photography → Server IP"
echo "      - www.hafiportrait.photography → Server IP"
echo "      - socketio.hafiportrait.photography → Server IP"
echo ""
echo "   2. Make sure Next.js app is running on port 3000"
echo "   3. Make sure Socket.IO server is running on port 3001"
echo ""

read -p "Are DNS records configured correctly? (yes/no): " DNS_READY

if [ "$DNS_READY" != "yes" ]; then
    echo "❌ Please configure DNS first, then run this script again."
    exit 1
fi

echo ""
echo "🎯 Obtaining SSL certificates..."
echo ""

# Get certificate for main domain and www subdomain
echo "📝 Main domain: hafiportrait.photography"
certbot --nginx -d hafiportrait.photography -d www.hafiportrait.photography

# Get certificate for socketio subdomain
echo ""
echo "📝 Socket.IO subdomain: socketio.hafiportrait.photography"
certbot --nginx -d socketio.hafiportrait.photography

echo ""
echo "✅ SSL certificate setup complete!"
echo ""
echo "📌 Next steps:"
echo "   1. Test HTTPS access: https://hafiportrait.photography"
echo "   2. Test Socket.IO: https://socketio.hafiportrait.photography"
echo "   3. Certificates will auto-renew via certbot timer"
echo ""
echo "🔄 Auto-renewal status:"
systemctl status certbot.timer --no-pager | head -5
