// Hosted invitations: create, protect, upload, save, publish, guest page, unpublish, expire, delete.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startBlobs, call, JPEG, MP3 } from './helpers.mjs';
import invites from '../netlify/functions/invites.mjs';
import page from '../netlify/functions/invite-page.mjs';
import { loadInvite, saveInvite } from '../netlify/lib/store.mjs';
import samples from '../src/engine/samples.js';

let stop;
before(async () => { stop = await startBlobs(); });
after(async () => { await stop(); });

const create = async () => (await call(invites, 'POST', '/api/invites')).data;
const markPaid = async (id) => { const r = await loadInvite(id); r.paid = { orderId: 'order_test', paymentId: 'pay_test', amount: 49900, currency: 'INR', at: new Date().toISOString(), via: 'test' }; await saveInvite(r); };

test('create returns an id and a private token; record starts as an unpaid draft', async () => {
  const { id, token } = await create();
  assert.match(id, /^[a-z2-9]{12}$/);
  assert.ok(token.length >= 40);
  const rec = await loadInvite(id);
  assert.equal(rec.status, 'draft');
  assert.equal(rec.paid, null);
  assert.ok(!JSON.stringify(rec).includes(token), 'the token itself is never stored');
});

test('the owner API needs the right edit token', async () => {
  const { id, token } = await create();
  assert.equal((await call(invites, 'GET', '/api/invites/' + id, { params: { id } })).status, 404);
  assert.equal((await call(invites, 'GET', '/api/invites/' + id, { params: { id }, token: 'x'.repeat(43) })).status, 404);
  const ok = await call(invites, 'GET', '/api/invites/' + id, { params: { id }, token });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.paid, false);
  assert.equal(ok.data.guestUrl, 'http://localhost:8888/i/' + id);
});

test('saving, uploading and publishing need payment first', async () => {
  const { id, token } = await create();
  const p = { id };
  assert.equal((await call(invites, 'PUT', '/api/invites/' + id, { params: p, token, body: { data: samples.defaults() } })).status, 402);
  assert.equal((await call(invites, 'POST', '/api/invites/' + id + '/assets', { params: { id, action: 'assets' }, token, raw: JPEG, type: 'image/jpeg' })).status, 402);
  assert.equal((await call(invites, 'POST', '/api/invites/' + id + '/status', { params: { id, action: 'status' }, token, body: { live: true } })).status, 402);
});

