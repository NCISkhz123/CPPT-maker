# Modern Clinical SaaS UI Redesign - Specification

## 1. Overview & Objectives
Transform the CPPT Maker (Clinical Pharmacist SOAP & PCNE System) into a premium, modern, intuitive, and accessible web application designed specifically for clinical pharmacists and healthcare practitioners. The redesign follows the multidisciplinary design engineering standards across typography, colors, layout, UX writing, accessibility, and micro-interactions.

---

## 2. Design System Foundations

### 2.1 Typography (`better-typography`)
- **Primary Typeface**: Plus Jakarta Sans (Google Fonts) with fallback to system UI sans-serif.
- **Tabular Numerics**: `tabular-nums` applied to clinical values, dates, medical record numbers (No. RM), and counter statistics to eliminate layout shifts.
- **Scale & Hierarchy**:
  - Page Titles: `text-2xl` to `text-3xl font-bold tracking-tight` (line-height `1.2`, `text-wrap: balance`).
  - Section Headings: `text-lg` to `text-xl font-semibold` (line-height `1.3`).
  - Body & Form Controls: `text-sm` to `text-base` (line-height `1.5–1.6`, `text-wrap: pretty`).
  - Captions & Meta Badges: `text-xs font-medium`.
- **Mobile Input Optimization**: Minimum `16px` (`text-base sm:text-sm`) on mobile inputs to prevent iOS Safari auto-zoom.
- **Root Smoothing**: `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`.

### 2.2 Color Architecture (`better-colors`)
- **Canvas & Surface Ramps**:
  - Light mode: Canvas `bg-slate-50/60`, elevated surface `bg-white`, border `border-slate-200/80`.
  - Dark mode: Canvas `bg-slate-950`, elevated surface `bg-slate-900`, border `border-slate-800`.
- **Brand / Accent**: Medical Slate Cyan (`#0284c7` / `#0ea5e9`), providing clean clinical authority.
- **Semantic SOAP Visual Coding**:
  - **S (Subjective)**: Light Sky (`bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/50`)
  - **O (Objective)**: Clean Emerald (`bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50`)
  - **A (Assessment)**: Warm Amber (`bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50`)
  - **P (Plan)**: Modern Indigo (`bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/50`)
- **Contrast**: Full compliance with WCAG 2.1 AA (minimum 4.5:1 for normal text, 3:1 for large text and UI components).

### 2.3 Visual Polish & Micro-Interactions (`better-ui`)
- **Concentric Radii**: Shell containers `rounded-2xl` (16px), inner cards `rounded-xl` (12px), interactive buttons/inputs `rounded-lg` (8px).
- **Tactile Response**: Buttons feature `active:scale-[0.98]` tactile press and crisp hover transitions.
- **Layered Elevation**: Subtle shadows `shadow-sm` for cards, `shadow-md` for modals/dropdowns.
- **Icon Alignment**: Lucide icons matched to text stroke weight (`stroke-[1.75]` or `stroke-2`) with optical alignment.

---

## 3. Structural & Page Design

### 3.1 Global Shell & Navigation (`Navigation.tsx`, `App.tsx`)
- App branding: Medical pill/cross icon with "CPPT Maker" and subtitle "Apoteker Klinis".
- Navigation links with active route indicators (pill badge + icon).
- Pharmacist status indicator and accessible logout button with icon.
- Full viewport responsiveness with mobile-friendly top bar.

### 3.2 Authentication (`Login.tsx`)
- Centered auth card with healthcare shield/pill badge.
- Tab-based or unified toggle between "Masuk" (Sign In) and "Daftar" (Sign Up).
- Clear validation messages with alert icons.

### 3.3 Dashboard (`Dashboard.tsx`)
- Header hero with pharmacist greeting and `+ Tambah Pasien` action modal.
- Metric Stat Cards:
  - Total Pasien Aktif
  - Pasien Masuk Hari Ini
  - Total Rekam CPPT
- Real-time instant search bar (filter by patient name or No. RM).
- Patient Data Table / Card list:
  - Patient Name with avatar initials.
  - Tabular No. RM badge.
  - Admission date indicator.
  - Direct action: `Detail CPPT` (primary outline/ghost) and `Pulangkan` (destructive with confirm dialog).
- Rich empty state when no active patients are found or search yields no results.

### 3.4 Patient Detail (`PatientDetail.tsx`)
- Breadcrumb navigation (`← Kembali ke Dashboard`).
- Patient Profile Card: Patient Name, No. RM badge, Admission Date, and `+ Buat CPPT Baru` trigger.
- CPPT History Timeline:
  - Chronological cards with formatted date badge.
  - Distinct colored SOAP blocks (S, O, A, P) for rapid visual scanning.
  - Scientific References card displaying DOI / clinical guideline links with distinct clickable badges.
- Empty state if patient has no CPPT notes yet.

### 3.5 New CPPT Form (`NewCPPT.tsx`)
- Ergonomic 2-Column Desktop Layout:
  - **Left Column**: Date picker, Subjective textarea, Objective textarea, and the primary `✨ Generate Analisis PCNE dengan AI` button with interactive loading spinner.
  - **Right Column**: Assessment textarea, Plan textarea (each with quick 1-click `Salin` clipboard action), and dynamic Scientific References preview.
- Contextual Alert: Displays whether patient is in Day-1 care or continuing care from previous notes.
- Action footer: `Kembali` and `Simpan Catatan CPPT`.

### 3.6 Settings & BYOK (`Settings.tsx`)
- API Key management for Google Gemini with show/hide password toggle.
- `Uji Koneksi` (Test Connection) action with clear live feedback status badge.
- Helpful guidance callout on obtaining a free Google AI Studio API Key.

---

## 4. UX Writing & Microcopy (`better-writing`)
- Consistent Bahasa Indonesia clinical terminology.
- Verb-first interactive labels: "Simpan Catatan CPPT", "Generate Analisis PCNE", "Pulangkan Pasien", "Uji Koneksi".
- Positive, helpful error messages and actionable empty states.

---

## 5. Accessibility & Inclusivity (`better-accessibility`)
- Explicit `:focus-visible` styling (`focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2`).
- Accessible names (`aria-label`) on all icon-only buttons (copy, close, navigation).
- Native semantic HTML (`<main>`, `<nav>`, `<header>`, `<article>`, `<time>`).
- Live regions (`role="status"`) for AI generation feedback and toast notifications.
- Complete keyboard navigability across modals, inputs, and tables.
