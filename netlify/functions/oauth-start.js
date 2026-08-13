const crypto = require('crypto');

exports.handler = async (event) => {
  const clientId = process.env.ROBLOX_CLIENT_ID;
  const redirectUri = process.env.ROBLOX_REDIRECT_URI;
  const scope = process.env.ROBLOX_SCOPE || 'openid profile';

  if (!clientId || !redirectUri) {
    return { statusCode: 500, body: 'OAuth is not configured.' };
  }

  const state = crypto.randomBytes(32).toString('base64url');
  const verifier = crypto.randomBytes(48).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256'
  });

  return {
    statusCode: 302,
    headers: {
      Location: `https://apis.roblox.com/oauth/v1/authorize?${params.toString()}`,
      'Set-Cookie': [
        `zusa_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
        `zusa_oauth_verifier=${verifier}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
      ].join(', ')
    },
    body: ''
  };
};
