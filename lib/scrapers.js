// CAS tedarikçi scraper'ları — Node.js portu (harici paket yok, Node 18+ global fetch).
// Her fonksiyon bir SupplierResult döndürür. Bir siteyi güncellemek için sadece
// ilgili fonksiyonu düzenlemeniz yeterlidir.

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

// ---------- yardımcılar ----------
function decodeEntities(s) {
  return (s || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d));
}
function stripTags(html) {
  if (!html) return '';
  return decodeEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}
function absoluteUrl(base, href) {
  if (!href) return base;
  if (/^https?:/i.test(href)) return href;
  try { return new URL(href, base).toString(); } catch { return href; }
}
async function fetchText(url, headers = {}, timeoutMs = 9000) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, ...headers }, signal: ctrl.signal });
    return { status: r.status, body: await r.text() };
  } finally { clearTimeout(to); }
}
function supplier(name, root, searchUrl, success, error, note, products) {
  return { supplier: name, supplierUrl: root, searchUrl, success, error, note, products };
}

// ---------- BLD Pharm (JSON API) ----------
async function bldpharm(cas) {
  const root = 'https://www.bldpharm.com';
  const searchUrl = `${root}/search/Search.html?keyword=${encodeURIComponent(cas)}`;
  try {
    const b64 = Buffer.from(JSON.stringify({ keyword: cas }), 'utf8').toString('base64');
    const apiUrl = `${root}/webapi/v1/searchquery?params=${encodeURIComponent(b64)}&_xsrf=`;
    const { body } = await fetchText(apiUrl, {
      'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json', Referer: searchUrl,
    });
    const json = JSON.parse(body);
    const products = [];
    if (Array.isArray(json.value)) {
      for (const it of json.value) {
        const url = it.url || '';
        const name = it.nameEN || stripTags(it.name || '');
        products.push({
          catalogNumber: it.p_bd || '', name, cas: it.cas || '',
          packSize: null, price: null, purity: null,
          url: url ? `${root}/products/${url}` : searchUrl,
        });
      }
    }
    return supplier('BLD Pharm', root, searchUrl, true, null, null, products);
  } catch (e) {
    return supplier('BLD Pharm', root, searchUrl, false, String(e.message || e), null, []);
  }
}

// ---------- Aladdin (Magento HTML + tam CAS filtresi) ----------
async function aladdin(cas) {
  const root = 'https://www.aladdinsci.com';
  const searchUrl = `${root}/us_en/catalogsearch/result/?q=${encodeURIComponent(cas)}`;
  try {
    const { body: html } = await fetchText(searchUrl);

    // kart başlangıçları: <li ... class="view ...">
    const starts = [];
    const cardRe = /<li[^>]*class="view\b/gi;
    let m;
    while ((m = cardRe.exec(html)) !== null) starts.push(m.index);

    const linkRe = /href="(https?:\/\/[^"]*?\/us_en\/(?!faqs\/)[^"]*?-([A-Za-z0-9]+)\.html)"/i;
    const products = [];
    const seen = new Set();

    for (let i = 0; i < starts.length; i++) {
      const card = html.slice(starts[i], i + 1 < starts.length ? starts[i + 1] : html.length);
      const text = stripTags(card);

      const casMatch = text.match(/CAS:\s*(\d{1,7}-\d{2}-\d)/i);
      if (!casMatch || casMatch[1] !== cas) continue;

      const link = card.match(linkRe);
      if (!link) continue;
      const url = decodeEntities(link[1]);
      const catalog = link[2];
      if (seen.has(url)) continue;
      seen.add(url);

      const casIdx = text.search(/CAS:/i);
      const name = casIdx > 0 ? text.slice(0, casIdx).trim() : text.slice(0, 60).trim();
      const price = card.match(/\$[\d,]+\.\d{2}/);
      const formula = text.match(/Formula:\s*([^\s<]+)/i);

      products.push({
        catalogNumber: catalog, name, cas,
        packSize: null,
        purity: formula ? 'Formül: ' + formula[1] : null,
        price: price ? price[0] : null,
        url,
      });
    }
    const note = products.length === 0
      ? 'Bu CAS için sayfada tam eşleşme bulunamadı; tedarikçi sayfasında tüm sonuçları görebilirsiniz.'
      : null;
    return supplier('Aladdin', root, searchUrl, true, null, note, products);
  } catch (e) {
    return supplier('Aladdin', root, searchUrl, false, String(e.message || e), null, []);
  }
}

// ---------- Beyotime (HTML tablo) ----------
async function beyotime(cas) {
  const root = 'https://www.beyotime.com';
  const searchUrl = `${root}/goods.do?method=search&q=${encodeURIComponent(cas)}`;
  try {
    const { body: html } = await fetchText(searchUrl);
    const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const linkRe = /href="(\/product\/([^"]+?)\.htm)"[^>]*>([\s\S]*?)<\/a>/i;
    const priceRe = /([\d,]+\.?\d*)\s*元/;

    const products = [];
    const seen = new Set();
    let row;
    while ((row = rowRe.exec(html)) !== null) {
      const rowHtml = row[1];
      const link = rowHtml.match(linkRe);
      if (!link) continue;
      const fullCode = decodeEntities(link[2]); // ST1661-5g
      if (seen.has(fullCode)) continue;
      seen.add(fullCode);

      const name = stripTags(link[3]);
      const href = link[1];
      const price = rowHtml.match(priceRe);
      const dash = fullCode.lastIndexOf('-');
      const pack = dash > 0 ? fullCode.slice(dash + 1) : null;

      products.push({
        catalogNumber: fullCode, name, cas,
        packSize: pack, purity: null,
        price: price ? price[1] + ' CNY' : null,
        url: absoluteUrl(root, href),
      });
    }
    return supplier('Beyotime', root, searchUrl, true, null, null, products);
  } catch (e) {
    return supplier('Beyotime', root, searchUrl, false, String(e.message || e), null, []);
  }
}

// ---------- Macklin (JS-render; fallback) ----------
async function macklin(cas) {
  const root = 'https://www.macklin.cn';
  const searchUrl = `${root}/search/${encodeURIComponent(cas)}`;
  try {
    const { body: html } = await fetchText(searchUrl, {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    });
    const text = stripTags(html);
    const nameMatch = text.match(/([A-Za-z][A-Za-z0-9 ,\-()]{2,60}?)\s*分子式/);
    const compoundName = nameMatch ? nameMatch[1].trim() : cas;

    const products = [];
    const seen = new Set();
    const codeRe = /\/products\/([A-Za-z0-9]+)/gi;
    let m;
    while ((m = codeRe.exec(html)) !== null) {
      const code = m[1];
      if (seen.has(code)) continue;
      seen.add(code);
      products.push({
        catalogNumber: code, name: compoundName, cas,
        packSize: null, price: null, purity: null,
        url: `${root}/products/${code}`,
      });
    }
    const note = products.length === 0
      ? 'Macklin sonuçları tarayıcıda (JavaScript) yükleniyor; ürünleri görmek için Macklin arama sayfasını açın.'
      : null;
    return supplier('Macklin', root, searchUrl, true, null, note, products);
  } catch (e) {
    return supplier('Macklin', root, searchUrl, false, String(e.message || e), null, []);
  }
}

module.exports = { bldpharm, aladdin, beyotime, macklin };
