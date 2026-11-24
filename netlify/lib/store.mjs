// Storage for hosted invitations, using Netlify Blobs (store "invites").
//   invite/<id>            JSON record (see newRecord)
//   asset/<id>/<assetId>   a photo or song, with metadata {type}
// Tests and the local dev server set globalThis.__inviteStore to a store backed by a local Blobs server.
import { getStore } from '@netlify/blobs';
import { HttpError, bearer, sha256, sameHex } from './http.mjs';

export function store() {
  return globalThis.__inviteStore || getStore({ name: 'invites', consistency: 'strong' });
}

export function newRecord(id, token) {
  const now = new Date().toISOString();
  return {
    v: 1, id, editHash: sha256(token), createdAt: now, updatedAt: now,
    status: 'draft',      // draft (not paid yet) | live | unpublished | refunded
    paid: null,           // {orderId, paymentId, amount, currency, at, via} once paid
    orders: [],           // Razorpay order IDs created for this invitation
    duplicates: [],       // extra payments for an already-paid invitation (to refund)
    data: null,           // the invitation details, as checked by validateData()
    assets: {},           // assetId -> {type, size}
    expiresAt: null,      // set from the wedding date when data is saved
  };
}

export const loadInvite = (id) => store().get('invite/' + id, { type: 'json' });

export async function saveInvite(rec) {
  rec.updatedAt = new Date().toISOString();
  await store().setJSON('invite/' + rec.id, rec);
}

// Loads an invitation and checks the private edit token; 404 for both "missing" and "wrong token".
export async function loadOwned(req, id) {
  const token = bearer(req);
  const rec = token ? await loadInvite(id) : null;
  if (!rec || !sameHex(rec.editHash, sha256(token))) throw new HttpError(404, 'Invitation not found. Check your edit link.');
  return rec;
}

export const assetKey = (id, assetId) => 'asset/' + id + '/' + assetId;

export async function deleteAssets(rec, keep = new Set()) {
  for (const assetId of Object.keys(rec.assets)) {
    if (keep.has(assetId)) continue;
    await store().delete(assetKey(rec.id, assetId));
    delete rec.assets[assetId];
  }
}

export async function deleteInvite(rec) {
  await deleteAssets(rec);
  await store().delete('invite/' + rec.id);
}
