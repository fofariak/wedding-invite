// A stand-in for Razorpay's API (orders, payments, refunds) used by the tests and the local dev server.
// It replaces global fetch only for api.razorpay.com; every other request goes through unchanged.
import { createHmac } from 'node:crypto';

export const TEST_KEYS = { id: 'rzp_test_localKey123', secret: 'local_test_key_secret', webhook: 'local_test_webhook_secret' };

export function installFakeRazorpay() {
  const orders = new Map(), payments = new Map();
  let n = 0;
  const realFetch = globalThis.fetch;
  const reply = (status, data) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

  globalThis.fetch = async (url, opts = {}) => {
    const u = new URL(typeof url === 'string' ? url : url.url);
    if (u.hostname !== 'api.razorpay.com') return realFetch(url, opts);
    const auth = 'Basic ' + Buffer.from(TEST_KEYS.id + ':' + TEST_KEYS.secret).toString('base64');
    if ((opts.headers || {}).Authorization !== auth) return reply(401, { error: { description: 'Authentication failed' } });
    const method = (opts.method || 'GET').toUpperCase();
    let m;
    if (method === 'POST' && u.pathname === '/v1/orders') {
      const b = JSON.parse(opts.body);
      if (!Number.isInteger(b.amount) || b.amount < 100) return reply(400, { error: { description: 'amount invalid' } });
      if (b.receipt && b.receipt.length > 40) return reply(400, { error: { description: 'receipt too long' } });
      if ([...orders.values()].some((o) => o.receipt === b.receipt)) return reply(400, { error: { description: 'duplicate receipt' } });
      const o = { id: 'order_T' + (++n), entity: 'order', amount: b.amount, amount_paid: 0, amount_due: b.amount, currency: b.currency, receipt: b.receipt, status: 'created', notes: b.notes || [] };
      orders.set(o.id, o);
      return reply(200, o);
    }
    if (method === 'GET' && (m = /^\/v1\/orders\/(.+)$/.exec(u.pathname))) {
      const o = orders.get(decodeURIComponent(m[1]));
      return o ? reply(200, o) : reply(400, { error: { description: 'not found' } });
    }
    if (method === 'GET' && (m = /^\/v1\/payments\/(.+)$/.exec(u.pathname))) {
      const p = payments.get(decodeURIComponent(m[1]));
      return p ? reply(200, p) : reply(400, { error: { description: 'not found' } });
    }
    return reply(404, { error: { description: 'unknown endpoint' } });
  };

  return {
    orders, payments,
    // Simulates a customer paying an order; returns what checkout.js would hand to the page.
    pay(orderId) {
      const o = orders.get(orderId);
      const p = { id: 'pay_T' + (++n), entity: 'payment', order_id: orderId, amount: o.amount, amount_refunded: 0, currency: o.currency, status: 'captured' };
      payments.set(p.id, p);
      o.status = 'paid'; o.amount_paid = o.amount; o.amount_due = 0;
      const signature = createHmac('sha256', TEST_KEYS.secret).update(orderId + '|' + p.id).digest('hex');
      return { razorpay_order_id: orderId, razorpay_payment_id: p.id, razorpay_signature: signature };
    },
    refund(paymentId) { const p = payments.get(paymentId); p.amount_refunded = p.amount; p.status = 'refunded'; },
    webhook(event, payload) {
      const body = JSON.stringify({ entity: 'event', event, payload });
      return { body, signature: createHmac('sha256', TEST_KEYS.webhook).update(body).digest('hex') };
    },
    restore() { globalThis.fetch = realFetch; },
  };
}

export function setTestKeys() {
  process.env.RAZORPAY_KEY_ID = TEST_KEYS.id;
  process.env.RAZORPAY_KEY_SECRET = TEST_KEYS.secret;
  process.env.RAZORPAY_WEBHOOK_SECRET = TEST_KEYS.webhook;
}
