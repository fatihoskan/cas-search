// Vercel Serverless Function — GET /api/search?cas=67-68-5
// Dört tedarikçiyi paralel sorgular, sade JSON döner.
const { bldpharm, aladdin, beyotime, macklin } = require('../lib/scrapers');

const CAS_RE = /^\d{1,7}-\d{2}-\d$/;

module.exports = async (req, res) => {
  // cas parametresini al (Vercel req.query ya da URL'den)
  let cas = '';
  if (req.query && req.query.cas) cas = String(req.query.cas);
  else {
    try { cas = new URL(req.url, 'http://x').searchParams.get('cas') || ''; } catch { cas = ''; }
  }
  cas = cas.trim();

  if (!CAS_RE.test(cas)) {
    res.status(400).json({ error: 'Geçersiz CAS numarası. Örnek biçim: 67-68-5' });
    return;
  }

  const results = await Promise.all([
    bldpharm(cas), aladdin(cas), beyotime(cas), macklin(cas),
  ]);

  res.status(200).json({
    cas,
    totalProducts: results.reduce((sum, s) => sum + s.products.length, 0),
    suppliers: results,
  });
};
