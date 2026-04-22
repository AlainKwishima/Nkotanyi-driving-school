const fetch = require('node-fetch');

async function testApi() {
  const loginRes = await fetch('https://www.ibyapa.com/api/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account: '0780211466', password: '0780211466' })
  });
  const loginData = await loginRes.json();
  const token = loginData.accessToken || loginData.token || (loginData.data && loginData.data.accessToken) || loginData?.user?.accessToken || loginData?.user?.token;
  
  const videosRes = await fetch('https://www.ibyapa.com/api/videos/get-all-videos?language=rw', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const v = await videosRes.json();
  console.log('Video 1:', JSON.stringify(v.data[0], null, 2));

  const pdfRes = await fetch('https://www.ibyapa.com/api/pdf/get-all-pdf?language=rw', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const p = await pdfRes.json();
  console.log('PDF 1:', JSON.stringify(p.data[0], null, 2));
}

testApi().catch(console.error);
