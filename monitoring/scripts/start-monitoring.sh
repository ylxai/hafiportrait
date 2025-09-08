#!/bin/bash
echo "🚀 Starting HafiPortrait Monitoring..."
cd "$(dirname "$0")/../.."
node scripts/automated-monitoring.js &
echo "✅ Monitoring started successfully"
