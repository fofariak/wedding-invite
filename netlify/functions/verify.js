// Two jobs:
//   GET  ?session_id=cs_...   after Stripe sends the buyer back: confirm the payment and issue a licence
//   POST {key, token}         before each download: confirm the licence is genuine
const crypto = require('crypto');
const json = (statusCode, data) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(data),
});
const sign = (key) => crypto.createHmac('sha256', process.env.LICENSE_SECRET).update(key).digest('hex');

exports.handler = async (event) => {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret || !process.env.LICENSE_SECRET) return json(503, { error: 'Payments are not set up yet.' });

  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Bad request.' }); }
    const key = String(body.key || ''), token = String(body.token || '');
    if (!/^[0-9a-f]{64}$/.test(key) || !/^[0-9a-f]{64}$/.test(token)) return json(200, { ok: false });
    const ok = crypto.timingSafeEqual(Buffer.from(sign(key), 'hex'), Buffer.from(token, 'hex'));
    return json(200, { ok });
  }

  if (event.httpMethod !== 'GET') return json(405, { error: 'Use GET or POST.' });
  const id = String((event.queryStringParameters || {}).session_id || '');
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return json(400, { error: 'Bad request.' });
  try {
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions/' + encodeURIComponent(id), {
      headers: { Authorization: 'Bearer ' + secret },
    });
    const s = await r.json();
    if (!r.ok) return json(200, { ok: false });
    const paid = s.status === 'complete' && (s.payment_status === 'paid' || s.payment_status === 'no_payment_required');
    const key = s.metadata && s.metadata.invite_key;
    if (!paid || !/^[0-9a-f]{64}$/.test(key || '')) return json(200, { ok: false });
    return json(200, { ok: true, key, token: sign(key) });
  } catch (e) {
    console.error(e);
    return json(502, { error: 'The payment service could not be reached.' });
  }
};
