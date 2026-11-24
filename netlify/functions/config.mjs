// Tells the pages what to show on the pay button. No secrets are returned.
// Path stays /.netlify/functions/config (used by the homepage and the editor).
import { json } from '../lib/http.mjs';
import { keys, price } from '../lib/razorpay.mjs';

export default async () => {
  const { amount, currency } = price();
  const k = keys();
  return json(200, {
    amount,
    currency: currency.toLowerCase(),
    ready: k.ready && amount > 0,
    testMode: k.id.startsWith('rzp_test_'),
    provider: 'razorpay',
    // Only a server setting can change where the checkout window comes from (used by the local test server).
    checkoutScript: process.env.RAZORPAY_CHECKOUT_URL || 'https://checkout.razorpay.com/v1/checkout.js',
  });
};
