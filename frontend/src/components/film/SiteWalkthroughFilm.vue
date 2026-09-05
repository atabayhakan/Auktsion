<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, Minimize2,
  ChevronLeft, ChevronRight, Sparkles, ShieldCheck, CheckCircle2,
  Smartphone, CreditCard, Truck, Search, Zap, Clock, Shield,
  ArrowRight, Award, Lock, Check, TrendingUp, Eye
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

// Active language in player: Starts in Russian ('ru') by default or active site locale
type LangCode = 'ru' | 'ky' | 'tr'
const filmLang = ref<LangCode>(props.initialLang || 'ru')

watch(() => props.initialLang, (newLang) => {
  if (newLang && ['ru', 'ky', 'tr'].includes(newLang)) {
    filmLang.value = newLang as LangCode
  }
})

// Playback state
const currentScene = ref(props.initialScene)
const isPlaying = ref(true)
const sceneProgress = ref(0) // 0 to 100
const playbackSpeed = ref<number>(1) // 0.75, 1, 1.25, 1.5
const isSoundOn = ref(false)
const isFullscreen = ref(false)
const containerRef = ref<HTMLElement | null>(null)

// Scene duration in milliseconds at 1x speed
const BASE_SCENE_DURATION = 8000 
let animationFrameId: number | null = null
let lastTimestamp: number | null = null

// Web Audio API Synthesizer (Zero external file dependencies)
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
  } catch {
    // Ignore audio policy restrictions
  }
}

function playSuccessChime() {
  if (!isSoundOn.value) return
  playBeep(523.25, 'triangle', 0.15, 0.08) // C5
  setTimeout(() => playBeep(659.25, 'triangle', 0.15, 0.08), 90) // E5
  setTimeout(() => playBeep(783.99, 'triangle', 0.25, 0.1), 180) // G5
}

function playBidChime() {
  if (!isSoundOn.value) return
  playBeep(440, 'sine', 0.1, 0.07)
  setTimeout(() => playBeep(880, 'triangle', 0.18, 0.09), 80)
}

function playClickSound() {
  playBeep(800, 'sine', 0.05, 0.04)
}

