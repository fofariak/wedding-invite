// Rules for hosted invitations: checking incoming details, how long they stay online, and when they are visible.
import engine from '../../src/engine/engine.js';
import R from './generated/resources.mjs';
import { HttpError } from './http.mjs';

export const LIMITS = {
  photos: 12,
  events: 20,
  imageBytes: 1.5 * 1024 * 1024,
  audioBytes: 3 * 1024 * 1024,
  assets: 20,
  dataBytes: 200 * 1024,
};
export const MONTHS_ONLINE_AFTER_WEDDING = 12;

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const AUDIO_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/webm'];

export const assetPath = (id, assetId) => '/i/' + id + '/a/' + assetId;
const ASSET_RE = /^\/i\/([a-z2-9]{12})\/a\/([0-9a-f]{20})$/;
const PLACEHOLDER = 'data:image/svg+xml;charset=utf-8,%3Csvg';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// Plain text: control characters removed, length capped.
function text(v, max) {
  return typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').slice(0, max) : '';
}
const pick = (v, allowed, fallback) => (allowed.includes(v) ? v : fallback);
const date = (v) => (typeof v === 'string' && DATE_RE.test(v) ? v : '');
const time = (v) => (typeof v === 'string' && TIME_RE.test(v) ? v : '');
const hex = (v, fallback) => (typeof v === 'string' && HEX_RE.test(v) ? v.toLowerCase() : fallback);

// Accepts only our own uploaded files for this invitation (or the built-in placeholder pictures).
function assetRef(v, rec, kind) {
  if (typeof v !== 'string' || v === '') return '';
  const m = ASSET_RE.exec(v);
  if (m && m[1] === rec.id && rec.assets[m[2]]) {
    const type = rec.assets[m[2]].type;
    if ((kind === 'image' && IMAGE_TYPES.includes(type)) || (kind === 'audio' && AUDIO_TYPES.includes(type))) return v;
  }
  if (kind === 'image' && v.startsWith(PLACEHOLDER) && v.length <= 4000) return v;
  throw new HttpError(400, 'Please upload photos and songs again before saving.');
}

// Turns whatever the browser sent into a clean invitation, or refuses it.
export function validateData(raw, rec) {
  if (!raw || typeof raw !== 'object') throw new HttpError(400, 'Bad request.');
  const template = pick(raw.template, Object.keys(R.templates), engine.DEFAULT_TEMPLATE);
  const themes = Object.keys(R.templates[template].themes);
  const photos = Array.isArray(raw.photos) ? raw.photos.slice(0, LIMITS.photos) : [];
  if (!photos.length) throw new HttpError(400, 'Please keep at least one photo.');
  const events = Array.isArray(raw.events) ? raw.events.slice(0, LIMITS.events) : [];
  const S = {
    template,
    // Only languages a native speaker has reviewed ("reviewed" not false in src/i18n/<code>.json) reach customers.
    lang: pick(raw.lang, Object.keys(R.phrases).filter((k) => R.phrases[k].reviewed !== false), engine.DEFAULT_LANG),
    theme: pick(raw.theme, themes, themes.includes('wine') ? 'wine' : themes[0]),
    tradition: pick(raw.tradition, Object.keys(engine.TRAD), 'hindu'),
    tz: typeof raw.tz === 'string' && /^[+-]\d{2}:\d{2}$/.test(raw.tz) ? raw.tz : '+05:30',
    name1: text(raw.name1, 60), name2: text(raw.name2, 60),
    rel1: text(raw.rel1, 40), rel2: text(raw.rel2, 40),
    parents1: text(raw.parents1, 160), parents2: text(raw.parents2, 160),
    frontLabel: text(raw.frontLabel, 120), inviteLine: text(raw.inviteLine, 200),
    coverTitle: text(raw.coverTitle, 60), coverSub: text(raw.coverSub, 80),
    date: date(raw.date), time: time(raw.time), bannerLine: text(raw.bannerLine, 160),
    events: events.map((e) => {
      e = e && typeof e === 'object' ? e : {};
      return {
        name: text(e.name, 80), date: date(e.date), time: time(e.time), place: text(e.place, 160),
        dress: text(e.dress, 120), c1: hex(e.c1, '#e9d7ad'), c2: e.c2 ? hex(e.c2, '') : '',
        style: pick(e.style, Object.keys(engine.STYLES), 'ceremony'),
        dressOn: e.dressOn !== false, swatch: e.swatch !== false,
      };
    }),
    photos: photos.map((p) => {
      p = p && typeof p === 'object' ? p : {};
      return { src: assetRef(p.src, rec, 'image'), caption: text(p.caption, 120), pos: pick(p.pos, ['20%', '50%', '80%'], '50%') };
    }),
    cover: 0,
    recOn: raw.recOn !== false,
    recLabel: text(raw.recLabel, 80), recTitle: text(raw.recTitle, 80), recDate: date(raw.recDate),
    recLine: text(raw.recLine, 160), recVenue: text(raw.recVenue, 160), recChip: text(raw.recChip, 120),
    venue: text(raw.venue, 120), address: text(raw.address, 200), city: text(raw.city, 40),
    mapArea: text(raw.mapArea, 40), mapLandmark: text(raw.mapLandmark, 40), mapRoad: text(raw.mapRoad, 40),
    closing: text(raw.closing, 200), kids: text(raw.kids, 240),
    song: assetRef(raw.song, rec, 'audio'), songName: text(raw.songName, 120),
    rsvpPhone: text(raw.rsvpPhone, 30),
    hashtag: engine.hashtagOf(text(raw.hashtag, 80)),
    opening: validateOpening(raw.opening),
  };
  if (S.photos.some((p) => !p.src)) throw new HttpError(400, 'Every photo needs a picture.');
  const c = Number(raw.cover);
  S.cover = Number.isInteger(c) && c >= 0 && c < S.photos.length ? c : 0;
  return S;
}

