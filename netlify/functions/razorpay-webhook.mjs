// Razorpay sends payment events here (set up in the Razorpay Dashboard -> Webhooks):
//   URL:    https://<your site>/api/razorpay-webhook
//   Secret: the same value as the RAZORPAY_WEBHOOK_SECRET setting in Netlify
//   Events: payment.captured, order.paid, payment.failed, refund.processed
// This means a payment still completes if the customer closes the window right after paying.
// Every event is double-checked with Razorpay's API; repeated deliveries are harmless.
import { json } from '../lib/http.mjs';
import { settleByOrder } from '../lib/payments.mjs';
import { fetchPayment, fetchOrder, validWebhookSignature } from '../lib/razorpay.mjs';
import { loadInvite, saveInvite } from '../lib/store.mjs';

export const config = { path: '/api/razorpay-webhook' };

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Not allowed.' });
  const raw = await req.text();
  if (raw.length > 100000 || !validWebhookSignature(raw, req.headers.get('x-razorpay-signature'))) {
    return json(400, { error: 'Invalid signature.' });
  }
  let event;
  try { event = JSON.parse(raw); } catch (e) { return json(400, { error: 'Bad request.' }); }
  const p = event.payload || {};
  const payment = (p.payment && p.payment.entity) || {};
  const order = (p.order && p.order.entity) || {};
  const refund = (p.refund && p.refund.entity) || {};

  try {
    switch (event.event) {
      case 'payment.captured':
      case 'order.paid': {
        const orderId = payment.order_id || order.id;
        if (orderId) console.log('Payment event', event.event, orderId, '->', await settleByOrder(orderId, payment.id || '', 'webhook'));
        break;
      }
      case 'refund.processed':
      case 'payment.refunded': {
        const paymentId = refund.payment_id || payment.id;
        if (paymentId) await handleRefund(paymentId);
        break;
      }
      case 'payment.failed':
        console.log('Payment failed', payment.id, payment.order_id, payment.error_description || '');
        break;
      default:
        break;
    }
  } catch (e) {
    console.error('Webhook handling failed', event.event, e);
    return json(500, { error: 'Retry later.' }); // Razorpay retries failed deliveries
  }
  return json(200, { ok: true });
};

// A fully refunded payment takes its invitation offline. Refunds of duplicate payments change nothing.
async function handleRefund(paymentId) {
  const pay = await fetchPayment(paymentId);
  if (!pay.order_id || !(pay.amount_refunded >= pay.amount)) return;
  const order = await fetchOrder(pay.order_id);
  const id = order.notes && !Array.isArray(order.notes) ? order.notes.invite_id : '';
  const rec = id ? await loadInvite(id) : null;
  if (!rec || !rec.paid || rec.paid.orderId !== pay.order_id) return;
  rec.status = 'refunded';
  await saveInvite(rec);
  console.log('Invitation taken offline after refund', rec.id);
}
