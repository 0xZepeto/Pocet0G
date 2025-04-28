const puppeteer = require('puppeteer');

const loginTwitter = async (username, password, proxy) => {
  const launchOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  };

  if (proxy) {
    launchOptions.args.push(`--proxy-server=${proxy}`);
  }

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();

  try {
    if (proxy && proxy.includes('@')) {
      // Kalau proxy ada auth
      const proxyCredentials = proxy.split('@')[0].replace('http://', '');
      const [proxyUser, proxyPass] = proxyCredentials.split(':');
      await page.authenticate({ username: proxyUser, password: proxyPass });
    }

    await page.goto('https://faucet.0g.ai', { waitUntil: 'networkidle2' });

    await page.waitForSelector('button[data-testid="twitter-auth-button"]', { timeout: 10000 });
    await page.click('button[data-testid="twitter-auth-button"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    await page.waitForSelector('input[name="text"]', { timeout: 10000 });
    await page.type('input[name="text"]', username, { delay: 50 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    await page.waitForSelector('input[name="password"]', { timeout: 10000 });
    await page.type('input[name="password"]', password, { delay: 50 });
    await page.keyboard.press('Enter');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    const url = page.url();
    const params = new URLSearchParams(url.split('?')[1]);
    const oauthToken = params.get('oauth_token');
    const oauthVerifier = params.get('oauth_verifier');

    if (!oauthToken || !oauthVerifier) {
      throw new Error('Gagal mengambil oauth_token atau oauth_verifier.');
    }

    return { oauthToken, oauthVerifier };

  } catch (error) {
    throw new Error('Login Twitter gagal: ' + error.message);
  } finally {
    await browser.close();
  }
};

module.exports = { loginTwitter };
