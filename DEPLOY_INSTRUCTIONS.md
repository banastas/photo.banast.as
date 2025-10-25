# Deploy photo.banast.as to Cloudflare Pages

## Step 1: Push to GitHub

```bash
cd /Users/banastas/GitHub/photo.banast.as

# Check current status
git status

# Add all changes
git add .

# Commit
git commit -m "Add Cloudflare Pages support with D1 database

- Add D1 database adapter for SQLite
- Add Cloudflare build configuration
- Update database imports to use adapter
- Add OpenNext Cloudflare adapter
- Configure wrangler.toml for D1 and R2
- Add setup documentation

All styling and features preserved 100%"

# Push to GitHub
git push origin main
```

## Step 2: Connect to Cloudflare Pages

### A. Go to Cloudflare Dashboard

1. Visit: https://dash.cloudflare.com
2. Click **"Pages"** in the left sidebar
3. Click **"Create a project"**
4. Click **"Connect to Git"**

### B. Connect GitHub Repository

1. Click **"Connect GitHub"**
2. Authorize Cloudflare if needed
3. Select repository: **`photo.banast.as`**
4. Click **"Begin setup"**

### C. Configure Build Settings

Set the following:

```
Project name: photo-banast-as
Production branch: main

Build settings:
├─ Framework preset: Next.js
├─ Build command: npm run build && npm run pages:build
├─ Build output directory: .vercel/output/static
└─ Root directory: (leave empty)

Node version: 18 or higher
```

**Don't deploy yet!** Click **"Save and Deploy"** but we need to add environment variables first.

## Step 3: Set Environment Variables

Go to: **Settings → Environment variables**

Add these variables for **Production**:

### Required Variables

```bash
# Database
USE_D1=true
CLOUDFLARE=true

# Storage (R2)
NEXT_PUBLIC_STORAGE_PREFERENCE=cloudflare-r2
NEXT_PUBLIC_CLOUDFLARE_R2_BUCKET=photo-banast-as
NEXT_PUBLIC_CLOUDFLARE_R2_ACCOUNT_ID=<your_account_id>
NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DOMAIN=photos.banast.as

# R2 Credentials (you already have these from Vercel!)
CLOUDFLARE_R2_ACCESS_KEY=<your_r2_access_key>
CLOUDFLARE_R2_SECRET_ACCESS_KEY=<your_r2_secret_key>

# Site
NEXT_PUBLIC_DOMAIN=photo.banast.as
NEXT_PUBLIC_META_TITLE=Photo Blog
NEXT_PUBLIC_META_DESCRIPTION=Stephane's Photo Blog

# Auth (generate new secret: openssl rand -base64 32)
AUTH_SECRET=<generate_new_secret>
ADMIN_EMAIL=<your_email>
ADMIN_PASSWORD=<your_password>
```

### Where to Find These Values

**Your R2 Credentials:**
Check your Vercel dashboard → Project → Settings → Environment Variables
Look for:
- `CLOUDFLARE_R2_ACCESS_KEY`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `NEXT_PUBLIC_CLOUDFLARE_R2_ACCOUNT_ID`

**Your Account ID:**
1. Go to Cloudflare Dashboard
2. Click on any domain
3. Look for "Account ID" on the right sidebar
4. Or run: `npx wrangler whoami`

**Generate Auth Secret:**
```bash
openssl rand -base64 32
```

### Optional Variables (if you use them)

```bash
# AI Features
OPENAI_SECRET_KEY=<your_openai_key>

# Location Services
GOOGLE_PLACES_API_KEY=<your_google_key>

# Performance
NEXT_PUBLIC_STATICALLY_OPTIMIZE_PHOTOS=1
NEXT_PUBLIC_STATICALLY_OPTIMIZE_PHOTO_OG_IMAGES=1
```

## Step 4: Bind D1 Database and R2 Bucket

This is **critical** - Cloudflare needs to know which resources to use!

