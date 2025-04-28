const log = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

const loadAccounts = () => {
  const fs = require('fs');
  const path = require('path');
  const accountsPath = path.join(__dirname, 'config/accounts.json');
  return JSON.parse(fs.readFileSync(accountsPath, 'utf-8'));
};

const loadAddress = () => {
  const fs = require('fs');
  const path = require('path');
  const addressPath = path.join(__dirname, 'config/address.txt');
  return fs.readFileSync(addressPath, 'utf-8').trim();
};

const loadProxies = () => {
  const fs = require('fs');
  const path = require('path');
  const proxyPath = path.join(__dirname, 'proxy.txt');
  const proxies = fs.readFileSync(proxyPath, 'utf-8').trim().split('\n');
  return proxies.length > 0 && proxies[0] ? proxies : null;
};

module.exports = { log, loadAccounts, loadAddress, loadProxies };
