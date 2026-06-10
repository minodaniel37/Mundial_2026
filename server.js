const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'quiniela.json');
const ADMIN_PIN = process.env.ADMIN_PIN || '0000';

app.use(express.json({ limit: '200kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- persistencia ----------
let db = { players: {}, results: {} };
// players: { "Daniel": { pin:"1234", preds:{ M1:[2,1], ... } } }
// results: { M1:[1,0], ... }

function load() {
  try {
    if (fs.existsSync(DATA_FILE)) db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) { console.error('No se pudo leer la base:', e.message); }
}
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(db));
    } catch (e) { console.error('No se pudo guardar:', e.message); }
  }, 300);
}

const cleanName = n => String(n || '').trim().slice(0, 24);
const validPin = p => /^\d{4}$/.test(String(p || ''));
const validScore = s => Array.isArray(s) && s.length === 2 &&
  s.every(v => Number.isInteger(v) && v >= 0 && v <= 99);

// ---------- API ----------
// Estado público (sin NIPs)
app.get('/api/state', (req, res) => {
  const players = Object.entries(db.players).map(([name, p]) => ({ name, preds: p.preds || {} }));
  res.json({ players, results: db.results });
});

// Registro / verificación de jugador
app.post('/api/login', (req, res) => {
  const name = cleanName(req.body.name);
  const pin = String(req.body.pin || '');
  if (!name) return res.status(400).json({ error: 'Escribe tu nombre.' });
  if (!validPin(pin)) return res.status(400).json({ error: 'El NIP debe ser de 4 dígitos.' });
  const existing = db.players[name];
  if (existing) {
    if (existing.pin !== pin) return res.status(403).json({ error: 'Ese nombre ya existe y el NIP no coincide.' });
    return res.json({ ok: true, name, nuevo: false });
  }
  db.players[name] = { pin, preds: {} };
  save();
  res.json({ ok: true, name, nuevo: true });
});

// Guardar pronósticos del jugador (no se aceptan si ya hay resultado oficial)
app.post('/api/preds', (req, res) => {
  const name = cleanName(req.body.name);
  const pin = String(req.body.pin || '');
  const preds = req.body.preds || {};
  const player = db.players[name];
  if (!player || player.pin !== pin) return res.status(403).json({ error: 'Sesión no válida. Vuelve a entrar.' });
  let bloqueados = 0;
  for (const [id, sc] of Object.entries(preds)) {
    if (!/^M\d{1,2}$/.test(id)) continue;
    if (db.results[id]) { bloqueados++; continue; }   // partido ya cerrado
    if (sc === null) { delete player.preds[id]; continue; }
    if (validScore(sc)) player.preds[id] = sc;
  }
  save();
  res.json({ ok: true, bloqueados });
});

// Resultados oficiales (solo admin)
app.post('/api/results', (req, res) => {
  if (String(req.body.adminPin || '') !== ADMIN_PIN)
    return res.status(403).json({ error: 'PIN de administrador incorrecto.' });
  const results = req.body.results || {};
  for (const [id, sc] of Object.entries(results)) {
    if (!/^M\d{1,2}$/.test(id)) continue;
    if (sc === null) { delete db.results[id]; continue; }
    if (validScore(sc)) db.results[id] = sc;
  }
  save();
  res.json({ ok: true });
});

// Verificar PIN admin (para activar el modo en el cliente)
app.post('/api/admin-check', (req, res) => {
  res.json({ ok: String(req.body.adminPin || '') === ADMIN_PIN });
});

load();
app.listen(PORT, () => console.log(`Quiniela Mundial 2026 escuchando en puerto ${PORT} · datos en ${DATA_FILE}`));
