# PML Hotel

Next.js 16 App Router website for PML Hotel.

## Content architecture

- `config/site.ts`: brand name, tagline, contact details, navigation, social placeholders, and branch references.
- `data/*.ts`: typed room, branch, offer, FAQ, review, gallery, and assistant quick-reply content copied from `files/pml_hotel_dataset_full.json`.
- `i18n/vi.ts` and `i18n/en.ts`: typed public UI dictionaries. Vietnamese is the default; the toggle persists `pml-locale` as a cookie.
- `app/globals.css`: design variables under `:root` for cream, ink, accent, spacing, radius, and shadows.

Run `node scripts/generate-hotel-data.mjs` after intentionally updating the source dataset. Review generated copy before publishing.

## Images

Current photography uses remote Unsplash placeholders through `next/image`. Replace URLs with licensed hotel photography, preserve descriptive Vietnamese alt text, and keep only the hero image marked priority.

## Booking connection

`lib/submit-booking.ts` currently returns a local request reference. Replace its implementation with the production CRM/PMS endpoint. Never collect card numbers, CVV, or OTP in this form.

## AI assistant

The Gemini server route is `app/api/assistant/route.ts`. Knowledge and prompt guardrails come from `files/01_brand_policies.json` through `files/08_content_seo.json`; typed quick replies and guardrail references are in `data/assistant.ts`. The server-only `GEMINI_API_KEY` must stay in local or deployment environment variables.

## Development and deployment

```
npm run dev
npm run lint
npm run build
```

Deploy on Vercel and set `GEMINI_API_KEY` in project settings. Do not expose it through a `NEXT_PUBLIC_` variable.
