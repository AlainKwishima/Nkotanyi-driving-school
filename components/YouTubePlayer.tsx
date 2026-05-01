import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

type YouTubePlayerProps = {
  videoId: string;
  height?: number;
  play?: boolean;
  onReady?: () => void;
  onChangeState?: (state: string) => void;
  onError?: (error: string) => void;
};

type PlayerMessage =
  | { type: 'ready' }
  | { type: 'state'; state: string }
  | { type: 'error'; code: number }
  | { type: 'timeout' };

const EMBED_ORIGIN = 'https://www.ibyapa.com';
const EMBED_REFERRER = 'https://www.ibyapa.com/mobile-app';
const LOAD_TIMEOUT_MS = 15000;
const ANDROID_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36';

function isAllowedUrl(url: string): boolean {
  if (url === 'about:blank') return true;
  if (url.startsWith(EMBED_ORIGIN)) return true;
  return /^https:\/\/([a-z0-9-]+\.)*(youtube\.com|youtube-nocookie\.com|ytimg\.com|googlevideo\.com|google\.com|gstatic\.com|doubleclick\.net|googlesyndication\.com)\//i.test(
    url,
  );
}

function mapYouTubeError(code: number): string {
  switch (code) {
    case 2:
      return 'This video could not be loaded because the YouTube video ID or URL is invalid.';
    case 5:
      return 'YouTube could not start the HTML5 player for this video. Please try again.';
    case 100:
      return 'This YouTube video is no longer available.';
    case 101:
    case 150:
      return 'This YouTube video does not allow playback inside embedded players.';
    case 153:
      return 'YouTube rejected this playback request because the embedded player could not be fully identified.';
    default:
      return `YouTube playback failed with error ${code}.`;
  }
}

function buildPlayerHtml(videoId: string, shouldAutoplay: boolean) {
  const safeVideoId = JSON.stringify(videoId);
  const safeOrigin = JSON.stringify(EMBED_ORIGIN);
  const safeReferrer = JSON.stringify(EMBED_REFERRER);
  const autoplay = shouldAutoplay ? 1 : 0;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #000;
      }
      #player {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }
    </style>
  </head>
  <body>
    <div id="player"></div>
    <script>
      (function () {
        var ready = false;
        var timeoutHandle = null;
        var tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);

        function post(message) {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          }
        }

        function startTimeout() {
          if (timeoutHandle) {
            clearTimeout(timeoutHandle);
          }
          timeoutHandle = setTimeout(function () {
            if (!ready) {
              post({ type: 'timeout' });
            }
          }, ${LOAD_TIMEOUT_MS});
        }

        startTimeout();

        window.onYouTubeIframeAPIReady = function () {
          var player = new YT.Player('player', {
            width: '100%',
            height: '100%',
            videoId: ${safeVideoId},
            playerVars: {
              autoplay: ${autoplay},
              controls: 1,
              rel: 0,
              playsinline: 1,
              enablejsapi: 1,
              origin: ${safeOrigin},
              widget_referrer: ${safeReferrer},
              fs: 1,
              iv_load_policy: 3
            },
            events: {
              onReady: function () {
                ready = true;
                if (timeoutHandle) {
                  clearTimeout(timeoutHandle);
                }
                post({ type: 'ready' });
                if (${autoplay}) {
                  try {
                    player.playVideo();
                  } catch (error) {}
                }
              },
              onStateChange: function (event) {
                var states = {
                  '-1': 'unstarted',
                  0: 'ended',
                  1: 'playing',
                  2: 'paused',
                  3: 'buffering',
                  5: 'video_cued'
                };
                post({ type: 'state', state: states[event.data] || String(event.data) });
              },
              onError: function (event) {
                if (timeoutHandle) {
                  clearTimeout(timeoutHandle);
                }
                post({ type: 'error', code: event.data });
              }
            }
          });
        };
      })();
    </script>
  </body>
</html>`;
}

export default function YouTubePlayer({
  videoId,
  height = 210,
  play = false,
  onReady,
  onChangeState,
  onError,
}: YouTubePlayerProps) {
  const webViewRef = useRef<WebView>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const retryCountRef = useRef(0);

  useEffect(() => {
    retryCountRef.current = 0;
    setReloadKey((value) => value + 1);
  }, [videoId]);

  const sourceHtml = useMemo(() => buildPlayerHtml(videoId, play), [play, videoId, reloadKey]);

  const handleMessage = (raw: string | undefined) => {
    if (!raw) return;

    let message: PlayerMessage | null = null;
    try {
      message = JSON.parse(raw) as PlayerMessage;
    } catch {
      return;
    }
    if (!message) return;

    if (message.type === 'ready') {
      retryCountRef.current = 0;
      onReady?.();
      return;
    }

    if (message.type === 'state') {
      onChangeState?.(message.state);
      return;
    }

    if (message.type === 'timeout') {
      if (retryCountRef.current < 1) {
        retryCountRef.current += 1;
        setReloadKey((value) => value + 1);
        return;
      }
      onError?.('The YouTube player took too long to start.');
      return;
    }

    if (message.type === 'error') {
      if ((message.code === 5 || message.code === 153) && retryCountRef.current < 1) {
        retryCountRef.current += 1;
        setReloadKey((value) => value + 1);
        return;
      }
      onError?.(mapYouTubeError(message.code));
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        key={`${videoId}:${play ? 'play' : 'pause'}:${reloadKey}`}
        ref={webViewRef}
        source={{ html: sourceHtml, baseUrl: EMBED_ORIGIN }}
        style={styles.webView}
        originWhitelist={['https://*', 'http://*', 'about:blank']}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        setSupportMultipleWindows={false}
        javaScriptCanOpenWindowsAutomatically={false}
        thirdPartyCookiesEnabled
        cacheEnabled
        userAgent={Platform.OS === 'android' ? ANDROID_USER_AGENT : undefined}
        onMessage={(event) => handleMessage(event.nativeEvent.data)}
        onShouldStartLoadWithRequest={(request) => {
          const nextUrl = request.url || '';
          return isAllowedUrl(nextUrl);
        }}
        onError={() => {
          if (retryCountRef.current < 1) {
            retryCountRef.current += 1;
            setReloadKey((value) => value + 1);
            return;
          }
          onError?.('The in-app YouTube player failed to load.');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000000',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
