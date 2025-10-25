# Data Migration Guide: Vercel Postgres → Cloudflare D1

## Do You Need to Migrate?

### Option 1: Fresh Start ✨
**Recommended if:**
- You have few photos (< 20)
- You want to clean up/reorganize
- Testing Cloudflare first

**Action:** Skip migration, just upload photos via `/admin` on Cloudflare

### Option 2: Full Migration 📦
**Recommended if:**
- You have many photos (20+)
- Want to preserve all metadata (titles, captions, tags, albums)
- Ready to fully switch

**Action:** Follow this guide to migrate data

## Migration Steps

### Step 1: Export from Vercel Postgres

#### A. Install Vercel CLI (if needed)
```bash
npm install -g vercel
vercel login
```

#### B. Connect to Your Project
```bash
cd /Users/banastas/GitHub/photo.banast.as
vercel link
```

#### C. Export Database

**Option A: Using psql (Recommended)**

Get your database connection string from Vercel:
```bash
# Go to Vercel Dashboard → Storage → Postgres → .env.local tab
# Copy POSTGRES_URL
```

Export all data:
```bash
# Set your connection string
export POSTGRES_URL="postgres://user:pass@host/database"

# Export photos table
psql $POSTGRES_URL -c "\COPY photos TO 'photos_export.csv' CSV HEADER"

# Export albums table
psql $POSTGRES_URL -c "\COPY albums TO 'albums_export.csv' CSV HEADER"

# Export album_photo junction table
psql $POSTGRES_URL -c "\COPY album_photo TO 'album_photo_export.csv' CSV HEADER"
```

**Option B: Using pg_dump**
```bash
pg_dump $POSTGRES_URL --table=photos --data-only --column-inserts > photos.sql
pg_dump $POSTGRES_URL --table=albums --data-only --column-inserts > albums.sql
pg_dump $POSTGRES_URL --table=album_photo --data-only --column-inserts > album_photo.sql
```

**Option C: Manual Export via Vercel Dashboard**
1. Go to Vercel Dashboard → Storage → Postgres
2. Click "Query" tab
3. Run:
   ```sql
   SELECT * FROM photos ORDER BY created_at DESC;
   ```
4. Copy results to CSV

### Step 2: Convert Data (PostgreSQL → SQLite format)

Create a conversion script:

```bash
# Create converter script
cat > convert_to_d1.js << 'EOF'
const fs = require('fs');
const { parse } = require('csv-parse/sync');

// Read CSV
const photosCSV = fs.readFileSync('photos_export.csv', 'utf-8');
const photos = parse(photosCSV, { columns: true, skip_empty_lines: true });

// Convert PostgreSQL data to SQLite format
const convertedPhotos = photos.map(photo => {
  return {
    ...photo,
    // Convert PostgreSQL arrays to JSON strings
    tags: photo.tags ? JSON.stringify(photo.tags.replace('{', '[').replace('}', ']')) : '[]',
    // Convert JSONB to JSON strings
    recipe_data: photo.recipe_data || null,
    color_data: photo.color_data || null,
    // Convert boolean to integer (0/1)
    hidden: photo.hidden === 't' || photo.hidden === 'true' ? 1 : 0,
    exclude_from_feeds: photo.exclude_from_feeds === 't' ? 1 : 0,
  };
});

// Generate SQLite INSERT statements
let sql = '';
convertedPhotos.forEach(photo => {
  const values = Object.values(photo).map(v =>
    v === null ? 'NULL' :
    typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` :
    v
  ).join(', ');

  sql += `INSERT INTO photos VALUES (${values});\n`;
});

fs.writeFileSync('photos_import.sql', sql);
console.log(`✅ Converted ${convertedPhotos.length} photos`);
EOF

# Install dependencies
npm install csv-parse

# Run converter
node convert_to_d1.js
```

### Step 3: Import to D1

#### A. Import Photos
```bash
# Import to local D1
npx wrangler d1 execute photo-banast-as --file=photos_import.sql