// 6 Scenes Configuration with 3 Languages
const scenes = computed(() => [
  {
    id: 0,
    number: '01',
    icon: Smartphone,
    color: 'from-amber-500 to-orange-500',
    title: {
      ky: 'Каттоо жана Ыкчам SMS-Тастыктоо',
      ru: 'Регистрация и Быстрое SMS-Подтверждение',
      tr: 'Hızlı Kayıt ve SMS Doğrulama'
    }[filmLang.value],
    badge: {
      ky: '30 СЕКУНДА',
      ru: '30 СЕКУНД',
      tr: '30 SANİYE'
    }[filmLang.value],
    description: {
      ky: 'Телефон номериңизди жазып, акысыз SMS-кодду киргизиңиз. Сырсөз жаттоонун кереги жок.',
      ru: 'Введите номер телефона Кыргызстана и получите мгновенный 4-значный SMS-код. Никаких сложных паролей.',
      tr: 'Telefon numaranızı girin ve anında gelen SMS kodunu onaylayın. Şifre ezberlemenize gerek yok.'
    }[filmLang.value],
    tip: {
      ky: 'Кыргызстандын бардык байланыш операторлору колдоого алынат (O!, Beeline, Mega).',
      ru: 'Поддерживаются все операторы связи КР: Mega, O!, Beeline.',
      tr: 'Tüm Kırgızistan mobil operatörleri (O!, Beeline, Mega) desteklenir.'
    }[filmLang.value]
  },
  {
    id: 1,
    number: '02',
    icon: ShieldCheck,
    color: 'from-blue-500 to-indigo-600',
    title: {
      ky: 'Коопсуз KYC Текшерүү (Паспорт жана ID)',
      ru: 'Надежная KYC-Верификация (Паспорт и ID)',
      tr: 'Güvenli KYC Kimlik Doğrulaması'
    }[filmLang.value],
    badge: {
      ky: 'ЭСКРОУ КЕПИЛДИГИ',
      ru: 'ГАРАНТИЯ ЭСКРОУ',
      tr: 'ESCROW GÜVENCESİ'
    }[filmLang.value],
    description: {
      ky: 'Жасалма аккаунттардан коргонуу үчүн өздүк документти тастыктоо. Маалыматтар банк стандартында шифрленет.',
      ru: 'AI-проверка документов защищает участников от мошенников. Данные надежно зашифрованы по стандартам Нацбанка.',
      tr: 'Sahte hesapları önlemek için kimlik teyidi yapılır. Verileriniz bankacılık standardında korunur.'
    }[filmLang.value],
    tip: {
      ky: 'Тастыкталган катышуучуларга DemirBank жана Optima эскроу чектери ачылат.',
      ru: 'Верифицированные пользователи получают доступ к крупным лотам и эскроу-счетам.',
      tr: 'Doğrulanmış kullanıcılar yüksek değerli lotlara ve banka emanetine tam erişim kazanır.'
    }[filmLang.value]
  },
  {
    id: 2,
    number: '03',
    icon: Search,
    color: 'from-emerald-500 to-teal-600',
    title: {
      ky: 'Акылдуу Издөө жана Түз Эфирдеги Лоттор',
      ru: 'Умный Поиск и Лоты в Прямом Эфире',
      tr: 'Akıllı Arama ve Canlı Müzayede Seçimi'
    }[filmLang.value],
    badge: {
      ky: 'ТҮЗ ЭФИР',
      ru: 'ПРЯМОЙ ЭФИР',
      tr: 'CANLI YAYIN'
    }[filmLang.value],
    description: {
      ky: 'Унаалар, электроника, жылкы-малдар жана кыймылсыз мүлк. Баштапкы баалар 1 сомдон башталышы мүмкүн.',
      ru: 'Автомобили, гаджеты, скот и недвижимость. Честные стартовые цены с фото и видеофиксацией.',
      tr: 'Araçlar, teknoloji, canlı hayvan ve gayrimenkul. Şeffaf başlangıç fiyatları ve video incelemeleri.'
    }[filmLang.value],
    tip: {
      ky: 'Антиснайпинг коргоосу жана чыныгы убакытта баа жаңылоо активдүү.',
      ru: 'Фильтры по регионам (Бишкек, Ош, Чуй, Иссык-Куль) и категориям.',
      tr: 'Bölge filtreleri (Bişkek, Oş, Çüy, Issık-Göl) ile anında en yakın ilanları bulun.'
    }[filmLang.value]
  },
  {
    id: 3,
    number: '04',
    icon: Zap,
    color: 'from-amber-500 to-rose-600',
    title: {
      ky: 'Чыныгы Убакытта Коюм Коюу жана Антиснайпинг',
      ru: 'Торги в Реальном Времени и Антиснайпинг',
      tr: 'Canlı Teklif Verme & Anti-Sniping Koruması'
    }[filmLang.value],
    badge: {
      ky: 'АНТИСНАЙПИНГ +2 МҮН',
      ru: 'АНТИСНАЙПИНГ +2 МИН',
      tr: 'ANTİ-SNİPİNG +2 DK'
    }[filmLang.value],
    description: {
      ky: 'WebSocket аркылуу 0.1 секундада баа өсөт. Акыркы секундада коюлса, убакыт автоматтык 2 мүнөткө узартылат.',
      ru: 'Мгновенное обновление ставок без перезагрузки. Ставка на последних секундах продлевает таймер на 2 минуты.',
      tr: 'Sayfayı yenilemeden 0.1 saniyede canlı teklifler akar. Son saniyede teklif gelirse süre 2 dk otomatik uzar.'
    }[filmLang.value],
    tip: {
      ky: 'Бул эреже ботторду токтотуп, чыныгы адамдарга тең укуктуу жеңиш берет.',
      ru: 'Антиснайпинг гарантирует честную борьбу людей, а не скоростных ботов.',
      tr: 'Anti-sniping sistemi botları devre dışı bırakır, gerçek alıcıların hakkını korur.'
    }[filmLang.value]
  },
  {
    id: 4,
    number: '05',
    icon: CreditCard,
    color: 'from-violet-500 to-purple-700',
    title: {
      ky: '100% Коопсуз Банктык Эскроу (MBank & Optima)',
      ru: '100% Банковский Эскроу (MBank, Optima, Demir)',
      tr: '100% Güvenli Banka Emanet Hesabı (Escrow)'
    }[filmLang.value],
    badge: {
      ky: 'ТОҢДУРУЛГАН КАРАЖАТ',
      ru: 'ЗАМОРОЗКА СРЕДСТВ',
      tr: 'BLOKELİ HAVUZ'
    }[filmLang.value],
    description: {
      ky: 'Сиздин акчаңыз сатуучуга дароо берилбейт! Ал DemirBank эскроу-эсебинде сакталып турат.',
      ru: 'Деньги победителя не уходят продавцу сразу! Они блокируются на банковском счете эскроу до передачи товара.',
      tr: 'Ödediğiniz para satıcıya hemen aktarılmaz! Siz ürünü teslim alana kadar DemirBank emanet havuzunda güvendedir.'
    }[filmLang.value],
    tip: {
      ky: 'Эгер товар дал келбесе, акча толугу менен сизге кайтарылып берилет.',
      ru: 'Если товар не соответствует описанию, деньги возвращаются покупателю в полном объеме.',
      tr: 'Ürün ilandaki gibi çıkmazsa paranız anında %100 oranında iade edilir.'
    }[filmLang.value]
  },
  {
    id: 5,
    number: '06',
    icon: Truck,
    color: 'from-emerald-600 to-green-700',
    title: {
      ky: 'Товарды Кабыл Алуу жана Сатуучуга Акча Төлөө',
      ru: 'Получение Товара и Выплата Продавцу',
      tr: 'Ürünü Teslim Alma ve Satıcıya Otomatik Ödeme'
    }[filmLang.value],
    badge: {
      ky: 'КООПСУЗ АЯКТОО',
      ru: 'УСПЕШНАЯ СДЕЛКА',
      tr: 'MUTLU ALIŞVERİŞ'
    }[filmLang.value],
    description: {
      ky: 'Товарды текшерип алып, сайттан "Кабыл алдым" баскычын баскандан кийин гана сатуучуга акча бошотулат.',
      ru: 'Курьер доставляет товар. Покупатель проверяет его, подтверждает получение — и продавец получает выплату.',
      tr: 'Kurye ürünü getirir. Siz kontrol edip onay verdikten sonra emanetteki para satıcının hesabına aktarılır.'
    }[filmLang.value],
    tip: {
      ky: 'Эки тарап тең корголгон: сатып алуучу алданбайт, сатуучу акчасын так алат.',
      ru: 'Обе стороны защищены: покупатель не рискует деньгами, а продавец гарантированно получает оплату.',
      tr: 'İki taraf da güvende: alıcı dolandırılmaz, satıcı parasını kuruşu kuruşuna alır.'
    }[filmLang.value]
  }
])

