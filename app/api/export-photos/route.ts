// app/api/export-photos/route.ts
import { NextResponse } from 'next/server';

function between(src: string, a: string, b: string): string | null {
  const i = src.indexOf(a);
  if (i === -1) return null;
  const j = src.indexOf(b, i + a.length);
  if (j === -1) return null;
  return src.slice(i + a.length, j);
}

export const revalidate = 3600; // 1h edge cache

export async function GET() {
  const base = 'https://photo.banast.as';
  const r = await fetch(`${base}/sitemap.xml`, {
    next: { revalidate },
  });
  if (!r.ok) {
    return new NextResponse('sitemap fetch failed', { status: 502 });
  }
  const xml = await r.text();

  const urls: string[] = [];
  let rest = xml;
  while (true) {
    const loc = between(rest, '<loc>', '</loc>');
    if (!loc) break;
    urls.push(loc);
    const end = rest.indexOf('</loc>') + '</loc>'.length;
    rest = rest.slice(end);
  }

  const items = urls
    .filter((u) => /\/p\/[^/]+$/.test(u))
    .map((u) => {
      const m = u.match(/\/p\/([^/?#]+)$/);
      return { id: m ? m[1] : null, permalink: u };
    })
    .filter((x): x is { id: string; permalink: string } => !!x.id);

  return NextResponse.json(
    { items },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, max-age=3600',
      },
    },
  );
}
