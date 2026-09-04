<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, Minimize2,
  ChevronLeft, ChevronRight, Sparkles, ShieldCheck, CheckCircle2,
  Smartphone, CreditCard, Truck, Search, Zap, Clock, Shield,
  ArrowRight, Award, Lock, Check, TrendingUp, Eye, Camera,
  Upload, DollarSign, FileText, CheckCircle, Tag
} from 'lucide-vue-next'
import { useI18n } from '@/composables/useI18n'

interface Props {
  initialScene?: number
  initialLang?: 'ru' | 'ky' | 'tr'
}

const props = withDefaults(defineProps<Props>(), {
  initialScene: 0,
  initialLang: 'ru'
})

const emit = defineEmits<{
  'sceneChange': [sceneIndex: number]
}>()

const { currentLocale } = useI18n()

type LangCode = 'ru' | 'ky' | 'tr'
const filmLang = ref<LangCode>(props.initialLang || 'ru')

// Playback state
const currentScene = ref(props.initialScene)
const isPlaying = ref(true)
const sceneProgress = ref(0) // 0 to 100
const playbackSpeed = ref<number>(1) // 0.75, 1, 1.25, 1.5
const isSoundOn = ref(false)
const isFullscreen = ref(false)
const containerRef = ref<HTMLElement | null>(null)

const BASE_SCENE_DURATION = 8000
let animationFrameId: number | null = null
let lastTimestamp: number | null = null

