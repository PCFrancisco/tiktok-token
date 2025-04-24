const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();
const port = 9900;

const CLIENT_KEY = 'sbawbqgxalvpnbt4eg';
const CLIENT_SECRET = 'xgUhuOorXZQsso9k0PLyS9oe6QdxHoKc';
const APP_KEY = 'sbawbqgxalvpnbt4eg';
const APP_SECRET = 'xgUhuOorXZQsso9k0PLyS9oe6QdxHoKc';
const APP_ID = '7495669289367799813';
const REDIRECT_URI = 'https://your-deployed-url.com/callback';

// Home page
app.get('/', (req, res) => {
  const tiktokAuthUrl = `https://auth.tiktok-shops.com/oauth/authorize?app_key=${APP_ID}&state=my_state&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.send(`<a href="${tiktokAuthUrl}">Connect to TikTok Shop</a>`);
});

// Handle TikTok redirect
app.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  console.log('Received code:', code);

  if (!code) {
    return res.status(400).send('Authorization code not found.');
  }

  try {
    const response = await axios.post('https://auth.tiktok-shops.com/api/token/create/', {
      app_key: APP_KEY,
      app_secret: APP_SECRET,
      auth_code: code,
      grant_type: 'authorized_code'
    });

    const { access_token, refresh_token, seller_id } = response.data.data;

    console.log('✅ Access Token:', access_token);
    console.log('🔄 Refresh Token:', refresh_token);
    console.log('🛍️ Seller ID:', seller_id);

    // Save these tokens securely (file, database, vault, etc.)
    res.send('Authorization successful. Check your terminal for tokens.');
  } catch (err) {
    console.error('❌ Error exchanging code for token:', err.response?.data || err.message);
    res.status(500).send('Failed to exchange code for token.');
  }
});

// Token refresh route (could be used in a cron job)
app.get('/refresh', async (req, res) => {
  const refresh_token = 'STORED_REFRESH_TOKEN'; // replace with real one

  try {
    const response = await axios.post('https://auth.tiktok-shops.com/api/token/refresh/', {
      app_key: APP_KEY,
      app_secret: APP_SECRET,
      refresh_token,
      grant_type: 'refresh_token'
    });

    const { access_token, refresh_token: new_refresh_token } = response.data.data;

    console.log('♻️ Refreshed Access Token:', access_token);
    console.log('🔄 New Refresh Token:', new_refresh_token);

    // Save new tokens
    res.send('Token refreshed successfully.');
  } catch (err) {
    console.error('❌ Error refreshing token:', err.response?.data || err.message);
    res.status(500).send('Failed to refresh token.');
  }
});

app.listen(port, () => {
  console.log(`TikTok Shop OAuth server running at http://localhost:${port}`);
});