test('full life of a paid invitation', async () => {
  const { id, token } = await create();
  await markPaid(id);
  const up = (raw, type) => call(invites, 'POST', '/api/invites/' + id + '/assets', { params: { id, action: 'assets' }, token, raw, type });

  // Uploads: real files accepted, fakes refused.
  const photo = await up(JPEG, 'image/jpeg');
  assert.equal(photo.status, 200);
  assert.match(photo.data.path, new RegExp('^/i/' + id + '/a/[0-9a-f]{20}$'));
  assert.equal((await up(Buffer.from('<script>alert(1)</script>'), 'image/jpeg')).status, 415);
  assert.equal((await up(JPEG, 'text/html')).status, 415);
  assert.equal((await up(Buffer.concat([JPEG, Buffer.alloc(2 * 1024 * 1024)]), 'image/jpeg')).status, 413);
  const song = await up(MP3, 'audio/mpeg');
  assert.equal(song.status, 200);

  // Save details using the uploaded files; a hostile name must come out escaped.
  const data = samples.defaults();
  data.name1 = '<script>alert("x")</script>';
  data.photos[0].src = photo.data.path;
  data.cover = 0;
  data.song = song.data.path;
  const saved = await call(invites, 'PUT', '/api/invites/' + id, { params: { id }, token, body: { data } });
  assert.equal(saved.status, 200);
  assert.equal(saved.data.expiresAt, '2028-01-01T00:00:00.000Z');

  // Not visible to guests until published.
  assert.equal((await call(page, 'GET', '/i/' + id, { params: { id } })).status, 404);
  const pub = await call(invites, 'POST', '/api/invites/' + id + '/status', { params: { id, action: 'status' }, token, body: { live: true } });
  assert.equal(pub.data.status, 'live');

  const guest = await call(page, 'GET', '/i/' + id, { params: { id } });
  assert.equal(guest.status, 200);
  assert.match(guest.headers.get('x-robots-tag'), /noindex/);
  assert.ok(guest.text.includes('<meta name="robots" content="noindex'));
  assert.ok(guest.text.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'), 'name is escaped');
  assert.ok(!guest.text.includes('<script>alert("x")'), 'no raw script from the name');
  assert.ok(guest.text.includes('og:image" content="http://localhost:8888' + photo.data.path), 'cover photo used for WhatsApp preview');
  assert.ok(guest.text.includes('Thursday, 31 December 2026 · The Oberoi'), 'preview description has date and venue');
  assert.ok(!guest.text.includes(token), 'edit token never appears on the guest page');
  assert.ok(guest.text.includes('href="/fonts/fonts.css"'));

  const img = await call(page, 'GET', photo.data.path, { params: { id, asset: photo.data.path.split('/').pop() } });
  assert.equal(img.status, 200);
  assert.equal(img.headers.get('content-type'), 'image/jpeg');

  // Removing the song from the invitation deletes the file.
  data.song = '';
  await call(invites, 'PUT', '/api/invites/' + id, { params: { id }, token, body: { data } });
  const songId = song.data.path.split('/').pop();
  assert.equal((await call(page, 'GET', song.data.path, { params: { id, asset: songId } })).status, 404);

  // Unpublish hides it again; publish shows it.
  await call(invites, 'POST', '/api/invites/' + id + '/status', { params: { id, action: 'status' }, token, body: { live: false } });
  assert.equal((await call(page, 'GET', '/i/' + id, { params: { id } })).status, 404);
  await call(invites, 'POST', '/api/invites/' + id + '/status', { params: { id, action: 'status' }, token, body: { live: true } });
  assert.equal((await call(page, 'GET', '/i/' + id, { params: { id } })).status, 200);

  // Past its expiry date it goes offline by itself.
  const rec = await loadInvite(id); rec.expiresAt = '2020-01-01T00:00:00.000Z'; await saveInvite(rec);
  assert.equal((await call(page, 'GET', '/i/' + id, { params: { id } })).status, 404);
  rec.expiresAt = '2099-01-01T00:00:00.000Z'; await saveInvite(rec);

  // Delete removes everything.
  assert.equal((await call(invites, 'DELETE', '/api/invites/' + id, { params: { id }, token })).status, 200);
  assert.equal(await loadInvite(id), null);
  assert.equal((await call(page, 'GET', '/i/' + id, { params: { id } })).status, 404);
  assert.equal((await call(page, 'GET', photo.data.path, { params: { id, asset: photo.data.path.split('/').pop() } })).status, 404);
});

test('details that point at outside files are refused', async () => {
  const { id, token } = await create();
  await markPaid(id);
  const data = samples.defaults();
  data.photos[0].src = 'https://tracker.example/pixel.jpg';
  assert.equal((await call(invites, 'PUT', '/api/invites/' + id, { params: { id }, token, body: { data } })).status, 400);
  const other = await create();
  data.photos[0].src = '/i/' + other.id + '/a/0123456789abcdef0123';
  assert.equal((await call(invites, 'PUT', '/api/invites/' + id, { params: { id }, token, body: { data } })).status, 400);
});

test('unknown and malformed guest links show the not-available page', async () => {
  for (const id of ['abcdefghjkmn', 'BAD', '../../etc']) {
    const r = await call(page, 'GET', '/i/' + id, { params: { id } });
    assert.equal(r.status, 404);
    assert.match(r.text, /not available/);
  }
});

test('openings: saved with the invitation, checked by the server, shown on the guest page', async () => {
  const { id, token } = await create();
  await markPaid(id);
  const save = (opening) => { const d = samples.defaults(); d.opening = opening; return call(invites, 'PUT', '/api/invites/' + id, { params: { id }, token, body: { data: d } }); };
  const publish = () => call(invites, 'POST', '/api/invites/' + id + '/status', { params: { id, action: 'status' }, token, body: { live: true } });

  // A Quranic verse: its own page, right-to-left, Arabic font, reference and meaning.
  let r = await save({ id: 'mu-q-30-21', design: 'framed', size: 'l', color: 'accent', meaning: true, ref: true });
  assert.equal(r.status, 200);
  assert.equal(r.data.data.opening.id, 'mu-q-30-21');
  await publish();
  let g = await call(page, 'GET', '/i/' + id, { params: { id } });
  assert.match(g.text, /<section class="opening-page" id="opening"/);
  assert.match(g.text, /class="op-text op-s-arab" lang="ar" dir="rtl"/);
  assert.ok(g.text.includes('href="/fonts/arab.css"'), 'Arabic font loaded on the guest page');
  assert.ok(g.text.includes('Surah Ar-Rum 30:21'));
  assert.ok(g.text.includes('Sahih International'));

  // Gujarati script option for a Hindu phrase: one line under the emblem.
  await save({ id: 'hi-gen-shri-ganeshay', gujarati: true });
  g = await call(page, 'GET', '/i/' + id, { params: { id } });
  assert.ok(g.text.includes('॥ શ્રી ગણેશાય નમઃ ॥'));
  assert.ok(g.text.includes('href="/fonts/gujr.css"'));
  assert.ok(!g.text.includes('id="opening"'), 'a one-line opening has no separate page');

  // Unknown IDs and bad options are corrected, never stored as-is.
  r = await save({ id: 'not-a-real-opening', design: '<script>', size: 'huge', color: 'red', version: 'niv' });
  assert.deepEqual([r.data.data.opening.id, r.data.data.opening.design, r.data.data.opening.size, r.data.data.opening.color, r.data.data.opening.version], ['', 'classic', 'm', 'gold', 'kjv']);

  // Custom words: line breaks kept, length capped, HTML escaped.
  r = await save({ id: 'custom', custom: 'Line one\nLine two <b>x</b>' + 'a'.repeat(900) });
  assert.equal(r.data.data.opening.custom.length, 600);
  g = await call(page, 'GET', '/i/' + id, { params: { id } });
  assert.ok(g.text.includes('Line one<br>Line two &lt;b&gt;x&lt;/b&gt;'));
});
