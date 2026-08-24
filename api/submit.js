const { LEADS_REF, FieldValue, json, clean } = require('../lib/firebase');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'object' && req.body ? req.body : {};
    if (clean(body.company, 100)) return json(res, 200, { ok: true });

    const name = clean(body.name, 120);
    const phone = clean(body.phone, 40);
    const city = clean(body.city, 120);
    const concern = clean(body.concern, 500);

    if (!name || !phone || !city) return json(res, 400, { error: 'Name, phone and city are required.' });
    if (name.length < 2 || phone.length < 7 || city.length < 2) return json(res, 400, { error: 'Please provide valid details.' });

    const payload = {
      name,
      phone,
      city,
      concern,
      product: 'Gengold Eye Wonder+',
      source: clean(body.source, 80) || 'landing_page',
      utm_source: clean(body.utm_source, 150),
      utm_medium: clean(body.utm_medium, 150),
      utm_campaign: clean(body.utm_campaign, 200),
      utm_content: clean(body.utm_content, 200),
      utm_term: clean(body.utm_term, 200),
      fbclid: clean(body.fbclid, 300),
      created_at: FieldValue.serverTimestamp()
    };

    await LEADS_REF().add(payload);
    return json(res, 201, { ok: true });
  } catch (error) {
    console.error('Lead insert failed:', error);
    return json(res, 500, { error: 'Could not save lead.' });
  }
};
