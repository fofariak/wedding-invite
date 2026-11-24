// Public guest pages for hosted invitations.
//   GET /i/:id            the invitation itself (only while published, paid and not expired)
//   GET /i/:id/a/:asset   a photo or song belonging to it
// Guest pages are never listed by search engines, and never contain the private edit token.
import engine from '../../src/engine/engine.js';
import R from '../lib/generated/resources.mjs';
import { ID_RE, siteUrl } from '../lib/http.mjs';
import { store, loadInvite, assetKey } from '../lib/store.mjs';
import { isLive, assetsVisible } from '../lib/invite.mjs';

export const config = { path: ['/i/:id', '/i/:id/a/:asset'] };

const NOINDEX = 'noindex, nofollow, noarchive';
const esc = engine.esc;

export default async (req, context) => {
  const { id, asset } = context.params || {};
  try {
    if (!ID_RE.test(id || '')) return notFound();
    const rec = await loadInvite(id);
    if (asset) return await serveAsset(rec, id, asset);
    if (!isLive(rec)) return notFound();
    return page(rec, siteUrl(req));
  } catch (e) {
    console.error(e);
    return new Response('Something went wrong. Please try again in a moment.', { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': NOINDEX } });
  }
};

function page(rec, site) {
  const S = rec.data;
  const res = Object.assign({}, R, { fontsBase: '/' });
  let html = engine.build(S, {}, res);
  const P = R.phrases[S.lang] || R.phrases.en;
  const trad = engine.TRAD[S.tradition] ? S.tradition : 'hindu';
  const title = S.name1 + P.format.join[trad] + S.name2;
  const when = longDate(S.date, P.format);
  const desc = [when, S.venue].filter(Boolean).join(' · ') || 'Wedding invitation';
  const cover = (S.photos[S.cover] || S.photos[0] || {}).src || '';
  const url = site + '/i/' + rec.id;
  const meta = [
    '<meta name="robots" content="' + NOINDEX + '">',
    '<meta name="description" content="' + esc(desc) + '">',
    '<meta property="og:type" content="website">',
    '<meta property="og:title" content="' + esc(title) + '">',
    '<meta property="og:description" content="' + esc(desc) + '">',
    '<meta property="og:url" content="' + esc(url) + '">',
    cover.startsWith('/i/') ? '<meta property="og:image" content="' + esc(site + cover) + '">' : '',
    '<meta name="twitter:card" content="summary_large_image">',
  ].filter(Boolean).join('');
  html = html.replace('</head>', () => meta + '</head>');
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': NOINDEX,
      'Referrer-Policy': 'no-referrer',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Netlify-CDN-Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  });
}

async function serveAsset(rec, id, assetId) {
  if (!/^[0-9a-f]{20}$/.test(assetId) || !assetsVisible(rec) || !rec.assets[assetId]) return notFound();
  const got = await store().getWithMetadata(assetKey(id, assetId), { type: 'arrayBuffer' });
  if (!got) return notFound();
  return new Response(got.data, {
    status: 200,
    headers: {
      'Content-Type': rec.assets[assetId].type,
      'X-Robots-Tag': NOINDEX,
      'Cache-Control': 'public, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function longDate(d, F) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || '');
  if (!m) return '';
  const y = +m[1], mo = +m[2] - 1, da = +m[3], wd = new Date(Date.UTC(y, mo, da)).getUTCDay();
  return engine.fill(F.date_long, { weekday: F.days[wd], day: String(da), month: F.months[mo], year: String(y) });
}

function notFound() {
  const brand = esc(R.brand);
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="robots" content="' + NOINDEX + '"><title>Invitation not available</title><link rel="stylesheet" href="/fonts/fonts.css"><link rel="stylesheet" href="/page.css"></head>' +
    '<body><header><div class="wrap"><a class="brand" href="/">' + brand + '</a></div></header><main class="wrap"><h1>This invitation is not available</h1>' +
    '<p>The link may be mistyped, or the couple may have taken the invitation offline. If you were sent this link, please ask them for the latest one.</p>' +
    '<p style="margin-top:24px"><a href="/">Create your own invitation</a></p></main></body></html>';
  return new Response(html, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': NOINDEX, 'Cache-Control': 'no-store' } });
}
