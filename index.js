require('dotenv').config();
const { loginTwitter } = require('./config/twitterLogin');
const axios = require('axios');
const anticaptcha = require('@antiadmin/anticaptchaofficial');

const accounts = require('./config/accounts.json');
const proxies = require('./config/proxies.json');

anticaptcha.setAPIKey(process.env.ANTICAPTCHA_KEY);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const claimFaucet = async (oauthToken, oauthVerifier) => {
  try {
    const response = await axios.post('https://api.0g.ai/faucet-claim', {
      oauth_token: oauthToken,
      oauth_verifier: oauthVerifier,
    });

    console.log('Claim response:', response.data);
  } catch (error) {
    console.error('Gagal claim faucet:', error.message);
  }
};

const run = async () => {
  for (let i = 0; i < accounts.length; i++) {
    const { username, password } = accounts[i];
    const proxy = proxies[i] || null;

    console.log(`\n[${i+1}] Login akun: ${username} menggunakan proxy: ${proxy || 'No proxy'}`);

    try {
      const { oauthToken, oauthVerifier } = await loginTwitter(username, password, proxy);

      console.log(`[${i+1}] Login sukses, klaim faucet...`);
      await claimFaucet(oauthToken, oauthVerifier);

    } catch (error) {
      console.error(`[${i+1}] Error:`, error.message);
    }

    await sleep(5000); // Delay antar akun biar aman
  }
};

run();
