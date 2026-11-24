// Small helpers shared by the server functions: responses, request bodies, random IDs and edit-link checks.
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export function json(status, data, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}

export const fail = (status, error) => json(status, { error });

// Reads a JSON body, refusing anything larger than maxBytes.
export async function readJson(req, maxBytes) {
  const text = await req.text();
  if (Buffer.byteLength(text) > maxBytes) throw new HttpError(413, 'That is too large to save.');
  try { return JSON.parse(text || '{}'); } catch (e) { throw new HttpError(400, 'Bad request.'); }
}

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// Wraps a handler so thrown HttpErrors become clean JSON responses and nothing else leaks.
export const handle = (fn) => async (req, context) => {
  try { return await fn(req, context); } catch (e) {
    if (e instanceof HttpError) return fail(e.status, e.message);
    console.error(e);
    return fail(500, 'Something went wrong. Please try again.');
  }
};

// Public invitation ID: 12 lowercase letters/digits (about 62 bits), easy to read in a link.
export function newId() {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789'; // no look-alikes (l, 1, o, 0)
  const bytes = randomBytes(12);
  let id = '';
  for (const b of bytes) id += alphabet[b % alphabet.length];
  return id;
}
export const ID_RE = /^[a-z2-9]{12}$/;

// Private edit token: 32 random bytes. Only its SHA-256 hash is stored.
export const newToken = () => randomBytes(32).toString('base64url');
export const sha256 = (s) => createHash('sha256').update(s).digest('hex');

export function bearer(req) {
  const m = /^Bearer ([A-Za-z0-9_-]{20,100})$/.exec(req.headers.get('authorization') || '');
  return m ? m[1] : '';
}

export function sameHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length || !/^[0-9a-f]*$/.test(a + b)) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

export function siteUrl(req) {
  return (process.env.URL || new URL(req.url).origin).replace(/\/$/, '');
}
