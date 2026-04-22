const fetch = require('node-fetch');

async function check() {
  const loginRes = await fetch('https://www.ibyapa.com/api/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account: '0780211466', password: '0780211466' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data.accessToken || loginData.accessToken;
  const vidRes = await fetch('https://www.ibyapa.com/api/videos/get-all-videos?language=rw', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await vidRes.json();
  console.log("Status type:", typeof data.status, "Value:", data.status);
}
check();
