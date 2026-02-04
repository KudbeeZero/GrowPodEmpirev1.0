#!/bin/bash

# Cloudflare Workers Setup Script
# This script helps configure your Cloudflare Workers deployment

set -e

echo "🚀 GrowPod Empire - Cloudflare Workers Setup"
echo "============================================="
echo ""

# Check if wrangler is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js and npx are installed"
echo ""

# Step 1: Login to Cloudflare
echo "📝 Step 1: Login to Cloudflare"
echo "Running: npx wrangler login"
npx wrangler login
echo ""

# Step 2: Get account ID
echo "📝 Step 2: Get your Cloudflare Account ID"
echo "Running: npx wrangler whoami"
npx wrangler whoami
echo ""
echo "⚠️  Please copy your Account ID from above and update wrangler.toml"
echo ""

# Step 3: Configure D1 Database ID
echo "📝 Step 3: Configure D1 Database ID"
echo ""
echo "You can either:"
echo "  A) Use an existing D1 database ID (if already provided)"
echo "  B) Create a new D1 database"
echo ""
read -p "Do you already have a D1 database ID? (y/n): " has_db_id

if [ "$has_db_id" = "y" ] || [ "$has_db_id" = "Y" ]; then
    echo ""
    echo "Please enter your D1 Database ID (cannot be empty):"
    echo ""
    while true; do
        read -p "D1 Database ID: " db_id_1

        # Ensure the ID is not empty
        if [ -z "$db_id_1" ]; then
            echo "❌ Error: D1 Database ID cannot be empty. Please try again."
            continue
        fi

        # Basic validation: D1 IDs are UUID-like (alphanumeric and dashes only)
        if ! [[ "$db_id_1" =~ ^[A-Za-z0-9-]+$ ]]; then
            echo "❌ Error: Invalid D1 Database ID format. Expected only letters, numbers, and dashes."
            continue
        fi

        # Valid, non-empty ID provided
        break
    done
    
    # Update wrangler.toml with the provided ID
    if [ -f "wrangler.toml" ]; then
        # Create a backup
        cp wrangler.toml wrangler.toml.backup
        
        # Determine cross-platform sed in-place flag based on OS and update the database ID
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # BSD/macOS sed requires an explicit (possibly empty) backup extension
            sed -i '' "s/database_id = \"YOUR_D1_DATABASE_ID\"/database_id = \"$db_id_1\"/" wrangler.toml
        else
            # GNU/Linux and other platforms typically support sed -i without an explicit extension
            sed -i "s/database_id = \"YOUR_D1_DATABASE_ID\"/database_id = \"$db_id_1\"/" wrangler.toml
        fi
        
        echo ""
        echo "✅ Updated wrangler.toml with your D1 database ID"
        echo "   (backup saved as wrangler.toml.backup)"
    else
        echo "❌ Error: wrangler.toml not found"
        exit 1
    fi
else
    echo ""
    echo "Creating new D1 database..."
    echo ""
    
    echo "Creating primary database..."
    npx wrangler d1 create growpod-primary
    echo ""
    
    echo "⚠️  Please copy the database ID from above and update wrangler.toml"
fi

echo ""
echo "📝 Step 4: Configure Secrets"
echo ""
echo "You need to set up the following secrets:"
echo "  - DATABASE_URL (your PostgreSQL connection string)"
echo ""
read -p "Would you like to set up DATABASE_URL now? (y/n): " setup_db_url

if [ "$setup_db_url" = "y" ] || [ "$setup_db_url" = "Y" ]; then
    echo ""
    echo "Running: npx wrangler secret put DATABASE_URL"
    npx wrangler secret put DATABASE_URL
fi

echo ""
echo "📝 Step 5: Set up local development environment"
echo ""
if [ ! -f ".dev.vars" ]; then
    if [ -f ".dev.vars.example" ]; then
        cp .dev.vars.example .dev.vars
        echo "✅ Created .dev.vars from .dev.vars.example"
        echo "   Please edit .dev.vars with your local development values"
    fi
else
    echo "✅ .dev.vars already exists"
fi

echo ""
echo "============================================="
echo "✨ Setup Complete!"
echo "============================================="
echo ""
echo "Next steps:"
echo "  1. Update wrangler.toml with your account_id (if not done already)"
echo "  2. Update wrangler.toml with your D1 database ID (if not done already)"
echo "  3. Edit .dev.vars with your local development environment variables"
echo "  4. Run 'npm run build' to build the application"
echo "  5. Run 'npm run worker:deploy' to deploy to Cloudflare Workers"
echo ""
echo "For more information, see CLOUDFLARE_DEPLOYMENT.md"
echo ""
