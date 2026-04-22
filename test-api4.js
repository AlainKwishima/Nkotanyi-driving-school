const fetch = require('node-fetch');

async function testApi() {
  const loginRes = await fetch('https://www.ibyapa.com/api/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account: '0780211466', password: '0780211466' })
  });
  const loginData = await loginRes.json();
  const token = (loginData.data && loginData.data.accessToken) || loginData.accessToken;
  
  const videosResEn = await fetch('https://www.ibyapa.com/api/videos/get-all-videos?language=en', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const vEn = await videosResEn.json();
  const videosEn = vEn.data || [];
  
  console.log('Total English videos found:', videosEn.length);
  videosEn.forEach((vid, i) => {
    const url = vid.video || vid.videoURL || vid.url || vid.link;
    console.log(`English Video ${i+1}: ${url}`);
  });

  const videosResFr = await fetch('https://www.ibyapa.com/api/videos/get-all-videos?language=fr', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const vFr = await videosResFr.json();
  const videosFr = vFr.data || [];
  
  console.log('Total French videos found:', videosFr.length);
  videosFr.forEach((vid, i) => {
    const url = vid.video || vid.videoURL || vid.url || vid.link;
    console.log(`French Video ${i+1}: ${url}`);
  });
}

testApi().catch(console.error);
