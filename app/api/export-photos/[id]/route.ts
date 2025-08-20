// app/api/export-photos/[id]/route.ts
import { NextResponse } from 'next/server';

function toTitleCase(str: string): string {
  return str
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');
}

export const revalidate = 3600;

export async function GET(_req: Request, ctx: any) {
  const id: string = ctx?.params?.id;
  if (!id) return new NextResponse('bad request', { status: 400 });

  const permalink = `https://photo.banast.as/p/${id}`;
  const r = await fetch(permalink, { next: { revalidate } });
  if (!r.ok) return new NextResponse('not found', { status: 404 });
  const html = await r.text();

  const og = html.match(
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
  );
  const image_url = og ? og[1] : null;

  const sideMatch =
    html.match(/<aside[\s\S]*?<\/aside>/i) ||
    html.match(
      new RegExp(
        '<div[^>]*class=["\'][^"\']*' +
          '(sidebar|exif|meta)[^"\']*["\'][\\s\\S]*?<\\/div>',
        'i',
      ),
    );
  const side = sideMatch ? sideMatch[0] : html;

  const tagAnchors = Array.from(
    side.matchAll(/<a\b[^>]*>([^<]{2,})<\/a>/gi),
  ).map((m) => toTitleCase(m[1].trim()));
  const tags = tagAnchors.filter((t) => !/^ISO\b/i.test(t));

  function valueFor(label: string): string | null {
    const re = new RegExp(
      '(?:<dt[^>]*>\\s*' +
        label +
        '\\s*<\\/dt>\\s*<dd[^>]*>\\s*' +
        '([^<][\\s\\S]*?)<\\/(?:dd|p)>|' +
        '<[^>]*>\\s*' +
        label +
        '\\s*<\\/[^>]+>\\s*<[^>]+>\\s*' +
        '([^<][\\s\\S]*?)<\\/[^>]+>)',
      'i',
    );
    const m = side.match(re);
    if (!m) return null;
    return (m[1] || m[2] || '').toString().replace(/\s+/g, ' ').trim();
  }

  const cameraRaw = valueFor('Camera Type');
  const focalRaw = valueFor('Focal Length');
  const fstopRaw =
    valueFor('F-stop') || valueFor('ƒ-stop') || valueFor('F stop');
  const shutterRaw = valueFor('Shutter speed');
  const isoRaw = valueFor('ISO') || valueFor('ISO (If known)');
  const evRaw =
    valueFor('Ev value') || valueFor('EV value') || valueFor('Exposure');
  const taken_at = valueFor('Date Taken');

  const camera = cameraRaw ? cameraRaw : null;

  let focal_length: string | null = null;
  if (focalRaw) {
    const m = focalRaw.match(/(\d+(?:\.\d+)?)/);
    focal_length = m ? `${m[1]}mm` : focalRaw;
  }

  let f_stop: string | null = null;
  if (fstopRaw) {
    const m = fstopRaw.match(/(?:f|ƒ)[\s/]*([0-9.]+)/i);
    f_stop = m ? `f/${m[1]}` : fstopRaw.replace(/^Æ’/i, 'f/');
  }

  let shutter: string | null = null;
  if (shutterRaw) {
    const m = shutterRaw.match(/(\d+\/\d+s|\d+(?:\.\d+)?s)/i);
    shutter = m ? m[1] : shutterRaw;
  }

  let iso: string | null = null;
  if (isoRaw) {
    const m = isoRaw.match(/(\d{2,5})/);
    iso = m ? `ISO ${m[1]}` : isoRaw;
  }

  let ev: string | null = null;
  if (evRaw) {
    const m = evRaw.match(/(-?\d+(?:\.\d+)?)/);
    ev = m ? `${m[1]}ev` : evRaw.replace(/ev/gi, '').trim() + 'ev';
  }

  const placeTags = tags.filter(
    (t) => t.length > 3 && (/\s/.test(t) || /[aeiou]/i.test(t)),
  );
  const location =
    (placeTags.slice(0, 2).join(', ') || tags[0] || null) ?? null;

  const payload = {
    id,
    permalink,
    image_url,
    tags,
    location,
    camera,
    focal_length,
    f_stop,
    shutter,
    iso,
    ev,
    taken_at,
  };

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, max-age=3600',
    },
  });
}