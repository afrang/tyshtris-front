# Empire

Next.js + TypeScript + Tailwind CSS app with multilingual routing (`next-intl`).

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- `next-intl` (EN / FA / AR, with RTL for FA & AR)
- Site header driven by TishtryaCMS public APIs

## Getting started

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you’ll be redirected to a locale path such as `/en`.

Ensure the API is running (`http://localhost:5068` by default).

| Locale | Path | Direction | Font |
| --- | --- | --- | --- |
| English | `/en` | LTR | Geist / Libre Baskerville (brand) |
| Persian | `/fa` | RTL | Vazir (Vazirmatn) |
| Arabic | `/ar` | RTL | Vazir (Vazirmatn) |

## Header data source

Single endpoint used by the site header:

```http
GET /api/header?lang=en
```

Returns:

```json
{
  "settings": { "name": "...", "title": "...", "logoUrl": "...", "socialLinks": [], "...": "..." },
  "languages": [{ "id": "...", "name": "English", "prefix": "en", "isDefault": true, "direction": "ltr" }],
  "menu": [{ "id": "...", "title": "News", "url": "/news", "children": [] }]
}
```

Menu comes from the active menu group with key `topmenu` (seeded on API startup if missing).

## Project layout

```
messages/                 # UI copy (header fallbacks, home)
src/
  app/[locale]/          # Locale-scoped routes
  components/header/      # Official banner + main nav
  lib/cms/                # Public API client
  i18n/                   # Routing, navigation helpers, request config
  proxy.ts                # Locale detection / redirects (Next.js 16)
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Adding a language

1. Add the locale code in `src/i18n/routing.ts`
2. Create `messages/<locale>.json`
3. If the language is RTL, add it to `rtlLocales`
