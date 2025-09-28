#!/bin/bash

# GitHub Secrets Batch Add Script
# Requires GitHub CLI (gh) to be installed and authenticated

echo "🚀 GitHub Secrets Batch Add Tool"
echo "================================="
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "📥 Install it with: curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg"
    echo "   Then: echo \"deb [arch=\$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main\" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null"
    echo "   Finally: sudo apt update && sudo apt install gh"
    echo ""
    echo "🔐 Or use the manual method with: bash scripts/export-env-for-github-secrets.sh"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "🔑 Please authenticate with GitHub first:"
    echo "   gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is ready!"
echo ""

# Function to add secrets from env file
add_secrets_from_file() {
    local env_file=$1
    local description=$2
    
    if [ ! -f "$env_file" ]; then
        echo "⚠️  $env_file not found, skipping..."
        return
    fi
    
    echo "📁 Adding secrets from $description ($env_file)..."
    
    local count=0
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
            
            # Skip if value is empty
            if [ -z "$value" ]; then
                echo "⚠️  Skipping $key (empty value)"
                continue
            fi
            
            # Add secret to GitHub
            echo "🔐 Adding secret: $key"
            if gh secret set "$key" --body "$value" 2>/dev/null; then
                echo "✅ Successfully added: $key"
                ((count++))
            else
                echo "❌ Failed to add: $key"
            fi
        fi
    done < "$env_file"
    
    echo "📊 Added $count secrets from $env_file"
    echo ""
}

# Add secrets from different env files
add_secrets_from_file ".env.local" "Local Environment"
add_secrets_from_file ".env.production" "Production Environment"
add_secrets_from_file ".env" "Default Environment"

echo "🎉 Batch secret addition completed!"
echo ""
echo "🔍 Verify your secrets at:"
echo "   https://github.com/ylxai/hafiportrait/settings/secrets/actions"
echo ""
echo "🚀 Your CI/CD pipeline should now have all required environment variables!"