// The opening (mantra, verse, phrase): a real library ID, 'custom' with the customer's own words, or none.
function validateOpening(o) {
  o = o && typeof o === 'object' ? o : {};
  const M = R.openings.meta;
  const ids = (list) => list.map((x) => x.id);
  let id = typeof o.id === 'string' ? o.id : '';
  if (id && id !== 'custom' && !engine.findOpening(R, id)) id = '';
  const custom = typeof o.custom === 'string' ? o.custom.replace(/\r/g, '').split('\n').slice(0, 12).join('\n') : '';
  return {
    id, custom: text(custom, 600), // text() keeps line breaks and removes other control characters
    design: pick(o.design, ids(M.designs), 'classic'), size: pick(o.size, ids(M.sizes), 'm'),
    color: pick(o.color, ids(M.colors), 'gold'), version: pick(o.version, ids(M.bibleVersions), 'kjv'),
    gujarati: o.gujarati === true, translit: o.translit === true, meaning: o.meaning !== false, ref: o.ref !== false,
  };
}

// Asset IDs used by the invitation (so unused uploads can be removed).
export function usedAssets(S) {
  const used = new Set();
  for (const src of [S.song, ...S.photos.map((p) => p.src)]) {
    const m = ASSET_RE.exec(src || '');
    if (m) used.add(m[2]);
  }
  return used;
}

// The invitation goes offline automatically some months after the wedding date.
export function expiryFor(S, createdAt) {
  const base = S.date ? new Date(S.date + 'T00:00:00Z') : new Date(createdAt);
  if (isNaN(base)) return null;
  const d = new Date(base);
  d.setUTCMonth(d.getUTCMonth() + MONTHS_ONLINE_AFTER_WEDDING);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}

const expired = (rec, now) => !!rec.expiresAt && now >= new Date(rec.expiresAt);
export const isLive = (rec, now = new Date()) => !!(rec && rec.paid && rec.data && rec.status === 'live' && !expired(rec, now));
// Photos and songs stay viewable for the owner while editing an unpublished invitation.
export const assetsVisible = (rec, now = new Date()) => !!(rec && rec.paid && rec.status !== 'refunded' && !expired(rec, now));

// What the owner's editor receives.
export function ownerView(rec, site) {
  return {
    id: rec.id, status: rec.status, paid: !!rec.paid, data: rec.data, expiresAt: rec.expiresAt,
    guestUrl: site + '/i/' + rec.id,
  };
}
