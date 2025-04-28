const puppeteer = require('puppeteer');

const loginTwitter = async (username, password) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Buka situs faucet dan mulai proses autentikasi Twitter
  await page.goto('https://faucet.0g.ai', { waitUntil: 'networkidle2' });

  // Klik tombol untuk autentikasi Twitter (sesuaikan selector berdasarkan situs)
  await page.click('button[data-testid="twitter-auth-button"]'); // Ganti selector sesuai tombol di situs
  await page.waitForNavigation();

  // Masukkan username Twitter
  await page.type('input[name="text"]', username);
  await page.click('div[role="button"][data-testid="LoginForm_Login_Button"]');
  await page.waitForNavigation();

  // Masukkan password Twitter
  await page.type('input[name="password"]', password);
  await page.click('div[role="button"][data-testid="LoginForm_Login_Button"]');
  await page.waitForNavigation();

  // Tunggu redirect kembali ke situs faucet
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  // Ambil oauth_token dan oauth_verifier dari URL atau localStorage
  const { oauthToken, oauthVerifier } = await page.evaluate(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      oauthToken: urlParams.get('oauth_token') || localStorage.getItem('oauth_token'),
      oauthVerifier: urlParams.get('oauth_verifier') || localStorage.getItem('oauth_verifier'),
    };
  });

  await browser.close();

  if (!oauthToken || !oauthVerifier) {
    throw new Error('Gagal mendapatkan oauth_token atau oauth_verifier');
  }

  return { oauthToken, oauthVerifier };
};

module.exports = { loginTwitter };
