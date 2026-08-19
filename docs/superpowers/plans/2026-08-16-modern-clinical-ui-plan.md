# Modern Clinical SaaS UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the entire CPPT Maker web application to a modern, professional, accessible, and high-performance Clinical SaaS interface adhering to the `better-*` design engineering principles.

**Architecture:** We establish a design token foundation (Plus Jakarta Sans, medical slate-cyan color palette, concentric radii, tabular numerics), upgrade shared UI primitives (`button`, `card`, `input`, `textarea`, `table`, `dialog`, `alert`), and refactor all five application pages (`Login`, `Dashboard`, `PatientDetail`, `NewCPPT`, `Settings`) along with the global navigation and app shell.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v3.4, Radix UI primitives, Lucide React, Supabase JS, Google Generative AI SDK.

## Global Constraints
- Typography: Plus Jakarta Sans for UI, `tabular-nums` for clinical and numerical values, mobile inputs minimum 16px to prevent iOS auto-zoom.
- Color Tokens: High contrast (WCAG AA), distinct semantic color coding for SOAP sections (S: Sky, O: Emerald, A: Amber, P: Indigo).
- Micro-interactions: `active:scale-[0.98]` tactile press on interactive buttons, concentric radii, transparent layered box-shadows.
- Language & UX Writing: Professional, concise, respectful Indonesian clinical terminology.
- Accessibility: Focus-visible rings (`focus-visible:ring-2`), semantic landmarks (`<header>`, `<main>`, `<nav>`), accessible names on icon buttons.

---

### Task 1: Design System & Shared UI Primitives Foundation

**Files:**
- Modify: `index.html`
- Modify: `src/index.css`
- Modify: `tailwind.config.js`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/textarea.tsx`
- Modify: `src/components/ui/table.tsx`
- Modify: `src/components/ui/dialog.tsx`
- Modify: `src/components/ui/alert.tsx`

**Interfaces:**
- Consumes: Tailwind CSS config and Google Fonts.
- Produces: Enhanced UI components with tactile states, concentric radii, accessible focus indicators, and semantic SOAP classes.

- [ ] **Step 1: Update `index.html` with Google Font (Plus Jakarta Sans) and metadata**
  Load `Plus Jakarta Sans` font weights (400, 500, 600, 700) and set `<html lang="id">` and `<title>CPPT Maker - Sistem SOAP Apoteker Klinis</title>`.

- [ ] **Step 2: Update `src/index.css` with refined HSL palette and typography rules**
  Add root font family, antialiasing smoothing, custom scrollbars, and accessible focus ring tokens.

- [ ] **Step 3: Update `tailwind.config.js` with font family and keyframe tokens**
  Wire `fontFamily.sans` to `['"Plus Jakarta Sans"', 'system-ui', 'sans-serif']` and extend border-radius / colors.

- [ ] **Step 4: Update UI Primitives (`button`, `card`, `input`, `textarea`, `table`, `dialog`, `alert`)**
  Ensure button variants have `active:scale-[0.98]`, inputs have `text-base sm:text-sm`, cards have subtle border/shadow elevation, table rows have smooth hover transitions, and dialogs have backdrop blur.

- [ ] **Step 5: Verify build & TypeScript check**
  Run: `npm run build`
  Expected: PASS with 0 errors.

---

### Task 2: Modern Global Navigation & App Shell

**Files:**
- Modify: `src/components/Navigation.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useAuth` hook, Supabase auth signOut.
- Produces: Semantic `<header>` navigation bar with logo badge, active path indicators, pharmacist status pill, and responsive layout.

- [ ] **Step 1: Rewrite `Navigation.tsx`**
  Add brand logo (capsule/stethoscope icon + "CPPT Maker" + "Apoteker Klinis" badge), active nav links (Dashboard, Settings) with icons, and user email badge with sign out button.

- [ ] **Step 2: Update `App.tsx` layout shell**
  Wrap protected pages in a semantic `<main className="min-h-[calc(100vh-4rem)] bg-slate-50/50 dark:bg-slate-950">` wrapper.

- [ ] **Step 3: Verify build**
  Run: `npm run build`
  Expected: PASS.

---

### Task 3: Auth & Login Page Transformation

**Files:**
- Modify: `src/pages/Login.tsx`

**Interfaces:**
- Consumes: Supabase auth signIn / signUp.
- Produces: Professional auth screen with medical branding, tab toggle (Masuk / Daftar), loading spinners, and clear validation messages.

- [ ] **Step 1: Refactor `Login.tsx`**
  Implement card with medical shield badge, tab toggle for "Masuk" / "Daftar", password visibility toggle, accessible input labels, and alert notifications.

- [ ] **Step 2: Verify build**
  Run: `npm run build`
  Expected: PASS.

---

### Task 4: Dashboard Page Transformation

**Files:**
- Modify: `src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: Supabase `patients` & `patient_handlers` queries.
- Produces: Hero section, 3 metric overview cards, real-time search/filter bar, modern patient table with avatar initials, RM badges, and safe discharge modal.

