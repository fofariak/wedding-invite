// Test helpers: a local Netlify Blobs server and a way to call functions without deploying.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BlobsServer } from '@netlify/blobs/server';
import { getStore } from '@netlify/blobs';

export async function startBlobs() {
  const dir = mkdtempSync(join(tmpdir(), 'blobs-test-'));
  const token = 'test-token';
  const server = new BlobsServer({ directory: dir, token, port: 0 });
  const { port } = await server.start();
  globalThis.__inviteStore = getStore({ name: 'invites', edgeURL: 'http://localhost:' + port, token, siteID: 'test-site', consistency: 'strong', uncachedEdgeURL: 'http://localhost:' + port });
  return async () => { await server.stop(); rmSync(dir, { recursive: true, force: true }); delete globalThis.__inviteStore; };
}

// Calls a function the way Netlify would. `pattern` is matched to fill context.params.
export async function call(fn, method, url, { token, body, type, raw, headers = {}, params = {} } = {}) {
  const h = new Headers(headers);
  if (token) h.set('authorization', 'Bearer ' + token);
  let payload;
  if (raw !== undefined) { payload = raw; if (type) h.set('content-type', type); }
  else if (body !== undefined) { payload = JSON.stringify(body); h.set('content-type', 'application/json'); }
  const req = new Request('http://localhost:8888' + url, { method, headers: h, body: payload });
  const res = await fn(req, { params });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch (e) { data = text; }
  return { status: res.status, headers: res.headers, data, text };
}

// A tiny but real JPEG (1x1 pixel).
export const JPEG = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
// A tiny MP3 frame header followed by silence.
export const MP3 = Buffer.concat([Buffer.from([0xff, 0xfb, 0x90, 0x64]), Buffer.alloc(400)]);
