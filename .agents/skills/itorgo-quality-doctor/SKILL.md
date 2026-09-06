---
name: itorgo-quality-doctor
description: >-
  Audits, detects, and automatically fixes recurring quality issues in the ITOrgo / Auktsion platform.
  Activate this skill when the user asks to check, inspect, audit, test, or fix issues across the site,
  including: i18n multilingual parity (RU primary, KY secondary, TR tertiary), mobile horizontal overflow,
  mock data leaks vs real SQLite listings, and modal close / event contracts.
---

# ITOrgo Quality Doctor & Regression Auditor

This skill provides an automated regression prevention and quality auditing system tailored specifically for the **ITOrgo / Auktsion** platform. It was synthesized directly from the critical issues encountered between September 1 and September 6, 2026.

Whenever the user asks:
- *"Sitedeki eksikleri / hataları tespit et ve düzelt"*
- *"Genel bir tarama / kontrol yap"*
- *"Dil / mobil / ilan problemlerini kontrol et"*
- *"Bu skill'i çalıştır ve kontrolleri yap"*

Follow the workflow outlined below.

---

## 🚀 Quick Execution: Automated Audits

Run the master audit suite from the repository root:

```bash
node .agents/skills/itorgo-quality-doctor/scripts/run_full_audit.js
```

Or execute individual specialized audit scripts:

1. **Check Multilingual Key Parity (RU / KY / TR):**
   ```bash
   node .agents/skills/itorgo-quality-doctor/scripts/check_i18n_parity.js
   ```
2. **Auto-Fix Missing Locale Keys (Sync RU -> KY & TR):**
   ```bash
   node .agents/skills/itorgo-quality-doctor/scripts/fix_i18n_parity.js
   ```
3. **Audit Mobile Horizontal Overflows & Unconstrained Widths:**
   ```bash
   node .agents/skills/itorgo-quality-doctor/scripts/check_mobile_overflow.js
   ```
4. **Audit Real SQLite Database Integrity (No Mock Leaks):**
   ```bash
   node .agents/skills/itorgo-quality-doctor/scripts/check_data_integrity.js
   ```
5. **Audit Modal Close & `v-model` Event Contracts:**
   ```bash
   node .agents/skills/itorgo-quality-doctor/scripts/check_modal_contracts.js
   ```

---

## 📋 The 4 Pillars of Platform Quality

### Pillar 1: Multilingual Consistency (i18n)
- **Baseline Language:** Russian (`ru.ts`) is primary. Kyrgyz (`ky.ts`) is secondary. Turkish (`tr.ts`) is tertiary.
- **Rule 1:** Every single translation key in `ru.ts` must exist in both `ky.ts` and `tr.ts`. Never deploy if key counts differ.
- **Rule 2:** Never hardcode Turkish, English, or Russian strings directly in Vue templates. Always wrap user-facing text with `t('namespace.key')`.
- **Rule 3:** If keys are missing, run `fix_i18n_parity.js` to backfill missing keys automatically.

### Pillar 2: Mobile Viewport & Touch Stability (Zero Horizontal Scroll)
- **Root Container Rule:** Every page root container must have `overflow-x-clip` or `overflow-x-hidden`, and `w-full max-w-full`.
- **Constraint Rule:** Never use fixed pixel widths (e.g., `w-[600px]`) without `max-w-full`, responsive prefixes (`lg:w-[600px]`), or an enclosing `overflow-hidden` container.
- **Table Rule:** Wide horizontal comparison tables must be wrapped in `<div class="overflow-x-auto">` with `-mx-4 px-4 sm:mx-0`.

### Pillar 3: Data Integrity & Real Database Listings
- **Zero Mock Rule:** Never import or fall back to `mockAuctions.ts` in production storefront pages (`LandingPage.vue`, `LiveAuctionsPage.vue`, `CategoryPage.vue`, etc.).
- **Empty State Rule:** If the database returns 0 active auctions, always render the styled empty state component (`emptyState` namespace), never fall back to fake mock auctions.
- **Seller Listings Rule:** In `DashboardPage.vue`, verify that seller auctions are fetched from `/api/auctions?sellerId=...` and displayed in the seller's listings tab.

### Pillar 4: Modal & Event Binding Contracts
- **Two-Way Binding Contract:** Whenever creating or updating a Modal component:
  - It must accept `modelValue: boolean` (or `isOpen`).
  - When closing, it must emit BOTH `emit('update:modelValue', false)` AND `emit('close')`.
  - The parent component must listen via `v-model="..."` and/or `@close="..."`.
- **Backdrop & Escape:** Modals must close on backdrop click and on `Escape` key press.

---

## 🛠️ Step-by-Step Fix Protocol

When an audit detects an anomaly:

1. **If i18n keys are missing:**
   - Run `node .agents/skills/itorgo-quality-doctor/scripts/fix_i18n_parity.js`.
   - Open `frontend/src/locales/ky.ts` and `tr.ts` to refine the localized translations.
2. **If a mobile layout warning appears:**
   - Locate the offending `.vue` file.
   - Replace unconstrained `w-[...px]` with `w-full max-w-[...px]` or add `overflow-x-auto` to the parent container.
3. **If mock data leaks are found:**
   - Remove the `mockAuctions` import from the page/component.
   - Connect the component directly to `auctionStore.fetchLiveAuctions()` or `auctionStore.auctions`.
4. **If a modal button fails to close:**
   - Check the modal component's `@click` handlers and ensure `emit('update:modelValue', false)` is fired.
5. **Verify All Builds:**
   - Run `npm --prefix server run build`
   - Run `npm --prefix admin run build`
   - Run `npm --prefix frontend run build`
