// Starts a Stripe Checkout payment for one invitation (one couple + wedding date).
// The price lives here on the server, so it cannot be changed from the browser.
const json = (statusCode, data) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(data),
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST.' });
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret || !process.env.LICENSE_SECRET) return json(503, { error: 'Payments are not set up yet.' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Bad request.' }); }
  const key = String(body.key || '');
  if (!/^[0-9a-f]{64}$/.test(key)) return json(400, { error: 'Bad request.' });
  const label = String(body.label || '').replace(/[\u0000-\u001f]/g, ' ').slice(0, 80);

  const site = (process.env.URL || 'https://' + event.headers.host).replace(/\/$/, '');
  const amount = parseInt(process.env.PRICE_AMOUNT || '1900', 10);
  const currency = (process.env.PRICE_CURRENCY || 'usd').toLowerCase();

  const p = new URLSearchParams();
  p.set('mode', 'payment');
  p.set('success_url', site + '/studio.html?paid={CHECKOUT_SESSION_ID}');
  p.set('cancel_url', site + '/studio.html?cancelled=1');
  p.set('line_items[0][quantity]', '1');
  p.set('line_items[0][price_data][currency]', currency);
  p.set('line_items[0][price_data][unit_amount]', String(amount));
  p.set('line_items[0][price_data][product_data][name]', process.env.PRODUCT_NAME || 'Animated wedding invitation');
  if (label) p.set('line_items[0][price_data][product_data][description]', 'For ' + label);
  p.set('metadata[invite_key]', key);
  p.set('allow_promotion_codes', 'true');

  try {
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + secret, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: p.toString(),
    });
    const s = await r.json();
    if (!r.ok || !s.url) {
      console.error('Stripe error', s && s.error && s.error.message);
      return json(502, { error: 'The payment service refused the request.' });
    }
    return json(200, { url: s.url });
  } catch (e) {
    console.error(e);
    return json(502, { error: 'The payment service could not be reached.' });
  }
};
