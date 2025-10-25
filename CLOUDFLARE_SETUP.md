# Cloudflare Pages Deployment Guide

This guide will walk you through deploying your EXIF Photo Blog to Cloudflare Pages with D1 database and R2 storage.

## Prerequisites

- Cloudflare account
- GitHub repository connected to Cloudflare Pages
- Wrangler CLI installed (`npm install wrangler -g` or use the local version)

## Step 1: Create Cloudflare D1 Database

```bash
# Login to Cloudflare (if not already logged in)
npx wrangler login

# Create D1 database
npx wrangler d1 create exif-photo-blog

# This will output something like:
# Created database exif-photo-blog with ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Update `wrangler.toml` with the database ID:
```toml
[[d1_databases]]
binding = "DB"
database_name = "exif-photo-blog"
database_id = "YOUR_DATABASE_ID_HERE"  # Replace with the ID from above
```

## Step 2: Initialize Database Schema

```bash
# Run the schema SQL file to create tables
npx wrangler d1 execute exif-photo-blog --file=./schema.sql

# Verify tables were created
npx wrangler d1 execute exif-photo-blog --command="SELECT name FROM sqlite_master WHERE type='table'"
```

## Step 3: Create Cloudflare R2 Bucket

```bash
# Create R2 bucket for photos
npx wrangler r2 bucket create photos

# Update wrangler.toml if needed - it's already configured
```

### Configure R2 Public Access

1. Go to Cloudflare Dashboard → R2 → photos bucket
2. Click "Settings"
3. Under "Public Access", click "Allow Access" or "Connect Custom Domain"
4. Note the public domain (e.g., `pub-xxxxx.r2.dev` or your custom domain)

## Step 4: Configure Environment Variables

### For Local Development (.env.local)

Create `.env.local` file:
```env
# Database
USE_D1=true
CLOUDFLARE=true

# Cloudflare R2 Storage
NEXT_PUBLIC_STORAGE_PREFERENCE=cloudflare-r2
NEXT_PUBLIC_CLOUDFLARE_R2_BUCKET=photos
NEXT_PUBLIC_CLOUDFLARE_R2_ACCOUNT_ID=your_account_id
NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DOMAIN=pub-xxxxx.r2.dev

# R2 Credentials (DO NOT prefix with NEXT_PUBLIC)
CLOUDFLARE_R2_ACCESS_KEY=your_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key

# Site Configuration
NEXT_PUBLIC_DOMAIN=photo.yourdomain.com
NEXT_PUBLIC_META_TITLE=Your Photo Blog
NEXT_PUBLIC_META_DESCRIPTION=Your photo blog description

# Admin Auth
AUTH_SECRET=your_generated_secret
ADMIN_EMAIL=your@email.com
ADMIN_PASSWORD=your_secure_password
```

### Generate R2 API Keys

1. Go to Cloudflare Dashboard → R2 → Overview
2. Click "Manage R2 API Tokens"
3. Create new API token with "Object Read & Write" permissions
4. Copy Access Key ID and Secret Access Key

### Generate Auth Secret

```bash
# Generate a secure random string
openssl rand -base64 32
```

## Step 5: Configure Cloudflare Pages

### Connect GitHub Repository

1. Go to Cloudflare Dashboard → Pages
2. Click "Create a project"
3. Connect to GitHub and select your repository
4. Configure build settings:
   - **Framework preset**: Next.js
   - **Build command**: `npm run build && npm run pages:build`
   - **Build output directory**: `.vercel/output/static`
   - **Node version**: 18 or higher

### Add Environment Variables

In Cloudflare Pages project settings → Environment variables, add:

```
# Storage
NEXT_PUBLIC_STORAGE_PREFERENCE=cloudflare-r2
NEXT_PUBLIC_CLOUDFLARE_R2_BUCKET=photos
NEXT_PUBLIC_CLOUDFLARE_R2_ACCOUNT_ID=[your_account_id]
NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DOMAIN=[your_r2_domain]
CLOUDFLARE_R2_ACCESS_KEY=[your_access_key]
CLOUDFLARE_R2_SECRET_ACCESS_KEY=[your_secret_key]

