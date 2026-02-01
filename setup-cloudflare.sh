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

# Step 3: Configure D1 Database IDs
echo "📝 Step 3: Configure D1 Database IDs"
echo ""
echo "You can either:"
echo "  A) Use existing D1 database IDs (if already provided)"
echo "  B) Create new D1 databases"
echo ""
read -p "Do you already have D1 database IDs? (y/n): " has_db_ids

if [ "$has_db_ids" = "y" ] || [ "$has_db_ids" = "Y" ]; then
    echo ""
    echo "Please enter your D1 Database IDs:"
    echo ""
    read -p "Primary Database ID (DB): " db_id_1
    read -p "Secondary Database ID (DB2): " db_id_2
    read -p "Tertiary Database ID (DB3): " db_id_3
    
    # Update wrangler.toml with the provided IDs
    if [ -f "wrangler.toml" ]; then
        # Create a backup
        cp wrangler.toml wrangler.toml.backup
        
        # Update the database IDs
        sed -i "s/database_id = \"YOUR_D1_DATABASE_ID_1\"/database_id = \"$db_id_1\"/" wrangler.toml
        sed -i "s/database_id = \"YOUR_D1_DATABASE_ID_2\"/database_id = \"$db_id_2\"/" wrangler.toml
        sed -i "s/database_id = \"YOUR_D1_DATABASE_ID_3\"/database_id = \"$db_id_3\"/" wrangler.toml
        
        echo ""
        echo "✅ Updated wrangler.toml with your D1 database IDs"
        echo "   (backup saved as wrangler.toml.backup)"
    else
        echo "❌ Error: wrangler.toml not found"
        exit 1
    fi
else
    echo ""
    echo "Creating new D1 databases..."
    echo ""
    
    echo "Creating primary database..."
    npx wrangler d1 create growpod-primary
    echo ""
    
    echo "Creating secondary database..."
    npx wrangler d1 create growpod-secondary
    echo ""
    
    echo "Creating tertiary database..."
    npx wrangler d1 create growpod-tertiary
    echo ""
    
    echo "⚠️  Please copy the database IDs from above and update wrangler.toml"
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
echo "  2. Update wrangler.toml with your D1 database IDs (if not done already)"
echo "  3. Edit .dev.vars with your local development environment variables"
echo "  4. Run 'npm run build' to build the application"
echo "  5. Run 'npm run worker:deploy' to deploy to Cloudflare Workers"
echo ""
echo "For more information, see CLOUDFLARE_DEPLOYMENT.md"
echo ""
