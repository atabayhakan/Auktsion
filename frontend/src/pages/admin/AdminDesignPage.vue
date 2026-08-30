<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Palette,
  Sparkles,
  Image as ImageIcon,
  Type,
  Square,
  Layers,
  Check,
  RotateCcw,
  Upload,
  Save,
  Eye,
  Smartphone,
  Tablet,
  Monitor,
  Flame,
  Radio,
  Sliders,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  Gavel,
  Clock,
  User,
  Heart
} from 'lucide-vue-next'
import { useThemeStore } from '@/stores/theme'
import { useUIStore } from '@/stores/ui'
import IlbirsIcon from '@/components/icons/IlbirsIcon.vue'
import type { ThemeSettings } from '@/types/admin'

const themeStore = useThemeStore()
const uiStore = useUIStore()

const activeTab = ref<'presets' | 'logo' | 'colors' | 'buttons' | 'typography' | 'cards'>('presets')
const previewDevice = ref<'desktop' | 'tablet' | 'mobile'>('desktop')

onMounted(async () => {
  await themeStore.initTheme()
})

const currentTheme = computed(() => themeStore.theme)
const isDirty = computed(() => themeStore.isDirty)
const presets = computed(() => themeStore.presets)

const fontOptions = [
  { id: 'Poppins', name: 'Poppins', preview: 'Modern & Dinamik (Varsayılan)' },
  { id: 'Inter', name: 'Inter', preview: 'Temiz, Net & Kurumsal' },
  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans', preview: 'Lüks Fintech & Teknoloji' },
  { id: 'Montserrat', name: 'Montserrat', preview: 'Güçlü & Prestijli Başlıklar' },
  { id: 'Rubik', name: 'Rubik', preview: 'Yumuşak & Ergonomik' },
]

const buttonRadiusOptions = [
  { id: '0px', label: 'Keskin (0px)', desc: 'Modern & Dik' },
  { id: '6px', label: 'Hafif (6px)', desc: 'Kompakt' },
  { id: '10px', label: 'Klasik (10px)', desc: 'Dengeli Apple Stili' },
  { id: '16px', label: 'Yumuşak (16px)', desc: 'Geniş Kavis' },
  { id: '9999px', label: 'Kapsül / Pill', desc: 'Tam Yuvarlak' },
]

const cardRadiusOptions = [
  { id: '8px', label: 'Kompakt (8px)' },
  { id: '16px', label: 'Standart (16px)' },
  { id: '24px', label: 'Lüks Kavis (24px)' },
]

const glassBlurOptions = [
  { id: 'none', label: 'Mat / Blur Yok' },
  { id: '10px', label: 'Hafif Cam (10px)' },
  { id: '20px', label: 'Standart Cam (20px)' },
  { id: '40px', label: 'Derin Buzlu Cam (40px)' },
]

const logoBadgeShapeOptions = [
  { id: 'rounded', label: 'Yuvarlak Köşe' },
  { id: 'circle', label: 'Tam Daire' },
  { id: 'square', label: 'Keskin Kare' },
  { id: 'transparent', label: 'Şeffaf' },
]

function handleColorChange(key: keyof ThemeSettings, val: string) {
  themeStore.setLivePreview({ [key]: val })
}

function handlePresetSelect(key: string) {
  themeStore.applyPreset(key)
  uiStore.toastSuccess('Tema Seçildi', `"${presets.value[key]?.name || key}" teması uygulandı`)
}

async function handlePublish() {
  try {
    const res = await themeStore.publishTheme()
    uiStore.toastSuccess('Yayınlandı', 'Tasarım değişiklikleri tüm sitede anında canlıya alındı!')
  } catch (err: any) {
    uiStore.toastError('Kayıt Hatası', err.message || 'Tema kaydedilemedi')
  }
}

function handleResetDefaults() {
  if (confirm('Tüm tasarım ayarlarını orijinal iTorgo varsayılanlarına sıfırlamak istediğinize emin misiniz?')) {
    themeStore.resetToDefault()
    uiStore.toastSuccess('Sıfırlandı', 'Varsayılan tema yüklendi')
  }
}

function handleRevert() {
  themeStore.revertPreview()
  uiStore.toastSuccess('Geri Alındı', 'Yayınlanmış son tasarıma dönüldü')
}
</script>

