const crypto = require('crypto');
const { getApps, initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

function required(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return String(value).trim();
}

function getDb() {
  if (!getApps().length) {
    const privateKey = required('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n');
    initializeApp({
      credential: cert({
        projectId: required('FIREBASE_PROJECT_ID'),
        clientEmail: required('FIREBASE_CLIENT_EMAIL'),
        privateKey
      })
    });
  }
  return getFirestore();
}

const SETTINGS_REF = () => getDb().collection('app_settings').doc('general');
const LEADS_REF = () => getDb().collection('leads');

function hashKey(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function safeEqualHex(a, b) {
  const aa = Buffer.from(a || '', 'hex');
  const bb = Buffer.from(b || '', 'hex');
  return aa.length === bb.length && aa.length > 0 && crypto.timingSafeEqual(aa, bb);
}

async function readSettings() {
  const ref = SETTINGS_REF();
  const snap = await ref.get();
  if (snap.exists) return { id: snap.id, ...snap.data() };

  const bootstrap = process.env.ADMIN_BOOTSTRAP_KEY || 'gengold321';
  const settings = {
    whatsapp: '2348123487411',
    admin_key_hash: hashKey(bootstrap),
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp()
  };
  await ref.set(settings, { merge: false });
  const created = await ref.get();
  return { id: created.id, ...created.data() };
}

async function verifyAdminKey(req) {
  const supplied = String(req.headers['x-admin-key'] || '');
  if (!supplied || supplied.length > 200) return false;
  const settings = await readSettings();
  return safeEqualHex(hashKey(supplied), settings.admin_key_hash);
}

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function clean(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function serialize(value) {
  if (value && typeof value.toDate === 'function') return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = serialize(v);
    return out;
  }
  return value;
}

module.exports = {
  getDb,
  FieldValue,
  SETTINGS_REF,
  LEADS_REF,
  readSettings,
  hashKey,
  verifyAdminKey,
  json,
  clean,
  serialize
};
