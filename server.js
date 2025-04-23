const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();
const port = 9900;

const CLIENT_KEY = 'sbawbqgxalvpnbt4eg';
const CLIENT_SECRET = 'xgUhuOorXZQsso9k0PLyS9oe6QdxHoKc';
//const REDIRECT_URI = `http://localhost:${port}/callback`;
// const REDIRECT_URI = 'https://d88f-201-162-227-169.ngrok-free.app/callback';
const REDIRECT_URI = 'https://tiktok-token.onrender.com/callback';

app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

let codeVerifierGlobal = null;

function generateRandomString(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function generatePKCE() {
  const codeVerifier = generateRandomString(128);

  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return { codeVerifier, codeChallenge };
}

app.get('/', (req, res) => {
  res.send(`<a href="/login">Login with TikTok</a>`);
});

app.get('/login', (req, res) => {
  const { codeVerifier, codeChallenge } = generatePKCE();
  codeVerifierGlobal = codeVerifier;

  const authUrl = `https://www.tiktok.com/v2/auth/authorize?` +
    `client_key=${CLIENT_KEY}` +
    `&response_type=code` +
    `&scope=user.info.basic` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&state=my_state` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=S256`;

  console.log('Authorization URL:', authUrl);
  console.log('Code Verifier:', codeVerifier); // Log the code verifier for debugging

  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  console.log("Code received:", code);

  if (!code) {
    return res.send('No code received.');
  }

  try {
    const response = await axios.post(
      'https://open.tiktokapis.com/v2/oauth/token',
      new URLSearchParams({
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifierGlobal
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'ngrok-skip-browser-warning': 'true'
        },
      }
    );

    const data = response.data;
    console.log('Access Token:', data);
    res.send(`Access Token received: <pre>${JSON.stringify(data, null, 2)}</pre>`);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.send('Failed to exchange code for token.');
  }
});

app.listen(port, () => {
  console.log(`TikTok OAuth server running at http://localhost:${port}`);
});
