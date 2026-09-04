# Auktsion v2.0 - Comprehensive Fix Plan

## Executive Summary
Tüm butonların ve özelliklerin çalışmaması sorununu çözmek için bu plan hazırlanmıştır. Kod tabanındaki her bir etkileşimli öğe incelenmiş, çalışmayan/eksik kısımlar tespit edilmiş ve düzeltme adımları öncelik sırasına göre planlanmıştır.

---

## 🔍 Tespit Edilen Sorunlar (Analiz Raporu)

### 1. Header / Dropdown Menü Sorunları
| Sorun | Açıklama | Öncelik |
|-------|----------|---------|
| Kullanıcı menüsü tıklanmıyor | `Dropdown` component'inin `trigger="click"` çalışmıyor, `v-model` binding'i yanlış | 🔴 Critical |
| Menü öğeleri yönlendirme yapmıyor | `RouterLink` wrapper'ı `Dropdown` slot'u içinde çalışmıyor | 🔴 Critical |
| KYC badge güncellenmiyor | `userStore.kycStatus` reactive değil, computed'tan gelmiyor | 🟠 High |
| Çıkış yap butonu çalışmıyor | `handleLogout` fonksiyonu tetiklenmiyor | 🔴 Critical |
| Dil seçici çalışmıyor | `setLocale` çağrılıyor ama UI güncellenmiyor | 🟠 High |
| Tema değiştirici çalışmıyor | `uiStore.toggleTheme()` çağrılıyor ama CSS class eklenmiyor | 🟠 High |
| Arama çubuğu submit etmiyor | `handleSearch` preventDefault yapıyor ama router.push çalışmıyor | 🟡 Medium |

### 2. Dashboard Sekmeleri (8 Sekme) - Hepsi Çalışmıyor
| Sekme | Route | Sorunlar |
|-------|-------|----------|
| Genel Bakış | `/dashboard/overview` | StatCard linkleri tıklanmıyor, ActivityItem link çalışmıyor |
| İlanlarım | `/dashboard/listings` | ListingRow aksiyon butonları (düzenle/sil) çalışmıyor |
| Tekliflerim | `/dashboard/bids` | BidRow detay butonu, filtre tabs çalışmıyor |
| İzleme Listesi | `/dashboard/watchlist` | Boş state butonu `/auctions` yönlendirmiyor |
| Ödemeler | `/dashboard/payments` | PaymentRow detay/kvitans butonları çalışmıyor |
| Para Çekme | `/dashboard/payouts` | Modal açılmıyor, PayoutRow detay çalışmıyor |
| Çekim Yöntemleri | `/dashboard/payout-methods` | Modal açılmıyor, kart silme/default yapma çalışmıyor |
| KYC | `/dashboard/kyc` | Stepper ilerlemiyor, DocumentUpload çalışmıyor, KYC gönder butonu tetiklenmiyor |
| Ayarlar | `/dashboard/settings` | Profil kaydetme, şifre değiştirme modalı, 2FA toggle çalışmıyor |

