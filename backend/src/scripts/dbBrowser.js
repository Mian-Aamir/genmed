// Local, read-only database viewer for development: npm run db:browse  ->  http://localhost:4001
//
// SECURITY:
// - Separate from the GenMed API and only runs when started by hand. It listens on 127.0.0.1
//   only, so other computers on the network cannot open it.
// - The database is opened read-only; this page cannot change any data.
// - Every value is HTML-escaped, so stored XSS test input such as <script> is shown as text.
//   A strict Content-Security-Policy blocks all scripts as a second layer.
// - Password hashes are shortened on screen. Plaintext passwords are never stored at all.
// - Table names come from sqlite_master and are matched exactly, never inserted from the URL.
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { config } from '../config.js';

const PORT = Number(process.env.DB_BROWSER_PORT) || 4001;

if (!existsSync(config.dbFile)) {
  console.log(`No database yet at ${config.dbFile}. Run "npm start" or "npm run db:reset" first.`);
  process.exit(1);
}

const escapeHtml = value => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const quoteIdentifier = name => `"${name.replaceAll('"', '""')}"`;

function renderCell(column, value) {
  if (value === null) return '<span class="null">NULL</span>';
  if (column === 'password_hash') return `<code>${escapeHtml(String(value).slice(0, 20))}…</code> <span class="tag">bcrypt</span>`;
  return escapeHtml(value);
}

function page(selected) {
  // A fresh read-only connection per request, so the page always shows the latest saved data.
  const db = new DatabaseSync(config.dbFile, { readOnly: true });
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all().map(row => row.name);
    const counts = Object.fromEntries(tables.map(name => [name, db.prepare(`SELECT COUNT(*) AS n FROM ${quoteIdentifier(name)}`).get().n]));
    const current = tables.includes(selected) ? selected : (tables.includes('users') ? 'users' : tables[0]);
    const columns = db.prepare(`PRAGMA table_info(${quoteIdentifier(current)})`).all();
    const rows = db.prepare(`SELECT * FROM ${quoteIdentifier(current)} ORDER BY rowid DESC LIMIT 500`).all();

    const nav = tables.map(name => `<a href="/?table=${encodeURIComponent(name)}" class="${name === current ? 'active' : ''}">
      ${escapeHtml(name)} <span class="count">${counts[name]}</span></a>`).join('');
    const head = columns.map(c => `<th>${escapeHtml(c.name)}<small>${escapeHtml(c.type || '')}${c.pk ? ' · PK' : ''}</small></th>`).join('');
    const body = rows.length
      ? rows.map(row => `<tr>${columns.map(c => `<td>${renderCell(c.name, row[c.name])}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${columns.length}" class="empty">No rows yet.</td></tr>`;

    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="5">
<title>GenMed database</title>
<style>
  :root { --bg:#f6f8f7; --card:#fff; --ink:#173b37; --muted:#5d716d; --line:#d9e3e0; --accent:#0b7a6c; --mint:#e6f4f0; }
  @media (prefers-color-scheme: dark) { :root { --bg:#0f1716; --card:#162220; --ink:#e3efec; --muted:#9db3ae; --line:#2a3b38; --accent:#4cc3b0; --mint:#1d302d; } }
  * { box-sizing: border-box; } body { margin:0; font:14px/1.5 system-ui, "Segoe UI", sans-serif; background:var(--bg); color:var(--ink); }
  header { padding:20px 24px; border-bottom:1px solid var(--line); background:var(--card); }
  h1 { margin:0; font-size:20px; } header p { margin:4px 0 0; color:var(--muted); font-size:13px; } code { font-size:12px; }
  nav { display:flex; flex-wrap:wrap; gap:8px; padding:16px 24px 0; }
  nav a { padding:8px 14px; border:1px solid var(--line); border-radius:999px; background:var(--card); color:var(--ink); text-decoration:none; font-weight:600; }
  nav a.active { background:var(--accent); border-color:var(--accent); color:#fff; }
  .count { opacity:.75; font-weight:400; margin-left:4px; }
  main { padding:16px 24px 32px; } .wrap { overflow-x:auto; border:1px solid var(--line); border-radius:10px; background:var(--card); }
  table { border-collapse:collapse; width:100%; } th, td { padding:9px 12px; border-bottom:1px solid var(--line); text-align:left; vertical-align:top; }
  th { background:var(--mint); position:sticky; top:0; white-space:nowrap; } th small { display:block; font-weight:400; color:var(--muted); font-size:11px; }
  td { max-width:360px; overflow-wrap:anywhere; } tr:last-child td { border-bottom:0; }
  .null { color:var(--muted); font-style:italic; } .tag { font-size:11px; color:var(--accent); } .empty { text-align:center; color:var(--muted); padding:28px; }
  footer { padding:0 24px 24px; color:var(--muted); font-size:12px; }
</style></head>
<body>
<header><h1>GenMed database <span style="font-weight:400;color:var(--muted)">· read-only</span></h1>
<p>SQLite file: <code>${escapeHtml(config.dbFile)}</code> · refreshes every 5 seconds</p></header>
<nav aria-label="Tables">${nav}</nav>
<main><div class="wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div></main>
<footer>Newest rows first (up to 500). Password hashes are shortened; plaintext passwords are never stored.</footer>
</body></html>`;
  } finally {
    db.close();
  }
}

createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method !== 'GET' || url.pathname !== '/') {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
    return;
  }
  try {
    const html = page(url.searchParams.get('table') || '');
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    }).end(html);
  } catch (error) {
    console.error('[db-browser]', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' }).end('Could not read the database.');
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`[db-browser] Read-only viewer: http://localhost:${PORT}`);
  console.log(`[db-browser] Database file: ${config.dbFile}`);
});
