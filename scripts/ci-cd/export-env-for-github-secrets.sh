#!/bin/bash

# Script to export environment variables for GitHub Secrets
# This will help you quickly add all env vars to GitHub repository secrets

echo "🔐 HafiPortrait - GitHub Secrets Export Helper"
echo "=============================================="
echo ""

# Function to process env file
process_env_file() {
    local env_file=$1
    local env_name=$2
    
    if [ -f "$env_file" ]; then
        echo "📁 Processing $env_name ($env_file):"
        echo "-----------------------------------"
        
        # Read and format env vars for GitHub Secrets
        while IFS= read -r line; do
            # Skip comments and empty lines
            if [[ $line =~ ^[[:space:]]*# ]] || [[ -z "${line// }" ]]; then
                continue
            fi
            
            # Extract key=value pairs
            if [[ $line =~ ^[[:space:]]*([^=]+)=(.*)$ ]]; then
                key="${BASH_REMATCH[1]// /}"
                value="${BASH_REMATCH[2]}"
                
                # Remove quotes if present
                value=$(echo "$value" | sed 's/^["'\'']//' | sed 's/["'\'']$//')
                
                echo "Secret Name: $key"
                echo "Secret Value: $value"
                echo ""
            fi
        done < "$env_file"
        echo ""
    else
        echo "❌ $env_file not found"
        echo ""
    fi
}

# Check for different env files
echo "🔍 Scanning for environment files..."
echo ""

# Process production env
process_env_file ".env.local" "Local Environment"
process_env_file ".env.production" "Production Environment" 
process_env_file ".env" "Default Environment"

echo "📋 GitHub CLI Commands (if you have gh CLI installed):"
echo "======================================================"
echo ""

# Generate GitHub CLI commands
if [ -f ".env.local" ]; then
    echo "# From .env.local:"
    while IFS= read -r line; do
        if [[ $line =~ ^[[:space:]]*([^=]+)=(.*)$ ]] && [[ ! $line =~ ^[[:space:]]*# ]]; then
            key="${BASH_REMATCH[1]// /}"
            value="${BASH_REMATCH[2]}"
            value=$(echo "$value" | sed 's/^["'\'']//' | sed 's/["'\'']$//')
            echo "gh secret set $key --body \"$value\""
        fi
    done < ".env.local"
    echo ""
fi

echo "🌐 Manual Setup Instructions:"
echo "============================="
echo "1. Go to: https://github.com/ylxai/hafiportrait/settings/secrets/actions"
echo "2. Click 'New repository secret'"
echo "3. Copy each Secret Name and Secret Value from above"
echo "4. Add them one by one"
echo ""
echo "✅ Done! Your GitHub Secrets will be ready for CI/CD pipeline."