- [ ] **Step 1: Refactor `Dashboard.tsx`**
  - Add Header with greeting, subtitle, and `+ Tambah Pasien` modal.
  - Add 3 Stat Cards (Total Pasien Aktif, Pasien Baru Hari Ini, Total CPPT).
  - Add instant search filter by Patient Name or No. RM.
  - Implement modern table rows with avatar badge, tabular No. RM badge, and actions (Detail CPPT & Pulangkan Pasien with safe confirmation modal).
  - Add rich empty state for no patients found / no search results.

- [ ] **Step 2: Verify build**
  Run: `npm run build`
  Expected: PASS.

---

### Task 5: Patient Detail & SOAP History Page Transformation

**Files:**
- Modify: `src/pages/PatientDetail.tsx`

**Interfaces:**
- Consumes: `patients` and `cppt_records` data for patient ID.
- Produces: Patient hero profile card, chronological SOAP timeline with color-coded S (Sky), O (Emerald), A (Amber), P (Indigo) blocks, and scientific reference cards.

- [ ] **Step 1: Refactor `PatientDetail.tsx`**
  - Add breadcrumb back button (`← Kembali ke Dashboard`).
  - Add Patient Profile Hero card with patient name, RM number, admission date badge, and `+ Buat CPPT Baru` primary action.
  - Add SOAP timeline entries with distinct color-coded cards for Subjektif, Objektif, Assessment, and Plan.
  - Add formatted scientific references with direct external link & DOI badges.
  - Add empty state for patients with no CPPT records yet.

- [ ] **Step 2: Verify build**
  Run: `npm run build`
  Expected: PASS.

---

### Task 6: New CPPT Studio & PCNE AI Generator Transformation

**Files:**
- Modify: `src/pages/NewCPPT.tsx`

**Interfaces:**
- Consumes: Gemini API (`@google/generative-ai`), Supabase insert, previous CPPT record context.
- Produces: Ergonomic 2-column studio layout, quick 1-click `Salin` clipboard action, animated AI generation state, and scientific reference preview.

- [ ] **Step 1: Refactor `NewCPPT.tsx`**
  - Implement 2-column desktop grid / responsive mobile stack.
  - Left column: Date picker, Subjektif (S) textarea, Objektif (O) textarea, context info banner (Day-1 vs continuing care), and prominent `✨ Generate Analisis PCNE dengan AI` button with interactive loading spinner.
  - Right column: Assessment (A) editor with 1-click `Salin` action, Plan (P) editor with 1-click `Salin` action, and dynamic Scientific References card.
  - Action footer: `Kembali` and `Simpan Catatan CPPT`.

- [ ] **Step 2: Verify build**
  Run: `npm run build`
  Expected: PASS.

---

### Task 7: Settings & BYOK Page Transformation

**Files:**
- Modify: `src/pages/Settings.tsx`

**Interfaces:**
- Consumes: `aiConfig.ts` (`getApiKey`, `setApiKey`), Google Generative AI test call.
- Produces: Settings card with show/hide password toggle for API key, live test connection with visual status badge, and setup instructions.

- [ ] **Step 1: Refactor `Settings.tsx`**
  - Add show/hide password toggle for Gemini API key input.
  - Enhance `Uji Koneksi` with real-time visual status indicator (Success / Failure).
  - Add helpful info box on obtaining a free Gemini API key from Google AI Studio.

- [ ] **Step 2: Verify build**
  Run: `npm run build`
  Expected: PASS.

---

### Task 8: Cross-Discipline Quality & Accessibility Verification (`better-interface`)

**Files:**
- Verify all touched files and components.

**Checks:**
- Build check: `npm run build`
- Lint check: `npm run lint`
- Verification against `better-ui`, `better-colors`, `better-layout`, `better-writing`, `better-typography`, `better-accessibility`.

- [ ] **Step 1: Run build & linter**
  Run: `npm run build && npm run lint`
  Expected: Clean build without errors or warnings.

- [ ] **Step 2: Document walkthrough and design improvements**
  Create `walkthrough.md` artifact summarizing all UI/UX transformations.