// Interactive simulated scene states
const simPhone = ref('555 12-34-56')
const simSmsTyped = ref(['8', '4', '9', '1'])
const simCurrentBid = ref(85000)
const simTimerSeconds = ref(4)
const simIsAntisniping = ref(false)
const simPaidSuccess = ref(false)
const simDeliveredSuccess = ref(false)

// Scene Loop Controller
function updatePlayback(timestamp: number) {
  if (!isPlaying.value) {
    lastTimestamp = timestamp
    animationFrameId = requestAnimationFrame(updatePlayback)
    return
  }

  if (lastTimestamp === null) {
    lastTimestamp = timestamp
  }

  const delta = timestamp - lastTimestamp
  lastTimestamp = timestamp

  const effectiveDuration = BASE_SCENE_DURATION / playbackSpeed.value
  const progressIncrement = (delta / effectiveDuration) * 100

  sceneProgress.value += progressIncrement

  // Micro-animations in scenes based on progress
  animateSceneEvents(currentScene.value, sceneProgress.value)

  if (sceneProgress.value >= 100) {
    sceneProgress.value = 0
    if (currentScene.value < scenes.value.length - 1) {
      goToScene(currentScene.value + 1)
    } else {
      // Loop back to start
      goToScene(0)
    }
  }

  animationFrameId = requestAnimationFrame(updatePlayback)
}

