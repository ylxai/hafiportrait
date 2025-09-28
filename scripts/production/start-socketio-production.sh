#!/bin/bash

# ===================================
# Socket.IO Production Starter
# Untuk VPS HafiPortrait Photography
# ===================================

echo "🚀 Starting Socket.IO Server for Production..."

# Create logs directory
mkdir -p logs

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally..."
    npm install -g pm2
fi

# Stop existing Socket.IO process if running
echo "🔄 Stopping existing Socket.IO processes..."
pm2 stop hafiportrait-socketio 2>/dev/null || true
pm2 delete hafiportrait-socketio 2>/dev/null || true

# Start Socket.IO server with PM2
echo "🎯 Starting Socket.IO server on port 3001..."
pm2 start ecosystem.config.js --only hafiportrait-socketio

# Show status
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "✅ Socket.IO Server Started!"
echo "🌐 Public URL: http://74.63.10.103:3001"
echo "🔗 Health Check: http://74.63.10.103:3001/health"
echo ""
echo "📝 Useful Commands:"
echo "   pm2 logs hafiportrait-socketio  # View logs"
echo "   pm2 restart hafiportrait-socketio  # Restart"
echo "   pm2 stop hafiportrait-socketio  # Stop"
echo "   pm2 monit  # Monitor dashboard"
echo ""

# Test health endpoint
echo "🔍 Testing health endpoint..."
sleep 3
curl -s http://74.63.10.103:3001/health | jq . 2>/dev/null || curl -s http://74.63.10.103:3001/health

echo ""
echo "🎉 Socket.IO Production Setup Complete!"