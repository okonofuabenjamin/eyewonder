const { SETTINGS_REF, readSettings, verifyAdminKey, json, clean, FieldValue } = require('../lib/firebase');

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const settings = await readSettings();
      return json(res, 200, { whatsapp: settings.whatsapp || '2348123487411' });
    }

    if (req.method === 'POST') {
      if (!(await verifyAdminKey(req))) return json(res, 401, { error: 'Unauthorized' });
      const body = typeof req.body === 'object' && req.body ? req.body : {};
      const whatsapp = clean(body.whatsapp, 30).replace(/\D/g, '');
      if (whatsapp.length < 10 || whatsapp.length > 15) return json(res, 400, { error: 'Enter a valid WhatsApp number with country code.' });

      await SETTINGS_REF().set({ whatsapp, updated_at: FieldValue.serverTimestamp() }, { merge: true });
      return json(res, 200, { ok: true, whatsapp });
    }

    return json(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: 'Server error.' });
  }
};
