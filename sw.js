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

    event.respondWith(
      fetch(cleanUrl, {
        headers: {
          'Authorization': 'Bearer ' + token,
          // forward Range header so seeking works
          ...(event.request.headers.get('Range')
            ? { 'Range': event.request.headers.get('Range') }
            : {}),
        },
        // important: don't follow redirects automatically for range requests
        redirect: 'follow',
      }).then(response => {
        // pass through the response with CORS headers added
        const headers = new Headers(response.headers);
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Accept-Ranges', 'bytes');
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
