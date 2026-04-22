const API_BASE_URL = 'https://www.ibyapa.com';

function joinUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  const pathname = path.startsWith('/') ? path : `/${path}`;
  const base = API_BASE_URL.replace(/\/+$/, '');
  try {
    return new URL(pathname, `${base}/`).href;
  } catch {
    return `${base}${pathname}`.replace(/([^:]\/)\/+/g, '$1');
  }
}

console.log('Videos URL:', joinUrl('/api/videos/get-all-videos?language=rw'));
console.log('PDFs URL:', joinUrl('/api/pdf/get-all-pdf?language=rw'));
