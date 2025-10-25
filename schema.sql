-- Cloudflare D1 (SQLite) Schema for EXIF Photo Blog
-- This mirrors the PostgreSQL schema from the original Vercel deployment

-- Main photos table
CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  extension TEXT NOT NULL,
  aspect_ratio REAL NOT NULL DEFAULT 1.5,
  blur_data TEXT,

  -- EXIF Camera Data
  make TEXT,
  model TEXT,
  focal_length INTEGER,
  focal_length_in_35mm_format INTEGER,
  f_number REAL,
  iso INTEGER,
  exposure_time REAL,
  exposure_compensation REAL,

  -- EXIF Lens Data
  lens_make TEXT,
  lens_model TEXT,

  -- Location Data
  latitude REAL,
  longitude REAL,
  location_name TEXT,

  -- Film & Recipe Data
  film TEXT,
  recipe_data TEXT, -- JSON stored as TEXT
  recipe_title TEXT,

  -- Photo Metadata
  title TEXT,
  caption TEXT,
  semantic_description TEXT,
  tags TEXT, -- JSON array stored as TEXT (SQLite doesn't have native arrays)

  -- Color Data
  color_data TEXT, -- JSON stored as TEXT
  color_sort INTEGER,

  -- Display Control
  hidden INTEGER DEFAULT 0, -- SQLite uses 0/1 for boolean
  exclude_from_feeds INTEGER DEFAULT 0,
  priority_order INTEGER,

  -- Timestamps
  taken_at TEXT NOT NULL, -- ISO 8601 format
  taken_at_naive TEXT NOT NULL, -- Naive datetime without timezone
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Albums table
CREATE TABLE IF NOT EXISTS albums (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT, -- JSON stored as TEXT
  hidden INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Album-Photo junction table (many-to-many)
CREATE TABLE IF NOT EXISTS album_photo (
  album_id TEXT NOT NULL,
  photo_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (album_id, photo_id),
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_photos_taken_at ON photos(taken_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_hidden ON photos(hidden);
CREATE INDEX IF NOT EXISTS idx_photos_make_model ON photos(make, model);
CREATE INDEX IF NOT EXISTS idx_photos_lens ON photos(lens_make, lens_model);
CREATE INDEX IF NOT EXISTS idx_photos_film ON photos(film);
CREATE INDEX IF NOT EXISTS idx_photos_recipe_title ON photos(recipe_title);
CREATE INDEX IF NOT EXISTS idx_photos_updated_at ON photos(updated_at);
CREATE INDEX IF NOT EXISTS idx_photos_color_sort ON photos(color_sort);

CREATE INDEX IF NOT EXISTS idx_albums_hidden ON albums(hidden);

CREATE INDEX IF NOT EXISTS idx_album_photo_album_id ON album_photo(album_id);
CREATE INDEX IF NOT EXISTS idx_album_photo_photo_id ON album_photo(photo_id);

-- Trigger to update updated_at timestamp automatically
CREATE TRIGGER IF NOT EXISTS photos_updated_at
AFTER UPDATE ON photos
FOR EACH ROW
BEGIN
  UPDATE photos SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS albums_updated_at
AFTER UPDATE ON albums
FOR EACH ROW
BEGIN
  UPDATE albums SET updated_at = datetime('now') WHERE id = NEW.id;
END;
