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

// ---------- Horarios oficiales de cada partido (UTC-6 = Centro de México) ----------
// Formato: timestamp Unix en milisegundos (hora de inicio del partido)
const KICKOFFS = {
  M1:  new Date('2026-06-11T13:00:00-06:00').getTime(),
  M2:  new Date('2026-06-11T20:00:00-06:00').getTime(),
  M3:  new Date('2026-06-12T13:00:00-06:00').getTime(),
  M4:  new Date('2026-06-12T19:00:00-06:00').getTime(),
  M8:  new Date('2026-06-13T13:00:00-06:00').getTime(),
  M7:  new Date('2026-06-13T16:00:00-06:00').getTime(),
  M5:  new Date('2026-06-13T19:00:00-06:00').getTime(),
  M6:  new Date('2026-06-13T22:00:00-06:00').getTime(),
  M10: new Date('2026-06-14T11:00:00-06:00').getTime(),
  M11: new Date('2026-06-14T14:00:00-06:00').getTime(),
  M9:  new Date('2026-06-14T17:00:00-06:00').getTime(),
  M12: new Date('2026-06-14T20:00:00-06:00').getTime(),
  M14: new Date('2026-06-15T10:00:00-06:00').getTime(),
  M16: new Date('2026-06-15T13:00:00-06:00').getTime(),
  M13: new Date('2026-06-15T16:00:00-06:00').getTime(),
  M15: new Date('2026-06-15T19:00:00-06:00').getTime(),
  M17: new Date('2026-06-16T13:00:00-06:00').getTime(),
  M18: new Date('2026-06-16T16:00:00-06:00').getTime(),
  M19: new Date('2026-06-16T19:00:00-06:00').getTime(),
  M20: new Date('2026-06-16T22:00:00-06:00').getTime(),
  M23: new Date('2026-06-17T11:00:00-06:00').getTime(),
  M22: new Date('2026-06-17T14:00:00-06:00').getTime(),
  M21: new Date('2026-06-17T17:00:00-06:00').getTime(),
  M24: new Date('2026-06-17T20:00:00-06:00').getTime(),
  M25: new Date('2026-06-18T10:00:00-06:00').getTime(),
  M26: new Date('2026-06-18T13:00:00-06:00').getTime(),
  M27: new Date('2026-06-18T16:00:00-06:00').getTime(),
  M28: new Date('2026-06-18T19:00:00-06:00').getTime(),
  M32: new Date('2026-06-19T13:00:00-06:00').getTime(),
  M30: new Date('2026-06-19T16:00:00-06:00').getTime(),
  M29: new Date('2026-06-19T18:30:00-06:00').getTime(),
  M31: new Date('2026-06-19T21:00:00-06:00').getTime(),
  M35: new Date('2026-06-20T11:00:00-06:00').getTime(),
  M33: new Date('2026-06-20T14:00:00-06:00').getTime(),
  M34: new Date('2026-06-20T18:00:00-06:00').getTime(),
  M36: new Date('2026-06-20T22:00:00-06:00').getTime(),
  M38: new Date('2026-06-21T10:00:00-06:00').getTime(),
  M39: new Date('2026-06-21T13:00:00-06:00').getTime(),
  M37: new Date('2026-06-21T16:00:00-06:00').getTime(),
  M40: new Date('2026-06-21T19:00:00-06:00').getTime(),
  M43: new Date('2026-06-22T11:00:00-06:00').getTime(),
  M42: new Date('2026-06-22T15:00:00-06:00').getTime(),
  M41: new Date('2026-06-22T18:00:00-06:00').getTime(),
  M44: new Date('2026-06-22T21:00:00-06:00').getTime(),
  M47: new Date('2026-06-23T11:00:00-06:00').getTime(),
  M45: new Date('2026-06-23T14:00:00-06:00').getTime(),
  M46: new Date('2026-06-23T17:00:00-06:00').getTime(),
  M48: new Date('2026-06-23T20:00:00-06:00').getTime(),
  M51: new Date('2026-06-24T13:00:00-06:00').getTime(),
  M52: new Date('2026-06-24T13:00:00-06:00').getTime(),
  M49: new Date('2026-06-24T16:00:00-06:00').getTime(),
  M50: new Date('2026-06-24T16:00:00-06:00').getTime(),
  M53: new Date('2026-06-24T19:00:00-06:00').getTime(),
  M54: new Date('2026-06-24T19:00:00-06:00').getTime(),
  M55: new Date('2026-06-25T14:00:00-06:00').getTime(),
  M56: new Date('2026-06-25T14:00:00-06:00').getTime(),
  M57: new Date('2026-06-25T17:00:00-06:00').getTime(),
  M58: new Date('2026-06-25T17:00:00-06:00').getTime(),
  M59: new Date('2026-06-25T20:00:00-06:00').getTime(),
  M60: new Date('2026-06-25T20:00:00-06:00').getTime(),
  M61: new Date('2026-06-26T13:00:00-06:00').getTime(),
  M62: new Date('2026-06-26T13:00:00-06:00').getTime(),
  M66: new Date('2026-06-26T18:00:00-06:00').getTime(),
  M65: new Date('2026-06-26T18:00:00-06:00').getTime(),
  M63: new Date('2026-06-26T21:00:00-06:00').getTime(),
  M64: new Date('2026-06-26T21:00:00-06:00').getTime(),
  M67: new Date('2026-06-27T15:00:00-06:00').getTime(),
  M68: new Date('2026-06-27T15:00:00-06:00').getTime(),
  M71: new Date('2026-06-27T17:30:00-06:00').getTime(),
  M72: new Date('2026-06-27T17:30:00-06:00').getTime(),
  M70: new Date('2026-06-27T20:00:00-06:00').getTime(),
  M69: new Date('2026-06-27T20:00:00-06:00').getTime(),
};

