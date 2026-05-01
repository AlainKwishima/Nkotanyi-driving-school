import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/types';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'PdfViewer'>;
type PreviewState = 'loading' | 'ready' | 'error';

const PDF_JS_VERSION = '3.11.174';

function buildSecurePreviewHtml(fileUrl: string, title: string) {
  const safeUrl = JSON.stringify(fileUrl);
  const safeTitle = JSON.stringify(title);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <title>${title.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>
    <style>
      :root {
        color-scheme: light only;
        --page-bg: #f3f5fa;
        --card-bg: #ffffff;
        --text-main: #1e293b;
        --text-muted: #64748b;
        --watermark: rgba(107, 114, 128, 0.22);
        --shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
      }
      * {
        box-sizing: border-box;
        -webkit-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
      }
      html, body {
        margin: 0;
        padding: 0;
        background: var(--page-bg);
        color: var(--text-main);
        font-family: Arial, Helvetica, sans-serif;
        overscroll-behavior: none;
      }
      body {
        min-height: 100vh;
      }
      #app {
        width: 100%;
        min-height: 100vh;
        padding: 16px 12px 28px;
      }
      #status {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        text-align: center;
        padding: 24px;
      }
      #statusTitle {
        margin-top: 12px;
        font-size: 18px;
        font-weight: 700;
      }
      #statusBody {
        margin-top: 8px;
        font-size: 14px;
        line-height: 1.6;
        color: var(--text-muted);
        max-width: 420px;
      }
      #pages {
        display: none;
      }
      .page-shell {
        position: relative;
        width: 100%;
        margin: 0 auto 18px;
        background: var(--card-bg);
        border-radius: 18px;
        padding: 14px;
        box-shadow: var(--shadow);
        overflow: hidden;
      }
      .page-frame {
        position: relative;
        width: 100%;
        overflow: hidden;
        border-radius: 12px;
        background: #ffffff;
      }
      canvas {
        display: block;
        width: 100%;
        height: auto;
      }
      .watermark {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        overflow: hidden;
      }
      .watermark span {
        display: block;
        width: 130%;
        text-align: center;
        color: var(--watermark);
        font-size: 28px;
        font-style: oblique;
        font-weight: 700;
        letter-spacing: 4px;
        transform: rotate(-24deg);
        text-transform: uppercase;
        white-space: nowrap;
      }
      .page-meta {
        margin-top: 10px;
        font-size: 11px;
        font-weight: 700;
        color: #94a3b8;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        text-align: right;
      }
      .spinner {
        width: 44px;
        height: 44px;
        border-radius: 22px;
        border: 4px solid rgba(74, 120, 208, 0.18);
        border-top-color: #4a78d0;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    </style>
  </head>
  <body>
    <div id="app">
      <div id="status">
        <div class="spinner"></div>
        <div id="statusTitle">Opening secure preview</div>
        <div id="statusBody">Preparing the document in-app. Please wait...</div>
      </div>
      <div id="pages" aria-label="Secure document preview"></div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDF_JS_VERSION}/pdf.min.js"></script>
    <script>
      (function () {
        var fileUrl = ${safeUrl};
        var title = ${safeTitle};
        var status = document.getElementById('status');
        var statusTitle = document.getElementById('statusTitle');
        var statusBody = document.getElementById('statusBody');
        var pagesRoot = document.getElementById('pages');
        var pdfjsLib = window['pdfjs-dist/build/pdf'];

        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDF_JS_VERSION}/pdf.worker.min.js';

        function post(type, payload) {
          if (!window.ReactNativeWebView || !window.ReactNativeWebView.postMessage) return;
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload || null }));
        }

        function showError(message) {
          status.style.display = 'flex';
          pagesRoot.style.display = 'none';
          statusTitle.textContent = 'Preview unavailable';
          statusBody.textContent = message;
          post('error', { message: message });
        }

        function preventExtraction() {
          document.addEventListener('contextmenu', function (event) {
            event.preventDefault();
          });
          document.addEventListener('dragstart', function (event) {
            event.preventDefault();
          });
          document.addEventListener('copy', function (event) {
            event.preventDefault();
          });
          document.addEventListener('cut', function (event) {
            event.preventDefault();
          });
          document.addEventListener('keydown', function (event) {
            var key = (event.key || '').toLowerCase();
            if ((event.ctrlKey || event.metaKey) && (key === 's' || key === 'p' || key === 'u' || key === 'c')) {
              event.preventDefault();
            }
          });
        }

        async function renderDocument() {
          try {
            preventExtraction();
            var loadingTask = pdfjsLib.getDocument({
              url: fileUrl,
              withCredentials: false,
              disableAutoFetch: true,
              disableStream: false,
              disableRange: false,
              stopAtErrors: true,
            });

            var pdf = await loadingTask.promise;
            pagesRoot.innerHTML = '';
            pagesRoot.style.display = 'block';
            status.style.display = 'none';

            for (var pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
              var page = await pdf.getPage(pageNumber);
              var viewport = page.getViewport({ scale: 1 });
              var availableWidth = Math.max(window.innerWidth - 52, 320);
              var scale = availableWidth / viewport.width;
              var scaledViewport = page.getViewport({ scale: scale });

              var shell = document.createElement('section');
              shell.className = 'page-shell';

              var frame = document.createElement('div');
              frame.className = 'page-frame';

              var canvas = document.createElement('canvas');
              var context = canvas.getContext('2d', { alpha: false });

              var outputScale = window.devicePixelRatio || 1;
              canvas.width = Math.floor(scaledViewport.width * outputScale);
              canvas.height = Math.floor(scaledViewport.height * outputScale);
              canvas.style.width = scaledViewport.width + 'px';
              canvas.style.height = scaledViewport.height + 'px';

              context.setTransform(outputScale, 0, 0, outputScale, 0, 0);
              await page.render({
                canvasContext: context,
                viewport: scaledViewport,
              }).promise;

              var watermark = document.createElement('div');
              watermark.className = 'watermark';
              var watermarkText = document.createElement('span');
              watermarkText.textContent = 'NKOTANYI DRIVING SCHOOL';
              watermark.appendChild(watermarkText);

              var meta = document.createElement('div');
              meta.className = 'page-meta';
              meta.textContent = title + '  Page ' + pageNumber + ' of ' + pdf.numPages;

              frame.appendChild(canvas);
              frame.appendChild(watermark);
              shell.appendChild(frame);
              shell.appendChild(meta);
              pagesRoot.appendChild(shell);

              post('progress', { page: pageNumber, total: pdf.numPages });
            }

            post('ready', { totalPages: pdf.numPages });
          } catch (error) {
            var message =
              error && error.message
                ? error.message
                : 'Unable to prepare this document for secure preview.';
            showError(message);
          }
        }

        renderDocument();
      })();
    </script>
  </body>
