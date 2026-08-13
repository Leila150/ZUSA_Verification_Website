const crypto = require('crypto');

function base64url(buffer) {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

exports.handler = async (event) => {
  const clientId = process.env.ROBLOX_CLIENT_ID;
  const siteUrl = process.env.SITE_URL || 'https://verifyzusa.netlify.app';
  const redirectUri = process.env.ROBLOX_REDIRECT_URI || `${siteUrl}/verification/`;
  const scope = process.env.ROBLOX_SCOPE || 'openid profile';

  if (!clientId) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: 'OAuth is not configured. Set ROBLOX_CLIENT_ID in Netlify environment variables.'
    };
  }

  const state = base64url(crypto.randomBytes(32));
  const verifier = base64url(crypto.randomBytes(48));
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    response_type: 'code',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256'
  });

  const authorizeUrl = `https://apis.roblox.com/oauth/v1/authorize?${params.toString()}`;

  return {
    statusCode: 302,
    headers: {
      Location: authorizeUrl,
      'Set-Cookie': `zusa_oauth=${encodeURIComponent(JSON.stringify({ state, verifier }))}; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax`
    },
    body: ''
  };
};
