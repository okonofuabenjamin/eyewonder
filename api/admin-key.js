const { SETTINGS_REF, hashKey, verifyAdminKey, json, clean, FieldValue } = require('../lib/firebase');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    if (!(await verifyAdminKey(req))) return json(res, 401, { error: 'Unauthorized' });
    const body = typeof req.body === 'object' && req.body ? req.body : {};
    const newKey = clean(body.newKey, 200);
    if (newKey.length < 8) return json(res, 400, { error: 'New admin key must be at least 8 characters.' });

    await SETTINGS_REF().set({ admin_key_hash: hashKey(newKey), updated_at: FieldValue.serverTimestamp() }, { merge: true });
    return json(res, 200, { ok: true });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: 'Could not change admin key.' });
  }
};
