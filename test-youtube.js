fetch('https://www.youtube.com/embed/Ok6UQ-b9yJc')
  .then(r => r.text())
  .then(t => {
     console.log("UNPLAYABLE:", t.includes('UNPLAYABLE'));
     console.log("LOGIN_REQUIRED:", t.includes('LOGIN_REQUIRED'));
     console.log("status:", t.match(/"status":"(.*?)"/)?.[1]);
  });