<template>
  <div class="space-y-6 max-w-7xl pb-20">
    <!-- Page Header & Action Bar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-border shadow-xs">
      <div>
        <h1 class="text-2xl font-black text-text-primary tracking-tight flex items-center gap-2.5">
          <Palette class="w-6 h-6 text-primary" />
          <span>Site Tasarım & Canlı Tema Stüdyosu</span>
        </h1>
        <p class="text-xs text-text-secondary mt-1">
          Sitenin logosu, renkleri, butonları, tipografisi ve kart tasarımlarını canlı simülatör eşliğinde yönetin
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2">
        <button
          v-if="isDirty"
          type="button"
          class="px-3.5 py-2 rounded-xl text-xs font-bold text-text-secondary bg-white hover:bg-black/5 border border-border flex items-center gap-1.5 transition-all"
          @click="handleRevert"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span>Geri Al</span>
        </button>

        <button
          type="button"
          class="px-3.5 py-2 rounded-xl text-xs font-bold text-text-secondary bg-white hover:bg-black/5 border border-border flex items-center gap-1.5 transition-all"
          @click="handleResetDefaults"
        >
          <Sliders class="w-3.5 h-3.5" />
          <span>Varsayılana Sıfırla</span>
        </button>

        <button
          type="button"
          :disabled="themeStore.isSaving"
          class="px-5 py-2 rounded-xl text-xs font-bold text-text-primary bg-primary hover:bg-primary/90 shadow-md shadow-primary/25 flex items-center gap-1.5 transition-all disabled:opacity-50"
          @click="handlePublish"
        >
          <Save class="w-3.5 h-3.5" />
          <span>{{ themeStore.isSaving ? 'Kaydediliyor...' : 'Canlı Yayına Al' }}</span>
        </button>
      </div>
    </div>

    <!-- MAIN STUDIO WORKSPACE (2-COLUMN GRID) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      <!-- LEFT COLUMN: CONTROLS & INSPECTOR (5 COLS) -->
      <div class="lg:col-span-5 bg-white rounded-3xl border border-border shadow-xs overflow-hidden flex flex-col">
        <!-- Inspector Navigation Tabs -->
        <div class="flex items-center gap-1 p-2 bg-black/[0.02] border-b border-border overflow-x-auto">
          <button
            type="button"
            :class="[
              'px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0',
              activeTab === 'presets' ? 'bg-white text-text-primary shadow-xs' : 'text-text-secondary hover:text-text-primary'
            ]"
            @click="activeTab = 'presets'"
          >
            <Sparkles class="w-3.5 h-3.5 text-primary" />
            <span>Hazır Temalar</span>
          </button>

          <button
            type="button"
            :class="[
              'px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0',
              activeTab === 'logo' ? 'bg-white text-text-primary shadow-xs' : 'text-text-secondary hover:text-text-primary'
            ]"
            @click="activeTab = 'logo'"
          >
            <ImageIcon class="w-3.5 h-3.5 text-blue-500" />
            <span>Logo & Marka</span>
          </button>

          <button
            type="button"
            :class="[
              'px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0',
              activeTab === 'colors' ? 'bg-white text-text-primary shadow-xs' : 'text-text-secondary hover:text-text-primary'
            ]"
            @click="activeTab = 'colors'"
          >
            <Palette class="w-3.5 h-3.5 text-emerald-500" />
            <span>Renkler</span>
          </button>

          <button
            type="button"
            :class="[
              'px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0',
              activeTab === 'buttons' ? 'bg-white text-text-primary shadow-xs' : 'text-text-secondary hover:text-text-primary'
            ]"
            @click="activeTab = 'buttons'"
          >
            <Square class="w-3.5 h-3.5 text-amber-500" />
            <span>Butonlar</span>
          </button>

          <button
            type="button"
            :class="[
              'px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0',
              activeTab === 'typography' ? 'bg-white text-text-primary shadow-xs' : 'text-text-secondary hover:text-text-primary'
            ]"
            @click="activeTab = 'typography'"
          >
            <Type class="w-3.5 h-3.5 text-purple-500" />
            <span>Tipografi</span>
          </button>

          <button
            type="button"
            :class="[
              'px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0',
              activeTab === 'cards' ? 'bg-white text-text-primary shadow-xs' : 'text-text-secondary hover:text-text-primary'
            ]"
            @click="activeTab = 'cards'"
          >
            <Layers class="w-3.5 h-3.5 text-rose-500" />
            <span>Kartlar</span>
          </button>
        </div>

        <!-- TAB CONTENT AREA -->
        <div class="p-6 space-y-6 max-h-[720px] overflow-y-auto">
          
          <!-- 1. HAZIR TEMALAR (PRESETS) -->
          <div v-if="activeTab === 'presets'" class="space-y-4">
            <div>
              <h3 class="text-sm font-extrabold text-text-primary">1-Tık Hazır Tema Paketleri</h3>
              <p class="text-xs text-text-secondary mt-0.5">
                Özenle hazırlanmış renk paletleri ve tasarım sistemlerini anında sitenize uygulayın
              </p>
            </div>

            <div class="space-y-3">
              <div
                v-for="(p, key) in presets"
                :key="key"
                :class="[
                  'p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-3',
                  currentTheme.activePreset === key
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/40 shadow-xs'
                    : 'border-border bg-white hover:bg-black/[0.02] hover:border-black/20'
                ]"
                @click="handlePresetSelect(key)"
              >
                <div class="flex items-center justify-between">
                  <div class="font-bold text-xs text-text-primary flex items-center gap-2">
                    <span>{{ p.name }}</span>
                    <span v-if="currentTheme.activePreset === key" class="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-black">
                      Aktif
                    </span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span
                      class="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                      :style="{ backgroundColor: p.theme.primaryColor || '#F2B138' }"
                    />
                    <span
                      class="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                      :style="{ backgroundColor: p.theme.secondaryColor || '#5B9BD5' }"
                    />
                    <span
                      class="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                      :style="{ backgroundColor: p.theme.backgroundColor || '#FFFFFF' }"
                    />
                  </div>
                </div>
                <p class="text-xs text-text-secondary">{{ p.description }}</p>
              </div>
            </div>
          </div>

          <!-- 2. LOGO & MARKA (BRAND & LOGO) -->
          <div v-else-if="activeTab === 'logo'" class="space-y-5">
            <div>
              <h3 class="text-sm font-extrabold text-text-primary">Logo & Marka Kimliği</h3>
              <p class="text-xs text-text-secondary mt-0.5">
                Site genelinde header, footer ve faturalarda gösterilecek logoyu özelleştirin
              </p>
            </div>

            <!-- Logo Type Selector -->
            <div>
              <label class="block text-xs font-bold text-text-secondary mb-2">Logo Gösterim Türü</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  :class="[
                    'py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center',
                    currentTheme.logoType === 'icon_text' ? 'bg-primary text-text-primary border-primary shadow-xs' : 'bg-white border-border text-text-secondary hover:bg-black/5'
                  ]"
                  @click="themeStore.setLivePreview({ logoType: 'icon_text' })"
                >
                  İkon + Yazı
                </button>
                <button
                  type="button"
                  :class="[
                    'py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center',
                    currentTheme.logoType === 'image' ? 'bg-primary text-text-primary border-primary shadow-xs' : 'bg-white border-border text-text-secondary hover:bg-black/5'
                  ]"
                  @click="themeStore.setLivePreview({ logoType: 'image' })"
                >
                  Görsel Logo
                </button>
                <button
                  type="button"
                  :class="[
                    'py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center',
                    currentTheme.logoType === 'text_only' ? 'bg-primary text-text-primary border-primary shadow-xs' : 'bg-white border-border text-text-secondary hover:bg-black/5'
                  ]"
                  @click="themeStore.setLivePreview({ logoType: 'text_only' })"
                >
                  Sadece Yazı
                </button>
              </div>
            </div>

            <!-- Logo Text & Tagline -->
            <div class="space-y-3">
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1">Marka Metni</label>
                <input
                  v-model="currentTheme.logoText"
                  type="text"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 font-bold"
                  @input="themeStore.setLivePreview({ logoText: currentTheme.logoText })"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1">Logo Sloganı (Alt Başlık)</label>
                <input
                  v-model="currentTheme.logoTagline"
                  type="text"
                  placeholder="Real-Time Platform"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                  @input="themeStore.setLivePreview({ logoTagline: currentTheme.logoTagline })"
                />
              </div>
            </div>

            <!-- If Image Logo: Image URL or Height -->
            <div v-if="currentTheme.logoType === 'image'" class="space-y-3 p-4 rounded-2xl bg-black/[0.02] border border-border">
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1">Logo Görsel URL Adresi</label>
                <input
                  v-model="currentTheme.logoUrl"
                  type="text"
                  placeholder="https://example.com/logo.png veya /uploads/..."
                  class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                  @input="themeStore.setLivePreview({ logoUrl: currentTheme.logoUrl })"
                />
                <p class="text-[10px] text-text-muted mt-1">Medya Kütüphanesinden yüklediğiniz görsel URL adresini yapıştırabilirsiniz.</p>
              </div>

              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1">
                  Logo Yüksekliği: <span class="text-text-primary font-black">{{ currentTheme.logoHeightPx }}px</span>
                </label>
                <input
                  v-model.number="currentTheme.logoHeightPx"
                  type="range"
                  min="24"
                  max="64"
                  step="2"
                  class="w-full accent-primary cursor-pointer"
                  @input="themeStore.setLivePreview({ logoHeightPx: currentTheme.logoHeightPx })"
                />
              </div>
            </div>

            <!-- If Icon + Text: Badge Shape & Color -->
            <div v-else-if="currentTheme.logoType === 'icon_text'" class="space-y-4 p-4 rounded-2xl bg-black/[0.02] border border-border">
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-2">İkon Rozet Şekli</label>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    v-for="opt in logoBadgeShapeOptions"
                    :key="opt.id"
                    type="button"
                    :class="[
                      'py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center',
                      currentTheme.logoBadgeShape === opt.id ? 'bg-primary/20 border-primary text-text-primary font-black' : 'bg-white border-border text-text-secondary hover:bg-black/5'
                    ]"
                    @click="themeStore.setLivePreview({ logoBadgeShape: opt.id as any })"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1">İkon Rozet Rengi</label>
                <div class="flex items-center gap-2">
                  <input
                    v-model="currentTheme.logoBadgeColor"
                    type="color"
                    class="w-10 h-10 rounded-xl cursor-pointer border border-border p-1 bg-white"
                    @input="handleColorChange('logoBadgeColor', currentTheme.logoBadgeColor)"
                  />
                  <input
                    v-model="currentTheme.logoBadgeColor"
                    type="text"
                    class="flex-1 px-3.5 py-2 rounded-xl border border-border bg-white text-xs font-mono text-text-primary"
                    @input="handleColorChange('logoBadgeColor', currentTheme.logoBadgeColor)"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 3. RENKLER (COLORS) -->
          <div v-else-if="activeTab === 'colors'" class="space-y-5">
            <div>
              <h3 class="text-sm font-extrabold text-text-primary">Renk Paleti & Tonlar</h3>
              <p class="text-xs text-text-secondary mt-0.5">
                Tüm sitedeki buton, başlık, arka plan ve vurgu renklerini belirleyin
              </p>
            </div>

            <div class="space-y-4">
              <!-- Primary Color -->
              <div class="flex items-center justify-between p-3 rounded-2xl border border-border bg-white shadow-xs">
                <div>
                  <span class="text-xs font-extrabold text-text-primary block">Ana Renk (Primary Gold/Brand)</span>
                  <span class="text-[10px] text-text-muted">Butonlar, CTA'lar, aktif göstergeler</span>
                </div>
                <div class="flex items-center gap-2">
                  <input
                    v-model="currentTheme.primaryColor"
                    type="color"
                    class="w-9 h-9 rounded-xl cursor-pointer border border-border p-0.5 bg-white"
                    @input="handleColorChange('primaryColor', currentTheme.primaryColor)"
                  />
                  <input
                    v-model="currentTheme.primaryColor"
                    type="text"
                    class="w-20 px-2 py-1 rounded-lg border border-border text-xs font-mono text-text-primary text-center"
                    @input="handleColorChange('primaryColor', currentTheme.primaryColor)"
                  />
                </div>
              </div>

              <!-- Secondary Color -->
              <div class="flex items-center justify-between p-3 rounded-2xl border border-border bg-white shadow-xs">
                <div>
                  <span class="text-xs font-extrabold text-text-primary block">İkincil Renk (Secondary Blue/Link)</span>
                  <span class="text-[10px] text-text-muted">Linkler, filtreler, ikincil butonlar</span>
                </div>
                <div class="flex items-center gap-2">
                  <input
                    v-model="currentTheme.secondaryColor"
                    type="color"
                    class="w-9 h-9 rounded-xl cursor-pointer border border-border p-0.5 bg-white"
                    @input="handleColorChange('secondaryColor', currentTheme.secondaryColor)"
                  />
                  <input
                    v-model="currentTheme.secondaryColor"
                    type="text"
                    class="w-20 px-2 py-1 rounded-lg border border-border text-xs font-mono text-text-primary text-center"
                    @input="handleColorChange('secondaryColor', currentTheme.secondaryColor)"
                  />
                </div>
              </div>

              <!-- Background Color -->
              <div class="flex items-center justify-between p-3 rounded-2xl border border-border bg-white shadow-xs">
                <div>
                  <span class="text-xs font-extrabold text-text-primary block">Sayfa Arka Planı (Background)</span>
                  <span class="text-[10px] text-text-muted">Tüm sayfanın ana zemin rengi</span>
                </div>
                <div class="flex items-center gap-2">
                  <input
                    v-model="currentTheme.backgroundColor"
                    type="color"
                    class="w-9 h-9 rounded-xl cursor-pointer border border-border p-0.5 bg-white"
                    @input="handleColorChange('backgroundColor', currentTheme.backgroundColor)"
                  />
                  <input
                    v-model="currentTheme.backgroundColor"
                    type="text"
                    class="w-20 px-2 py-1 rounded-lg border border-border text-xs font-mono text-text-primary text-center"
                    @input="handleColorChange('backgroundColor', currentTheme.backgroundColor)"
                  />
                </div>
              </div>

              <!-- Surface/Card Color -->
              <div class="flex items-center justify-between p-3 rounded-2xl border border-border bg-white shadow-xs">
                <div>
                  <span class="text-xs font-extrabold text-text-primary block">Kart & Yüzey (Surface)</span>
                  <span class="text-[10px] text-text-muted">Açık artırma kartları, modallar</span>
                </div>
                <div class="flex items-center gap-2">
                  <input
                    v-model="currentTheme.surfaceColor"
                    type="color"
                    class="w-9 h-9 rounded-xl cursor-pointer border border-border p-0.5 bg-white"
                    @input="handleColorChange('surfaceColor', currentTheme.surfaceColor)"
                  />
                  <input
                    v-model="currentTheme.surfaceColor"
                    type="text"
                    class="w-20 px-2 py-1 rounded-lg border border-border text-xs font-mono text-text-primary text-center"
                    @input="handleColorChange('surfaceColor', currentTheme.surfaceColor)"
                  />
                </div>
              </div>

              <!-- Text Primary Color -->
              <div class="flex items-center justify-between p-3 rounded-2xl border border-border bg-white shadow-xs">
                <div>
                  <span class="text-xs font-extrabold text-text-primary block">Birincil Metin Rengi (Text)</span>
                  <span class="text-[10px] text-text-muted">Başlıklar ve ana içerik metni</span>
                </div>
                <div class="flex items-center gap-2">
                  <input
                    v-model="currentTheme.textPrimaryColor"
                    type="color"
                    class="w-9 h-9 rounded-xl cursor-pointer border border-border p-0.5 bg-white"
                    @input="handleColorChange('textPrimaryColor', currentTheme.textPrimaryColor)"
                  />
                  <input
                    v-model="currentTheme.textPrimaryColor"
                    type="text"
                    class="w-20 px-2 py-1 rounded-lg border border-border text-xs font-mono text-text-primary text-center"
                    @input="handleColorChange('textPrimaryColor', currentTheme.textPrimaryColor)"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 4. BUTONLAR (BUTTONS) -->
          <div v-else-if="activeTab === 'buttons'" class="space-y-5">
            <div>
              <h3 class="text-sm font-extrabold text-text-primary">Buton Tasarım Sistemi</h3>
              <p class="text-xs text-text-secondary mt-0.5">
                Köşe yuvarlaklığı, gölge derinliği ve hover efektleri
              </p>
            </div>

            <!-- Button Radius -->
            <div>
              <label class="block text-xs font-bold text-text-secondary mb-2">Buton Köşe Yuvarlaklığı (Radius)</label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  v-for="opt in buttonRadiusOptions"
                  :key="opt.id"
                  type="button"
                  :class="[
                    'p-3 border text-left transition-all flex items-center justify-between',
                    currentTheme.buttonRadius === opt.id ? 'bg-primary/15 border-primary shadow-xs ring-2 ring-primary/40' : 'bg-white border-border hover:bg-black/5'
                  ]"
                  :style="{ borderRadius: opt.id }"
                  @click="themeStore.setLivePreview({ buttonRadius: opt.id as any })"
                >
                  <div>
                    <span class="text-xs font-extrabold text-text-primary block">{{ opt.label }}</span>
                    <span class="text-[10px] text-text-muted">{{ opt.desc }}</span>
                  </div>
                  <CheckCircle2 v-if="currentTheme.buttonRadius === opt.id" class="w-4 h-4 text-primary" />
                </button>
              </div>
            </div>

            <!-- Button Shadow -->
            <div>
              <label class="block text-xs font-bold text-text-secondary mb-2">Buton Gölge Stili</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="s in ['none', 'md', 'glow']"
                  :key="s"
                  type="button"
                  :class="[
                    'py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center',
                    currentTheme.buttonShadow === s ? 'bg-primary text-text-primary border-primary shadow-xs' : 'bg-white border-border text-text-secondary hover:bg-black/5'
                  ]"
                  @click="themeStore.setLivePreview({ buttonShadow: s as any })"
                >
                  {{ s === 'none' ? 'Düz (Gölgesiz)' : s === 'md' ? 'Standart Gölge' : 'Neon Parıltı (Glow)' }}
                </button>
              </div>
            </div>

            <!-- Button Hover Animation -->
            <div>
              <label class="block text-xs font-bold text-text-secondary mb-2">Hover / Tıklama Animasyonu</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="h in ['scale', 'lift', 'none']"
                  :key="h"
                  type="button"
                  :class="[
                    'py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center',
                    currentTheme.buttonHoverEffect === h ? 'bg-primary text-text-primary border-primary shadow-xs' : 'bg-white border-border text-text-secondary hover:bg-black/5'
                  ]"
                  @click="themeStore.setLivePreview({ buttonHoverEffect: h as any })"
                >
                  {{ h === 'scale' ? 'Büyüme (Scale)' : h === 'lift' ? 'Yukarı Kayma' : 'Sabit' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 5. TİPOGRAFİ (TYPOGRAPHY) -->
          <div v-else-if="activeTab === 'typography'" class="space-y-5">
            <div>
              <h3 class="text-sm font-extrabold text-text-primary">Tipografi & Yazı Tipleri</h3>
              <p class="text-xs text-text-secondary mt-0.5">
                Google Fonts destekli modern yazı tipi ailesini seçin
              </p>
            </div>

            <div class="space-y-3">
              <div
                v-for="font in fontOptions"
                :key="font.id"
                :class="[
                  'p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between',
                  currentTheme.fontFamily === font.id
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/40 shadow-xs'
                    : 'border-border bg-white hover:bg-black/[0.02]'
                ]"
                @click="themeStore.setLivePreview({ fontFamily: font.id as any })"
              >
                <div>
                  <span class="text-sm font-bold text-text-primary block" :style="{ fontFamily: font.id }">
                    {{ font.name }} — Örnek Başlık 123
                  </span>
                  <span class="text-xs text-text-muted mt-0.5 block">{{ font.preview }}</span>
                </div>
                <CheckCircle2 v-if="currentTheme.fontFamily === font.id" class="w-5 h-5 text-primary shrink-0" />
              </div>
            </div>
          </div>

          <!-- 6. KARTLAR & CAM (CARDS & GLASS) -->
          <div v-else-if="activeTab === 'cards'" class="space-y-5">
            <div>
              <h3 class="text-sm font-extrabold text-text-primary">Kartlar, Cam & Konteynerler</h3>
              <p class="text-xs text-text-secondary mt-0.5">
                İlan kartları, modallar ve arka plan cam (blur) efektleri
              </p>
            </div>

            <div>
              <label class="block text-xs font-bold text-text-secondary mb-2">Kart Köşe Yuvarlaklığı</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="opt in cardRadiusOptions"
                  :key="opt.id"
                  type="button"
                  :class="[
                    'py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center',
                    currentTheme.cardRadius === opt.id ? 'bg-primary text-text-primary border-primary shadow-xs' : 'bg-white border-border text-text-secondary hover:bg-black/5'
                  ]"
                  @click="themeStore.setLivePreview({ cardRadius: opt.id as any })"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-text-secondary mb-2">Buzlu Cam Efekti (Backdrop Blur)</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="opt in glassBlurOptions"
                  :key="opt.id"
                  type="button"
                  :class="[
                    'py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center',
                    currentTheme.cardGlassBlur === opt.id ? 'bg-primary/20 border-primary text-text-primary font-black' : 'bg-white border-border text-text-secondary hover:bg-black/5'
                  ]"
                  @click="themeStore.setLivePreview({ cardGlassBlur: opt.id as any })"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- RIGHT COLUMN: REAL-TIME INTERACTIVE SANDBOX (7 COLS) -->
      <div class="lg:col-span-7 space-y-4">
        
        <!-- Device Simulator Toolbar -->
        <div class="bg-white p-2.5 rounded-2xl border border-border shadow-xs flex items-center justify-between">
          <div class="flex items-center gap-2 text-xs font-extrabold text-text-primary px-2">
            <Eye class="w-4 h-4 text-primary" />
            <span>Gerçek Zamanlı Canlı Önizleme (Interactive Simulator)</span>
          </div>

          <div class="flex items-center bg-black/5 p-0.5 rounded-xl">
            <button
              type="button"
              :class="[
                'p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1',
                previewDevice === 'desktop' ? 'bg-white text-text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'
              ]"
              @click="previewDevice = 'desktop'"
            >
              <Monitor class="w-3.5 h-3.5" />
              <span class="hidden sm:inline">Masaüstü</span>
            </button>
            <button
              type="button"
              :class="[
                'p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1',
                previewDevice === 'tablet' ? 'bg-white text-text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'
              ]"
              @click="previewDevice = 'tablet'"
            >
              <Tablet class="w-3.5 h-3.5" />
              <span class="hidden sm:inline">Tablet</span>
            </button>
            <button
              type="button"
              :class="[
                'p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1',
                previewDevice === 'mobile' ? 'bg-white text-text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'
              ]"
              @click="previewDevice = 'mobile'"
            >
              <Smartphone class="w-3.5 h-3.5" />
              <span class="hidden sm:inline">Mobil</span>
            </button>
          </div>
        </div>

        <!-- SIMULATOR CONTAINER -->
        <div class="flex justify-center w-full transition-all">
          <div
            :class="[
              'w-full transition-all duration-300 space-y-5',
              previewDevice === 'mobile' ? 'max-w-sm' : previewDevice === 'tablet' ? 'max-w-xl' : 'max-w-full'
            ]"
          >
            <!-- 1. MOCK HEADER -->
            <div class="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-border shadow-xs flex items-center justify-between gap-3">
              <div class="flex items-center gap-2.5">
                <img
                  v-if="currentTheme.logoType === 'image' && currentTheme.logoUrl"
                  :src="currentTheme.logoUrl"
                  :alt="currentTheme.logoText"
                  :style="{ height: (currentTheme.logoHeightPx || 36) + 'px' }"
                  class="object-contain"
                />
                <span v-else-if="currentTheme.logoType === 'text_only'" class="font-bold text-base text-text-primary">
                  {{ currentTheme.logoText }}
                </span>
                <template v-else>
                  <div
                    class="w-8 h-8 p-1.5 flex items-center justify-center shadow-xs"
                    :class="[
                      currentTheme.logoBadgeShape === 'circle' ? 'rounded-full' :
                      currentTheme.logoBadgeShape === 'square' ? 'rounded-none' :
                      currentTheme.logoBadgeShape === 'transparent' ? 'bg-transparent' :
                      'rounded-xl'
                    ]"
                    :style="{ backgroundColor: currentTheme.logoBadgeColor || '#F2B138' }"
                  >
                    <IlbirsIcon class="w-full h-full text-text-primary" />
                  </div>
                  <div class="flex flex-col">
                    <span class="font-extrabold text-sm text-text-primary leading-tight">{{ currentTheme.logoText }}</span>
                    <span class="text-[8px] text-text-muted uppercase leading-none">{{ currentTheme.logoTagline }}</span>
                  </div>
                </template>
              </div>

              <!-- Mock Navigation & CTA -->
              <div class="flex items-center gap-2">
                <span class="hidden md:inline text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer">Açık Artırmalar</span>
                <button
                  type="button"
                  class="px-3.5 py-1.5 text-xs font-bold text-text-primary shadow-xs transition-all flex items-center gap-1.5"
                  :style="{
                    backgroundColor: currentTheme.primaryColor,
                    borderRadius: currentTheme.buttonRadius,
                    boxShadow: currentTheme.buttonShadow === 'glow' ? `0 0 15px ${currentTheme.primaryColor}80` : undefined
                  }"
                >
                  <Flame class="w-3.5 h-3.5" />
                  <span>İlan Ver</span>
                </button>
              </div>
            </div>

            <!-- 2. MOCK LIVE BENTO AUCTION CARD -->
            <div
              class="border overflow-hidden transition-all shadow-md"
              :style="{
                backgroundColor: currentTheme.surfaceColor,
                borderRadius: currentTheme.cardRadius,
                borderColor: currentTheme.borderColor
              }"
            >
              <!-- Card Image Header -->
              <div class="relative h-48 bg-black/5 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80"
                  alt="Porsche 911 GT3"
                  class="w-full h-full object-cover"
                />
                
                <!-- Live Badge -->
                <div class="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-rose-600/90 backdrop-blur-xs text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                  <span class="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>CANLI İHALE</span>
                </div>

                <!-- Timer Badge -->
                <div class="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono font-bold flex items-center gap-1.5">
                  <Clock class="w-3 h-3 text-amber-400" />
                  <span>02:14:50</span>
                </div>
              </div>

              <!-- Card Body -->
              <div class="p-5 space-y-4">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <span class="text-[10px] font-extrabold uppercase tracking-wider text-text-muted block">Otomobil & Araçlar</span>
                    <h3 class="text-base font-extrabold text-text-primary mt-0.5">2023 Porsche 911 GT3 RS</h3>
                  </div>
                  <button type="button" class="p-2 rounded-xl bg-black/5 text-text-muted hover:text-rose-500 transition-colors">
                    <Heart class="w-4 h-4" />
                  </button>
                </div>

                <!-- Bid Stats Grid -->
                <div class="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-black/[0.03] border border-border">
                  <div>
                    <span class="text-[10px] text-text-muted font-bold block">Güncel Teklif</span>
                    <span class="text-sm font-black text-text-primary">14,250,000 KGS</span>
                  </div>
                  <div class="text-right">
                    <span class="text-[10px] text-text-muted font-bold block">Toplam Teklif</span>
                    <span class="text-sm font-bold text-text-secondary">42 Teklif</span>
                  </div>
                </div>

                <!-- Action Button in Card -->
                <div class="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    class="flex-1 py-3 px-4 text-xs font-black text-text-primary shadow-md transition-all flex items-center justify-center gap-2"
                    :style="{
                      backgroundColor: currentTheme.primaryColor,
                      borderRadius: currentTheme.buttonRadius,
                      boxShadow: currentTheme.buttonShadow === 'glow' ? `0 0 20px ${currentTheme.primaryColor}90` : undefined
                    }"
                  >
                    <Gavel class="w-4 h-4" />
                    <span>Hemen Teklif Ver (+50,000 KGS)</span>
                  </button>

                  <button
                    type="button"
                    class="py-3 px-3.5 text-xs font-bold border transition-all"
                    :style="{
                      color: currentTheme.secondaryColor,
                      borderColor: currentTheme.secondaryColor,
                      borderRadius: currentTheme.buttonRadius
                    }"
                  >
                    İncele
                  </button>
                </div>
              </div>
            </div>

            <!-- 3. MOCK BUTTON VARIATION SHOWCASE -->
            <div class="bg-white p-5 rounded-3xl border border-border shadow-xs space-y-3">
              <span class="text-xs font-extrabold text-text-muted uppercase tracking-wider block">Buton Varyasyon Önizlemesi</span>
              
              <div class="flex flex-wrap items-center gap-2.5">
                <!-- Primary Button -->
                <button
                  type="button"
                  class="px-4 py-2.5 text-xs font-bold text-text-primary shadow-sm"
                  :style="{
                    backgroundColor: currentTheme.primaryColor,
                    borderRadius: currentTheme.buttonRadius
                  }"
                >
                  Primary Buton
                </button>

                <!-- Secondary Button -->
                <button
                  type="button"
                  class="px-4 py-2.5 text-xs font-bold text-white shadow-sm"
                  :style="{
                    backgroundColor: currentTheme.secondaryColor,
                    borderRadius: currentTheme.buttonRadius
                  }"
                >
                  Secondary Buton
                </button>

                <!-- Outline Button -->
                <button
                  type="button"
                  class="px-4 py-2.5 text-xs font-bold border bg-transparent"
                  :style="{
                    color: currentTheme.secondaryColor,
                    borderColor: currentTheme.secondaryColor,
                    borderRadius: currentTheme.buttonRadius
                  }"
                >
                  Outline Buton
                </button>

                <!-- Destructive Button -->
                <button
                  type="button"
                  class="px-4 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200"
                  :style="{
                    borderRadius: currentTheme.buttonRadius
                  }"
                >
                  İptal / Sil
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  </div>
</template>
