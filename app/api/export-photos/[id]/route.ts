// app/api/export-photos/[id]/route.ts
import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET(_req: Request, ctx: any) {
  const id: string = ctx?.params?.id;
  if (!id) return new NextResponse('bad request', { status: 400 });

  const permalink = `https://photo.banast.as/p/${id}`;
  const r = await fetch(permalink, { next: { revalidate } });
  if (!r.ok) return new NextResponse('not found', { status: 404 });
  const html = await r.text();

  // Share image from OG or fallback to /p/<id>/image
  const og = html.match(
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
  );
  const share_image_url = og ? og[1] : `${permalink}/image`;

  // Full image: pull original from any _next/image?url=... occurrence
  // Prefer the first occurrence in <link rel="preload"> or <img srcset>
  let full_image_url: string | null = null;
  const m1 = html.match(/\/_next\/image\?[^"']*url=([^&"'>]+)/i);
  if (m1 && m1[1]) {
    try {
      full_image_url = decodeURIComponent(m1[1]);
    } catch {
      full_image_url = null;
    }
  }

  // Fallback: if site uses a stable origin for originals
  if (!full_image_url) {
    const patternStr =
      'https?://photos\\.banast\\.as/photo-[A-Za-z0-9_-]+' +
      '\\.(?:jpg|jpeg|png|webp)';
    const m2 = html.match(new RegExp(patternStr, 'i'));
    if (m2) full_image_url = m2[0];
  }

  const payload = {
    id,
    permalink,
    share_image_url,
    full_image_url,
  };

  return NextResponse.json(
    payload,
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, max-age=3600',
      },
    },
  );
}