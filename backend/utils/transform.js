function avatarUrl(name) {
  const n = encodeURIComponent(name || 'Guest');
  return `https://ui-avatars.com/api/?name=${n}&background=1a2744&color=c9a84c&size=400&format=svg`;
}

function resolvePhoto(photoUrl, name) {
  if (!photoUrl) return avatarUrl(name);
  return photoUrl;
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

function transformSpeaker(row) {
  return {
    id: row.id,
    name: row.full_name,
    role: row.professional_title || '',
    bio: row.bio || '',
    photo: resolvePhoto(row.photo_url, row.full_name),
    isHost: !!row.is_host
  };
}

function transformTheme(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || ''
  };
}

function transformSession(row, themeIds = []) {
  return {
    id: row.id,
    number: row.session_number,
    title: row.title,
    subtitle: row.subtitle || '',
    synopsis: row.synopsis || '',
    pullQuote: row.pull_quote || '',
    hostId: row.host_id,
    speakerId: row.speaker_id,
    themes: themeIds,
    poster: row.poster_url || null,
    youtubeId: row.video_youtube_id || '',
    duration: row.video_duration || '',
    publishedAt: formatDate(row.published_at),
    status: row.status,
    featured: !!row.is_featured,
    live: false,
    pills: []
  };
}

function transformQuestion(row) {
  return {
    id: row.id,
    sessionId: row.session_id,
    student: row.student_name,
    year: row.student_year || '',
    question: row.question_text,
    status: row.status
  };
}

function defaultSite() {
  return {
    title: 'Breaking Mazes',
    tagline: 'A Leadership Dialogue Series',
    liveUrl: '',
    liveActive: false,
    liveTitle: 'Can Young India Lead the World?'
  };
}

module.exports = {
  avatarUrl,
  resolvePhoto,
  transformSpeaker,
  transformTheme,
  transformSession,
  transformQuestion,
  defaultSite
};