# Database
USE_D1=true
CLOUDFLARE=true

# Site
NEXT_PUBLIC_DOMAIN=[your domain]
NEXT_PUBLIC_META_TITLE=[your title]
NEXT_PUBLIC_META_DESCRIPTION=[your description]

# Auth
AUTH_SECRET=[your_auth_secret]
ADMIN_EMAIL=[your_email]
ADMIN_PASSWORD=[your_password]

# Optional AI Features
OPENAI_SECRET_KEY=[your_openai_key]

# Optional Location Services
GOOGLE_PLACES_API_KEY=[your_google_key]
```

### Bind D1 Database and R2 Bucket

In Cloudflare Pages project settings:

1. Go to "Settings" → "Functions" → "D1 database bindings"
   - Variable name: `DB`
   - D1 database: Select `exif-photo-blog`

2. Go to "Settings" → "Functions" → "R2 bucket bindings"
   - Variable name: `PHOTOS`
   - R2 bucket: Select `photos`

## Step 6: Deploy

### Option A: Automatic Deployment (via GitHub)

Push to your main branch - Cloudflare Pages will automatically build and deploy.

### Option B: Manual Deployment

```bash
# Build the application
npm run build
npm run pages:build

# Deploy to Cloudflare Pages
npx wrangler pages deploy .vercel/output/static --project-name=exif-photo-blog
```

## Step 7: Verify Deployment

1. Visit your Cloudflare Pages URL (e.g., `https://exif-photo-blog.pages.dev`)
2. Navigate to `/admin` and login
3. Try uploading a photo to verify R2 storage works
4. Check that the database is storing photo metadata

## Local Development

To develop locally with Cloudflare:

```bash
# Start local D1 database and R2 storage
npx wrangler pages dev --d1=DB --r2=PHOTOS -- npm run dev

# Or use the simplified command
npm run preview
```

## Troubleshooting

### Database Connection Issues

```bash
# Check D1 database status
npx wrangler d1 list

# Query the database
npx wrangler d1 execute exif-photo-blog --command="SELECT COUNT(*) as count FROM photos"
```

### R2 Storage Issues

```bash
# List R2 buckets
npx wrangler r2 bucket list

# List objects in bucket
npx wrangler r2 object list photos
```

### Build Failures

1. Check Node version (should be 18+)
2. Verify all environment variables are set
3. Check build logs in Cloudflare Pages dashboard
4. Try building locally: `npm run build && npm run pages:build`

### Migration from Vercel

If you're migrating from Vercel:

1. **Export your database** from Vercel Postgres
2. **Convert and import** to D1 (you may need custom scripts)
3. **Migrate photos** from Vercel Blob to R2:
   ```bash
   # Use rclone or custom script to copy files
   ```

## Performance Optimization

Enable static generation for better performance:

```env
NEXT_PUBLIC_STATICALLY_OPTIMIZE_PHOTOS=1
NEXT_PUBLIC_STATICALLY_OPTIMIZE_PHOTO_OG_IMAGES=1
NEXT_PUBLIC_STATICALLY_OPTIMIZE_PHOTO_CATEGORIES=1
```

## Cost Estimates (Cloudflare Free Tier)

- **D1 Database**: 5 GB storage, 5 million reads/day (FREE)
- **R2 Storage**: 10 GB storage, 1 million Class A operations/month (FREE)
- **Pages**: Unlimited requests, 500 builds/month (FREE)

Perfect for photo blogs with moderate traffic!

## Support

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [R2 Storage Docs](https://developers.cloudflare.com/r2/)
- [OpenNext Cloudflare](https://opennext.js.org/cloudflare)