// Web Audio API Synthesizer
let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (!isSoundOn.value) return null
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function playBeep(freq: number, type: OscillatorType = 'sine', duration = 0.12, gainVal = 0.08) {
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    gain.gain.setValueAtTime(gainVal, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch {}
}

function playSuccessChime() {
  if (!isSoundOn.value) return
  playBeep(523.25, 'triangle', 0.15, 0.08)
  setTimeout(() => playBeep(659.25, 'triangle', 0.15, 0.08), 90)
  setTimeout(() => playBeep(783.99, 'triangle', 0.25, 0.1), 180)
}

function playCashChime() {
  if (!isSoundOn.value) return
  playBeep(587.33, 'sine', 0.08, 0.08)
  setTimeout(() => playBeep(880, 'triangle', 0.2, 0.1), 70)
  setTimeout(() => playBeep(1174.66, 'triangle', 0.25, 0.12), 140)
}

function playClickSound() {
  playBeep(850, 'sine', 0.05, 0.04)
}

// 6 Seller Scenes
const scenes = computed(() => [
  {
    id: 0,
    number: '01',
    icon: Tag,
    title: {
      ky: 'Категория Тандоо жана AI Баяндоо',
      ru: 'Выбор Категории и AI-Описание',
      tr: 'Kategori Seçimi ve AI ile Açıklama'
    }[filmLang.value],
    badge: {
      ky: 'AI ЖАРДАМЧЫ',
      ru: 'AI ПОМОЩНИК',
      tr: 'AI SİHİRBAZI'
    }[filmLang.value],
    description: {
      ky: 'Товарыңыздын категориясын тандаңыз. AI кызматы бир нече сөздөн кесипкөй сүрөттөмө жазып берет.',
      ru: 'Выберите категорию (Авто, Гаджеты, Скот). Встроенный AI сам составит продающее описание лота.',
      tr: 'Ürününüzün kategorisini seçin. Dahili yapay zeka birkaç kelimeden profesyonel ilan metni hazırlar.'
    }[filmLang.value],
    tip: {
      ky: 'AI баскычын бассаңыз, техникалык мүнөздөмөлөр автоматтык толтурулат.',
      ru: 'Кнопка "Создать через AI" экономит до 10 минут времени при заполнении.',
      tr: 'AI asistanı sayesinde tüm teknik detaylar saniyeler içinde otomatik doldurulur.'
    }[filmLang.value]
  },
  {
    id: 1,
    number: '02',
    icon: Camera,
    title: {
      ky: 'Чыныгы Сүрөттөр жана Видео Жүктөө',
      ru: 'Загрузка Реальных Фото и Видео',
      tr: 'Net Fotoğraflar ve Video Yükleme'
    }[filmLang.value],
    badge: {
      ky: 'САПАТТУУ ФОТО',
      ru: 'ЖИВЫЕ ФОТО',
      tr: 'NET GÖRSELLER'
    }[filmLang.value],
    description: {
      ky: 'Лоттун бардык бурчтарынан так сүрөттөрдү жүктөңүз. Сапаттуу сүрөттөр сатып алуучулардын ишенимин арттырат.',
      ru: 'Загрузите до 10 фото и видео. Качественные живые снимки привлекают в 3 раза больше реальных ставок.',
      tr: 'Ürünün tüm açılarını gösteren fotoğraflar yükleyin. Net görseller teklif sayısını 3 kat artırır.'
    }[filmLang.value],
    tip: {
      ky: 'Сүрөттөрдүн салмагы автоматтык кысылып, тез ачылат.',
      ru: 'Система автоматически оптимизирует фото для быстрой загрузки у покупателей.',
      tr: 'Yüklenen fotoğraflar sistem tarafından anında optimize edilir ve hızlı açılır.'
    }[filmLang.value]
  },
  {
    id: 2,
    number: '03',
    icon: DollarSign,
    title: {
      ky: 'Баштапкы Баа жана Коюм Кадамы',
      ru: 'Стартовая Цена и Шаг Ставки',
      tr: 'Başlangıç Fiyatı ve Artış Adımı'
    }[filmLang.value],
    badge: {
      ky: '1 СОМДОН БАШТАЛАТ',
      ru: 'ОТ 1 СОМА',
      tr: '1 KGS BAŞLANGIÇ'
    }[filmLang.value],
    description: {
      ky: 'Баштапкы бааны 1 сом же каалаган суммада белгилеңиз. Минималдуу кадамды (мисалы 500 сом) көрсөтүңүз.',
      ru: 'Укажите стартовую цену и шаг ставки (например +500 сом). Также можно задать цену "Купить сейчас".',
      tr: 'Başlangıç fiyatını ve teklif artış adımını (+500 сом gibi) belirleyin. Dilerseniz "Hemen Al" fiyatı koyun.'
    }[filmLang.value],
    tip: {
      ky: '"Дароо сатып алуу" баасы коюлса, кардар күтпөстөн бир басуу менен ала алат.',
      ru: 'Блиц-цена позволяет забрать товар мгновенно без ожидания окончания таймера.',
      tr: 'Hemen Al fiyatı ekleyerek sabırsız alıcılara anında satın alma fırsatı sunabilirsiniz.'
    }[filmLang.value]
  },
  {
    id: 3,
    number: '04',
    icon: Clock,
    title: {
      ky: 'Мөөнөт Тандоо (Блиц же 1-7 Күн)',
      ru: 'Срок Торгов (Блиц или 1-7 Дней)',
      tr: 'Müzayede Süresi (Hızlı Blitz veya 1-7 Gün)'
    }[filmLang.value],
    badge: {
      ky: 'АНТИСНАЙПИНГ 2.0',
      ru: 'АНТИСНАЙПИНГ 2.0',
      tr: 'ANTİ-SNİPİNG 2.0'
    }[filmLang.value],
    description: {
      ky: 'Тез сатуу үчүн Блиц (24 саат) же 3-7 күндүк сооданы тандаңыз. Антиснайпинг максималдуу бааны камсыздайт.',
      ru: 'Выберите длительность: быстрый Блиц-аукцион на 24 часа или стандартные торги на 3-7 дней.',
      tr: 'Süreyi belirleyin: 24 saatlik hızlı Blitz veya 3-7 günlük açık artırma. Süre sonunda en yüksek teklif kazanır.'
    }[filmLang.value],
    tip: {
      ky: 'Соода бүтөөрдө коюлган коюм таймерди 2 мүнөткө узартып, бааны дагы көтөрөт.',
      ru: 'Каждая ставка в последние 2 минуты продлевает торги, увеличивая вашу итоговую прибыль.',
      tr: 'Son 2 dakikada gelen her teklif süreyi uzatır ve satış kazancınızı maksimize eder.'
    }[filmLang.value]
  },
  {
    id: 4,
    number: '05',
    icon: Zap,
    title: {
      ky: 'Ыкчам Модерация жана Түз Эфир',
      ru: 'Быстрая Модерация и Прямой Эфир',
      tr: 'Anında Moderasyon ve Canlı Yayın'
    }[filmLang.value],
    badge: {
      ky: 'АКТИВДҮҮ ЛОТ',
      ru: 'ЛОТ ОПУБЛИКОВАН',
      tr: 'YAYINDA'
    }[filmLang.value],
    description: {
      ky: 'Лот модерациядан өтүп, заматта башкы бетке жана бүт Кыргызстандын сатып алуучуларына чыгат.',
      ru: 'После быстрой проверки лот сразу появляется на главной странице и доступен тысячам покупателей.',
      tr: 'İlanınız onaylandıktan sonra anında ana sayfada canlı yayına girer ve tüm alıcılara gösterilir.'
    }[filmLang.value],
    tip: {
      ky: 'Telegram жана WhatsApp аркылуу лоттун шилтемесин бөлүшүп, досторуңузду чакырсаңыз болот.',
      ru: 'Делитесь ссылкой на лот в соцсетях и мессенджерах для максимального охвата.',
      tr: 'İlan linkini WhatsApp ve Telegram üzerinden paylaşarak teklif yarışını hızlandırabilirsiniz.'
    }[filmLang.value]
  },
  {
    id: 5,
    number: '06',
    icon: ShieldCheck,
    title: {
      ky: 'Кепилденген Төлөм жана Эскроу Выплата',
      ru: 'Гарантия Оплаты и Выплата с Эскроу',
      tr: 'Garantili Ödeme ve Hesaba Aktarım'
    }[filmLang.value],
    badge: {
      ky: '100% КЕПИЛДИК',
      ru: '100% ВЫПЛАТА',
      tr: '100% GÜVENCE'
    }[filmLang.value],
    description: {
      ky: 'Жеңүүчү акчаны эскроуга төлөйт. Сиз товарды тапшырасыз жана каражат картаңызга толук которулат.',
      ru: 'Покупатель заранее оплачивает лот в эскроу. Вы отправляете товар и мгновенно получаете деньги на карту.',
      tr: 'Alıcı tutarı banka emanetine peşin yatırır. Siz ürünü teslim edersiniz ve paranız anında kartınıza geçer.'
    }[filmLang.value],
    tip: {
      ky: 'Сатуучу эч качан алданбайт: кардар төлөбөсө, лот кайра соодага коюлат же компенсация берилет.',
      ru: 'Вы застрахованы от неплатежей: деньги покупателя уже заблокированы банком до отправки товара.',
      tr: 'Ödeme alamama riski sıfırdır: alıcının parası siz kargolamadan önce banka tarafından bloke edilir.'
    }[filmLang.value]
  }
])

// Interactive simulated scene states for seller
const simCategory = ref('electronics')
const simTitle = computed(() => {
  if (filmLang.value === 'ky') return 'Sony PlayStation 5 Pro 2TB (Жаңы / Жабык куту)'
  if (filmLang.value === 'tr') return 'Sony PlayStation 5 Pro 2TB (Sıfır / Kapalı Kutu)'
  return 'Sony PlayStation 5 Pro 2TB (Новый / В заводской упаковке)'
})
const simAiActive = ref(false)
const simPhotoCount = ref(3)
const simStartPrice = ref(25000)
const simBlitzPrice = ref(55000)
const simStepPrice = ref(1000)
const simPublished = ref(false)
const simMoneyReceived = ref(false)

function updatePlayback(timestamp: number) {
  if (!isPlaying.value) {
    lastTimestamp = timestamp
    animationFrameId = requestAnimationFrame(updatePlayback)
    return
  }

  if (lastTimestamp === null) lastTimestamp = timestamp
  const delta = timestamp - lastTimestamp
  lastTimestamp = timestamp

  const effectiveDuration = BASE_SCENE_DURATION / playbackSpeed.value
  sceneProgress.value += (delta / effectiveDuration) * 100

  // Animate micro-events
  if (currentScene.value === 0 && sceneProgress.value > 40 && !simAiActive.value) {
    simAiActive.value = true
    playSuccessChime()
  } else if (currentScene.value === 4 && sceneProgress.value > 60 && !simPublished.value) {
    simPublished.value = true
    playSuccessChime()
  } else if (currentScene.value === 5 && sceneProgress.value > 65 && !simMoneyReceived.value) {
    simMoneyReceived.value = true
    playCashChime()
  }

  if (sceneProgress.value >= 100) {
    sceneProgress.value = 0
    if (currentScene.value < scenes.value.length - 1) {
      goToScene(currentScene.value + 1)
    } else {
      goToScene(0)
    }
  }

  animationFrameId = requestAnimationFrame(updatePlayback)
}

function togglePlay() {
  isPlaying.value = !isPlaying.value
  playClickSound()
}

function restartFilm() {
  goToScene(0)
  sceneProgress.value = 0
  isPlaying.value = true
  playClickSound()
}

function goToScene(idx: number) {
  if (idx < 0) idx = 0
  if (idx >= scenes.value.length) idx = scenes.value.length - 1
  currentScene.value = idx
  sceneProgress.value = 0
  resetSceneState(idx)
  emit('sceneChange', idx)
  playClickSound()
}

function resetSceneState(idx: number) {
  if (idx === 0) simAiActive.value = false
  if (idx === 4) simPublished.value = false
  if (idx === 5) simMoneyReceived.value = false
}

function setPlaybackSpeed(speed: number) {
  playbackSpeed.value = speed
  playClickSound()
}

function toggleSound() {
  isSoundOn.value = !isSoundOn.value
  if (isSoundOn.value) {
    getAudioContext()
    playSuccessChime()
  }
}

function toggleFullscreen() {
  if (!containerRef.value) return
  if (!document.fullscreenElement) {
    containerRef.value.requestFullscreen().catch(() => {})
    isFullscreen.value = true
  } else {
    document.exitFullscreen().catch(() => {})
    isFullscreen.value = false
  }
}

// User interactive test triggers
function triggerUserAiGenerate() {
  simAiActive.value = true
  playSuccessChime()
}

function triggerUserAddPhoto() {
  simPhotoCount.value = Math.min(6, simPhotoCount.value + 1)
  playClickSound()
}

function triggerUserPublish() {
  simPublished.value = true
  playSuccessChime()
}

function triggerUserCollectPayout() {
  simMoneyReceived.value = true
  playCashChime()
}

onMounted(() => {
  animationFrameId = requestAnimationFrame(updatePlayback)
})

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
})

