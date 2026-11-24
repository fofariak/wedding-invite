// The owner's API for a hosted invitation. Everything except "create" needs the private edit token
// (sent as "Authorization: Bearer <token>").
//   POST   /api/invites                 create an unpaid draft -> {id, token}
//   GET    /api/invites/:id             the owner's view: status, paid, details, guest link
//   PUT    /api/invites/:id             save details {data}            (paid only)
//   POST   /api/invites/:id/assets      upload one photo or song       (paid only; raw bytes, Content-Type set)
//   POST   /api/invites/:id/status      publish or unpublish {live}    (paid only)
//   DELETE /api/invites/:id             delete the invitation and its files
import { createHash } from 'node:crypto';
import { handle, json, readJson, HttpError, newId, newToken, ID_RE, siteUrl } from '../lib/http.mjs';
import { store, newRecord, loadInvite, saveInvite, loadOwned, assetKey, deleteAssets, deleteInvite } from '../lib/store.mjs';
import { validateData, usedAssets, expiryFor, ownerView, assetPath, LIMITS, IMAGE_TYPES, AUDIO_TYPES } from '../lib/invite.mjs';

export const config = { path: ['/api/invites', '/api/invites/:id', '/api/invites/:id/:action'] };

export default handle(async (req, context) => {
  const { id, action } = context.params || {};
  const method = req.method;

  if (!id) {
    if (method !== 'POST') throw new HttpError(405, 'Not allowed.');
    let newIdValue;
    for (let i = 0; i < 5 && !newIdValue; i++) { const c = newId(); if (!(await loadInvite(c))) newIdValue = c; }
    if (!newIdValue) throw new HttpError(503, 'Please try again.');
    const token = newToken();
    await saveInvite(newRecord(newIdValue, token));
    return json(201, { id: newIdValue, token });
  }

  if (!ID_RE.test(id)) throw new HttpError(404, 'Invitation not found.');
  const rec = await loadOwned(req, id);

  if (!action) {
    if (method === 'GET') return json(200, ownerView(rec, siteUrl(req)));
    if (method === 'DELETE') { await deleteInvite(rec); return json(200, { deleted: true }); }
    if (method === 'PUT') {
      requirePaid(rec);
      const body = await readJson(req, LIMITS.dataBytes);
      const data = validateData(body.data, rec);
      rec.data = data;
      rec.expiresAt = expiryFor(data, rec.createdAt);
      await deleteAssets(rec, usedAssets(data)); // remove photos and songs no longer used
      await saveInvite(rec);
      return json(200, ownerView(rec, siteUrl(req)));
    }
    throw new HttpError(405, 'Not allowed.');
  }

  if (action === 'assets' && method === 'POST') {
    requirePaid(rec);
    const type = (req.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const isImage = IMAGE_TYPES.includes(type), isAudio = AUDIO_TYPES.includes(type);
    if (!isImage && !isAudio) throw new HttpError(415, 'Please use a JPG, PNG or WebP photo, or an MP3 or M4A song.');
    const bytes = Buffer.from(await req.arrayBuffer());
    const max = isImage ? LIMITS.imageBytes : LIMITS.audioBytes;
    if (bytes.length > max) throw new HttpError(413, isImage ? 'That photo is too large.' : 'That song is over 3 MB. Please use a shorter clip.');
    if (!bytes.length || !looksLike(bytes, type)) throw new HttpError(415, 'That file could not be read.');
    const assetId = createHash('sha256').update(bytes).digest('hex').slice(0, 20);
    if (!rec.assets[assetId]) {
      if (Object.keys(rec.assets).length >= LIMITS.assets) throw new HttpError(409, 'Too many files. Save your changes first, then try again.');
      await store().set(assetKey(rec.id, assetId), bytes, { metadata: { type } });
      rec.assets[assetId] = { type, size: bytes.length };
      await saveInvite(rec);
    }
    return json(200, { path: assetPath(rec.id, assetId) });
  }

  if (action === 'status' && method === 'POST') {
    requirePaid(rec);
    if (rec.status === 'refunded') throw new HttpError(409, 'This invitation was refunded and cannot be published.');
    const body = await readJson(req, 1024);
    if (body.live && !rec.data) throw new HttpError(409, 'Save your invitation before publishing it.');
    rec.status = body.live ? 'live' : 'unpublished';
    await saveInvite(rec);
    return json(200, ownerView(rec, siteUrl(req)));
  }

  throw new HttpError(404, 'Not found.');
});

function requirePaid(rec) {
  if (!rec.paid) throw new HttpError(402, 'Please complete payment first.');
}

// Checks the first bytes match the declared file type.
function looksLike(b, type) {
  const at = (i, s) => b.subarray(i, i + s.length).toString('latin1') === s;
  switch (type) {
    case 'image/jpeg': return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case 'image/png': return at(0, '\x89PNG');
    case 'image/webp': return at(0, 'RIFF') && at(8, 'WEBP');
    case 'audio/mpeg': return at(0, 'ID3') || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0);
    case 'audio/mp4': case 'audio/aac': return at(4, 'ftyp') || (b[0] === 0xff && (b[1] & 0xf6) === 0xf0);
    case 'audio/ogg': return at(0, 'OggS');
    case 'audio/wav': case 'audio/x-wav': return at(0, 'RIFF') && at(8, 'WAVE');
    case 'audio/webm': return b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3;
    default: return false;
  }
}
