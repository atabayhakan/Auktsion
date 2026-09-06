# Historical Issue Log & Playbook (Sept 1 – Sept 6, 2026)

This document catalogs the 23 real-world defects encountered in production, their root causes, and how to permanently prevent them.

---

### Issue 1: Header & Navigation Bar Overflow on Russian Locale
- **Symptom:** Switching language to Russian caused the navigation items and search bar to overflow off the right edge of the screen.
- **Root Cause:** Russian translations are on average 30-40% longer than Turkish or English words (e.g., "Açık Artırmalar" -> "Прямые аукционы"). A fixed-width search bar `w-72` squeezed navigation items off-screen.
- **Solution:** Converted search bar to `flex-1 max-w-md min-w-[180px]`, compacted link padding, and applied `overflow-x-clip` to the header wrapper.

### Issue 2: Turkish / English Leakage in Multilingual Mode
- **Symptom:** Russian locale selected, but Turkish labels showed in footer, dashboard settings, or live auction cards.
- **Root Cause:** Hardcoded strings in templates and missing keys in `ru.ts` / `ky.ts` causing fallback to default locale or untranslated template strings.
- **Solution:** Standardized on Russian as primary locale, created `check_i18n_parity.js` to ensure 100% key parity across all 3 locale files.

### Issue 3: Missing Toast / Action Feedback on Profile Update
- **Symptom:** Admin changed profile name/phone and clicked Save; database updated but no confirmation toast appeared.
- **Root Cause:** `ToastContainer.vue` was not mounted at the root `App.vue` level.
- **Solution:** Mounted `<ToastContainer />` globally in `App.vue` and ensured all store actions trigger `uiStore.showToast(...)`.

### Issue 4: Mobile Horizontal Swipe / Overflow Jitter
- **Symptom:** Mobile user swiping up/down accidentally scrolled the page horizontally left and right.
- **Root Cause:** Unconstrained pill bar containers, wide grid items without `min-w-0`, and missing `overflow-x: clip` on `LandingPage.vue`.
- **Solution:** Added `overflow-x: clip` on page roots, constrained pills with `max-w-full`, and set `touch-action: pan-y` where appropriate.

### Issue 5: Upload 413 Payload Too Large
- **Symptom:** High-resolution product photos failed to upload when submitting an auction.
- **Root Cause:** Nginx `client_max_body_size` was 1M, and Express `body-parser` JSON limit was default (100kb).
- **Solution:** Increased Nginx limit to `50M` and Express limits to `express.json({ limit: '50mb' })` and `express.urlencoded({ limit: '50mb' })`.

### Issue 6: Payment Modal Close Button Inoperative
- **Symptom:** Clicking the "X" button on `PaymentModal.vue` did nothing; modal remained open.
- **Root Cause:** The modal's X button emitted `close`, while the caller was bound to `v-model` (`update:modelValue`).
- **Solution:** Modal components must always emit BOTH `update:modelValue` AND `close`.

### Issue 7: Inoperative Dispute / Complaint Modal
- **Symptom:** Buyer and seller dispute button didn't open modal or submit evidence to backend.
- **Root Cause:** Missing `DisputeModal.vue` integration in `DashboardPage.vue` and missing dispute routes on backend.
- **Solution:** Fully implemented `DisputeModal.vue`, added 8th dispute tab in dashboard, and connected to admin review panel.
