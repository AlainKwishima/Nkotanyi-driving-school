const fetch = require('node-fetch');

async function testApi() {
  const loginRes = await fetch('https://www.ibyapa.com/api/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account: '0780211466', password: '0780211466' })
  });
  
  if (!loginRes.ok) throw new Error('Login failed: ' + loginRes.status);
  const loginData = await loginRes.json();
  const token = loginData.accessToken || loginData.token || (loginData.data && loginData.data.accessToken) || loginData?.user?.accessToken || loginData?.user?.token;
  if (!token) throw new Error('No token found -> ' + JSON.stringify(loginData));
  
  console.log('Got token:', token.substring(0, 10));
  
  const videosRes = await fetch('https://www.ibyapa.com/api/videos/get-all-videos?language=rw', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const videosData = await videosRes.json();
  console.log('Videos Response Keys:', Object.keys(videosData));
  console.log('Videos Top Level Array?', Array.isArray(videosData));
  console.log('Videos data string:', JSON.stringify(videosData).substring(0, 300));
  
  const pdfRes = await fetch('https://www.ibyapa.com/api/pdf/get-all-pdf?language=rw', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const pdfData = await pdfRes.json();
  console.log('PDF Response Keys:', Object.keys(pdfData));
  console.log('PDF Response string:', JSON.stringify(pdfData).substring(0, 300));
}

testApi().catch(console.error);
