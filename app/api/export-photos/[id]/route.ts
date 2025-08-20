// app/api/export-photos/[id]/route.ts
import { NextResponse } from 'next/server';

function toTitleCase(str: string) {
  return str.split(/\s+/).map(w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w).join(' ');
}

export const revalidate = 3600;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const permalink = `https://photo.banast.as/p/${id}`;

  const r = await fetch(permalink, { next: { revalidate } });
  if (!r.ok) return new NextResponse('not found', { status: 404 });
  const html = await r.text();

  // og:image
  const image_url = (html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1]) ?? null;

  // normalize visible text to lines
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|h\d)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
  const lines = text.split('\n').map(s => s.trim()).filter(Boolean);

  // helpers
  const reFocal   = /\b(\d+(?:\.\d+)?)\s*mm\b/i;
  const reFstop   = /\b[fƒ]\s*\/\s*(\d+(?:\.\d+)?)\b/i;
  const reShutter = /\b(\d+\/\d+s|\d+(?:\.\d+)?s)\b/i;
  const reISO     = /\bISO\s*(\d+)\b/i;
  const reEV      = /\b(-?\d+(?:\.\d+)?\s*ev)\b/i;
  const reDate    = /\b(\d{1,2}\s+[A-Za-z]{3}\s+\d{4}\s+\d{1,2}:\d{2}(?:AM|PM))\b/i;

  // anchor on date, walk upward to find EXIF block
  const dateIdx = lines.findIndex(l => reDate.test(l));
  let exifStart = -1;
  if (dateIdx !== -1) {
    for (let i = dateIdx - 1; i >= 0; i--) {
      const L = lines[i];
      if (reFocal.test(L) || reFstop.test(L) || reShutter.test(L) || reISO.test(L) || reEV.test(L)) {
        exifStart = i;
        while (exifStart - 1 >= 0) {
          const P = lines[exifStart - 1];
          if (reFocal.test(P) || reFstop.test(P) || reShutter.test(P) || reISO.test(P) || reEV.test(P)) exifStart--;
          else break;
        }
        break;
      }
    }
  }

  // tags (ALL CAPS) just above EXIF; camera above tags
  const tagLines: string[] = [];
  let camera: string | null = null;
  if (exifStart > 0) {
    for (let i = exifStart - 1; i >= 0; i--) {
      const L = lines[i];
      if (!L || L.length > 50) break;
      if (reFocal.test(L) || reFstop.test(L) || reShutter.test(L) || reISO.test(L) || reEV.test(L) || reDate.test(L)) break;
      if (L === L.toUpperCase() && !/[0-9/]/.test(L) && !/^ISO\b/.test(L)) {
        tagLines.unshift(L);
        continue;
      }
      camera = L;
      break;
    }
  }
  if (!camera) {
    const mCam = text.match(/\b(Canon EOS [A-Za-z0-9\- ]+|Nikon [A-Za-z0-9\- ]+|Sony [A-Za-z0-9\- ]+|Fujifilm [A-Za-z0-9\- ]+|Leica [A-Za-z0-9\- ]+|Pentax [A-Za-z0-9\- ]+|iPhone [A-Za-z0-9\- ]+|Pixel [A-Za-z0-9\- ]+|Samsung Galaxy [A-Za-z0-9\- ]+)\b/);
    if (mCam) camera = mCam[1];
  }

  const tags = tagLines.map(toTitleCase);
  const placeTags = tags.filter(t => t.length > 3 && (/\s/.test(t) || /[aeiou]/i.test(t)));
  const location = placeTags.slice(0, 2).join(', ') || (tags[0] ?? null);

  // exif + date
  const focal   = text.match(reFocal)?.[1];
  const fstop   = text.match(reFstop)?.[1];
  const shutter = text.match(reShutter)?.[1] ?? null;
  const iso     = text.match(reISO)?.[1];
  const ev      = text.match(reEV)?.[1];
  const taken   = text.match(reDate)?.[1];

  const payload = {
    id,
    permalink,
    image_url,
    tags,
    location,
    camera: camera ?? null,
    focal_length: focal ? `${focal}mm` : null,
    f_stop: fstop ? `f/${fstop}` : null,
    shutter,
    iso: iso ? `ISO ${iso}` : null,
    ev: ev ? `${ev}ev` : null,
    taken_at: taken ?? null,
  };

  return NextResponse.json(payload, { headers: { 'Cache-Control': 'public, s-maxage=3600, max-age=3600' } });
}
