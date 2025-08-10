## ComparePCO – System Architecture and Operational Overview

This document provides a concise, production-facing overview of the system: architecture, roles and permissions, data model, app structure, key pages and workflows, security/RLS, and operational runbooks.

### 1) Architecture at a glance
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS + React Icons + Recharts
- Backend: Supabase (PostgreSQL, Auth, Storage, Realtime)
- Data access:
  - Client-side Supabase with RLS enforced for all user-facing pages
  - Server-side endpoints (Next.js Route Handlers) with Service Role for cross-tenant/public aggregation
- Auth: Supabase Auth; custom `AuthContext` hydrates role, partner status, and activity checks
- Component approach: dashboard widgets + reusable cards; pages organized by business domain

### 2) Roles and permissions (RBAC)
- SUPER_ADMIN: Full platform control (RBAC, schema, policies), can act-as any user
- ADMIN: Platform-wide read, moderation/approval, oversight; no destructive RBAC changes
- ADMIN_STAFF: Operations/support subset of ADMIN privileges
- PARTNER: Tenant owner (their `partner_id`); full tenant CRUD: vehicles, bookings, drivers, categories, staff, pricing, docs, analytics
- PARTNER_STAFF: Mapped to tenant via `partner_staff.user_id → partner_id`; permission flags gate write ops (`canManageFleet`, `canManageBookings`, `canViewFinancials`, etc.)
- DRIVER: Sees only their data (profile, docs, bookings, invoices), can request/cancel bookings per status

Relationship summary
- Vehicles belong to a `partner_id`
- Bookings link `vehicle_id`, `partner_id`, `driver_id`
- Categories (`vehicle_categories`) scoped by `partner_id`
- Documents are polymorphic: owned by partner/vehicle/driver and permissioned accordingly
- Notifications target `user_id` and/or `partner_id`

### 3) Data model (key tables)
- users: all users, role and profile metadata
- partners: partner company row (id matches partner user id); approval/status
- partner_staff: link `user_id` → `partner_id` with permission flags
- vehicles: fleet records per partner; pricing (weekly_rate), status flags, categories
- vehicle_categories: per-partner categories; auto-sync ensures categories used by vehicles exist
- bookings: rental transactions; status, dates, financials; links to vehicle/partner/driver
- documents: entity docs (vehicle/partner/driver); verification state
- notifications: per-user/partner notifications

Indexes and performance
- Primary FKs on `partner_id`, `driver_id`, `vehicle_id`
- Composite/filtered indexes for common queries (e.g., bookings by partner + status)

### 4) Security (RLS) and access patterns
- Client-side Supabase uses anon key with RLS enforced
  - Partners (and staff) can access rows where `partner_id = auth_partner_id()` (resolved for staff)
  - Drivers limited to rows where `user_id = auth.uid()` (own records)
  - Admin/Admin_Staff have broad read and moderated write exceptions
- Server-side endpoints use Service Role where cross-tenant aggregation is needed (e.g., public available cars)
- Sensitive admin tasks must remain server-side behind admin-checks; never expose Service Role client-side

### 5) Frontend structure (App Router)
- `src/app/partner/` – Partner portal
  - `page.tsx` – Fleetio-style dashboard (30+ widgets, real data, modals, quick actions)
  - `layout.tsx` – Sidebar, role-based nav, active/expanded states, mobile behavior
  - `fleet/` – Fleet management
    - `page.tsx` – Fleet overview (stats cards, quick actions, list, pagination)
    - `add/page.tsx` – Add vehicle (multi-category PCO selection up to 3)
    - `categories/page.tsx` – Vehicle categories (stats, CRUD, export, auto-sync)
    - `bulk/page.tsx` – Bulk operations (filters: make, model, year; weekly rate updates; CSV)
  - `bookings/page.tsx` – All bookings (filters, actions, stats matching fleet cards)
  - `rentals/active/page.tsx` – Active Rentals (stats, filters, progress, payments)
  - Additional sections (drivers, finances, settings, etc.) scaffolded with role-aware navigation

- `src/app/admin/`
  - `fleet/approval/page.tsx` – Admin vehicle approval flow (sets `is_approved` / `is_active`)

- `src/app/driver/` and public
  - `compare/page.tsx` – Public comparison (filters by PCO categories), backed by `/api/cars/available`

- API
  - `src/app/api/cars/available/route.ts` – Service role endpoint for public inventory

### 6) Styling and UX
- Tailwind CSS, consistent card metrics UI across dashboard, fleet, bookings, rentals
- Quick actions per role; hover/transition polish; responsive grid layouts
- Rich modals for widget detail views

### 7) Data integrity and derived data
- Vehicle categories auto-sync from fleet data into `vehicle_categories` (production-safe defaults)
- Weekly rate normalization: UI displays weekly rates consistently; fetch prioritizes `weekly_rate`, then `price_per_week`, then `daily_rate * 7`
- Dashboard widgets compute analytics from live tables; no mock data remains in core flows

### 8) Migrations and policies
- Supabase migrations under `supabase/migrations/` (with `DROP IF EXISTS` guards for idempotency)
- Example tables/policies: `vehicle_categories` creation with triggers and RLS policies
- Fixes included for duplicate policy/trigger issues when re-running migrations

### 9) Operational runbook
Run locally
```
npm install
npm run dev
# App starts at http(s)://localhost:3000 or 3001 (if 3000 busy)
```

Environment
- Configure `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Linting
```
npm run lint
```

Deploy
- Ensure environment variables present
- Run migrations via Supabase CLI or dashboard prior to deploy
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client

### 10) Known considerations / follow-ups
- Rentals/Active: per-tenant partnerId resolution for PARTNER_STAFF uses `partner_staff` mapping; ensure client has `partnerId` hydrated for staff in `AuthContext` or fetch on first load
- Images: migrate to Next.js `images.remotePatterns` (domains config deprecated)
- Expand server-side APIs for admin analytics (use service role, admin-gated)
- Consider React Query/SWR for caching data fetches, optimistic updates for bulk ops

### 11) Quick route map (key)
- Partner
  - `/partner` – Dashboard
  - `/partner/fleet` – Fleet overview
  - `/partner/fleet/add` – Add vehicle
  - `/partner/fleet/categories` – Categories
  - `/partner/fleet/bulk` – Bulk ops
  - `/partner/bookings` – Bookings (filters, analytics view)
  - `/partner/rentals/active` – Active rentals
- Admin
  - `/admin/fleet/approval` – Vehicle approval
- Public/Driver
  - `/compare` – Vehicle comparison

This document complements `README.md` (setup + business overview) with a system-level map for engineers and operators.

