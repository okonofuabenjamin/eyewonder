const { LEADS_REF, FieldValue, json, clean } = require('../lib/firebase');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};

    // Honeypot: silently accept obvious bot submissions without storing them.
    if (clean(body.company, 100)) {
      return json(res, 200, { ok: true });
    }

    const name = clean(body.name, 120);
    const phone = clean(body.phone, 40);
    const email = clean(body.email, 254).toLowerCase();
    const city = clean(body.city, 120);
    const concern = clean(body.concern, 500);
    const pack = clean(body.pack, 10);
    const packLabel = clean(body.pack_label, 80);
    const packPrice = Number(body.pack_price);

    const PACKS = {
      '1': { price: 12000, label: '1 bottle — ₦12,000' },
      '2': { price: 20000, label: '2 bottles — ₦20,000' },
      '3': { price: 27000, label: '3 bottles — ₦27,000' }
    };

    if (!name || !phone || !city) {
      return json(res, 400, {
        error: 'Name, phone and city are required.'
      });
    }

    if (name.length < 2 || phone.length < 7 || city.length < 2) {
      return json(res, 400, {
        error: 'Please provide valid details.'
      });
    }

    if (!PACKS[pack] || packPrice !== PACKS[pack].price) {
      return json(res, 400, {
        error: 'Please choose a valid pack.'
      });
    }

    // Email is optional, but if supplied it must be valid.
    if (email && !EMAIL_RE.test(email)) {
      return json(res, 400, {
        error: 'Please provide a valid email address.'
      });
    }

    const payload = {
      name,
      phone,
      email,
      city,
      concern,
      pack,
      pack_label: packLabel || PACKS[pack].label,
      pack_price: PACKS[pack].price,
      currency: 'NGN',
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
    return json(res, 500, {
      error: 'Could not save your request right now. Please try again.'
    });
  }
};