</html>`;
}

export function PdfViewerScreen({ navigation, route }: Props) {
  const { title, url } = route.params;
  const { insets } = useResponsiveLayout();
  const webViewRef = useRef<WebView>(null);
  const [previewState, setPreviewState] = useState<PreviewState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [progressLabel, setProgressLabel] = useState('Preparing document...');
  const [loadVersion, setLoadVersion] = useState(0);

  const sourceHtml = useMemo(() => buildSecurePreviewHtml(url, title || 'Document'), [title, url]);

  const handleRetry = () => {
    setPreviewState('loading');
    setError(null);
    setProgressLabel('Preparing document...');
    setLoadVersion((version) => version + 1);
  };

  const handleMessage = (event: { nativeEvent: { data?: string } }) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data ?? '{}') as {
        type?: string;
        payload?: { page?: number; total?: number; totalPages?: number; message?: string } | null;
      };

      if (payload.type === 'progress' && payload.payload?.page && payload.payload?.total) {
        setPreviewState('loading');
        setProgressLabel(`Rendering page ${payload.payload.page} of ${payload.payload.total}...`);
        return;
      }

      if (payload.type === 'ready') {
        setPreviewState('ready');
        setError(null);
        return;
      }

      if (payload.type === 'error') {
        setPreviewState('error');
        setError(payload.payload?.message ?? 'Unable to preview this document securely.');
      }
    } catch {
      setPreviewState('error');
      setError('Unable to preview this document securely.');
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerBlue}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.headerLeft} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#F6F8FE" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title || 'Document'}
          </Text>
          <View style={styles.headerRight} />
        </View>
      </View>

      <View style={styles.bodyWrap}>
        <WebView
          key={`${url}:${loadVersion}`}
          ref={webViewRef}
          source={{ html: sourceHtml, baseUrl: 'https://localhost/' }}
          style={styles.webview}
          originWhitelist={['https://*', 'http://*', 'about:blank']}
          javaScriptEnabled
          domStorageEnabled
          cacheEnabled={false}
          startInLoadingState={false}
          setSupportMultipleWindows={false}
          allowsFullscreenVideo={false}
          allowFileAccess={false}
          allowFileAccessFromFileURLs={false}
          allowUniversalAccessFromFileURLs={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onMessage={handleMessage}
          onShouldStartLoadWithRequest={(request) => {
            const nextUrl = request.url || '';
            return (
              nextUrl === 'about:blank' ||
              nextUrl.startsWith('https://localhost/') ||
              nextUrl.startsWith('data:text/html')
            );
          }}
          onError={() => {
            setPreviewState('error');
            setError('Unable to preview this document securely.');
          }}
        />

        {previewState === 'loading' ? (
          <View style={styles.overlayCard}>
            <ActivityIndicator size="large" color="#4A78D0" />
            <Text style={styles.overlayTitle}>Opening secure preview</Text>
            <Text style={styles.overlayBody}>{progressLabel}</Text>
          </View>
        ) : null}

        {previewState === 'error' ? (
          <View style={styles.overlayCard}>
            <Ionicons name="alert-circle-outline" size={36} color="#C05A5A" />
            <Text style={styles.overlayTitle}>Unable to preview document</Text>
            <Text style={styles.overlayBody}>
              {error ?? 'The secure in-app preview could not be prepared.'}
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#4A78D0',
  },
  headerBlue: {
    backgroundColor: '#4A78D0',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  topRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLeft: {
    position: 'absolute',
    left: 0,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerRight: {
    position: 'absolute',
    right: 0,
    zIndex: 10,
    width: 44,
    height: 44,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 20,
    color: '#F5F7FC',
    textAlign: 'center',
    maxWidth: '70%',
  },
  bodyWrap: {
    flex: 1,
    backgroundColor: '#F3F5FA',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    marginTop: -20,
  },
  webview: {
    flex: 1,
    backgroundColor: '#F3F5FA',
  },
  overlayCard: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#F3F5FA',
    zIndex: 5,
  },
  overlayTitle: {
    marginTop: 12,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 18,
    color: '#1E293B',
    textAlign: 'center',
  },
  overlayBody: {
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 13,
    lineHeight: 19,
    color: '#5C6474',
  },
  retryBtn: {
    marginTop: 18,
    minHeight: 52,
    minWidth: 140,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  retryText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
