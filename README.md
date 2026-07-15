# CAS Numarası Arama — Vercel sürümü

Tek bir CAS numarası girip dört kimya tedarikçisinde (Beyotime, Aladdin, BLD Pharm, Macklin)
aynı anda arama yapan uygulama. **Tek Vercel projesi** olarak çalışır — ayrı sunucu yok:

- **Önyüz:** Angular 18 (statik olarak derlenir)
- **Backend:** Vercel Serverless Functions (`/api/search`) — 4 siteyi Node.js ile sorgular

Önyüz ve API aynı origin'de olduğu için CORS gerekmez; istek `/api/search` olarak gider.

---

## 🚀 Deploy (sunucu kurmadan)

### Yol 1 — GitHub + Vercel paneli (en kolay)

1. Bu klasörü bir GitHub deposuna yükleyin (repo oluşturup dosyaları push edin).
2. [vercel.com](https://vercel.com) → **Add New → Project** → GitHub reponuzu seçin.
3. Vercel Angular'ı otomatik algılar; ekstra ayar gerekmez (`vercel.json` her şeyi tanımlıyor).
4. **Deploy**'a basın. Birkaç dakikada `https://<proje>.vercel.app` adresiniz hazır.

Sonraki her `git push` otomatik yeni sürüm yayınlar.

### Yol 2 — Vercel CLI (terminalden)

```bash
npm i -g vercel      # bir kez
cd cas-search-vercel
vercel               # ilk seferde birkaç soru sorar → deploy
vercel --prod        # production yayını
```

Vercel'in **Hobby (ücretsiz)** planı bu proje için yeterlidir.

---

## 💻 Yerelde çalıştırma

Serverless fonksiyonları da yerelde çalıştırmak için Vercel CLI kullanın (Angular + API birlikte):

```bash
npm install
vercel dev           # http://localhost:3000
```

> Not: Sadece `npm start` (ng serve) çalıştırırsanız `/api/search` bulunmaz;
> fonksiyonlarla birlikte test etmek için `vercel dev` gerekir.

Deneme için: `67-68-5`, `113-24-6`, `64-17-5`.

---

## Tedarikçi durumları

| Tedarikçi | Yöntem | Durum |
|-----------|--------|-------|
| **BLD Pharm** | JSON API (`/webapi/v1/searchquery`) | Tam veri |
| **Aladdin** | Sunucu HTML (Magento) — tam CAS eşleşmesine filtrelenir | Tam veri |
| **Beyotime** | Sunucu HTML (`goods.do?method=search`) | Tam veri |
| **Macklin** | Sonuç sayfası JavaScript ile yüklenir + bot koruması | "Sitede aç" bağlantısı |

**Macklin:** sonuç sayfası tarayıcıda render edildiği ve bot koruması olduğu için serverless
fonksiyondan tam veri çekilemez; kart, o CAS için Macklin'in kendi arama sayfasına bağlantı verir.

---

## Proje yapısı

```
cas-search-vercel/
├─ api/
│  └─ search.js          # Vercel Serverless Function: GET /api/search?cas=...
├─ lib/
│  └─ scrapers.js        # 4 tedarikçi scraper'ı (Node.js, harici paket yok)
├─ src/app/
│  ├─ app.component.*     # ana sayfa (input + sonuçlar)
│  ├─ supplier-card.component.ts   # tek tedarikçi kartı (standalone)
│  ├─ cas-search.service.ts        # /api/search'e HTTP isteği
│  └─ models.ts           # TypeScript arayüzleri
├─ vercel.json           # framework + çıktı klasörü + fonksiyon süresi
├─ angular.json, package.json, tsconfig*.json
└─ README.md
```

## API

```
GET /api/search?cas=67-68-5    → 200, tedarikçi sonuçları (JSON)
GET /api/search?cas=abc        → 400, { "error": "Geçersiz CAS numarası..." }
```

## Bir tedarikçiyi güncellemek

Bir sitenin arama düzeni değişirse yalnızca `lib/scrapers.js` içindeki ilgili fonksiyonu
(`bldpharm`, `aladdin`, `beyotime`, `macklin`) düzenlemeniz yeterlidir. Yanıt biçimi
`{ supplier, supplierUrl, searchUrl, success, error, note, products[] }` olduğu sürece
önyüzde değişiklik gerekmez.