# Import to remote D1
npx wrangler d1 execute photo-banast-as --remote --file=photos_import.sql
```

#### B. Import Albums (if you use them)
```bash
# Convert albums CSV similarly
# Then import
npx wrangler d1 execute photo-banast-as --remote --file=albums_import.sql
npx wrangler d1 execute photo-banast-as --remote --file=album_photo_import.sql
```

### Step 4: Verify Migration

```bash
# Check photo count
npx wrangler d1 execute photo-banast-as --remote \
  --command="SELECT COUNT(*) as total FROM photos"

# Check recent photos
npx wrangler d1 execute photo-banast-as --remote \
  --command="SELECT id, title, taken_at FROM photos ORDER BY taken_at DESC LIMIT 10"

# Check tags
npx wrangler d1 execute photo-banast-as --remote \
  --command="SELECT id, tags FROM photos WHERE tags IS NOT NULL LIMIT 5"
```

## Simplified Migration Script

I'll create an automated script for you:

```bash
cat > migrate_database.sh << 'EOF'
#!/bin/bash
set -e

echo "🔄 Migrating Vercel Postgres → Cloudflare D1"
echo ""

# Check if POSTGRES_URL is set
if [ -z "$POSTGRES_URL" ]; then
    echo "❌ Error: POSTGRES_URL not set"
    echo "   Get it from Vercel Dashboard → Storage → Postgres → .env.local"
    echo "   Then run: export POSTGRES_URL='your_connection_string'"
    exit 1
fi

# Export from Vercel Postgres
echo "📤 Exporting from Vercel Postgres..."
psql "$POSTGRES_URL" -c "\COPY photos TO 'photos_export.csv' CSV HEADER"
psql "$POSTGRES_URL" -c "\COPY albums TO 'albums_export.csv' CSV HEADER" 2>/dev/null || echo "ℹ️  No albums table"
psql "$POSTGRES_URL" -c "\COPY album_photo TO 'album_photo_export.csv' CSV HEADER" 2>/dev/null || echo "ℹ️  No album_photo table"

# Count records
PHOTO_COUNT=$(wc -l < photos_export.csv)
echo "✅ Exported $PHOTO_COUNT photos"

# Convert to D1 format (simplified - just copy for now)
echo ""
echo "📝 Converting to D1 format..."
# You'll need to manually convert CSV to SQL INSERT statements
echo "⚠️  Manual conversion needed - see DATA_MIGRATION_GUIDE.md"

echo ""
echo "📤 Next steps:"
echo "   1. Convert CSV to SQL INSERT statements"
echo "   2. Run: npx wrangler d1 execute photo-banast-as --remote --file=photos_import.sql"

EOF

chmod +x migrate_database.sh
```

## Alternative: Use Google Sheet Method

Since you mentioned wanting to use Google Sheets:

### Easy Migration via CSV

1. **Export from Vercel** (as above)
2. **Clean up in Google Sheets:**
   - Import `photos_export.csv` to Google Sheets
   - Clean/edit as needed
   - Export as CSV
3. **Create import script:**
   ```bash
   # Convert your cleaned CSV to SQL
   # Then import to D1
   ```

## Photos Migration

**Good news:** Your photos are already in R2! (`photo-banast-as` bucket)

You only need to migrate the **database metadata** (titles, tags, EXIF, etc.)

The photos themselves don't need to move - they're already in the right place!

## Recommended Approach

### For Quick Testing:
1. **Don't migrate** - deploy fresh Cloudflare site
2. Test with a few photos
3. Make sure everything works
4. Then decide if you want to migrate

### For Production:
1. **Keep Vercel running** (your current site)
2. **Deploy to Cloudflare** with fresh D1
3. **Test thoroughly** on `.pages.dev` domain
4. **Once confident**, do full migration
5. **Switch domain** from Vercel to Cloudflare

## Need Help?

The migration is optional! You can:
- ✅ Start fresh on Cloudflare (easiest)
- ✅ Run both sites in parallel (safest)
- ✅ Do full migration later (when ready)

Your photos are safe in R2 regardless! 🎉

---

**Recommendation: Deploy to Cloudflare first with fresh D1, test it, then decide on migration.**
