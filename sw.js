self.addEventListener('fetch', event => {
  const url = event.request.url;
  if (url.includes('googleapis.com/drive/v3/files') && url.includes('alt=media')) {
    const token = url.split('sw_token=')[1]?.split('&')[0];
    if (!token) return;

    // rebuild clean URL without sw_token
    const cleanUrl = url
      .replace(/[?&]sw_token=[^&]+/, '')
      .replace(/\?&/, '?')
      .replace(/&&/, '&')
      .replace(/[?&]$/, '');

    const rangeHeader = event.request.headers.get('Range');

    event.respondWith(
      fetch(cleanUrl, {
        headers: {
          'Authorization': 'Bearer ' + token,
          ...(rangeHeader ? { 'Range': rangeHeader } : {}),
        },
        redirect: 'follow',
      }).then(response => {
        const headers = new Headers(response.headers);
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Accept-Ranges', 'bytes');

        // For range requests: ensure proper 206 response
        // For full requests: ensure Content-Length is preserved so browser knows duration
        if (rangeHeader && response.status === 206) {
          return new Response(response.body, {
            status: 206,
            statusText: 'Partial Content',
            headers,
          });
        }

        // If we sent a Range but got 200, the server doesn't support ranges for this file.
        // Return as-is; the browser will handle it.
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }).catch(e => {
        console.error('SW fetch error:', e);
        return new Response('SW error', { status: 500 });
      })
    );
  }
});
