const { LEADS_REF, verifyAdminKey, json, serialize } = require('../lib/firebase');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  try {
    if (!(await verifyAdminKey(req))) return json(res, 401, { error: 'Unauthorized' });

    const snap = await LEADS_REF().orderBy('created_at', 'desc').limit(2000).get();
    const leads = snap.docs.map(doc => serialize({ id: doc.id, ...doc.data() }));
    return json(res, 200, { leads });
  } catch (error) {
    console.error('Lead read failed:', error);
    return json(res, 500, { error: 'Could not load leads.' });
  }
};
