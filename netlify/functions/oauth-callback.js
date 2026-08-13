const crypto = require('crypto');

function parseCookies(header = '') {
  return header.split(';').reduce((cookies, part) => {
    const index = part.indexOf('=');
    if (index === -1) return cookies;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    cookies[key] = value;
    return cookies;
  }, {});
}

function page(title, message, status = 200) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    body: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#0f1114">
<title>ZUSA | ${title}</title>
<style>
*{box-sizing:border-box}html,body{margin:0;min-height:100%;font-family:Arial,sans-serif;background:#0f1114;color:#fff}body{display:flex;align-items:center;justify-content:center;padding:24px}.card{width:min(520px,100%);padding:42px 28px;text-align:center;background:#171a1f;border:1px solid #292e36;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.35)}.brand{font-weight:800;letter-spacing:.18em;margin-bottom:30px}.icon{width:74px;height:74px;margin:0 auto 22px;border-radius:50%;display:grid;place-items:center;border:2px solid #38d27a}.icon:after{content:'✓';font-size:42px}.error{border-color:#d64b4b}.error:after{content:'!'}.message{color:#aeb5bf;line-height:1.6}a{display:inline-block;margin-top:20px;color:#fff;text-decoration:none;font-weight:700}</style>
</head><body><main class="card"><div class="brand">ZUSA</div><div class="icon${status >= 400 ? ' error' : ''}"></div><h1>${title}</h1><p class="message">${message}</p><a href="/">Back to ZUSA</a></main></body></html>`
  };
}

exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  const code = params.code;
  const returnedState = params.state;
  const oauthError = params.error;

  if (oauthError) {
    return page('Verification Cancelled', 'Roblox authorization was not completed. You can return to ZUSA and try again.', 400);
  }

  if (!code || !returnedState) {
    return page('Verification Required', 'This page is used as the Roblox OAuth callback. Start verification from the ZUSA portal.', 400);
  }

  const cookies = parseCookies(event.headers.cookie || event.headers.Cookie || '');
  let session;
  try {
    session = JSON.parse(decodeURIComponent(cookies.zusa_oauth || ''));
  } catch {
    session = null;
  }

  if (!session || !session.state || !session.verifier || session.state !== returnedState) {
    return page('Verification Failed', 'The OAuth security check could not be completed. Please start verification again.', 400);
  }

  const clientId = process.env.ROBLOX_CLIENT_ID;
  const clientSecret = process.env.ROBLOX_CLIENT_SECRET;
  const siteUrl = process.env.SITE_URL || 'https://verifyzusa.netlify.app';
  const redirectUri = process.env.ROBLOX_REDIRECT_URI || `${siteUrl}/verification/`;

  if (!clientId) {
    return page('Configuration Error', 'ZUSA OAuth is not configured yet.', 500);
  }

  const body = new URLSearchParams({
    client_id: clientId,
    code,
    code_verifier: session.verifier,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri
  });

  if (clientSecret) body.set('client_secret', clientSecret);

  try {
    const tokenResponse = await fetch('https://apis.roblox.com/oauth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    if (!tokenResponse.ok) {
      return page('Verification Failed', 'Roblox could not complete the authorization. Please try again.', 400);
    }

    const tokens = await tokenResponse.json();
    if (!tokens.access_token) {
      return page('Verification Failed', 'No access token was returned by Roblox.', 400);
    }

    const userResponse = await fetch('https://apis.roblox.com/oauth/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    if (!userResponse.ok) {
      return page('Verification Failed', 'Roblox authorization succeeded, but the account could not be identified.', 400);
    }

    const user = await userResponse.json();
    const safeName = String(user.preferred_username || user.name || 'Roblox user').replace(/[&<>"']/g, '');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Set-Cookie': 'zusa_oauth=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax'
      },
      body: `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="theme-color" content="#0f1114"><meta name="description" content="ZUSA account verification"><title>ZUSA | Verification Successful</title><link rel="stylesheet" href="/style.css"></head><body><main class="page"><section class="verification-card" aria-labelledby="verification-title"><div class="brand">ZUSA</div><div class="success-icon" aria-label="Verification successful" role="img"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M16 33.5 27 44l21-24" /></svg></div><h1 id="verification-title">Verification Successful</h1><p class="message">Your Roblox account, <strong>${safeName}</strong>, has been successfully verified. You can safely continue to ZUSA.</p></section><footer class="rights">ZUSA Property &nbsp;•&nbsp; All Rights Reserved</footer></main></body></html>`
    };
  } catch {
    return page('Verification Failed', 'An unexpected error occurred while contacting Roblox. Please try again.', 500);
  }
};