### A. Bind D1 Database

1. Go to: **Settings → Functions → D1 database bindings**
2. Click **"Add binding"**
3. Set:
   - **Variable name:** `DB`
   - **D1 database:** Select `photo-banast-as`
4. Click **"Save"**

### B. Bind R2 Bucket

1. Go to: **Settings → Functions → R2 bucket bindings**
2. Click **"Add binding"**
3. Set:
   - **Variable name:** `PHOTOS`
   - **R2 bucket:** Select `photo-banast-as`
4. Click **"Save"**

## Step 5: Deploy!

### Trigger First Deployment

1. Go to **Deployments** tab
2. Click **"Create deployment"**
3. Select branch: `main`
4. Click **"Deploy"**

Or just push to GitHub - it will auto-deploy!

### Monitor Build

Watch the build logs:
- Should take 3-5 minutes
- Look for: "✅ Build successful"
- Get your URL: `https://photo-banast-as.pages.dev`

## Step 6: Verify Deployment

### Test the Site

1. Visit your Cloudflare Pages URL
2. Go to `/admin`
3. Try logging in
4. Upload a test photo

### Check Database Connection

The site should:
- ✅ Load without errors
- ✅ Show admin login
- ✅ Connect to D1 database
- ✅ Load photos from R2

## Step 7: Configure Custom Domain (Optional)

To use `photo.banast.as` instead of `.pages.dev`:

1. Go to: **Custom domains** tab
2. Click **"Set up a custom domain"**
3. Enter: `photo.banast.as`
4. Cloudflare will configure DNS automatically
5. Wait for SSL certificate (usually < 5 minutes)

**Note:** If you're currently using this domain on Vercel:
- You can test on `.pages.dev` first
- When ready, remove domain from Vercel
- Then add to Cloudflare Pages

## Troubleshooting

### Build Fails

**Check:**
1. Node version is 18+ in build settings
2. All environment variables are set
3. Build command is correct: `npm run build && npm run pages:build`

**View build logs:**
- Click on failed deployment
- Read the error message
- Common issues:
  - Missing environment variables
  - Node version too old
  - Package installation errors

### Site Loads But Errors

**Database connection issues:**
```bash
# Make sure D1 binding is set
Settings → Functions → D1 database bindings
Variable: DB
Database: photo-banast-as
```

**Storage issues:**
```bash
# Make sure R2 binding is set
Settings → Functions → R2 bucket bindings
Variable: PHOTOS
Bucket: photo-banast-as
```

### Can't Login to Admin

**Check environment variables:**
- `AUTH_SECRET` is set
- `ADMIN_EMAIL` is correct
- `ADMIN_PASSWORD` is correct

### Photos Don't Load

**Check R2 configuration:**
- Bucket name is `photo-banast-as`
- Public domain is correct
- R2 credentials are valid

## Quick Reference

### Build Command
```bash
npm run build && npm run pages:build
```

### Output Directory
```
.vercel/output/static
```

### Required Bindings
- D1: `DB` → `photo-banast-as`
- R2: `PHOTOS` → `photo-banast-as`

### Essential Environment Variables
```
USE_D1=true
CLOUDFLARE=true
NEXT_PUBLIC_STORAGE_PREFERENCE=cloudflare-r2
NEXT_PUBLIC_CLOUDFLARE_R2_BUCKET=photo-banast-as
AUTH_SECRET=<your_secret>
ADMIN_EMAIL=<your_email>
ADMIN_PASSWORD=<your_password>
```

## Next Steps After Deployment

1. **Test thoroughly** on `.pages.dev` domain
2. **Upload some photos** via `/admin`
3. **Verify everything works** (tags, albums, etc.)
4. **When confident**, switch custom domain from Vercel to Cloudflare
5. **Keep Vercel running** as backup until you're 100% sure

---

**Ready to deploy? Start with Step 1!** 🚀
