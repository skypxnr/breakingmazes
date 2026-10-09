// ============================================================
// BREAKING MAZES — Data layer + render helpers
// ============================================================
const BM = {
  data: null,

  get apiBase() {
    if (location.protocol === 'file:') return 'http://localhost:5000/api';
    return `${location.origin}/api`;
  },

  authHeaders() {
    const token = localStorage.getItem('bm_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  emptyData() {
    return {
      site: {
        title: 'Breaking Mazes',
        tagline: 'A Leadership Dialogue Series',
        liveUrl: '',
        liveActive: false,
        liveTitle: 'Can Young India Lead the World?'
      },
      sessions: [],
      speakers: [],
      themes: [],
      studentQuestions: []
    };
  },

  async load() {
    if (this.data) return this.data;

    const headers = { ...this.authHeaders() };

    try {
      const [sessions, speakers, themes, site, studentQuestions] = await Promise.all([
        fetch(`${this.apiBase}/sessions`, { headers }).then(r => {
          if (!r.ok) throw new Error('sessions fetch failed');
          return r.json();
        }),
        fetch(`${this.apiBase}/speakers`).then(r => {
          if (!r.ok) throw new Error('speakers fetch failed');
          return r.json();
        }),
        fetch(`${this.apiBase}/themes`).then(r => {
          if (!r.ok) throw new Error('themes fetch failed');
          return r.json();
        }),
        fetch(`${this.apiBase}/settings`).then(r => {
          if (!r.ok) throw new Error('settings fetch failed');
          return r.json();
        }),
        fetch(`${this.apiBase}/questions/approved`).then(r => {
          if (!r.ok) throw new Error('questions fetch failed');
          return r.json();
        })
      ]);

      this.data = { sessions, speakers, themes, site, studentQuestions };
      return this.data;
    } catch (error) {
      console.error('Failed to load data:', error);
      this.data = this.emptyData();
      return this.data;
    }
  },

  speaker(id) {
    if (!this.data) return null;
    return this.data.speakers.find(s => s.id === id);
  },

  theme(id) {
    if (!this.data) return null;
    return this.data.themes.find(t => t.id === id);
  },

  session(id) {
    if (!this.data) return null;
    return this.data.sessions.find(s => s.id === id);
  },

  publishedSessions() {
    return (this.data?.sessions || []).filter(s => s.status === 'published');
  },

  featuredSessions() {
    return this.publishedSessions().filter(s => s.featured);
  },

  ytThumb(id) {
    if (!id) return '';
    return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  },

  ytEmbed(id, autoplay = true) {
    const params = new URLSearchParams({
      rel: '0', modestbranding: '1', playsinline: '1',
      autoplay: autoplay ? '1' : '0'
    });
    return `https://www.youtube.com/embed/${id}?${params}`;
  },

  cardHTML(session) {
    const sp = this.speaker(session.speakerId);
    const themes = (session.themes || []).map(t => this.theme(t)?.name).filter(Boolean).join(' · ');
    const badge = session.live ? '<span class="card-badge live">Live</span>'
      : `<span class="card-badge">Session ${String(session.number).padStart(2, '0')}</span>`;
    const img = session.poster || this.ytThumb(session.youtubeId);
    return `
      <a class="card" href="session.html?id=${session.id}">
        <div class="card-img">
          ${badge}
          <img src="${img}" alt="${session.title}" loading="lazy">
        </div>
        <div class="card-body">
          <div class="speaker">${sp ? sp.name : ''}</div>
          <h4>${session.title}</h4>
          <div class="meta"><span>${themes}</span><span>·</span><span>${session.duration || ''}</span></div>
        </div>
      </a>`;
  },

  posterHTML(session) {
    const host = this.speaker(session.hostId);
    const guest = this.speaker(session.speakerId);
    const pills = (session.pills || []).map(p => `<span class="pill">${p}</span>`).join('');
    const words = session.title.split(' ');
    const mid = Math.ceil(words.length / 2);
    const top = words.slice(0, mid).join(' ');
    const bottom = words.slice(mid).join(' ');
    return `
      <div class="poster-inner">
        <div class="poster-speaker">
          <img src="${host?.photo || ''}" alt="${host?.name || ''}">
          <div class="poster-name"><div class="n">${host?.name || ''}</div><div class="r">${host?.role || ''}</div></div>
        </div>
        <div class="poster-center">
          <div class="q-top">${top}</div>
          <div class="q-big">${bottom}</div>
          ${session.subtitle ? `<div class="sub">${session.subtitle}</div>` : ''}
          ${pills ? `<div class="pills">${pills}</div>` : ''}
          <div class="cta-row mt-24" style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap">
            <a href="session.html?id=${session.id}" class="btn btn-gold">Watch Conversation</a>
            <a href="conversations.html" class="btn btn-outline">All Sessions</a>
          </div>
        </div>
        <div class="poster-speaker">
          <img src="${guest?.photo || ''}" alt="${guest?.name || ''}">
          <div class="poster-name"><div class="n">${guest?.name || ''}</div><div class="r">${guest?.role || ''}</div></div>
        </div>
      </div>`;
  }
};

BM.injectHeader = function(active) {
  const html = `
  <header class="site-header"><div class="container inner">
    <a href="index.html" class="brand">Breaking <span>Mazes</span></a>
    <nav class="nav">
      <a href="conversations.html" class="${active === 'conversations' ? 'active' : ''}">Conversations</a>
      <a href="voices.html" class="${active === 'voices' ? 'active' : ''}">Voices</a>
      <a href="ideas.html" class="${active === 'ideas' ? 'active' : ''}">Ideas</a>
      <a href="students.html" class="${active === 'students' ? 'active' : ''}">Student Voices</a>
      <a href="about.html" class="${active === 'about' ? 'active' : ''}">About</a>
    </nav>
    <div class="nav-right">
      <a href="live.html" class="btn btn-sm btn-live" id="liveBtn" style="display:none">Live</a>
      <a href="#" class="btn btn-sm btn-ghost" id="userBtn" style="display:none"></a>
      <a href="login.html" class="btn btn-sm btn-ghost" id="signInBtn">Sign In</a>
      <a href="session.html" class="btn btn-sm btn-gold">Watch</a>
      <button class="menu-toggle">☰</button>
    </div>
  </div></header>`;
  document.body.insertAdjacentHTML('afterbegin', html);
};

BM.injectFooter = function() {
  const html = `
  <footer class="site-footer"><div class="container">
    <div class="footer-grid">
      <div>
        <div class="footer-brand">Breaking <span>Mazes</span></div>
        <p style="max-width:300px;font-size:13px">A leadership dialogue series. Conversations that unmake the maze.</p>
      </div>
      <div class="footer-col"><h6>Explore</h6>
        <a href="conversations.html">Conversations</a>
        <a href="voices.html">Voices</a>
        <a href="ideas.html">Ideas</a>
        <a href="students.html">Student Voices</a>
      </div>
      <div class="footer-col"><h6>About</h6>
        <a href="about.html">The Curator</a>
        <a href="about.html">The Format</a>
        <a href="login.html">Sign In</a>
      </div>
      <div class="footer-col"><h6>Follow</h6>
        <a href="https://youtube.com" target="_blank" rel="noopener">YouTube</a>
        <a href="https://instagram.com" target="_blank" rel="noopener">Instagram</a>
        <a href="https://linkedin.com" target="_blank" rel="noopener">LinkedIn</a>
      </div>
    </div>
    <div class="footer-bottom"><span>© 2025 Breaking Mazes</span><span>Privacy · Terms</span></div>
  </div></footer>`;
  document.body.insertAdjacentHTML('beforeend', html);
};
