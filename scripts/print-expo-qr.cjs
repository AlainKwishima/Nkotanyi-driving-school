'use strict';
/**
 * Prints an Expo Go URL + QR for the LAN dev server.
 * Run after `npm start` (Metro on port 8081 by default).
 */
const qrcode = require('qrcode-terminal');
const os = require('os');
const http = require('http');

const port = Number(process.env.EXPO_PORT || process.env.RCT_METRO_PORT || 8081);

/** Common host-only / VM ranges — deprioritize so phones on Wi‑Fi get a usable IP. */
function virtualPenalty(addr) {
  if (/^192\.168\.(56|99)\./.test(addr)) return 20;
  if (/^169\.254\./.test(addr)) return 15;
  return 0;
}

function pickLanIp() {
  const nets = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family !== 'IPv4' && net.family !== 4) continue;
      if (net.internal) continue;
      const a = net.address;
      let base = 9;
      if (/^192\.168\./.test(a)) base = 0;
      else if (/^10\./.test(a)) base = 1;
      else if (/^172\.(1[6-9]|2\d|3[01])\./.test(a)) base = 2;
      candidates.push({ a, p: base + virtualPenalty(a) });
    }
  }
  candidates.sort((x, y) => x.p - y.p);
  return candidates[0]?.a || '127.0.0.1';
}

function metroRunning(cb) {
  const req = http.get(`http://127.0.0.1:${port}/status`, (res) => {
    let data = '';
    res.on('data', (c) => (data += c));
    res.on('end', () => cb(null, res.statusCode === 200 && data.includes('running')));
  });
  req.on('error', () => cb(null, false));
  req.setTimeout(2000, () => {
    req.destroy();
    cb(null, false);
  });
}

metroRunning((_, ok) => {
  const ip = pickLanIp();
  const url = `exp://${ip}:${port}`;
  if (!ok) {
    console.log('\nMetro does not appear to be running on port', port + '.');
    console.log('Start the dev server first:  npm start\n');
    console.log('If you use another port:  set EXPO_PORT=8082 && npm run qr\n');
  } else {
    console.log('\nExpo Go (same Wi‑Fi as this PC). Scan with Expo Go (Android) or Camera app (iOS):\n');
  }
  qrcode.generate(url, { small: true });
  console.log('\n' + url + '\n');
});
