// app/api/export-photos/route.ts
import { NextResponse } from 'next/server';

function textBetween(s: string, a: string, b: string) {
  const i = s.indexOf(a);
  if (i === -1) return null;
  const j = s.indexOf(b, i + a.length);
  if (j === -1) return null;
  return s.slice(i + a.length, j);
}

export const revalidate = 3600; // cache at edge 1h

export async function GET() {
  const base = 'https://photo.banast.as';
  const r = await fetch(`${base}/sitemap.xml`, { next: { revalidate } });
  if (!r.ok) return new NextResponse('sitemap fetch failed', { status: 502 });
  const xml = await r.text();

  // very small XML pull; robust enough for sitemap
  const urls: string[] = [];
  let rest = xml;
  while (true) {
    const loc = textBetween(rest, '<loc>', '</loc>');
    if (!loc) break;
    urls.push(loc);
    rest = rest.slice(rest.indexOf('</loc>') + 6);
  }

  const items = urls
    .filter(u => /\/p\/[^/]+$/.test(u))
    .map(u => {
      const m = u.match(/\/p\/([^/?#]+)$/);
      return { id: m ? m[1] : null, permalink: u };
    })
    .filter(x => x.id);

  return NextResponse.json({ items }, { headers: { 'Cache-Control': 'public, s-maxage=3600, max-age=3600' } });
}
