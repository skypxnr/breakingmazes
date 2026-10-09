// ============================================================
// VIDEO PLAYER — YouTube embed, custom MP4, live HLS
// ============================================================
const Player = {
  render(container, {type='youtube', youtubeId, src, live=false, autoplay=false, poster}){
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if(!el) return;

    if(live){
      el.innerHTML = `
        <div class="live-strip"><span class="dot"></span> Live Now</div>
        <div class="video-shell">
          <iframe src="${src}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
        </div>`;
      return;
    }

    if(type === 'youtube'){
      const thumb = poster || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
      el.innerHTML = `
        <div class="video-shell">
          <div class="video-facade" style="background-image:url('${thumb}')" data-yt="${youtubeId}">
            <div class="play"></div>
          </div>
        </div>`;
      const facade = el.querySelector('.video-facade');
      facade.addEventListener('click', () => {
        el.querySelector('.video-shell').innerHTML =
          `<iframe src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1"
                   allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      });
      if(autoplay) facade.click();
      return;
    }

    if(type === 'mp4'){
      el.innerHTML = `
        <div class="video-shell">
          <video controls ${autoplay?'autoplay':''} poster="${poster||''}">
            <source src="${src}" type="video/mp4">
          </video>
        </div>`;
      return;
    }

    if(type === 'hls'){
      el.innerHTML = `
        <div class="video-shell">
          <video controls ${autoplay?'autoplay':''} poster="${poster||''}" id="hlsVideo"></video>
        </div>`;
      const v = el.querySelector('#hlsVideo');
      if(window.Hls){
        const hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(v);
      } else {
        v.src = src; // fallback
      }
    }
  }
};