### 3. Kimlik Doğrulama Akışları
| Özellik | Sorun |
|---------|-------|
| Giriş (Login) | Form submit etmiyor, `userStore.login` çağrılmıyor |
| Kayıt (Register) | Form validation eksik, `userStore.register` çağrılmıyor |
| Çıkış (Logout) | Header ve Sidebar'da `handleLogout` çalışmıyor |
| KYC Gönderim | `userStore.submitKyc()` fonksiyonu yok (store'da `submitKycForReview` var) |
| Şifre Değiştirme | `ChangePasswordModal` açılmıyor, form submit etmiyor |

### 4. Ödeme / Para Çekme Modalları
| Modal | Sorunlar |
|-------|----------|
| `PaymentModal` | MBank/Optima/DemirBank gateway seçimleri çalışmıyor, QR kod üretmiyor |
| `PayoutModal` | Miktar girişi validation eksik, banka seçimi çalışmıyor |
| `AddPayoutMethodModal` | Form validation (IBAN/INN) çalışmıyor, banka listesi statik |
| Para çekme onayı | `userStore.requestPayout` mock dönüyor, toast göstermiyor |

### 5. UI Store / Global State
| Sorun | Açıklama |
|-------|----------|
| Toast sistemi | `uiStore.toastSuccess/Warning/Error/Info` fonksiyonları yok |
| Tema persist | `initTheme` localStorage'dan okumuyor, `toggleTheme` CSS class eklemiyor |
| Loading state | `isLoading` global state'i yok, butonlarda spinner gösterilmiyor |
| Modal yönetimi | Global modal stack yok, nested modal sorunu var |

### 6. Dashboard Sidebar
| Sorun | Açıklama |
|-------|----------|
| Aktif route highlighting | `router.currentRoute.value.path` tam eşleşme yapıyor, `/dashboard/listings` vs `/dashboard` çakışıyor |
| Badge sayıları | `userStore.activeBids?.length` reactive değil |
| Mobile drawer | `mobileSidebarOpen` state'i Header ile senkronize değil |

---

## 🎯 Düzeltme Planı (Öncelik Sırası)

### FAZ 1: Temel Altyapı (Critical - 1. Gün)

#### 1.1 UI Store - Toast & Theme System
**Dosya:** `/d/Auktsion/frontend/src/stores/ui.ts`
- [ ] `toasts` reactive array state'i ekle
- [ ] `toastSuccess`, `toastError`, `toastWarning`, `toastInfo` action'ları
- [ ] `removeToast(id)` action'ı
- [ ] `toggleTheme()` - `document.documentElement.classList` toggle
- [ ] `initTheme()` - localStorage + system preference oku
- [ ] `setLoading(key, value)` - global loading state map'i

#### 1.2 Dropdown Component - Core Fix
**Dosya:** `/d/Auktsion/frontend/src/components/ui/Dropdown.vue`
- [ ] `modelValue` prop'u `defineModel()` ile değiştir (Vue 3.4+)
- [ ] `handleOutsideClick` - trigger element kontrolü düzelt
- [ ] `Teleport` ile body'ye render et (z-index sorunu için)
- [ ] Focus trap için `focus-trap` composable ekle
- [ ] Transition group animasyonları iyileştir

#### 1.3 User Store - Missing Actions
**Dosya:** `/d/Auktsion/frontend/src/stores/user.ts`
- [ ] `submitKyc()` alias → `submitKycForReview()`
- [ ] `changePassword(current, new)` - proper implementation
- [ ] `fetchUser()` - demo user fallback'ini düzelt
- [ ] Reactive computed'lar için `user.value?.kycStatus` sync

---

### FAZ 2: Header Navigation (Critical - 1. Gün)

#### 2.1 Header.vue - User Menu Fix
**Dosya:** `/d/Auktsion/frontend/src/components/layout/Header.vue`
- [ ] `userMenuItems` computed'tan `action` yerine `to`/`handler` pattern kullan
- [ ] `handleUserMenuAction` - `router.push` + `closeUserMenu` garantile
- [ ] KYC badge: `userStore.kycStatus` reactive computed'tan gelmeli
- [ ] Logout butonu: `type="button"` + `@click.prevent="handleLogout"`
- [ ] Dil seçici: `setLocale` + `langMenuOpen = false` aynı tick'te
- [ ] Tema butonu: `uiStore.toggleTheme()` çağrısı
- [ ] Arama: `handleSearch` → `router.push` + input temizleme

#### 2.2 Header.vue - Mobile Menu Sync
- [ ] `mobileMenuOpen` state'i localStorage'a persist et
- [ ] Escape tuşu ile kapatma
- [ ] Body scroll lock (`overflow-hidden`) ekle

---

### FAZ 3: Dashboard Tabs (High - 2. Gün)

#### 3.1 DashboardPage.vue - Tab Navigation
**Dosya:** `/d/Auktsion/frontend/src/pages/DashboardPage.vue`
- [ ] `activeTab` → `defineModel()` veya `ref` + `watch` ile route sync
- [ ] `tabs` computed → route path'e göre aktif tab belirle
- [ ] `router.push('/dashboard/' + tabId)` navigation
- [ ] Her sekme için `v-if` yerine `v-show` (state koruma için)

#### 3.2 DashboardPage.vue - Modal Handlers
- [ ] `showPayoutModal`, `showAddPayoutMethodModal` - proper open/close
- [ ] `onPayoutSuccess` - toast + data refresh
- [ ] `onAddPayoutMethod` - toast + payoutMethods refresh
- [ ] `confirmDeleteProfile` - `showDeleteModal = false` + toast
- [ ] `onPasswordChanged` - `showChangePasswordModal = false` + toast

#### 3.3 DashboardPage.vue - Data Binding
- [ ] `myListings`, `myBids`, `payments`, `payouts`, `payoutMethods` → `userStore`'dan gelmeli (computed)
- [ ] `filteredBids` - `bidTab` watch'li computed
- [ ] `currentKycStep` - `userStore.kycStatus` watch'li computed

#### 3.4 Component Integration
- [ ] `ActivityItem` - `link` prop'u `RouterLink` ile render et
- [ ] `ListingRow` - `@edit`, `@delete` emit handler'ları
- [ ] `BidRow` - `@click` → auction detail sayfası
- [ ] `PaymentRow` - `@download`, `@view` handlers
- [ ] `PayoutRow` - `@view` handler
- [ ] `PayoutMethodCard` - `@set-default`, `@remove` handlers
- [ ] `DocumentUpload` - `@uploaded`, `@removed` emit'leri

---

### FAZ 4: Authentication & KYC (High - 2. Gün)

#### 4.1 LoginPage.vue
**Dosya:** `/d/Auktsion/frontend/src/pages/LoginPage.vue`
- [ ] Form `@submit.prevent="handleLogin"`
- [ ] `handleLogin` → `userStore.login(email, password)`
- [ ] Loading state: `userStore.isLoading` binding
- [ ] Hata toast: `uiStore.toastError`
- [ ] Başarılı → `router.push(redirect || '/dashboard')`
- [ ] "Beni hatırla" → localStorage token persist

#### 4.2 RegisterPage.vue
**Dosya:** `/d/Auktsion/frontend/src/pages/RegisterPage.vue`
- [ ] Form validation (required, email format, phone format, password min 8)
- [ ] `handleRegister` → `userStore.register(data)`
- [ ] KYC başlangıç durumu: `phone_verified`
- [ ] Başarılı → `router.push('/dashboard/kyc')`

#### 4.3 KYC Flow (DashboardPage.vue kyc tab)
- [ ] `Stepper` component - `modelValue` v-model binding
- [ ] `DocumentUpload` - file input + preview + remove
- [ ] `submitKyc` → `userStore.submitKycForReview()` + toast
- [ ] KYC status badge: `userStore.kycStatus` computed

#### 4.4 Settings Tab
- [ ] Profil formu: `userStore.updateProfile(profileForm)`
- [ ] Şifre değiştirme: `showChangePasswordModal = true`
- [ ] `ChangePasswordModal` - `@confirm="handlePasswordChange"`
- [ ] 2FA toggle: localStorage + backend sync (mock)

---

### FAZ 5: Payment / Payout Modals (Medium - 3. Gün)

#### 5.1 PaymentModal.vue
**Dosya:** `/d/Auktsion/frontend/src/components/payment/PaymentModal.vue`
- [ ] Gateway seçimi: MBank / Optima / DemirBank radio group
- [ ] MBank: QR kod üretimi (mock API call)
- [ ] Optima: 3D Secure iframe (mock)
- [ ] DemirBank: Escrow hesabı seçimi
- [ ] `@success` emit → toast + close

#### 5.2 PayoutModal.vue
**Dosya:** `/d/Auktsion/frontend/src/components/payment/PayoutModal.vue`
- [ ] Miktar girişi: number input + KGS format
- [ ] Bakiye kontrolü: `userStore.user?.balance`
- [ ] Yöntem seçimi: `userStore.payoutMethods` radio
- [ ] `@confirm` → `userStore.requestPayout(amount, methodId)`

#### 5.3 AddPayoutMethodModal.vue
**Dosya:** `/d/Auktsion/frontend/src/components/payment/AddPayoutMethodModal.vue`
- [ ] Banka seçimi: MBank / Optima / DemirBank select
- [ ] IBAN/PAN input: mask + validation (Luhn for card, IBAN regex)
- [ ] INN input: 14 haneli sayı validation
- [ ] `@success` → `userStore.addPayoutMethod(data)`

---

### FAZ 6: Dashboard Sidebar & Polish (Medium - 3. Gün)

#### 6.1 DashboardSidebar.vue
- [ ] Route matching: `startsWith` ile prefix match (`/dashboard/listings` matches `/dashboard`)
- [ ] Badge'ler: `userStore.activeBids.length` computed
- [ ] Mobile overlay: `Teleport` to body
- [ ] Collapse state: localStorage persist

#### 6.2 Global Polish
- [ ] Tüm butonlar: `disabled` state + `Spinner` loading
- [ ] Form input'lar: `@keydown.enter.prevent` + `@submit.prevent`
- [ ] RouterLink'ler: `active-class` doğru çalışmalı
- [ ] Toast konumu: top-right, stack limit 5
- [ ] Keyboard navigation: Tab, Escape, Enter support

---

## 📋 Dosya Değişiklik Özeti

| Dosya | Faz | Değişiklik Türü |
|-------|-----|-----------------|
| `src/stores/ui.ts` | 1 | **Yeniden yazım** - Toast, Theme, Loading sistemi |
| `src/stores/user.ts` | 1 | **Genişletme** - submitKyc alias, changePassword, fetchUser fix |
| `src/components/ui/Dropdown.vue` | 1 | **Yeniden yazım** - defineModel, Teleport, focus trap |
| `src/components/layout/Header.vue` | 2 | **Düzeltme** - User menu, lang, theme, search handlers |
| `src/pages/DashboardPage.vue` | 3 | **Büyük refactor** - Tab sync, modal handlers, data binding |
| `src/pages/LoginPage.vue` | 4 | **Düzeltme** - Form submit, validation, toast |
| `src/pages/RegisterPage.vue` | 4 | **Düzeltme** - Form submit, validation, KYC redirect |
| `src/components/payment/PaymentModal.vue` | 5 | **Düzeltme** - Gateway selection, QR, 3DS mock |
| `src/components/payment/PayoutModal.vue` | 5 | **Düzeltme** - Amount validation, method selection |
| `src/components/payment/AddPayoutMethodModal.vue` | 5 | **Düzeltme** - Form validation, bank selection |
| `src/components/layout/DashboardSidebar.vue` | 6 | **Düzeltme** - Route matching, badge, mobile sync |
| `src/components/dashboard/ActivityItem.vue` | 3 | **Düzeltme** - Link rendering, icon mapping |
| `src/components/dashboard/DocumentUpload.vue` | 3 | **Düzeltme** - File upload, preview, remove emit |
| `src/components/auction/BidRow.vue` | 3 | **Düzeltme** - Click handler, status badge |
| `src/components/auction/ListingRow.vue` | 3 | **Düzeltme** - Action emits (edit, delete) |

---

## ✅ Test Kriterleri (Definition of Done)

### Header
- [ ] Kullanıcı menüsü tıklayınca açılır/kapanır
- [ ] Menüdeki her link tıklanınca sayfa yönlendirir VE menü kapanır
- [ ] Çıkış yap butonu çalışır, login sayfasına yönlendirir
- [ ] Dil değiştirme anında UI güncellenir
- [ ] Tema değiştirme anında dark/light toggle olur
- [ ] Arama yapınca `/auctions?search=...` yönlendirir

### Dashboard
- [ ] 8 sekme tıklanınca içerik değişir, URL güncellenir
- [ ] Genel bakış: StatCard linkleri ilgili sekmeye gider
- [ ] İlanlarım: Düzenle/Sil butonları modal açar/emit eder
- [ ] Tekliflerim: Filtre tabs (Aktif/Kazandım/Geçildim/Kaybettim) çalışır
- [ ] Ödemeler: Kvitans indir butonu çalışır
- [ ] Para Çekme: Modal açılır, miktar girilir, onaylanır → toast
- [ ] Çekim Yöntemleri: Yeni ekle modalı, sil/default butonları çalışır
- [ ] KYC: Stepper ilerler, dosya yüklenir, gönder butonu çalışır
- [ ] Ayarlar: Profil kaydedilir, şifre değiştirme modalı açılır/kapanır

### Auth
- [ ] Login: Geçerli creds ile giriş → dashboard
- [ ] Register: Geçerli data ile kayıt → KYC sayfası
- [ ] Logout: Her yerden çalışır → home

### Payment
- [ ] PaymentModal: Gateway seç → mock ödeme → başarı toast
- [ ] PayoutModal: Miktar gir → yöntem seç → onayla → başarı toast
- [ ] AddPayoutMethod: Form doldur → ekle → listeye düşer

---

## ⏱️ Tahmini Süre
| Faz | Süre |
|-----|------|
| Faz 1: Altyapı | 4-6 saat |
| Faz 2: Header | 2-3 saat |
| Faz 3: Dashboard | 6-8 saat |
| Faz 4: Auth/KYC | 3-4 saat |
| Faz 5: Payment | 3-4 saat |
| Faz 6: Polish | 2-3 saat |
| **Toplam** | **20-28 saat** |

---

## 🚀 Başlangıç Noktası
**Öneri:** `src/stores/ui.ts` toast/theme sistemi ile başlayın çünkü tüm diğer bileşenler buna bağımlı.

---

*Plan hazırlanma tarihi: 2026-08-16*
*Proje: Auktsion v2.0 - Kyrgyzstan Real-Time Auction Platform*