function animateSceneEvents(sceneIdx: number, prog: number) {
  if (sceneIdx === 3) { // Bidding scene
    if (prog > 30 && prog < 35 && simTimerSeconds.value > 2) {
      simTimerSeconds.value = 2
    }
    if (prog >= 45 && !simIsAntisniping.value) {
      simIsAntisniping.value = true
      simCurrentBid.value = 86000
      simTimerSeconds.value = 120 // +2 mins added
      playBidChime()
    }
  } else if (sceneIdx === 4) { // Payment scene
    if (prog > 60 && !simPaidSuccess.value) {
      simPaidSuccess.value = true
      playSuccessChime()
    }
  } else if (sceneIdx === 5) { // Delivery scene
    if (prog > 65 && !simDeliveredSuccess.value) {
      simDeliveredSuccess.value = true
      playSuccessChime()
    }
  }
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
  if (idx === 3) {
    simCurrentBid.value = 85000
    simTimerSeconds.value = 4
    simIsAntisniping.value = false
  } else if (idx === 4) {
    simPaidSuccess.value = false
  } else if (idx === 5) {
    simDeliveredSuccess.value = false
  }
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

// User interactive test triggers (allows users to click inside the scene!)
function handleUserTestBid() {
  simCurrentBid.value += 1000
  simIsAntisniping.value = true
  simTimerSeconds.value = 120
  playBidChime()
}

function handleUserTestPay() {
  simPaidSuccess.value = true
  playSuccessChime()
}

function handleUserTestConfirmDelivery() {
  simDeliveredSuccess.value = true
  playSuccessChime()
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
    class="relative rounded-3xl overflow-hidden bg-[#0a0d14] border border-white/10 text-white shadow-2xl transition-all duration-300 select-none w-full"
    :class="{ 'fixed inset-0 z-50 rounded-none h-screen w-screen': isFullscreen }"
  >
    <!-- Background Ambient Glow & Studio Grid -->
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.18),rgba(255,255,255,0))] pointer-events-none" />
    <div class="absolute -top-32 -left-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
    <div class="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
    <div class="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />

    <!-- Cinema Top Navigation & Header Bar -->
    <div class="relative z-10 p-3 sm:p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-black/40 backdrop-blur-md">
      <!-- Title & Live Badge -->
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0">
          <Sparkles class="w-4 h-4" />
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-xs sm:text-sm font-black tracking-tight text-white truncate">
              iTorgo: {{ filmLang === 'ky' ? 'Интерактивдүү Таанытуу Киносу' : (filmLang === 'tr' ? 'İnteraktif Kullanım Rehberi' : 'Интерактивный Фильм-Гид') }}
            </span>
            <span class="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              60 FPS SIMULATION
            </span>
          </div>
          <p class="text-[11px] text-white/50 truncate">
            {{ scenes[currentScene].number }} / 06 · {{ scenes[currentScene].title }}
          </p>
        </div>
      </div>

      <!-- Top Right Controls: Language Switcher, Sound, Fullscreen -->
      <div class="flex items-center gap-1.5 sm:gap-2">
        <!-- 3-Language Selector Inside Player -->
        <div class="flex items-center p-1 rounded-xl bg-white/10 border border-white/10 text-xs font-bold">
          <button
            v-for="lang in (['ru', 'ky', 'tr'] as LangCode[])"
            :key="lang"
            type="button"
            class="px-2 py-1 rounded-lg transition-all cursor-pointer text-[11px]"
            :class="filmLang === lang ? 'bg-amber-400 text-gray-950 font-black shadow-xs' : 'text-white/70 hover:text-white'"
            @click="filmLang = lang; playClickSound()"
          >
            {{ lang === 'ru' ? 'RU 🇷🇺' : (lang === 'ky' ? 'KG 🇰🇬' : 'TR 🇹🇷') }}
          </button>
        </div>

        <!-- Audio Toggle Button -->
        <button
          type="button"
          class="p-2 rounded-xl border transition-all cursor-pointer"
          :class="isSoundOn ? 'bg-amber-400/20 border-amber-400/40 text-amber-300' : 'bg-white/5 border-white/10 text-white/50 hover:text-white'"
          :title="isSoundOn ? (filmLang === 'ky' ? 'Үн күйүк' : (filmLang === 'tr' ? 'Ses açık' : 'Звук включен')) : (filmLang === 'ky' ? 'Үн өчүк' : (filmLang === 'tr' ? 'Ses kapalı' : 'Без звука'))"
          @click="toggleSound"
        >
          <Volume2 v-if="isSoundOn" class="w-4 h-4" />
          <VolumeX v-else class="w-4 h-4" />
        </button>

        <!-- Fullscreen Button -->
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

    <!-- Main Cinema Stage (16:9 Visual Simulation Canvas) -->
    <div class="relative z-10 w-full min-h-[360px] sm:min-h-[440px] lg:min-h-[500px] flex items-center justify-center p-4 sm:p-8 overflow-hidden">
      
      <!-- ================================================================
           SCENE 01: REGISTRATION & SMS CONFIRMATION
           ================================================================ -->
      <div
        v-if="currentScene === 0"
        class="w-full max-w-lg space-y-4 animate-fade-in"
      >
        <div class="relative rounded-3xl bg-gradient-to-b from-[#181c28] to-[#10141f] border border-white/15 p-6 sm:p-8 shadow-2xl space-y-6">
          <div class="flex items-center justify-between border-b border-white/10 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-black">
                <Smartphone class="w-5 h-5" />
              </div>
              <div>
                <h4 class="text-sm font-black text-white">iTorgo Кыргызстан</h4>
                <p class="text-[11px] text-white/50">{{ filmLang === 'ky' ? 'Телефон номери аркылуу кирүү' : (filmLang === 'tr' ? 'Telefon No ile Giriş' : 'Вход по номеру телефона') }}</p>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SMS GATEWAY ONLINE
            </span>
          </div>

          <!-- Phone Number Input with animated typing -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-white/70">{{ filmLang === 'ky' ? 'Телефон номери' : (filmLang === 'tr' ? 'Telefon Numarası' : 'Номер телефона') }}</label>
            <div class="relative flex items-center">
              <span class="absolute left-3.5 text-sm font-bold text-amber-400">🇰🇬 +996</span>
              <div class="w-full bg-black/50 border border-amber-400/50 rounded-2xl pl-20 pr-4 py-3.5 text-sm font-mono font-bold text-white tracking-wider">
                <span>{{ simPhone }}</span>
                <span class="animate-ping inline-block w-1.5 h-4 bg-amber-400 ml-1 align-middle" />
              </div>
            </div>
          </div>

          <!-- Incoming Animated SMS Push Notification Card -->
          <div
            class="p-3.5 rounded-2xl bg-white/10 border border-amber-400/30 backdrop-blur-md flex items-center justify-between gap-3 shadow-lg transform transition-all duration-500"
            :class="sceneProgress > 25 ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl bg-amber-400 text-gray-950 flex items-center justify-center font-black text-xs">
                📩
              </div>
              <div>
                <div class="text-[11px] font-black text-amber-300">iTorgo Security SMS</div>
                <div class="text-xs font-bold text-white">
                  {{ filmLang === 'ky' ? 'Сиздин кодуңуз:' : (filmLang === 'tr' ? 'Giriş kodunuz:' : 'Ваш код входа:') }}
                  <span class="font-mono text-amber-400 tracking-widest text-sm font-black"> 8 4 9 1</span>
                </div>
              </div>
            </div>
            <span class="text-[10px] text-white/40">{{ filmLang === 'ky' ? 'азыр' : (filmLang === 'tr' ? 'şimdi' : 'сейчас') }}</span>
          </div>

          <!-- 4-Digit Code Blocks -->
          <div class="space-y-2">
            <div class="text-xs font-bold text-white/70 text-center">
              {{ filmLang === 'ky' ? 'SMS-код киргизилүүдө:' : (filmLang === 'tr' ? 'SMS Kodu Doğrulanıyor:' : 'Ввод SMS-кода:') }}
            </div>
            <div class="grid grid-cols-4 gap-2.5">
              <div
                v-for="(digit, i) in simSmsTyped"
                :key="i"
                class="h-13 rounded-2xl border flex items-center justify-center font-mono font-black text-xl transition-all duration-300"
                :class="sceneProgress > (35 + i * 12)
                  ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-md scale-105'
                  : 'bg-black/40 border-white/10 text-white/20'"
              >
                {{ sceneProgress > (35 + i * 12) ? digit : '•' }}
              </div>
            </div>
          </div>

          <!-- Success Verified State -->
          <div
            v-if="sceneProgress > 80"
            class="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-bounce"
          >
            <CheckCircle2 class="w-4 h-4" />
            <span>{{ filmLang === 'ky' ? 'Телефон номери ийгиликтүү тастыкталды!' : (filmLang === 'tr' ? 'Telefon başarıyla doğrulandı!' : 'Телефон успешно подтвержден!') }}</span>
          </div>
        </div>
      </div>

      <!-- ================================================================
           SCENE 02: KYC DOCUMENT SCANNING
           ================================================================ -->
      <div
        v-else-if="currentScene === 1"
        class="w-full max-w-lg space-y-4 animate-fade-in"
      >
        <div class="relative rounded-3xl bg-gradient-to-b from-[#181c28] to-[#10141f] border border-white/15 p-6 sm:p-8 shadow-2xl space-y-5 overflow-hidden">
          
          <!-- Laser Scanning Effect Line -->
          <div
            class="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] pointer-events-none transition-all duration-75"
            :style="{ top: `${(sceneProgress * 0.9) % 100}%` }"
          />

          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <div class="flex items-center gap-2.5">
              <ShieldCheck class="w-5 h-5 text-cyan-400" />
              <span class="text-sm font-black text-white">KYC Smart OCR Engine</span>
            </div>
            <span class="text-[10px] font-mono text-cyan-300 font-bold">SCANNING 99.8%</span>
          </div>

          <!-- Mock Kyrgyz ID Card -->
          <div class="relative rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 border border-cyan-400/40 p-4 shadow-xl space-y-3">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div class="w-14 h-16 rounded-xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center text-2xl">
                  👤
                </div>
                <div class="space-y-1">
                  <div class="text-[10px] text-cyan-400 font-mono font-bold">KYRGYZ REPUBLIC ID-CARD</div>
                  <div class="text-xs font-black text-white">ИСЛАМОВ КАХРАМАН</div>
                  <div class="text-[11px] font-mono text-white/60">ПИН: 21509199501234</div>
                  <div class="text-[10px] text-white/40">Бишкек ш. 15.09.1995</div>
                </div>
              </div>
              <div class="text-2xl">🇰🇬</div>
            </div>

            <!-- OCR Extraction Tags -->
            <div class="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px]">
              <div class="flex items-center gap-1 text-emerald-300">
                <Check class="w-3.5 h-3.5" />
                <span>{{ filmLang === 'ky' ? 'Сүрөт дал келди' : (filmLang === 'tr' ? 'Biyometrik Eşleşti' : 'Фото совпало: 99.8%') }}</span>
              </div>
              <div class="flex items-center gap-1 text-emerald-300">
                <Check class="w-3.5 h-3.5" />
                <span>{{ filmLang === 'ky' ? 'Таза тарых' : (filmLang === 'tr' ? 'Temiz Geçmiş' : 'Чистая история') }}</span>
              </div>
            </div>
          </div>

          <!-- Escrow Approved Stamp -->
          <div
            class="p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all duration-500"
            :class="sceneProgress > 60
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(160,185,129,0.2)]'
              : 'bg-white/5 border-white/10 text-white/40'"
          >
            <div class="flex items-center gap-3">
              <Award class="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <div class="text-xs font-black text-white">{{ filmLang === 'ky' ? 'DemirBank Escrow Бекитилди' : (filmLang === 'tr' ? 'DemirBank Escrow Onaylandı' : 'Одобрено для Эскроу DemirBank') }}</div>
                <div class="text-[10px] text-white/60">{{ filmLang === 'ky' ? 'Ири соодаларга толук мүмкүнчүлүк' : (filmLang === 'tr' ? 'Tüm açık artırmalara limitsiz erişim' : 'Допуск к неограниченным торгам') }}</div>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500 text-gray-950">
              VERIFIED
            </span>
          </div>
        </div>
      </div>

      <!-- ================================================================
           SCENE 03: LOT SEARCH & LIVE BROADCAST SELECTION
           ================================================================ -->
      <div
        v-else-if="currentScene === 2"
        class="w-full max-w-lg space-y-4 animate-fade-in"
      >
        <div class="rounded-3xl bg-gradient-to-b from-[#181c28] to-[#10141f] border border-white/15 p-5 sm:p-7 shadow-2xl space-y-4">
          
          <!-- Mock Search Bar -->
          <div class="relative flex items-center">
            <Search class="w-4 h-4 text-amber-400 absolute left-4" />
            <div class="w-full bg-black/60 border border-amber-400/50 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm font-bold text-white flex items-center justify-between">
              <span>Apple MacBook Pro M3 Max / iPhone 15</span>
              <span class="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 text-[10px] font-black font-mono">{{ filmLang === 'ky' ? '12 ЛОТ' : (filmLang === 'tr' ? '12 LOT' : '12 ЛОТОВ') }}</span>
            </div>
          </div>

          <!-- Category Tags -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] font-bold">
            <span class="px-3 py-1 rounded-xl bg-amber-400 text-gray-950 font-black">🔥 {{ filmLang === 'ky' ? 'Түз Эфир' : (filmLang === 'tr' ? 'Canlı Yayında' : 'Прямой эфир') }}</span>
            <span class="px-3 py-1 rounded-xl bg-white/10 text-white/80">💻 {{ filmLang === 'ky' ? 'Гаджеттер' : (filmLang === 'tr' ? 'Teknoloji' : 'Электроника') }}</span>
            <span class="px-3 py-1 rounded-xl bg-white/10 text-white/80">🚗 {{ filmLang === 'ky' ? 'Унаалар' : (filmLang === 'tr' ? 'Arabalar' : 'Авто') }}</span>
          </div>

          <!-- Featured Live Card Preview -->
          <div class="relative rounded-2xl overflow-hidden border border-white/20 bg-slate-900 group shadow-lg">
            <div class="relative h-44 bg-slate-950 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=700&q=80"
                alt="MacBook Pro"
                class="w-full h-full object-cover opacity-80"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              
              <!-- Badges -->
              <div class="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-600 text-white flex items-center gap-1 shadow-md">
                  <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  LIVE 🔴
                </span>
                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 text-white/90 backdrop-blur-md flex items-center gap-1 border border-white/10">
                  <Eye class="w-3 h-3 text-amber-400" />
                  38 {{ filmLang === 'ky' ? 'адам көрүүдө' : (filmLang === 'tr' ? 'kişi izliyor' : 'смотрят') }}
                </span>
              </div>

              <!-- Price Tag Overlay -->
              <div class="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                <div>
                  <div class="text-[10px] text-white/60 font-bold uppercase">{{ filmLang === 'ky' ? 'Учурдагы баа:' : (filmLang === 'tr' ? 'Güncel Fiyat:' : 'Текущая цена:') }}</div>
                  <div class="text-xl font-black text-amber-400 font-mono">85 000 сом</div>
                </div>
                <button
                  type="button"
                  class="px-4 py-2 rounded-xl bg-amber-400 text-gray-950 text-xs font-black shadow-lg hover:scale-105 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>{{ filmLang === 'ky' ? 'Торгго өтүү' : (filmLang === 'tr' ? 'Lota Katıl' : 'Участвовать') }}</span>
                  <ArrowRight class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ================================================================
           SCENE 04: REALTIME BIDDING & ANTI-SNIPING (INTERACTIVE)
           ================================================================ -->
      <div
        v-else-if="currentScene === 3"
        class="w-full max-w-lg space-y-4 animate-fade-in"
      >
        <div class="rounded-3xl bg-gradient-to-b from-[#181c28] to-[#10141f] border border-white/15 p-5 sm:p-7 shadow-2xl space-y-5">
          
          <!-- Live Price & Countdown Display -->
          <div class="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-black/40 border border-white/10">
            <div>
              <div class="text-[10px] font-bold uppercase text-white/50 tracking-wider">
                {{ filmLang === 'ky' ? 'Лидердин коюму:' : (filmLang === 'tr' ? 'Lider Teklif:' : 'Лидирующая ставка:') }}
              </div>
              <div class="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight transition-all duration-300">
                {{ simCurrentBid.toLocaleString('ru-RU') }} сом
              </div>
              <div class="text-[10px] text-emerald-400 font-bold mt-0.5">
                {{ filmLang === 'ky' ? '+1 000 сом кадам' : (filmLang === 'tr' ? '+1.000 KGS artış adımı' : '+1 000 сом шаг ставки') }}
              </div>
            </div>

            <div class="text-right">
              <div class="text-[10px] font-bold uppercase text-white/50 tracking-wider flex items-center justify-end gap-1">
                <Clock class="w-3 h-3 text-rose-400" />
                <span>{{ filmLang === 'ky' ? 'Калган убакыт:' : (filmLang === 'tr' ? 'Kalan Süre:' : 'До конца:') }}</span>
              </div>
              <div
                class="text-2xl sm:text-3xl font-black font-mono tracking-wider transition-colors"
                :class="simTimerSeconds <= 4 ? 'text-rose-500 animate-pulse' : 'text-white'"
              >
                00:{{ simTimerSeconds < 10 ? '0' + simTimerSeconds : simTimerSeconds }}
              </div>
              <div class="text-[10px] text-amber-300 font-bold mt-0.5">
                {{ simIsAntisniping ? (filmLang === 'ky' ? '⚡ +2 МҮНӨТ КОШУЛДУ!' : (filmLang === 'tr' ? '⚡ +2 DK EKLENDİ!' : '⚡ +2 МИНУТЫ ДОБАВЛЕНО!')) : 'Anti-sniping 2.0' }}
              </div>
            </div>
          </div>

          <!-- Anti-Sniping Event Banner -->
          <div
            v-if="simIsAntisniping"
            class="p-3 rounded-2xl bg-amber-400/20 border border-amber-400/50 text-amber-300 text-xs font-bold flex items-center justify-between gap-2 animate-bounce"
          >
            <div class="flex items-center gap-2">
              <Zap class="w-4 h-4 text-amber-400 shrink-0" />
              <span>{{ filmLang === 'ky' ? 'Антиснайпинг иштеди: +2 мүнөт кошулду!' : (filmLang === 'tr' ? 'Anti-sniping tetiklendi: +2 dk eklendi!' : 'Сработал антиснайпинг: +2 минуты добавлено!') }}</span>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-amber-400 text-gray-950 text-[10px] font-black">
              FAIR PLAY
            </span>
          </div>

          <!-- Interactive Action Buttons -->
          <div class="space-y-2">
            <div class="flex items-center justify-between text-[11px] text-white/60">
              <span>{{ filmLang === 'ky' ? 'Ыкчам кадамдар (сыноо үчүн басыңыз):' : (filmLang === 'tr' ? 'Hızlı Teklif Ver (Tıklayıp Deneyin):' : 'Быстрые варианты (нажмите для пробы):') }}</span>
              <span class="text-amber-400 font-bold">{{ filmLang === 'ky' ? 'Сиз лидируете' : (filmLang === 'tr' ? 'Siz Lidersiniz' : 'Вы лидируете') }}</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <button
                type="button"
                class="py-3 px-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-gray-950 font-black text-xs sm:text-sm shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                @click="handleUserTestBid"
              >
                <TrendingUp class="w-4 h-4" />
                <span>+1 000 сом</span>
              </button>
              <button
                type="button"
                class="py-3 px-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                @click="handleUserTestBid"
              >
                +2 000 сом
              </button>
              <button
                type="button"
                class="py-3 px-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                @click="handleUserTestBid"
              >
                +5 000 сом
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ================================================================
           SCENE 05: 100% BANK ESCROW GUARANTEE
           ================================================================ -->
      <div
        v-else-if="currentScene === 4"
        class="w-full max-w-lg space-y-4 animate-fade-in"
      >
        <div class="rounded-3xl bg-gradient-to-b from-[#181c28] to-[#10141f] border border-white/15 p-5 sm:p-7 shadow-2xl space-y-5">
          
          <div class="text-center space-y-1">
            <span class="px-3 py-1 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
              ESCROW THREE-WAY PROTECTION
            </span>
            <h4 class="text-sm sm:text-base font-black text-white">
              {{ filmLang === 'ky' ? 'Акча Банктык Эскроу-Эсепте Тоңдурулат' : (filmLang === 'tr' ? 'Para Banka Emanet Hesabında Bloke Edilir' : 'Деньги Заморожены в Банковском Эскроу') }}
            </h4>
          </div>

          <!-- 3-Pillars Escrow Architecture Diagram -->
          <div class="grid grid-cols-3 gap-2 sm:gap-3 text-center">
            <!-- Buyer -->
            <div class="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
              <div class="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 mx-auto flex items-center justify-center font-bold text-sm">
                👤
              </div>
              <div class="text-xs font-black text-white">{{ filmLang === 'ky' ? 'Сатып алуучу' : (filmLang === 'tr' ? 'Alıcı' : 'Покупатель') }}</div>
              <div class="text-[10px] text-emerald-400 font-bold">MBank / QR</div>
            </div>

            <!-- Vault Center -->
            <div class="p-3 rounded-2xl bg-gradient-to-b from-purple-950/60 to-purple-900/40 border border-purple-400/50 space-y-1.5 relative shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <div class="w-9 h-9 rounded-xl bg-purple-500/30 text-purple-300 mx-auto flex items-center justify-center font-black text-sm">
                🔒
              </div>
              <div class="text-xs font-black text-purple-200">DemirBank Vault</div>
              <div class="text-[10px] text-amber-300 font-bold font-mono">100% BLOCKED</div>
            </div>

            <!-- Seller -->
            <div class="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
              <div class="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center font-bold text-sm">
                🏪
              </div>
              <div class="text-xs font-black text-white">{{ filmLang === 'ky' ? 'Сатуучу' : (filmLang === 'tr' ? 'Satıcı' : 'Продавец') }}</div>
              <div class="text-[10px] text-white/50">{{ filmLang === 'ky' ? 'Текшерүүдөн кийин' : (filmLang === 'tr' ? 'Teslim Sonrası' : 'После проверки') }}</div>
            </div>
          </div>

          <!-- Interactive Payment Mock Action -->
          <div class="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div class="flex items-center justify-between text-xs">
              <span class="text-white/70">{{ filmLang === 'ky' ? 'Төлөм ыкмалары:' : (filmLang === 'tr' ? 'Ödeme Metodu:' : 'Способ оплаты:') }}</span>
              <span class="text-amber-400 font-mono font-bold">MBank • Optima • Demir</span>
            </div>

            <button
              type="button"
              class="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              @click="handleUserTestPay"
            >
              <Lock class="w-4 h-4" />
              <span>{{ simPaidSuccess ? (filmLang === 'ky' ? '✅ Каражат эскроудо сакталды' : (filmLang === 'tr' ? '✅ Tutar Emanet Kasasında Güvende' : '✅ Средства заморожены на эскроу')) : (filmLang === 'ky' ? 'MBank аркылуу коопсуз төлөө (Сыноо)' : (filmLang === 'tr' ? 'MBank Güvenli Öde (Dene)' : 'Безопасно оплатить через MBank (Тест)')) }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ================================================================
           SCENE 06: DELIVERY & AUTOMATIC SELLER PAYOUT
           ================================================================ -->
      <div
        v-else-if="currentScene === 5"
        class="w-full max-w-lg space-y-4 animate-fade-in"
      >
        <div class="rounded-3xl bg-gradient-to-b from-[#181c28] to-[#10141f] border border-white/15 p-5 sm:p-7 shadow-2xl space-y-5">
          
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <div class="flex items-center gap-2.5">
              <Truck class="w-5 h-5 text-emerald-400" />
              <span class="text-sm font-black text-white">iTorgo Express Courier</span>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {{ simDeliveredSuccess ? (filmLang === 'ky' ? 'ЖЕТКИРИЛДИ ЖАНА ТӨЛӨНДҮ' : (filmLang === 'tr' ? 'TESLİM EDİLDİ & ÖDENDİ' : 'ДОСТАВЛЕНО И ОПЛАЧЕНО')) : (filmLang === 'ky' ? 'ЖОЛДО: БИШКЕК ➡️ ОШ' : (filmLang === 'tr' ? 'YOLDA: BİŞKEK ➡️ OŞ' : 'В ПУТИ: БИШКЕК ➡️ ОШ')) }}
            </span>
          </div>

          <!-- Transit Progress Track -->
          <div class="relative py-4">
            <div class="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700 rounded-full"
                :style="{ width: simDeliveredSuccess ? '100%' : `${Math.min(90, sceneProgress * 1.2)}%` }"
              />
            </div>
            <div class="flex justify-between text-[11px] font-bold text-white/60 mt-2">
              <span>📍 {{ filmLang === 'tr' ? 'Bişkek' : 'Бишкек' }}</span>
              <span>🚚 {{ filmLang === 'ky' ? 'Жолдо' : (filmLang === 'tr' ? 'Yolda' : 'В пути') }}</span>
              <span>📍 {{ filmLang === 'ky' ? 'Ош (Дарегине жетти)' : (filmLang === 'tr' ? 'Oş (Teslim edildi)' : 'Ош (Доставлено)') }}</span>
            </div>
          </div>

          <!-- Buyer Confirm & Payout Release Card -->
          <div
            class="p-4 rounded-2xl border space-y-3 transition-all duration-500"
            :class="simDeliveredSuccess
              ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.25)]'
              : 'bg-black/40 border-white/10'"
          >
            <div class="flex items-center justify-between">
              <div>
                <h5 class="text-xs sm:text-sm font-black text-white">
                  {{ filmLang === 'ky' ? 'Товар текшерилди жана кабыл алынды' : (filmLang === 'tr' ? 'Ürün Kontrol Edildi & Onaylandı' : 'Товар проверен и получен') }}
                </h5>
                <p class="text-[11px] text-white/60">
                  {{ filmLang === 'ky' ? 'Сатуучуга 86 000 сом заматта которулду' : (filmLang === 'tr' ? 'Satıcıya 86.000 KGS anında aktarıldı' : 'Продавцу моментально выплачено 86 000 сом') }}
                </p>
              </div>
              <div class="text-xl">⭐️ 5.0</div>
            </div>

            <button
              type="button"
              class="w-full py-3 rounded-xl font-black text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              :class="simDeliveredSuccess
                ? 'bg-emerald-400 text-gray-950 shadow-emerald-500/30'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'"
              @click="handleUserTestConfirmDelivery"
            >
              <CheckCircle2 class="w-4 h-4" />
              <span>{{ simDeliveredSuccess ? (filmLang === 'ky' ? 'Ийгиликтүү Аяктады · 100% Кепилдик' : (filmLang === 'tr' ? 'İşlem Başarıyla Tamamlandı · 100% Güven' : 'Сделка завершена · 100% Гарантия')) : (filmLang === 'ky' ? 'Кабыл алууну тастыктоо (Сыноо)' : (filmLang === 'tr' ? 'Teslimatı Onayla (Dene)' : 'Подтвердить получение (Тест)')) }}</span>
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- Cinema Bottom Controller Bar (Timeline, Scrubber, Play/Pause, Steps) -->
    <div class="relative z-10 p-4 sm:p-6 border-t border-white/10 bg-black/60 backdrop-blur-xl space-y-4">
      
      <!-- Segmented 6-Scene Progress Timeline -->
      <div class="grid grid-cols-6 gap-1.5 sm:gap-2">
        <button
          v-for="(scene, idx) in scenes"
          :key="idx"
          type="button"
          class="group text-left space-y-1 cursor-pointer outline-none focus:outline-none"
          @click="goToScene(idx)"
        >
          <!-- Progress Bar Segment -->
          <div class="h-1.5 sm:h-2 rounded-full overflow-hidden bg-white/15 group-hover:bg-white/30 transition-colors">
            <div
              class="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all"
              :style="{
                width: idx < currentScene
                  ? '100%'
                  : idx === currentScene
                    ? `${sceneProgress}%`
                    : '0%'
              }"
            />
          </div>
          <!-- Step Mini Title for tablet & desktop -->
          <div
            class="hidden md:flex items-center justify-between text-[10px] font-bold transition-colors truncate"
            :class="idx === currentScene ? 'text-amber-300' : 'text-white/40 group-hover:text-white/70'"
          >
            <span class="truncate">{{ scene.number }}. {{ scene.badge }}</span>
          </div>
        </button>
      </div>

      <!-- Playback Navigation & Status Row -->
      <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
        
        <!-- Left: Scene Step Skip & Play/Pause -->
        <div class="flex items-center gap-2">
          <!-- Prev Scene Button -->
          <button
            type="button"
            class="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="currentScene === 0"
            :title="filmLang === 'ky' ? 'Мурунку кадам' : (filmLang === 'tr' ? 'Önceki Adım' : 'Предыдущая сцена')"
            @click="goToScene(currentScene - 1)"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>

          <!-- Primary Play/Pause Button -->
          <button
            type="button"
            class="px-4 sm:px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-gray-950 font-black text-xs sm:text-sm shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            @click="togglePlay"
          >
            <Pause v-if="isPlaying" class="w-4 h-4" />
            <Play v-else class="w-4 h-4 fill-current" />
            <span>{{ isPlaying ? (filmLang === 'ky' ? 'Тыныгуу' : (filmLang === 'tr' ? 'Durdur' : 'Пауза')) : (filmLang === 'ky' ? 'Ойнотуу' : (filmLang === 'tr' ? 'Oynat' : 'Продолжить')) }}</span>
          </button>

          <!-- Next Scene Button -->
          <button
            type="button"
            class="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="currentScene === scenes.length - 1"
            :title="filmLang === 'ky' ? 'Кийинки кадам' : (filmLang === 'tr' ? 'Sonraki Adım' : 'Следующая сцена')"
            @click="goToScene(currentScene + 1)"
          >
            <ChevronRight class="w-4 h-4" />
          </button>

          <!-- Restart / Replay Button -->
          <button
            type="button"
            class="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer"
            :title="filmLang === 'ky' ? 'Башынан баштоо' : (filmLang === 'tr' ? 'Baştan Başlat' : 'Перезапустить с начала')"
            @click="restartFilm"
          >
            <RotateCcw class="w-4 h-4" />
          </button>
        </div>

        <!-- Center: Current Scene Title & Tip -->
        <div class="hidden lg:block text-center flex-1 px-4 min-w-0">
          <p class="text-xs text-white/80 font-medium truncate">
            <span class="text-amber-300 font-bold">💡 {{ filmLang === 'ky' ? 'Кеңеш:' : (filmLang === 'tr' ? 'İpucu:' : 'Совет:') }}</span>
            {{ scenes[currentScene].tip }}
          </p>
        </div>

        <!-- Right: Speed Controller -->
        <div class="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-bold">
          <button
            v-for="speed in [0.75, 1, 1.25, 1.5]"
            :key="speed"
            type="button"
            class="px-2 py-1 rounded-lg text-[11px] transition-all cursor-pointer"
            :class="playbackSpeed === speed ? 'bg-amber-400 text-gray-950 font-black' : 'text-white/60 hover:text-white'"
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
