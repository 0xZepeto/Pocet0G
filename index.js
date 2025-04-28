const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const loadAccounts = () => {
  const accountsPath = path.join(__dirname, 'config', 'accounts.json');
  if (!fs.existsSync(accountsPath)) {
    console.error('File accounts.json tidak ditemukan!');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(accountsPath, 'utf-8'));
};

const loadProxies = () => {
  const proxyPath = path.join(__dirname, 'proxy.txt');
  if (!fs.existsSync(proxyPath)) return [];
  const proxies = fs.readFileSync(proxyPath, 'utf-8').split('\n').map(p => p.trim()).filter(p => p.length > 0);
  return proxies;
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const loginTwitter = async (username, password, proxy = null) => {
  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };

  if (proxy) {
    launchOptions.args.push(`--proxy-server=${proxy}`);
  }

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();

  try {
    console.log(`[${username}] Membuka faucet...`);
    await page.goto('https://faucet.0g.ai', { waitUntil: 'networkidle2' });

    console.log(`[${username}] Klik login Twitter...`);
    await page.waitForSelector('button[data-testid="twitter-auth-button"]', { timeout: 10000 });
    await page.click('button[data-testid="twitter-auth-button"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Isi login Twitter
    console.log(`[${username}] Mengisi form login Twitter...`);
    await page.waitForSelector('input[name="text"]', { timeout: 10000 });
    await page.type('input[name="text"]', username, { delay: 50 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    await page.waitForSelector('input[name="password"]', { timeout: 10000 });
    await page.type('input[name="password"]', password, { delay: 50 });
    await page.keyboard.press('Enter');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Cek URL mengandung oauth_token
    const currentUrl = page.url();
    const urlParams = new URL(currentUrl).searchParams;
    const oauthToken = urlParams.get('oauth_token');
    const oauthVerifier = urlParams.get('oauth_verifier');

    if (!oauthToken || !oauthVerifier) {
      throw new Error('Gagal mendapatkan oauth_token atau oauth_verifier.');
    }

    console.log(`[${username}] Berhasil login Twitter!`);
    await browser.close();
    return { oauthToken, oauthVerifier };
  } catch (err) {
    await browser.close();
    throw err;
  }
};

const claimFaucet = async (oauthToken, oauthVerifier, address, proxy = null) => {
  const url = 'https://faucet.0g.ai/api/faucet';
  const data = {
    address: address,
    oauth_token: oauthToken,
    oauth_verifier: oauthVerifier,
    hcaptchaToken: 'dummy' // Karena faucet.0g.ai sudah tidak pakai captcha berat, bisa dummy kalau perlu
  };

  const axiosConfig = {
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://faucet.0g.ai',
      'Referer': `https://faucet.0g.ai/?oauth_token=${oauthToken}&oauth_verifier=${oauthVerifier}`,
    }
  };

  if (proxy) {
    const [ip, port] = proxy.replace('http://', '').split(':');
    axiosConfig.proxy = {
      host: ip,
      port: parseInt(port),
    };
  }

  try {
    const res = await axios.post(url, data, axiosConfig);
    console.log(`Claim sukses untuk address ${address}:`, res.data);
  } catch (error) {
    console.error('Gagal claim faucet:', error.response?.data || error.message);
    throw error;
  }
};

const run = async () => {
  const accounts = loadAccounts();
  const proxies = loadProxies();

  console.log(`Ditemukan ${accounts.length} akun dan ${proxies.length} proxy.`);

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const proxy = proxies[i] || null; // 1 akun 1 proxy, kalau kurang ya null

    console.log(`\n[${account.username}] Memulai proses... Proxy: ${proxy || 'TANPA PROXY'}`);

    try {
      const { oauthToken, oauthVerifier } = await loginTwitter(account.username, account.password, proxy);
      await claimFaucet(oauthToken, oauthVerifier, account.address, proxy);
      console.log(`[${account.username}] Berhasil selesai!`);
    } catch (err) {
      console.error(`[${account.username}] Error:`, err.message);
    }

    console.log(`[${account.username}] Delay 5 detik sebelum lanjut akun berikutnya...\n`);
    await delay(5000);
  }
};

run();
  
