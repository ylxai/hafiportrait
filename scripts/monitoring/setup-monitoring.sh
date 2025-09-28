#!/bin/bash

# 🚀 HafiPortrait Monitoring Setup Script
# Complete monitoring system installation and configuration

set -e

echo "🚀 HafiPortrait Monitoring Setup"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_warning "Running as root. Some operations may require non-root user."
    fi
}

# Check system requirements
check_requirements() {
    log_info "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check npm/pnpm
    if ! command -v pnpm &> /dev/null && ! command -v npm &> /dev/null; then
        log_error "Neither pnpm nor npm is installed."
        exit 1
    fi
    
    # Check system tools
    local tools=("curl" "wget" "ps" "top" "free" "df" "ping")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_warning "$tool is not available. Some monitoring features may not work."
        fi
    done
    
    log_success "System requirements check completed"
}

# Create monitoring directories
create_directories() {
    log_info "Creating monitoring directories..."
    
    local dirs=(
        "logs"
        "logs/monitoring"
        "logs/alerts"
        "monitoring"
        "monitoring/config"
        "monitoring/scripts"
        "monitoring/data"
    )
    
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_success "Created directory: $dir"
        else
            log_info "Directory already exists: $dir"
        fi
    done
}

# Setup monitoring configuration
setup_monitoring_config() {
    log_info "Setting up monitoring configuration..."
    
    # Create monitoring configuration file
    cat > monitoring/config/monitoring.json << 'EOF'
{
  "monitoring": {
    "enabled": true,
    "interval": 60000,
    "retentionDays": 30,
    "alertCooldown": 300000
  },
  "thresholds": {
    "cpu": {
      "warning": 70,
      "critical": 85
    },
    "memory": {
      "warning": 80,
      "critical": 90
    },
    "storage": {
      "warning": 85,
      "critical": 95
    },
    "responseTime": {
      "warning": 1000,
      "critical": 2000
    },
    "errorRate": {
      "warning": 5,
      "critical": 10
    }
  },
  "notifications": {
    "slack": {
      "enabled": false,
      "webhook": "",
      "channel": "#alerts"
    },
    "email": {
      "enabled": false,
      "smtp": {
        "host": "",
        "port": 587,
        "secure": false,
        "auth": {
          "user": "",
          "pass": ""
        }
      },
      "from": "alerts@hafiportrait.com",
      "to": []
    }
  }
}
EOF
    
    log_success "Monitoring configuration created"
}

# Setup PM2 process manager
setup_pm2() {
    log_info "Setting up PM2 process manager..."
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        log_info "Installing PM2..."
        if command -v pnpm &> /dev/null; then
            pnpm add -g pm2
        else
            npm install -g pm2
        fi
    fi
    
    # Create PM2 ecosystem file
    cat > ecosystem.monitoring.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'hafiportrait-monitoring',
      script: './scripts/monitoring/automated-monitoring.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      log_file: './logs/monitoring/pm2.log',
      out_file: './logs/monitoring/pm2-out.log',
      error_file: './logs/monitoring/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
EOF
    
    log_success "PM2 ecosystem configuration created"
}

# Setup monitoring scripts
setup_monitoring_scripts() {
    log_info "Setting up monitoring scripts..."
    
    # Create monitoring start script
    cat > monitoring/scripts/start-monitoring.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting HafiPortrait Monitoring..."
cd "$(dirname "$0")/../.."
node scripts/monitoring/automated-monitoring.js &
echo "✅ Monitoring started successfully"
EOF
    
    # Create monitoring stop script
    cat > monitoring/scripts/stop-monitoring.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping HafiPortrait Monitoring..."
pkill -f "automated-monitoring.js"
echo "✅ Monitoring stopped successfully"
EOF
    
    # Make scripts executable
    chmod +x monitoring/scripts/*.sh
    
    log_success "Monitoring scripts created"
}

# Main setup function
main() {
    echo ""
    log_info "Starting HafiPortrait monitoring setup..."
    echo ""
    
    check_root
    check_requirements
    create_directories
    setup_monitoring_config
    setup_monitoring_scripts
    setup_pm2
    
    echo ""
    log_success "🎉 Monitoring setup completed successfully!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Configure notification channels in monitoring/config/monitoring.json"
    echo "2. Start monitoring with: pm2 start ecosystem.monitoring.config.js"
    echo "3. Access dashboard at: http://your-domain.com/admin"
    echo ""
}

# Run main function
main "$@"