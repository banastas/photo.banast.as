# Migration to Cloudflare Pages - Summary

This document summarizes the changes made to migrate the EXIF Photo Blog from Vercel to Cloudflare Pages.

## What Changed

### ✅ NO CHANGES to Styling or Features
- **All styling is preserved exactly as-is** - Tailwind v4, custom CSS, animations, fonts, colors
- **All features work identically** - Admin panel, photo uploads, EXIF parsing, AI features, etc.
- **All components unchanged** - Every React component, layout, and design element remains the same

### 🔄 Backend Changes

#### 1. **Database: PostgreSQL → Cloudflare D1 (SQLite)**

**New Files:**
- `src/platforms/d1.ts` - D1 database adapter (mirrors PostgreSQL interface)
- `src/platforms/database.ts` - Automatic adapter switcher (PostgreSQL or D1)
- `schema.sql` - D1 database schema

**Key Features:**
- Automatic query translation from PostgreSQL to SQLite syntax
- Handles `ANY(array)` queries for tags using JSON functions
- Converts `ILIKE` to `LIKE`, `CONCAT` to `||`, `EXTRACT` to `strftime`, etc.
- Supports both D1 and PostgreSQL via `USE_D1` environment variable

**Modified Files:**
- `src/admin/actions.ts` - Uses `database.ts` instead of `postgres.ts`
- `src/album/query.ts` - Uses `database.ts` instead of `postgres.ts`
- `src/db/migration.ts` - Uses `database.ts` instead of `postgres.ts`
- `src/photo/query.ts` - Uses `database.ts` instead of `postgres.ts`

#### 2. **Storage: Vercel Blob → Cloudflare R2**

**No code changes needed** - The codebase already supports Cloudflare R2! Just set environment variables:
- `NEXT_PUBLIC_STORAGE_PREFERENCE=cloudflare-r2`
- `NEXT_PUBLIC_CLOUDFLARE_R2_BUCKET=photos`
- `NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DOMAIN=your-r2-domain`
- `CLOUDFLARE_R2_ACCESS_KEY=your-key`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret`

#### 3. **Deployment: Vercel → Cloudflare Pages**

**New Files:**
- `wrangler.toml` - Cloudflare Pages configuration
- `CLOUDFLARE_SETUP.md` - Complete deployment guide
- `.env.example` - Environment variables template

**Modified Files:**
- `package.json` - Added Cloudflare build scripts:
  - `pages:build` - Build for Cloudflare Pages with OpenNext
  - `preview` - Local development with Wrangler
  - `deploy` - Deploy to Cloudflare Pages
  - `cf:typegen` - Generate TypeScript types for Cloudflare bindings

**New Dependencies:**
- `@opennextjs/cloudflare` - Next.js adapter for Cloudflare Pages
- `wrangler` - Cloudflare CLI
- `@cloudflare/workers-types` - TypeScript types

**Updated Files:**
- `.gitignore` - Added Cloudflare-specific ignores

## How to Deploy

### Quick Start

1. **Create D1 Database:**
   ```bash
   npx wrangler d1 create exif-photo-blog
   # Copy the database_id to wrangler.toml
   ```

2. **Initialize Schema:**
   ```bash
   npx wrangler d1 execute exif-photo-blog --file=./schema.sql
   ```

3. **Create R2 Bucket:**
   ```bash
   npx wrangler r2 bucket create photos
   ```

4. **Configure Environment Variables:**
   - Copy `.env.example` to `.env.local`
   - Fill in your values (see CLOUDFLARE_SETUP.md for details)

5. **Deploy to Cloudflare Pages:**
   - Connect GitHub repository to Cloudflare Pages
   - Set environment variables in dashboard
   - Bind D1 database and R2 bucket
   - Deploy!

See [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md) for detailed instructions.

## Database Schema Differences

### PostgreSQL vs D1 (SQLite)

| Feature | PostgreSQL | D1/SQLite |
|---------|-----------|-----------|
| Arrays | Native `TEXT[]` | JSON text: `'["tag1","tag2"]'` |
| JSON | `JSONB` | `TEXT` (stored as JSON string) |
| Boolean | `BOOLEAN` | `INTEGER` (0/1) |
| Timestamps | `TIMESTAMP WITH TIME ZONE` | `TEXT` (ISO 8601) |
| Regex | `REGEXP_REPLACE()` | Handled at app level |
| Case-insensitive | `ILIKE` | `LIKE` (SQLite is case-insensitive) |

The D1 adapter (`src/platforms/d1.ts`) handles all these conversions automatically!

## Testing the Migration

### Local Development

```bash
# With D1 and R2
npx wrangler pages dev --d1=DB --r2=PHOTOS -- npm run dev

# Or use the shortcut
npm run preview
```

### Build Test

```bash
# Build for Cloudflare Pages
npm run build
npm run pages:build

# Check output directory
ls -la .vercel/output/static
```

## Backward Compatibility

The code maintains **full backward compatibility** with Vercel:

- Set `USE_D1=false` or omit it → uses PostgreSQL
- Set `POSTGRES_URL` → uses Vercel Postgres
- Set `BLOB_READ_WRITE_TOKEN` → uses Vercel Blob

You can even run both deployments simultaneously!

## Cost Comparison

### Vercel
- Hobby: 100 GB bandwidth/month, limited serverless execution time
- Pro: $20/month base

### Cloudflare (Free Tier)
- **D1 Database:** 5 GB storage, 5M reads/day - **FREE**
- **R2 Storage:** 10 GB storage, 1M Class A operations/month - **FREE**
- **Pages:** Unlimited requests, 500 builds/month - **FREE**

For most photo blogs, Cloudflare is **completely free**!

## Troubleshooting

### Build Fails

1. Check Node version: `node -v` (should be 18+)
2. Clear Next.js cache: `rm -rf .next`
3. Reinstall dependencies: `rm -rf node_modules && npm install`

### Database Connection Issues

```bash
# Check D1 status
npx wrangler d1 list

# Test query
npx wrangler d1 execute exif-photo-blog --command="SELECT COUNT(*) FROM photos"
```

### R2 Storage Issues

```bash
# List buckets
npx wrangler r2 bucket list

# Check CORS settings in Cloudflare dashboard
```

## Next Steps

1. **Review** [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md) for detailed deployment steps
2. **Set up** your D1 database and R2 bucket
3. **Configure** environment variables
4. **Deploy** to Cloudflare Pages
5. **Test** by uploading photos via `/admin`

## Support

- Original Template: [exif-photo-blog](https://github.com/sambecker/exif-photo-blog)
- Cloudflare Pages: [docs.cloudflare.com/pages](https://developers.cloudflare.com/pages/)
- OpenNext: [opennext.js.org/cloudflare](https://opennext.js.org/cloudflare)

## Files Added/Modified

### Added Files
- `src/platforms/d1.ts` - D1 adapter
- `src/platforms/database.ts` - Database switcher
- `schema.sql` - D1 schema
- `wrangler.toml` - Cloudflare config
- `CLOUDFLARE_SETUP.md` - Setup guide
- `MIGRATION_SUMMARY.md` - This file
- `.env.example` - Environment template

### Modified Files
- `package.json` - New scripts and dependencies
- `.gitignore` - Cloudflare ignores
- `src/admin/actions.ts` - Database import
- `src/album/query.ts` - Database import
- `src/db/migration.ts` - Database import
- `src/photo/query.ts` - Database import

### Total Lines Changed
- **~200 lines of new code** (mostly D1 adapter)
- **4 import statements updated**
- **0 styling changes**
- **0 feature changes**

---

**🎉 Your photo blog is now ready for Cloudflare Pages!**
