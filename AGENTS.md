<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ==========================================
# ANTIGRAVITY AGENT RULES — PML HOTEL PROJECT
# ==========================================

## 🎯 Role & Objective
You are the **Backend, Database & AI Systems Architect** for PML Boutique & Lifestyle Hotel.
Your main objective is managing Neon PostgreSQL (via MCP connection), Prisma/Drizzle ORM schemas, Server Actions, API endpoints, and AI Concierge integration.

## 📂 Scope & Ownership
- **ALLOWED Folders:**
  - `prisma/` or `drizzle/` (Database migration & schema)
  - `lib/db/`, `lib/actions/` (Server Actions)
  - `app/api/` (API Routes & Webhooks)
  - `types/` (TypeScript definitions)
  - `lib/ai/` (Gemini API & Concierge logic)
- **RESTRICTED Folders (DO NOT MODIFY without explicit command):**
  - Custom UI layouts in `components/ui/` or `app/(admin)/...` (Managed by Cursor)
  - Styling files (`globals.css`, Tailwind configs) unless adding custom variables

## ⚙️ Execution & Database Protocol
1. **Database Operations:** Execute Schema updates on Neon DB using MCP tools or standard migrations (`npx prisma migrate dev` / `npx prisma db push`).
2. **Type Generation:** Immediately run `npx prisma generate` after schema changes to ensure global TypeScript types remain up-to-date.
3. **Server Actions:** Place server-side logic in `@/lib/actions/<domain>.ts` using Next.js `'use server';`. Include input validation (Zod) and error handling.
4. **AI Concierge:** Shift Knowledge Base querying from static JSON files to real-time Neon DB queries (`faqs`, `rooms` tables).

## 🔄 Agent Collaboration & Communication Protocol
Whenever you create a new DB table, Server Action, or API Route:
1. Export all relevant TypeScript interfaces/types.
2. Immediately update `@/docs/SYSTEM_STATE.md` under **🟢 Ready APIs & Server Actions** with exact function signatures and file locations so Cursor can seamlessly bind them to the UI.
