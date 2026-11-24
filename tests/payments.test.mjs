// Razorpay payments: orders, confirmation, webhooks, duplicates and refunds.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startBlobs, call } from './helpers.mjs';
import { installFakeRazorpay, setTestKeys } from './fake-razorpay.mjs';
import invites from '../netlify/functions/invites.mjs';
import pay from '../netlify/functions/pay.mjs';
import webhook from '../netlify/functions/razorpay-webhook.mjs';
import config from '../netlify/functions/config.mjs';
import page from '../netlify/functions/invite-page.mjs';
import { loadInvite } from '../netlify/lib/store.mjs';
import samples from '../src/engine/samples.js';

let stop, rzp;
before(async () => { stop = await startBlobs(); rzp = installFakeRazorpay(); });
after(async () => { rzp.restore(); await stop(); });

const create = async () => (await call(invites, 'POST', '/api/invites')).data;
const order = (id, token) => call(pay, 'POST', '/api/pay/order', { params: { step: 'order' }, token, body: { id } });
const confirm = (id, token, r) => call(pay, 'POST', '/api/pay/confirm', { params: { step: 'confirm' }, token, body: { id, orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature } });
const hook = (w, sig) => call(webhook, 'POST', '/api/razorpay-webhook', { raw: w.body, type: 'application/json', headers: { 'x-razorpay-signature': sig || w.signature } });

test('without Razorpay keys, payments report "not set up"', async () => {
  for (const k of ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET']) delete process.env[k];
  const c = await call(config, 'GET', '/.netlify/functions/config');
  assert.equal(c.data.ready, false);
  const { id, token } = await create();
  assert.equal((await order(id, token)).status, 503);
});

test('config: price comes from the server settings', async () => {
  setTestKeys();
  process.env.PRICE_AMOUNT = '49900'; process.env.PRICE_CURRENCY = 'inr';
  const c = await call(config, 'GET', '/.netlify/functions/config');
  assert.deepEqual([c.data.amount, c.data.currency, c.data.ready, c.data.testMode, c.data.provider], [49900, 'inr', true, true, 'razorpay']);
  assert.ok(!JSON.stringify(c.data).includes('secret'));
});

test('checkout: order -> pay -> confirm marks the invitation paid, once', async () => {
  setTestKeys();
  const { id, token } = await create();
  assert.equal((await order(id, 'x'.repeat(43))).status, 404, 'needs the edit token');
  const o = await order(id, token);
  assert.equal(o.status, 200);
  assert.equal(o.data.amount, 49900);
  assert.equal(o.data.currency, 'INR');
  assert.equal(o.data.keyId, 'rzp_test_localKey123');
  assert.equal(rzp.orders.get(o.data.orderId).notes.invite_id, id);

  // Before paying, confirming with a made-up signature fails.
  assert.equal((await confirm(id, token, { razorpay_order_id: o.data.orderId, razorpay_payment_id: 'pay_fake', razorpay_signature: 'ab'.repeat(32) })).status, 400);

  const paid = rzp.pay(o.data.orderId);
  const c1 = await confirm(id, token, paid);
  assert.deepEqual(c1.data, { paid: true, pending: false });
  let rec = await loadInvite(id);
  assert.equal(rec.paid.paymentId, paid.razorpay_payment_id);
  assert.equal(rec.status, 'unpublished');

  // Confirming again changes nothing; a new order is refused.
  assert.equal((await confirm(id, token, paid)).data.paid, true);
  assert.equal((await order(id, token)).status, 409);
  rec = await loadInvite(id);
  assert.equal(rec.duplicates.length, 0);
});

test('a valid signature for an order belonging to another invitation is refused', async () => {
  setTestKeys();
  const a = await create(), b = await create();
  const oa = await order(a.id, a.token);
  const paid = rzp.pay(oa.data.orderId);
  assert.equal((await confirm(b.id, b.token, paid)).status, 400);
  assert.equal((await loadInvite(b.id)).paid, null);
});

test('webhook completes a payment even if the customer closed the window', async () => {
  setTestKeys();
  const { id, token } = await create();
  const o = await order(id, token);
  const paid = rzp.pay(o.data.orderId);
  const w = rzp.webhook('payment.captured', { payment: { entity: { id: paid.razorpay_payment_id, order_id: o.data.orderId, amount: 49900, notes: [] } } });
  assert.equal((await hook(w, 'ab'.repeat(32))).status, 400, 'bad signature refused');
  assert.equal((await hook(w)).status, 200);
  assert.ok((await loadInvite(id)).paid);
  assert.equal((await hook(w)).status, 200, 'repeat delivery is harmless');
  assert.equal((await loadInvite(id)).duplicates.length, 0);
});

test('a second payment for an already-paid invitation is recorded for refund', async () => {
  setTestKeys();
  const { id, token } = await create();
  const o1 = await order(id, token);
  // Customer opens checkout in two tabs: two orders exist before the first is paid.
  const rec0 = await loadInvite(id);
  const o2 = await order(id, token);
  assert.equal(rec0.orders.length + 1, (await loadInvite(id)).orders.length);
  await confirm(id, token, rzp.pay(o1.data.orderId));
  const p2 = rzp.pay(o2.data.orderId);
  const w = rzp.webhook('order.paid', { order: { entity: { id: o2.data.orderId } }, payment: { entity: { id: p2.razorpay_payment_id, order_id: o2.data.orderId } } });
  await hook(w);
  const rec = await loadInvite(id);
  assert.equal(rec.duplicates.length, 1);
  assert.equal(rec.duplicates[0].orderId, o2.data.orderId);
  assert.equal(rec.paid.orderId, o1.data.orderId);

  // Refunding the duplicate leaves the invitation alone.
  rzp.refund(p2.razorpay_payment_id);
  await hook(rzp.webhook('refund.processed', { refund: { entity: { payment_id: p2.razorpay_payment_id } } }));
  assert.notEqual((await loadInvite(id)).status, 'refunded');
});

test('a full refund of the main payment takes the invitation offline', async () => {
  setTestKeys();
  const { id, token } = await create();
  const o = await order(id, token);
  const p = rzp.pay(o.data.orderId);
  await confirm(id, token, p);
  await call(invites, 'PUT', '/api/invites/' + id, { params: { id }, token, body: { data: samples.defaults() } });
  await call(invites, 'POST', '/api/invites/' + id + '/status', { params: { id, action: 'status' }, token, body: { live: true } });
  assert.equal((await call(page, 'GET', '/i/' + id, { params: { id } })).status, 200);

  rzp.refund(p.razorpay_payment_id);
  await hook(rzp.webhook('refund.processed', { refund: { entity: { payment_id: p.razorpay_payment_id } } }));
  assert.equal((await loadInvite(id)).status, 'refunded');
  assert.equal((await call(page, 'GET', '/i/' + id, { params: { id } })).status, 404);
  assert.equal((await call(invites, 'POST', '/api/invites/' + id + '/status', { params: { id, action: 'status' }, token, body: { live: true } })).status, 409);
});
