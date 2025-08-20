// app/api/export-photos/route.ts
import { NextResponse } from 'next/server';

export const revalidate = 3600; // 1h edge cache

export async function GET() {
  const base = 'https://photo.banast.as';
  const r = await fetch(`${base}/sitemap.xml`, { next: { revalidate } });
  if (!r.ok) return new NextResponse('sitemap fetch failed', { status: 502 });

  const xml = await r.text();

  // pull every <loc>…</loc> without mutable vars to satisfy ESLint
  const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map(m => m[1]);

  const items = locs
    .filter(u => /\/p\/[^/]+$/.test(u))
    .map(u => {
      const m = u.match(/\/p\/([^/?#]+)$/);
      return { id: m ? m[1] : null, permalink: u };
    })
    .filter((x): x is { id: string; permalink: string } => Boolean(x.id));

  return NextResponse.json(
    { items },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, max-age=3600' } }
  );
}