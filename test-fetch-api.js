const fetch = require('node-fetch');

async function testFetch() {
  const loginRes = await fetch('https://www.ibyapa.com/api/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account: '0780211466', password: '0780211466' })
  });
  const loginData = await loginRes.json();
  const token = (loginData.data && loginData.data.accessToken) || loginData.accessToken;
  
  if (!token) {
    console.error('Failed to log in:', loginData);
    return;
  }

  console.log('Testing videos with language=rw');
  const vidRes = await fetch('https://www.ibyapa.com/api/videos/get-all-videos?language=rw', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const vidData = await vidRes.json();
  console.log('Videos Payload keys:', Object.keys(vidData));
  if (vidData.data) {
    console.log('Videos count:', vidData.data.length);
  } else {
    console.log('Videos raw data:', JSON.stringify(vidData).substring(0, 100));
  }

  console.log('Testing pdfs with language=rw');
  const pdfRes = await fetch('https://www.ibyapa.com/api/pdf/get-all-pdf?language=rw', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const pdfData = await pdfRes.json();
  console.log('Pdfs Payload keys:', Object.keys(pdfData));
  if (pdfData.data) {
    console.log('Pdfs count:', pdfData.data.length);
  } else {
    console.log('Pdfs raw data:', JSON.stringify(pdfData).substring(0, 100));
  }
}

testFetch().catch(console.error);
