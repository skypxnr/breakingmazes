require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const USERS = [
  { id: 'u-admin', email: 'admin@breakingmazes.com', password: 'admin123' },
  { id: 'u-curator', email: 'curator@breakingmazes.com', password: 'curator123' },
  { id: 'u-editor', email: 'editor@breakingmazes.com', password: 'editor123' },
  { id: 'u-student', email: 'student@breakingmazes.com', password: 'student123' }
];

const SITE_SETTINGS = {
  title: 'Breaking Mazes',
  tagline: 'A Leadership Dialogue Series',
  liveUrl: 'https://www.youtube.com/embed/jNQXAC9IVRw',
  liveActive: false,
  liveTitle: 'Can Young India Lead the World?'
};

const SESSION_THEMES = [
  ['s-001', 'th-youth'], ['s-001', 'th-leadership'], ['s-001', 'th-entrepreneurship'],
  ['s-002', 'th-education'], ['s-002', 'th-governance'], ['s-002', 'th-innovation'],
  ['s-003', 'th-entrepreneurship'], ['s-003', 'th-culture'], ['s-003', 'th-governance'],
  ['s-004', 'th-culture'], ['s-004', 'th-leadership'],
  ['s-005', 'th-ai'], ['s-005', 'th-innovation'], ['s-005', 'th-education'],
  ['s-006', 'th-governance'], ['s-006', 'th-culture'],
  ['s-007', 'th-education'], ['s-007', 'th-youth'], ['s-007', 'th-leadership']
];

/** Local files under assets/img/ (see data/content.json) */
const SPEAKER_PHOTOS = {
  'sp-suhail': 'assets/img/suhail.jpg',
  'sp-001': 'assets/img/ravi.jpg',
  'sp-002': 'assets/img/arun.jpg',
  'sp-003': 'assets/img/manish.jpg',
  'sp-004': 'assets/img/declan.jpg',
  'sp-005': 'assets/img/mac.jpg',
  'sp-006': 'assets/img/rajiv.jpg',
  'sp-007': 'assets/img/anil.jpg'
};

const SESSION_POSTERS = {
  's-001': 'assets/img/poster-young-india.jpg',
  's-002': 'assets/img/poster-jobs-not-life.jpg',
  's-003': 'assets/img/poster-education-ai.jpg',
  's-004': 'assets/img/poster-science-strategy.jpg',
  's-005': 'assets/img/poster-leadership-taught.jpg',
  's-006': 'assets/img/poster-india-2047.jpg',
  's-007': 'assets/img/poster-system-broken.jpg'
};

const SAMPLE_QUESTIONS = [
  { id: 'q-001', session_id: 's-005', student_name: 'Aditya Sharma', student_year: '3rd Year', student_email: 'aditya@example.com', question_text: 'How do you hold your ground when the system is designed to wear you down?', status: 'approved' },
  { id: 'q-002', session_id: 's-005', student_name: 'Sneha Iyer', student_year: '2nd Year', student_email: 'sneha@example.com', question_text: 'Is patience a virtue, or a trap for young reformers?', status: 'approved' },
  { id: 'q-003', session_id: 's-004', student_name: 'Rahul Mehta', student_year: '4th Year', student_email: 'rahul@example.com', question_text: 'What did you learn too late?', status: 'approved' }
];

async function ensureTables(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      \`key\` VARCHAR(100) PRIMARY KEY,
      \`value\` LONGTEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

async function ensureStudentYearColumn(connection) {
  const [cols] = await connection.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'student_questions' AND COLUMN_NAME = 'student_year'`,
    [process.env.DB_NAME]
  );
  if (cols.length === 0) {
    await connection.query(
      'ALTER TABLE student_questions ADD COLUMN student_year VARCHAR(100) NULL AFTER student_email'
    );
    console.log('  ✓ Added student_year column');
  }
}

async function run() {
  const connection = await pool.getConnection();

  try {
    await ensureTables(connection);
    await ensureStudentYearColumn(connection);

    console.log('Updating demo user passwords…');
    for (const user of USERS) {
      const hash = await bcrypt.hash(user.password, 10);
      await connection.query(
        'UPDATE users SET password_hash = ? WHERE id = ? OR email = ?',
        [hash, user.id, user.email]
      );
      console.log(`  ✓ ${user.email} → ${user.password}`);
    }

    console.log('Seeding site settings…');
    for (const [key, value] of Object.entries(SITE_SETTINGS)) {
      const stored = typeof value === 'string' ? value : JSON.stringify(value);
      await connection.query(
        'INSERT INTO site_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
        [key, stored]
      );
    }

    console.log('Seeding session themes…');
    for (const [sessionId, themeId] of SESSION_THEMES) {
      await connection.query(
        'INSERT IGNORE INTO session_themes (session_id, theme_id) VALUES (?, ?)',
        [sessionId, themeId]
      );
    }

    console.log('Syncing local image paths…');
    for (const [id, photoUrl] of Object.entries(SPEAKER_PHOTOS)) {
      await connection.query('UPDATE speakers SET photo_url = ? WHERE id = ?', [photoUrl, id]);
    }
    for (const [id, posterUrl] of Object.entries(SESSION_POSTERS)) {
      await connection.query('UPDATE sessions SET poster_url = ? WHERE id = ?', [posterUrl, id]);
    }
    console.log('  ✓ speakers & session posters → assets/img/');

    console.log('Seeding sample student questions…');
    for (const q of SAMPLE_QUESTIONS) {
      await connection.query(
        `INSERT INTO student_questions (id, session_id, student_name, student_email, student_year, question_text, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           student_name = VALUES(student_name),
           student_year = VALUES(student_year),
           question_text = VALUES(question_text),
           status = VALUES(status)`,
        [q.id, q.session_id, q.student_name, q.student_email, q.student_year, q.question_text, q.status]
      );
    }

    console.log('Done.');
  } finally {
    connection.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
