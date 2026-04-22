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
  const videos = v.data || [];
  
  console.log('Total videos found:', videos.length);
  videos.forEach((vid, i) => {
    const url = vid.video || vid.videoURL || vid.url || vid.link;
    console.log(`Video ${i+1}: ${url}`);
  });
}

testApi().catch(console.error);
