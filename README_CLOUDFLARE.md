# EXIF Photo Blog - Cloudflare Pages Edition

This is a modified version of the [EXIF Photo Blog](https://github.com/sambecker/exif-photo-blog) configured to run on **Cloudflare Pages** with **D1 Database** and **R2 Storage**.

## 🎯 Key Features

- ✅ **All original styling preserved** - Zero design changes
- ✅ **All features work identically** - Photo uploads, EXIF parsing, AI, etc.
- ✅ **Cloudflare D1 Database** (SQLite) - Free tier: 5GB, 5M reads/day
- ✅ **Cloudflare R2 Storage** - Free tier: 10GB, 1M operations/month
- ✅ **Cloudflare Pages** - Unlimited requests, 500 builds/month
- ✅ **Backward compatible** - Can still deploy to Vercel if needed

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/exif-photo-blog.git
cd exif-photo-blog

# Install dependencies
npm install

# Run the setup script
./setup-cloudflare.sh
```

The script will:
1. Create D1 database
2. Initialize schema
3. Create R2 bucket
4. Generate `.env.local` template
5. Start local dev server

### Option 2: Manual Setup

See [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md) for detailed step-by-step instructions.

## 📋 Prerequisites

- Node.js 18+
- Cloudflare account (free tier is fine!)
- GitHub account (for automatic deployments)

## 🏗️ Architecture

### Database: Cloudflare D1 (SQLite)

- **What it is:** SQLite database running on Cloudflare's edge network
- **Why it's great:** Fast, globally distributed, generous free tier
- **Migration from PostgreSQL:** Automatic query translation handles all differences

### Storage: Cloudflare R2

- **What it is:** S3-compatible object storage
- **Why it's great:** No egress fees, fast, generous free tier
- **Already supported:** The original template has R2 support built-in!

### Hosting: Cloudflare Pages

- **What it is:** JAMstack platform for Next.js (using OpenNext adapter)
- **Why it's great:** Unlimited requests, fast edge network, free tier
- **Deployment:** Automatic from GitHub on push

## 📦 What Changed

### New Files

```
src/platforms/
  ├── d1.ts              # D1 database adapter
  └── database.ts        # Database switcher (PostgreSQL or D1)

schema.sql               # D1 database schema
wrangler.toml           # Cloudflare configuration
setup-cloudflare.sh     # Automated setup script

CLOUDFLARE_SETUP.md     # Detailed setup guide
MIGRATION_SUMMARY.md    # Technical migration details
.env.example            # Environment variables template
```

### Modified Files

- `package.json` - Added Cloudflare build scripts
- `.gitignore` - Added Cloudflare-specific ignores
- 4 database query files - Updated imports to use new adapter

### What Didn't Change

- **Zero styling changes** - All Tailwind, CSS, components identical
- **Zero feature changes** - Admin panel, uploads, EXIF, AI all work
- **Zero component changes** - Every React component untouched

## 🔧 Environment Variables

### Required

```env
# Database
USE_D1=true
CLOUDFLARE=true

# Storage
NEXT_PUBLIC_STORAGE_PREFERENCE=cloudflare-r2
NEXT_PUBLIC_CLOUDFLARE_R2_BUCKET=photos
NEXT_PUBLIC_CLOUDFLARE_R2_ACCOUNT_ID=your_account_id
NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DOMAIN=pub-xxxxx.r2.dev
CLOUDFLARE_R2_ACCESS_KEY=your_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret

# Site
NEXT_PUBLIC_DOMAIN=photos.yourdomain.com
NEXT_PUBLIC_META_TITLE=My Photo Blog
NEXT_PUBLIC_META_DESCRIPTION=Description

# Auth
AUTH_SECRET=generate_with_openssl_rand
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure_password
```

See [.env.example](./.env.example) for all available options.

## 🛠️ Development

### Local Development

```bash
# Install dependencies
npm install

# Start dev server with D1 and R2
npm run dev

# Or use Wrangler for full Cloudflare environment
npm run preview
```

### Build

```bash
# Standard Next.js build
npm run build

# Cloudflare Pages build
npm run pages:build
```

## 🚢 Deployment

### Via Cloudflare Pages Dashboard

1. **Connect GitHub:**
   - Go to Cloudflare Dashboard → Pages
   - Click "Create a project"
   - Connect GitHub and select your repository

2. **Configure Build:**
   - Framework: Next.js
   - Build command: `npm run build && npm run pages:build`
   - Output directory: `.vercel/output/static`

3. **Set Environment Variables:**
   - Add all variables from `.env.example`

4. **Bind Resources:**
   - Settings → Functions → D1 bindings: Add `DB` → `exif-photo-blog`
   - Settings → Functions → R2 bindings: Add `PHOTOS` → `photos`

5. **Deploy:**
   - Push to main branch → automatic deployment

### Via CLI

```bash
# Build
npm run build && npm run pages:build

# Deploy
npm run deploy
```

## 💰 Cost Comparison

| Service | Vercel Hobby | Vercel Pro | Cloudflare Free |
|---------|--------------|------------|-----------------|
| **Price** | $0 | $20/mo | $0 |
| **Bandwidth** | 100 GB | 1 TB | Unlimited |
| **Database** | Limited | 256 MB | 5 GB |
| **Storage** | Limited | 100 GB | 10 GB |
| **Requests** | Limited | Unlimited | Unlimited |
| **DB Reads** | Limited | Millions | 5M/day |

**For most photo blogs, Cloudflare is completely free!**

## 🎨 Features (All Preserved)

- ✅ Photo upload with EXIF extraction
- ✅ Organize by tags, albums, cameras, lenses
- ✅ Light/dark mode
- ✅ Infinite scroll
- ✅ AI text generation (OpenAI)
- ✅ Location services (Google Places)
- ✅ Automatic OG images
- ✅ CMD-K search menu
- ✅ RSS/JSON feeds
- ✅ Fujifilm recipes and film simulations
- ✅ Mobile-responsive design
- ✅ Admin panel for management

## 📚 Documentation

- **[CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md)** - Complete deployment guide
- **[MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)** - Technical migration details
- **[Original README](./README.md)** - Original template documentation

## 🔄 Backward Compatibility

Want to deploy to Vercel instead? Just set:

```env
USE_D1=false
POSTGRES_URL=your_postgres_url
BLOB_READ_WRITE_TOKEN=your_blob_token
```

The code automatically detects which platform you're using!

## 🐛 Troubleshooting

### Build Fails

```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Database Issues

```bash
# Check D1 status
npx wrangler d1 list

# Query database
npx wrangler d1 execute exif-photo-blog --command="SELECT COUNT(*) FROM photos"

# Reinitialize schema
npx wrangler d1 execute exif-photo-blog --file=./schema.sql
```

### R2 Storage Issues

```bash
# List buckets
npx wrangler r2 bucket list

# Check bucket contents
npx wrangler r2 object list photos
```

## 📖 Learn More

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [OpenNext Cloudflare](https://opennext.js.org/cloudflare)
- [Original EXIF Photo Blog](https://github.com/sambecker/exif-photo-blog)

## 🙏 Credits

- Original template by [Sam Becker](https://github.com/sambecker)
- Cloudflare migration maintained by [your name]
- Built with Next.js, React, Tailwind CSS
- Deployed on Cloudflare Pages

## 📄 License

Same as original EXIF Photo Blog template.

---

**Questions? Issues? Open a GitHub issue or discussion!**
