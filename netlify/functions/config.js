// Tells the site what to show on the pay button. No secrets are returned.
exports.handler = async () => {
  const key = process.env.STRIPE_SECRET_KEY || '';
  const amount = parseInt(process.env.PRICE_AMOUNT || '1900', 10);
  const currency = (process.env.PRICE_CURRENCY || 'usd').toLowerCase();
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify({
      amount,
      currency,
      ready: Boolean(key && process.env.LICENSE_SECRET && amount > 0),
      testMode: key.startsWith('sk_test_'),
    }),
  };
};