defineExpose({
  goToScene,
  currentScene
})
</script>

<template>
  <div
    ref="containerRef"
    class="relative rounded-3xl overflow-hidden bg-[#0c0f17] border border-white/10 text-white shadow-2xl transition-all duration-300 select-none w-full"
    :class="{ 'fixed inset-0 z-50 rounded-none h-screen w-screen': isFullscreen }"
  >
    <!-- Background Ambient Glow -->
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] pointer-events-none" />
    <div class="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
    <div class="absolute -bottom-32 -right-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

    <!-- Cinema Top Bar -->
    <div class="relative z-10 p-3 sm:p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-black/40 backdrop-blur-md">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0">
          <Tag class="w-4 h-4" />
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-xs sm:text-sm font-black tracking-tight text-white truncate">
              {{ filmLang === 'ky' ? 'Сатуучунун Колдонмосу: Лотту Кантип Чыгаруу Керек?' : (filmLang === 'tr' ? 'Satıcı Rehberi: Nasıl İlan Verilir?' : 'Гид Продавца: Как выставить лот?') }}
            </span>
            <span class="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SELLER MASTERCLASS
            </span>
          </div>
          <p class="text-[11px] text-white/50 truncate">
            {{ scenes[currentScene].number }} / 06 · {{ scenes[currentScene].title }}
          </p>
        </div>
      </div>

      <!-- Controls: Lang, Sound, Fullscreen -->
      <div class="flex items-center gap-1.5 sm:gap-2">
        <div class="flex items-center p-1 rounded-xl bg-white/10 border border-white/10 text-xs font-bold">
          <button
            v-for="lang in (['ru', 'ky', 'tr'] as LangCode[])"
            :key="lang"
            type="button"
            class="px-2 py-1 rounded-lg transition-all cursor-pointer text-[11px]"
            :class="filmLang === lang ? 'bg-emerald-400 text-gray-950 font-black shadow-xs' : 'text-white/70 hover:text-white'"
            @click="filmLang = lang; playClickSound()"
          >
            {{ lang === 'ru' ? 'RU 🇷🇺' : (lang === 'ky' ? 'KG 🇰🇬' : 'TR 🇹🇷') }}
          </button>
        </div>

        <button
          type="button"
          class="p-2 rounded-xl border transition-all cursor-pointer"
          :class="isSoundOn ? 'bg-emerald-400/20 border-emerald-400/40 text-emerald-300' : 'bg-white/5 border-white/10 text-white/50 hover:text-white'"
          :title="isSoundOn ? (filmLang === 'ky' ? 'Үн күйүк' : (filmLang === 'tr' ? 'Ses açık' : 'Звук включен')) : (filmLang === 'ky' ? 'Үн өчүк' : (filmLang === 'tr' ? 'Ses kapalı' : 'Без звука'))"
          @click="toggleSound"
        >
          <Volume2 v-if="isSoundOn" class="w-4 h-4" />
          <VolumeX v-else class="w-4 h-4" />
        </button>

        <button
          type="button"
          class="p-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
          :title="isFullscreen ? (filmLang === 'ky' ? 'Чыгуу' : (filmLang === 'tr' ? 'Çıkış' : 'Свернуть')) : (filmLang === 'ky' ? 'Толук экран' : (filmLang === 'tr' ? 'Tam Ekran' : 'На весь экран'))"
          @click="toggleFullscreen"
        >
          <Minimize2 v-if="isFullscreen" class="w-4 h-4" />
          <Maximize2 v-else class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Main Stage -->
    <div class="relative z-10 w-full min-h-[360px] sm:min-h-[440px] lg:min-h-[500px] flex items-center justify-center p-4 sm:p-8 overflow-hidden">
      
      <!-- SCENE 01: CATEGORY & AI LISTING -->
      <div v-if="currentScene === 0" class="w-full max-w-lg space-y-4 animate-fade-in">
        <div class="rounded-3xl bg-gradient-to-b from-[#161a26] to-[#0f121d] border border-white/15 p-6 sm:p-7 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <span class="text-xs font-bold text-white/70">{{ filmLang === 'ky' ? '1-Кадам: Категория жана Аталышы' : (filmLang === 'tr' ? '1. Adım: Kategori ve İlan Başlığı' : 'Шаг 1: Категория и Название') }}</span>
            <span class="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-black font-mono">AI ENHANCED</span>
          </div>

          <!-- Category Chips -->
          <div class="grid grid-cols-3 gap-2 text-xs font-bold">
            <div class="p-2.5 rounded-xl bg-emerald-500 text-gray-950 font-black text-center shadow-xs">
              💻 {{ filmLang === 'ky' ? 'Электроника' : (filmLang === 'tr' ? 'Elektronik' : 'Электроника') }}
            </div>
            <div class="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-center">
              🚗 {{ filmLang === 'ky' ? 'Унаалар' : (filmLang === 'tr' ? 'Araçlar' : 'Авто') }}
            </div>
            <div class="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-center">
              🐑 {{ filmLang === 'ky' ? 'Мал чарба' : (filmLang === 'tr' ? 'Hayvancılık' : 'Скот') }}
            </div>
          </div>

          <!-- Title Input -->
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold text-white/60">{{ filmLang === 'ky' ? 'Лоттун аталышы' : (filmLang === 'tr' ? 'İlan Başlığı' : 'Название лота') }}</label>
            <div class="w-full bg-black/50 border border-white/20 rounded-xl px-3.5 py-3 text-xs sm:text-sm font-bold text-white truncate">
              {{ simTitle }}
            </div>
          </div>

          <!-- AI Magic Button & Generator Card -->
          <div
            class="p-3.5 rounded-2xl border transition-all duration-500 space-y-2"
            :class="simAiActive
              ? 'bg-purple-950/40 border-purple-400/60 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
              : 'bg-white/5 border-white/10'"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-xs font-black text-purple-300">
                <Sparkles class="w-4 h-4 text-amber-400 animate-spin" />
                <span>{{ filmLang === 'ky' ? 'iTorgo AI сыйкыры' : (filmLang === 'tr' ? 'iTorgo Yapay Zeka Desteği' : 'iTorgo AI Генератор') }}</span>
              </div>
              <button
                type="button"
                class="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[11px] font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                @click="triggerUserAiGenerate"
              >
                {{ simAiActive ? (filmLang === 'ky' ? '✓ Даяр' : (filmLang === 'tr' ? '✓ Hazır' : '✓ Готово')) : (filmLang === 'ky' ? '✨ Түзүү' : (filmLang === 'tr' ? '✨ Oluştur' : '✨ Создать')) }}
              </button>
            </div>
            <p class="text-[11px] text-white/70 leading-relaxed font-mono">
              {{ simAiActive
                ? (filmLang === 'ky' ? '«Sony PS5 Pro 2TB. 8K колдоо, эки DualSense геймпады. Кепилдик талону бар. Кант шаарынан жеткирүү.»' : (filmLang === 'tr' ? '«Sony PS5 Pro 2TB sıfır kapalı kutu. 2 adet DualSense kol, 1 yıl resmi garanti. Bişkek içi ücretsiz kurye.»' : '«Sony PS5 Pro 2TB в идеале. Два геймпада DualSense, гарантийный талон. Доставка по Бишкеку бесплатно.»'))
                : (filmLang === 'ky' ? 'AI баскычын басып, даяр баяндама алыңыз...' : (filmLang === 'tr' ? 'AI butonuna tıklayarak otomatik açıklama oluşturun...' : 'Нажмите кнопку AI для автогенерации описания...'))
              }}
            </p>
          </div>
        </div>
      </div>

      <!-- SCENE 02: PHOTO UPLOAD -->
      <div v-else-if="currentScene === 1" class="w-full max-w-lg space-y-4 animate-fade-in">
        <div class="rounded-3xl bg-gradient-to-b from-[#161a26] to-[#0f121d] border border-white/15 p-6 sm:p-7 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <span class="text-xs font-bold text-white/70">{{ filmLang === 'ky' ? '2-Кадам: Сүрөттөрдү жүктөө' : (filmLang === 'tr' ? '2. Adım: Fotoğraf ve Video Yükleme' : 'Шаг 2: Загрузка фото и видео') }}</span>
            <span class="text-[10px] font-bold text-emerald-400 font-mono">{{ simPhotoCount }} / 10 {{ filmLang === 'ky' ? 'СҮРӨТ' : (filmLang === 'tr' ? 'FOTO' : 'ФОТО') }}</span>
          </div>

          <!-- Photo Drag & Drop Zone -->
          <div
            class="rounded-2xl border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 p-5 text-center space-y-2 cursor-pointer hover:bg-emerald-500/10 transition-colors"
            @click="triggerUserAddPhoto"
          >
            <div class="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 mx-auto flex items-center justify-center">
              <Camera class="w-5 h-5" />
            </div>
            <div class="text-xs font-bold text-white">
              {{ filmLang === 'ky' ? 'Сүрөттөрдү бул жерге таштаңыз же басыңыз' : (filmLang === 'tr' ? 'Fotoğrafları sürükleyin veya tıklayın' : 'Перетащите живые фото или нажмите') }}
            </div>
            <p class="text-[10px] text-white/40">PNG, JPG, WebP ({{ filmLang === 'ky' ? 'макс. 15 МБ' : (filmLang === 'tr' ? 'maks. 15 MB' : 'макс. 15 МБ') }})</p>
          </div>

          <!-- Photo Grid Thumbnail Cards -->
          <div class="grid grid-cols-4 gap-2 pt-1">
            <div
              v-for="i in 4"
              :key="i"
              class="h-16 rounded-xl border border-white/10 overflow-hidden relative group bg-black/40"
            >
              <img
                src="https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=300&q=80"
                alt="Product"
                class="w-full h-full object-cover"
              />
              <span v-if="i === 1" class="absolute top-1 left-1 px-1 rounded bg-amber-400 text-gray-950 text-[8px] font-black">
                COVER
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- SCENE 03: PRICING MATRIX -->
      <div v-else-if="currentScene === 2" class="w-full max-w-lg space-y-4 animate-fade-in">
        <div class="rounded-3xl bg-gradient-to-b from-[#161a26] to-[#0f121d] border border-white/15 p-6 sm:p-7 shadow-2xl space-y-5">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <span class="text-xs font-bold text-white/70">{{ filmLang === 'ky' ? '3-Кадам: Баа жана Коюм кадамы' : (filmLang === 'tr' ? '3. Adım: Fiyat ve Teklif Adımı' : 'Шаг 3: Цены и Шаг ставки') }}</span>
            <span class="text-[10px] font-mono font-black text-amber-400">KGS (СОМ)</span>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <!-- Starting Price Input -->
            <div class="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <label class="text-[10px] font-bold text-white/50 uppercase">{{ filmLang === 'ky' ? 'Баштапкы баа' : (filmLang === 'tr' ? 'Başlangıç Fiyatı' : 'Стартовая цена') }}</label>
              <div class="text-xl font-black text-white font-mono">
                {{ simStartPrice.toLocaleString('ru-RU') }} сом
              </div>
              <div class="text-[9px] text-white/40">{{ filmLang === 'ky' ? '1 сомдон да баштаса болот' : (filmLang === 'tr' ? '1 KGS ile bile başlanabilir' : 'Можно начать даже с 1 сома') }}</div>
            </div>

            <!-- Bid Step -->
            <div class="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <label class="text-[10px] font-bold text-white/50 uppercase">{{ filmLang === 'ky' ? 'Минималдуу кадам' : (filmLang === 'tr' ? 'Artış Adımı' : 'Шаг ставки') }}</label>
              <div class="text-xl font-black text-emerald-400 font-mono">
                +{{ simStepPrice.toLocaleString('ru-RU') }} сом
              </div>
              <div class="text-[9px] text-emerald-400/70">{{ filmLang === 'ky' ? 'Ар бир коюлган коюм' : (filmLang === 'tr' ? 'Her teklifteki artış miktarı' : 'Шаг каждого предложения') }}</div>
            </div>
          </div>

          <!-- Buy Now Blitz Option -->
          <div class="p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-between">
            <div>
              <div class="text-xs font-black text-amber-300">⚡ {{ filmLang === 'ky' ? 'Дароо сатып алуу баасы' : (filmLang === 'tr' ? 'Hemen Al Fiyatı' : 'Цена "Купить сейчас"') }}</div>
              <div class="text-[10px] text-white/60">{{ filmLang === 'ky' ? 'Таймерди күтпөстөн сатып алуу' : (filmLang === 'tr' ? 'Süreyi beklemeden anında satış' : 'Быстрая продажа без торгов') }}</div>
            </div>
            <div class="text-base font-black text-amber-400 font-mono">
              {{ simBlitzPrice.toLocaleString('ru-RU') }} сом
            </div>
          </div>
        </div>
      </div>

      <!-- SCENE 04: DURATION & ANTI-SNIPING -->
      <div v-else-if="currentScene === 3" class="w-full max-w-lg space-y-4 animate-fade-in">
        <div class="rounded-3xl bg-gradient-to-b from-[#161a26] to-[#0f121d] border border-white/15 p-6 sm:p-7 shadow-2xl space-y-5">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <span class="text-xs font-bold text-white/70">{{ filmLang === 'ky' ? '4-Кадам: Соода мөөнөтү' : (filmLang === 'tr' ? '4. Adım: Süre ve Koruma' : 'Шаг 4: Длительность торгов') }}</span>
            <span class="text-[10px] font-mono font-black text-rose-400">FAIR PLAY 2.0</span>
          </div>

          <!-- Duration Selector Pills -->
          <div class="grid grid-cols-3 gap-2 text-center text-xs font-bold">
            <div class="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/60">
              ⚡ {{ filmLang === 'ky' ? '24 саат' : (filmLang === 'tr' ? '24 saat' : '24 часа') }}
            </div>
            <div class="p-3 rounded-2xl bg-amber-400 text-gray-950 font-black shadow-md">
              🔥 {{ filmLang === 'ky' ? '3 күн (Сунуш)' : (filmLang === 'tr' ? '3 gün (Öneri)' : '3 дня (Хит)') }}
            </div>
            <div class="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/60">
              🗓️ {{ filmLang === 'ky' ? '7 күн' : (filmLang === 'tr' ? '7 gün' : '7 дней') }}
            </div>
          </div>

          <!-- Anti-Sniping Feature Explanation -->
          <div class="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
            <div class="flex items-center gap-2 text-xs font-black text-white">
              <Shield class="w-4 h-4 text-amber-400" />
              <span>{{ filmLang === 'ky' ? 'Антиснайпинг автоматтык күйгүзүлгөн' : (filmLang === 'tr' ? 'Anti-Sniping Otomatik Devrede' : 'Антиснайпинг включен автоматически') }}</span>
            </div>
            <p class="text-[11px] text-white/60 leading-relaxed">
              {{ filmLang === 'ky' ? 'Акыркы секундаларда коюм коюлса, таймер 2 мүнөткө узарып, сатуучуга эң жогорку пайда алып келет.' : (filmLang === 'tr' ? 'Son saniyelerdeki teklifler süreyi 2 dakika uzatarak lotun değerinin altında gitmesini önler.' : 'Ставки на последних секундах продлевают таймер, гарантируя максимальную финальную цену.') }}
            </p>
          </div>
        </div>
      </div>

      <!-- SCENE 05: PUBLISHING & LIVE FEED -->
      <div v-else-if="currentScene === 4" class="w-full max-w-lg space-y-4 animate-fade-in">
        <div class="rounded-3xl bg-gradient-to-b from-[#161a26] to-[#0f121d] border border-white/15 p-6 sm:p-7 shadow-2xl space-y-5">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <span class="text-xs font-bold text-white/70">{{ filmLang === 'ky' ? '5-Кадам: Түз эфирге чыгаруу' : (filmLang === 'tr' ? '5. Adım: Canlı Yayına Alma' : 'Шаг 5: Публикация лота') }}</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-gray-950">
              {{ simPublished ? (filmLang === 'ky' ? 'ТҮЗ ЭФИРДЕ 🔴' : (filmLang === 'tr' ? 'CANLI YAYINDA 🔴' : 'В ЭФИРЕ 🔴')) : (filmLang === 'ky' ? 'ДАЯР' : (filmLang === 'tr' ? 'HAZIR' : 'ГОТОВ')) }}
            </span>
          </div>

          <!-- Live Success Card -->
          <div
            class="p-5 rounded-2xl border text-center space-y-3 transition-all duration-500"
            :class="simPublished
              ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.25)]'
              : 'bg-white/5 border-white/10'"
          >
            <div class="w-12 h-12 rounded-2xl bg-emerald-400 text-gray-950 mx-auto flex items-center justify-center font-black text-xl">
              ✓
            </div>
            <div class="space-y-1">
              <h5 class="text-sm sm:text-base font-black text-white">
                {{ filmLang === 'ky' ? 'Куттуктайбыз! Лотуңуз түз эфирде!' : (filmLang === 'tr' ? 'Tebrikler! İlanınız Canlı Yayında!' : 'Поздравляем! Ваш лот в прямом эфире!') }}
              </h5>
              <p class="text-xs text-white/60">
                {{ filmLang === 'ky' ? 'Бишкек, Ош жана бүт Кыргызстан боюнча сатып алуучулар сунуш бере баштады.' : (filmLang === 'tr' ? 'Bişkek, Oş ve tüm Kırgızistan alıcıları teklif vermeye başladı.' : 'Покупатели со всего Кыргызстана уже видят ваш лот на главной странице.') }}
              </p>
            </div>
            <button
              type="button"
              class="px-5 py-2.5 rounded-xl bg-emerald-400 text-gray-950 font-black text-xs shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5"
              @click="triggerUserPublish"
            >
              <span>{{ filmLang === 'ky' ? 'Лотту көрүү' : (filmLang === 'tr' ? 'İlanı Görüntüle' : 'Перейти к лоту') }}</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- SCENE 06: GUARANTEED ESCROW PAYOUT -->
      <div v-else-if="currentScene === 5" class="w-full max-w-lg space-y-4 animate-fade-in">
        <div class="rounded-3xl bg-gradient-to-b from-[#161a26] to-[#0f121d] border border-white/15 p-6 sm:p-7 shadow-2xl space-y-5">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <span class="text-xs font-bold text-white/70">{{ filmLang === 'ky' ? '6-Кадам: Кепилденген акча чыгаруу' : (filmLang === 'tr' ? '6. Adım: Garantili Banka Tahsilatı' : 'Шаг 6: Гарантированная выплата') }}</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
              DEMIRBANK ESCROW
            </span>
          </div>

          <!-- Cash Payout Confirmation -->
          <div
            class="p-5 rounded-2xl border space-y-4 transition-all duration-500 text-center"
            :class="simMoneyReceived
              ? 'bg-gradient-to-b from-emerald-950/60 to-teal-900/40 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
              : 'bg-black/40 border-white/10'"
          >
            <div class="space-y-1">
              <div class="text-[10px] font-bold text-white/50 uppercase tracking-widest">{{ filmLang === 'ky' ? 'Таза түшкөн каражат:' : (filmLang === 'tr' ? 'Hesabınıza Geçen Tutar:' : 'Сумма к зачислению:') }}</div>
              <div class="text-3xl font-black text-amber-400 font-mono">
                +48 500 сом
              </div>
              <div class="text-[11px] text-emerald-400 font-bold">
                {{ filmLang === 'ky' ? 'MBank / Optima эсебиңизге дароо чегерилди' : (filmLang === 'tr' ? 'MBank / Optima kartınıza anında yatırıldı' : 'Зачислено на MBank / Optima моментально') }}
              </div>
            </div>

            <button
              type="button"
              class="w-full py-3 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              :class="simMoneyReceived
                ? 'bg-emerald-400 text-gray-950'
                : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'"
              @click="triggerUserCollectPayout"
            >
              <CheckCircle2 class="w-4 h-4" />
              <span>{{ simMoneyReceived ? (filmLang === 'ky' ? 'Төлөм ийгиликтүү чегерилди!' : (filmLang === 'tr' ? 'Ödeme Başarıyla Tahsil Edildi!' : 'Выплата успешно получена!')) : (filmLang === 'ky' ? 'Төлөмдү текшерүү (Сыноо)' : (filmLang === 'tr' ? 'Ödemeyi Kontrol Et (Dene)' : 'Проверить баланс (Тест)')) }}</span>
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- Cinema Bottom Bar -->
    <div class="relative z-10 p-4 sm:p-6 border-t border-white/10 bg-black/60 backdrop-blur-xl space-y-4">
      
      <!-- 6-Scene Segmented Progress Bar -->
      <div class="grid grid-cols-6 gap-1.5 sm:gap-2">
        <button
          v-for="(scene, idx) in scenes"
          :key="idx"
          type="button"
          class="group text-left space-y-1 cursor-pointer outline-none"
          @click="goToScene(idx)"
        >
          <div class="h-1.5 sm:h-2 rounded-full overflow-hidden bg-white/15 group-hover:bg-white/30 transition-colors">
            <div
              class="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all"
              :style="{
                width: idx < currentScene
                  ? '100%'
                  : idx === currentScene
                    ? `${sceneProgress}%`
                    : '0%'
              }"
            />
          </div>
          <div
            class="hidden md:flex items-center justify-between text-[10px] font-bold truncate transition-colors"
            :class="idx === currentScene ? 'text-emerald-300' : 'text-white/40 group-hover:text-white/70'"
          >
            <span class="truncate">{{ scene.number }}. {{ scene.badge }}</span>
          </div>
        </button>
      </div>

      <!-- Controls Row -->
      <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer disabled:opacity-30"
            :disabled="currentScene === 0"
            :title="filmLang === 'ky' ? 'Мурунку кадам' : (filmLang === 'tr' ? 'Önceki Adım' : 'Предыдущая сцена')"
            @click="goToScene(currentScene - 1)"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>

          <button
            type="button"
            class="px-4 sm:px-6 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-500 text-gray-950 font-black text-xs sm:text-sm shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            @click="togglePlay"
          >
            <Pause v-if="isPlaying" class="w-4 h-4" />
            <Play v-else class="w-4 h-4 fill-current" />
            <span>{{ isPlaying ? (filmLang === 'ky' ? 'Тыныгуу' : (filmLang === 'tr' ? 'Durdur' : 'Пауза')) : (filmLang === 'ky' ? 'Ойнотуу' : (filmLang === 'tr' ? 'Oynat' : 'Продолжить')) }}</span>
          </button>

          <button
            type="button"
            class="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer disabled:opacity-30"
            :disabled="currentScene === scenes.length - 1"
            :title="filmLang === 'ky' ? 'Кийинки кадам' : (filmLang === 'tr' ? 'Sonraki Adım' : 'Следующая сцена')"
            @click="goToScene(currentScene + 1)"
          >
            <ChevronRight class="w-4 h-4" />
          </button>

          <button
            type="button"
            class="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer"
            :title="filmLang === 'ky' ? 'Башынан баштоо' : (filmLang === 'tr' ? 'Baştan Başlat' : 'Перезапустить с начала')"
            @click="restartFilm"
          >
            <RotateCcw class="w-4 h-4" />
          </button>
        </div>

        <div class="hidden lg:block text-center flex-1 px-4 min-w-0">
          <p class="text-xs text-white/80 font-medium truncate">
            <span class="text-emerald-300 font-bold">💡 {{ filmLang === 'ky' ? 'Кеңеш:' : (filmLang === 'tr' ? 'İpucu:' : 'Совет:') }}</span>
            {{ scenes[currentScene].tip }}
          </p>
        </div>

        <div class="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-bold">
          <button
            v-for="speed in [0.75, 1, 1.25, 1.5]"
            :key="speed"
            type="button"
            class="px-2 py-1 rounded-lg text-[11px] transition-all cursor-pointer"
            :class="playbackSpeed === speed ? 'bg-emerald-400 text-gray-950 font-black' : 'text-white/60 hover:text-white'"
            @click="setPlaybackSpeed(speed)"
          >
            {{ speed }}x
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
