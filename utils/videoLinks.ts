const YOUTUBE_ID_LENGTH = 11;

export function normalizeHttpUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^\/\//.test(trimmed)) return `https:${trimmed}`;
  if (/^(www\.|youtube\.com|youtu\.be|m\.youtube\.com)/i.test(trimmed)) return `https://${trimmed}`;
  return undefined;
}

export function extractYouTubeId(value: unknown): string | null {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return null;

  const direct = raw.match(/^[a-zA-Z0-9_-]{11}$/);
  if (direct) return raw;

  const iframeSrc = raw.match(/src=["']([^"']+)["']/i)?.[1];
  const candidate = normalizeHttpUrl(iframeSrc ?? raw);
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    const host = url.hostname.replace(/^www\./i, '').toLowerCase();
    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id?.length === YOUTUBE_ID_LENGTH ? id : null;
    }

    if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      const watchId = url.searchParams.get('v');
      if (watchId?.length === YOUTUBE_ID_LENGTH) return watchId;

      const parts = url.pathname.split('/').filter(Boolean);
      const markerIndex = parts.findIndex((part) => ['embed', 'shorts', 'live', 'v'].includes(part));
      const id = markerIndex >= 0 ? parts[markerIndex + 1] : null;
      return id?.length === YOUTUBE_ID_LENGTH ? id : null;
    }
  } catch {
    const loose = raw.match(/(?:embed\/|shorts\/|live\/|v\/|youtu\.be\/|watch\?v=)([a-zA-Z0-9_-]{11})/i);
    return loose?.[1] ?? null;
  }

  return null;
}

export function youtubeThumbnailUrl(value: unknown): string | undefined {
  const id = extractYouTubeId(value);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined;
}
