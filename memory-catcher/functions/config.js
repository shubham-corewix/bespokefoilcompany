// config.js - serves non-secret runtime config to the page.
// The publishable key lives in Netlify env vars (STRIPE_PUBLISHABLE_KEY)
// so redeploying a fresh build can never wipe it. Publishable keys are
// safe to expose to browsers - the SECRET key must never appear here.
exports.handler = async () => {
  const pk = process.env.STRIPE_PUBLISHABLE_KEY || '';
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
    body: JSON.stringify({ publishableKey: pk }),
  };
};