// Kickoff del partido inaugural — desde este momento se bloquean TODOS
const TORNEO_INICIO = new Date('2026-06-11T13:00:00-06:00').getTime();

// Devuelve true si el torneo ya comenzó (todos los partidos se bloquean juntos)
function isLocked(id) {
  return Date.now() >= TORNEO_INICIO;
}

// ---------- persistencia ----------
let db = { players: {}, results: {} };

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
const validPin  = p => /^\d{4}$/.test(String(p || ''));
const validScore = s => Array.isArray(s) && s.length === 2 &&
  s.every(v => Number.isInteger(v) && v >= 0 && v <= 99);

// ---------- API ----------

// Estado público: incluye kickoffs para que el cliente muestre el candado
app.get('/api/state', (req, res) => {
  const now = Date.now();
  const players = Object.entries(db.players).map(([name, p]) => ({ name, preds: p.preds || {} }));
  // Enviar qué partidos están bloqueados por hora
  const locked = {};
  for (const id of Object.keys(KICKOFFS)) {
    if (isLocked(id)) locked[id] = true;
  }
  res.json({ players, results: db.results, locked, serverTime: now });
});

// Login / registro
app.post('/api/login', (req, res) => {
  const name = cleanName(req.body.name);
  const pin  = String(req.body.pin || '');
  if (!name)         return res.status(400).json({ error: 'Escribe tu nombre.' });
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

// Guardar pronósticos — el servidor bloquea por hora Y por resultado oficial
app.post('/api/preds', (req, res) => {
  const name  = cleanName(req.body.name);
  const pin   = String(req.body.pin || '');
  const preds = req.body.preds || {};
  const player = db.players[name];
  if (!player || player.pin !== pin)
    return res.status(403).json({ error: 'Sesión no válida. Vuelve a entrar.' });

  let bloqueados = 0;
  for (const [id, sc] of Object.entries(preds)) {
    if (!/^M\d{1,2}$/.test(id)) continue;
    // Bloqueado si ya tiene resultado oficial O si el partido ya comenzó
    if (db.results[id] || isLocked(id)) { bloqueados++; continue; }
    if (sc === null) { delete player.preds[id]; continue; }
    if (validScore(sc)) player.preds[id] = sc;
  }
  save();
  res.json({ ok: true, bloqueados });
});

// Resultados oficiales (solo admin) — el admin siempre puede capturar
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

// Verificar PIN admin
app.post('/api/admin-check', (req, res) => {
  res.json({ ok: String(req.body.adminPin || '') === ADMIN_PIN });
});

load();
app.listen(PORT, () => console.log(
  `Quiniela Mundial 2026 · puerto ${PORT} · datos en ${DATA_FILE}`
));
