// Turning a confirmed Razorpay order into a paid invitation. Used by checkout confirmation and webhooks,
// so it is safe to run more than once for the same payment.
import { fetchOrder, price } from './razorpay.mjs';
import { loadInvite, saveInvite } from './store.mjs';

// Asks Razorpay for the order's real status (never trusts what the browser or a message says).
// Returns 'paid' | 'pending' | 'invalid' | 'duplicate'.
export async function settleOrder(rec, orderId, paymentId, via) {
  if (!rec.orders.includes(orderId)) return 'invalid';
  const order = await fetchOrder(orderId);
  const notes = order.notes && !Array.isArray(order.notes) ? order.notes : {};
  if (notes.invite_id !== rec.id) return 'invalid';
  if (order.status !== 'paid') return 'pending';
  if (order.amount_paid < order.amount) return 'pending';

  if (rec.paid) {
    if (rec.paid.orderId === orderId) return 'paid'; // same payment reported again
    // A second, separate payment for an invitation that is already paid: keep a note so it can be refunded.
    if (!rec.duplicates.some((d) => d.orderId === orderId)) {
      rec.duplicates.push({ orderId, paymentId: paymentId || '', amount: order.amount, currency: order.currency, at: new Date().toISOString() });
      await saveInvite(rec);
      console.warn('Duplicate payment to refund', rec.id, orderId, paymentId);
    }
    return 'duplicate';
  }

  rec.paid = { orderId, paymentId: paymentId || '', amount: order.amount, currency: order.currency, at: new Date().toISOString(), via };
  if (rec.status === 'draft') rec.status = 'unpublished'; // paid, ready to save details and publish
  await saveInvite(rec);
  return 'paid';
}

export async function settleByOrder(orderId, paymentId, via) {
  const order = await fetchOrder(orderId);
  const id = order.notes && !Array.isArray(order.notes) ? order.notes.invite_id : '';
  const rec = id ? await loadInvite(id) : null;
  if (!rec) return 'unknown';
  return settleOrder(rec, orderId, paymentId, via);
}

export { price };
