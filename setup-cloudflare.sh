#!/bin/bash

# Cloudflare Pages Setup Script for EXIF Photo Blog
# This script helps automate the initial Cloudflare setup

set -e

echo "================================================"
echo "EXIF Photo Blog - Cloudflare Setup"
echo "================================================"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

echo "✅ Wrangler CLI is installed"
echo ""

# Login to Cloudflare
echo "📝 Logging in to Cloudflare..."
echo "   (A browser window will open for authentication)"
wrangler login

echo ""
echo "================================================"
echo "Step 1: Create D1 Database"
echo "================================================"
echo ""

read -p "Create D1 database? (y/n): " create_db

if [ "$create_db" = "y" ]; then
    echo "Creating D1 database 'exif-photo-blog'..."
    DB_OUTPUT=$(wrangler d1 create exif-photo-blog)
    echo "$DB_OUTPUT"

    # Extract database ID
    DB_ID=$(echo "$DB_OUTPUT" | grep "database_id" | awk -F'"' '{print $4}')

    if [ -n "$DB_ID" ]; then
        echo ""
        echo "✅ Database created with ID: $DB_ID"
        echo ""
        echo "Updating wrangler.toml with database ID..."

        # Update wrangler.toml
        sed -i.bak "s/database_id = \"\"/database_id = \"$DB_ID\"/" wrangler.toml
        rm wrangler.toml.bak

        echo "✅ wrangler.toml updated"
        echo ""

        # Initialize schema
        echo "Initializing database schema..."
        wrangler d1 execute exif-photo-blog --file=./schema.sql
        echo "✅ Database schema initialized"

        # Verify
        echo ""
        echo "Verifying database..."
        wrangler d1 execute exif-photo-blog --command="SELECT name FROM sqlite_master WHERE type='table'"
    else
        echo "❌ Could not extract database ID. Please update wrangler.toml manually."
    fi
else
    echo "⏭️  Skipping database creation"
fi

echo ""
echo "================================================"
echo "Step 2: Create R2 Bucket"
echo "================================================"
echo ""

read -p "Create R2 bucket 'photos'? (y/n): " create_r2

if [ "$create_r2" = "y" ]; then
    echo "Creating R2 bucket 'photos'..."
    wrangler r2 bucket create photos
    echo "✅ R2 bucket created"
    echo ""
    echo "⚠️  IMPORTANT: Configure R2 public access in Cloudflare Dashboard:"
    echo "   1. Go to R2 → photos bucket"
    echo "   2. Click 'Settings' → 'Public Access'"
    echo "   3. Click 'Allow Access' or 'Connect Custom Domain'"
    echo "   4. Note the public domain (e.g., pub-xxxxx.r2.dev)"
else
    echo "⏭️  Skipping R2 bucket creation"
fi

echo ""
echo "================================================"
echo "Step 3: Create R2 API Token"
echo "================================================"
echo ""

echo "You need to create an R2 API token manually:"
echo "1. Go to: https://dash.cloudflare.com/?to=/:account/r2/overview/api-tokens"
echo "2. Click 'Create API Token'"
echo "3. Select 'Object Read & Write' permissions"
echo "4. Apply to 'photos' bucket"
echo "5. Copy the Access Key ID and Secret Access Key"
echo ""

read -p "Press Enter when you've created the API token..."

echo ""
echo "================================================"
echo "Step 4: Environment Variables"
echo "================================================"
echo ""

echo "Create .env.local file with your configuration:"
echo ""

# Get account ID
ACCOUNT_ID=$(wrangler whoami | grep "Account ID" | awk '{print $4}' || echo "YOUR_ACCOUNT_ID")

cat > .env.local << EOF
# Database
USE_D1=true
CLOUDFLARE=true

# Cloudflare R2 Storage
NEXT_PUBLIC_STORAGE_PREFERENCE=cloudflare-r2
NEXT_PUBLIC_CLOUDFLARE_R2_BUCKET=photos
NEXT_PUBLIC_CLOUDFLARE_R2_ACCOUNT_ID=$ACCOUNT_ID
NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DOMAIN=pub-xxxxx.r2.dev
CLOUDFLARE_R2_ACCESS_KEY=your_access_key_here
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key_here

# Site Configuration
NEXT_PUBLIC_DOMAIN=photos.yourdomain.com
NEXT_PUBLIC_META_TITLE=My Photo Blog
NEXT_PUBLIC_META_DESCRIPTION=A beautiful photography blog

# Admin Auth (Generate secret: openssl rand -base64 32)
AUTH_SECRET=$(openssl rand -base64 32)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=change_this_password

# Optional: OpenAI for AI features
# OPENAI_SECRET_KEY=sk-xxxxx

# Optional: Google Places API for locations
# GOOGLE_PLACES_API_KEY=your_google_api_key
EOF

echo "✅ Created .env.local with template values"
echo ""
echo "⚠️  IMPORTANT: Edit .env.local and update:"
echo "   - NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DOMAIN"
echo "   - CLOUDFLARE_R2_ACCESS_KEY"
echo "   - CLOUDFLARE_R2_SECRET_ACCESS_KEY"
echo "   - NEXT_PUBLIC_DOMAIN"
echo "   - ADMIN_EMAIL"
echo "   - ADMIN_PASSWORD"
echo ""

echo "================================================"
echo "Step 5: Test Local Development"
echo "================================================"
echo ""

read -p "Test local development? (y/n): " test_local

if [ "$test_local" = "y" ]; then
    echo "Starting local development server..."
    echo "   - D1 database: exif-photo-blog"
    echo "   - R2 bucket: photos"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    npm run dev
fi

echo ""
echo "================================================"
echo "Setup Complete! 🎉"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your actual values"
echo "2. Test locally: npm run dev"
echo "3. Deploy to Cloudflare Pages:"
echo "   - Connect GitHub repo to Cloudflare Pages"
echo "   - Set environment variables in dashboard"
echo "   - Bind D1 database (DB) and R2 bucket (PHOTOS)"
echo "   - Deploy!"
echo ""
echo "For detailed instructions, see CLOUDFLARE_SETUP.md"
echo ""
