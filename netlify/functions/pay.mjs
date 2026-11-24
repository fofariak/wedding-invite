// Payment for a hosted invitation (needs the private edit token).
//   POST /api/pay/order    {id}                                   -> Razorpay order for the checkout window
//   POST /api/pay/confirm  {id, orderId, paymentId, signature}    -> checks with Razorpay, marks the invitation paid
import { handle, json, readJson, HttpError, ID_RE } from '../lib/http.mjs';
import { loadOwned, saveInvite } from '../lib/store.mjs';
import { createOrder, keys, price, validPaymentSignature } from '../lib/razorpay.mjs';
import { settleOrder } from '../lib/payments.mjs';
import R from '../lib/generated/resources.mjs';

export const config = { path: '/api/pay/:step' };

export default handle(async (req, context) => {
  if (req.method !== 'POST') throw new HttpError(405, 'Not allowed.');
  const body = await readJson(req, 2048);
  const id = String(body.id || '');
  if (!ID_RE.test(id)) throw new HttpError(404, 'Invitation not found.');
  const rec = await loadOwned(req, id);
  const step = (context.params || {}).step;

  if (step === 'order') {
    if (!keys().ready) throw new HttpError(503, 'Payments are not set up yet.');
    if (rec.paid) return json(409, { error: 'This invitation is already paid.', paid: true });
    const { amount, currency } = price();
    if (!amount) throw new HttpError(503, 'Payments are not set up yet.');
    if (rec.orders.length >= 10) throw new HttpError(429, 'Too many payment attempts. Please contact us.');
    // Receipt must be unique per order (max 40 characters): invitation ID plus attempt number.
    const order = await createOrder(amount, currency, 'inv_' + rec.id + '_' + (rec.orders.length + 1), { invite_id: rec.id });
    rec.orders.push(order.id);
    await saveInvite(rec);
    return json(200, {
      orderId: order.id, keyId: keys().id, amount: order.amount, currency: order.currency,
      name: R.brand, description: 'Animated wedding invitation',
    });
  }

  if (step === 'confirm') {
    const orderId = String(body.orderId || ''), paymentId = String(body.paymentId || '');
    if (!/^order_[A-Za-z0-9]+$/.test(orderId) || !/^pay_[A-Za-z0-9]+$/.test(paymentId)) throw new HttpError(400, 'Bad request.');
    if (!validPaymentSignature(orderId, paymentId, body.signature)) throw new HttpError(400, 'The payment could not be verified.');
    const result = await settleOrder(rec, orderId, paymentId, 'checkout');
    if (result === 'invalid') throw new HttpError(400, 'The payment could not be verified.');
    // 'pending' is rare (the bank is still confirming); the webhook will finish it and the editor keeps checking.
    return json(200, { paid: result === 'paid' || result === 'duplicate', pending: result === 'pending' });
  }

  throw new HttpError(404, 'Not found.');
});
