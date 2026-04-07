self.addEventListener('fetch', event => {
  const url = event.request.url;
  if (url.includes('googleapis.com/drive/v3/files') && url.includes('alt=media')) {
    const token = url.split('sw_token=')[1]?.split('&')[0];
    if (token) {
      const cleanUrl = url.replace(/[?&]sw_token=[^&]+/, '').replace(/&&/, '&');
      event.respondWith(
        fetch(cleanUrl, {
          headers: { Authorization: 'Bearer ' + token }
        })
      );
    }
  }
});
