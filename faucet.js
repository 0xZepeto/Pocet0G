const axios = require('axios');
const { solveCaptcha } = require('./solveCaptcha');

const claimFaucet = async (authToken, oauthVerifier, walletAddress, proxy) => {
  const faucetUrl = 'https://faucet.0g.ai';
  const claimEndpoint = `${faucetUrl}/api/faucet`;

  const siteKey = '914e63b4-ac20-4c24-bc92-cdb6950ccfde';
  const captchaToken = await solveCaptcha(siteKey, faucetUrl);

  const axiosConfig = {
    headers: {
      'Content-Type': 'application/json',
      'Origin': faucetUrl,
      'Referer': `${faucetUrl}/?oauth_token=${authToken}&oauth_verifier=${oauthVerifier}`,
    }
  };

  if (proxy) {
    const [host, port] = proxy.replace('http://', '').split(':');
    axiosConfig.proxy = {
      host,
      port: parseInt(port),
    };
  }

  try {
    const response = await axios.post(claimEndpoint, {
      address: walletAddress,
      hcaptchaToken: captchaToken,
      oauth_token: authToken,
      oauth_verifier: oauthVerifier,
    }, axiosConfig);

    return response.data;
  } catch (error) {
    if (error.response?.status === 500) {
      throw new Error('Gagal claim: IP atau akun Twitter sudah dipakai hari ini.');
    }
    throw new Error(`Gagal claim: ${error.response?.data || error.message}`);
  }
};

module.exports = { claimFaucet };
                                    
