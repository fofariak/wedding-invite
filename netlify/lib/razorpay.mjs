// Razorpay: orders, payment checks and signature checks. Keys live only in Netlify environment variables:
//   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
import { createHmac, timingSafeEqual } from 'node:crypto';
import { HttpError } from './http.mjs';

const API = 'https://api.razorpay.com/v1';

export function keys() {
  const id = process.env.RAZORPAY_KEY_ID || '', secret = process.env.RAZORPAY_KEY_SECRET || '';
  return { id, secret, ready: !!(id && secret) };
}

// The price is decided here on the server (Netlify settings), never by the browser.
export function price() {
  const amount = parseInt(process.env.PRICE_AMOUNT || '49900', 10);
  const currency = (process.env.PRICE_CURRENCY || 'inr').toUpperCase();
  return { amount: Number.isInteger(amount) && amount > 0 ? amount : 0, currency: /^[A-Z]{3}$/.test(currency) ? currency : 'INR' };
}

async function api(method, path, body) {
  const { id, secret } = keys();
  if (!id || !secret) throw new HttpError(503, 'Payments are not set up yet.');
  let res;
  try {
    res = await fetch(API + path, {
      method,
      headers: { Authorization: 'Basic ' + Buffer.from(id + ':' + secret).toString('base64'), 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    console.error('Razorpay unreachable', e);
    throw new HttpError(502, 'The payment service could not be reached. Please try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('Razorpay error', res.status, data && data.error && data.error.description);
    throw new HttpError(502, 'The payment service refused the request.');
  }
  return data;
}

export const createOrder = (amount, currency, receipt, notes) => api('POST', '/orders', { amount, currency, receipt, notes });
export const fetchOrder = (orderId) => api('GET', '/orders/' + encodeURIComponent(orderId));
export const fetchPayment = (paymentId) => api('GET', '/payments/' + encodeURIComponent(paymentId));

const hmacHex = (secret, message) => createHmac('sha256', secret).update(message).digest('hex');
function equalHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length || !/^[0-9a-f]+$/.test(a) || !/^[0-9a-f]+$/.test(b)) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

// Checkout success: HMAC-SHA256(order_id + "|" + payment_id, key secret). Use the order ID we created.
export function validPaymentSignature(orderId, paymentId, signature) {
  const { secret } = keys();
  return !!secret && equalHex(hmacHex(secret, orderId + '|' + paymentId), String(signature || ''));
}

// Webhooks: HMAC-SHA256(raw body, webhook secret), sent in the X-Razorpay-Signature header.
export function validWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
  return !!secret && equalHex(hmacHex(secret, rawBody), String(signature || ''));
}
