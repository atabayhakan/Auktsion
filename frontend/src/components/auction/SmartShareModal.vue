<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  X, Copy, Check, QrCode, Mail, MessageSquare, 
  Share2, ExternalLink, ShieldCheck, Sparkles 
} from 'lucide-vue-next'
import { useI18n } from '@/composables/useI18n'
import { useUIStore } from '@/stores/ui'

const props = defineProps<{
  modelValue: boolean
  lotId: string
  title: string
  price?: string
  imageUrl?: string
  sellerName?: string
  categoryName?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()
const uiStore = useUIStore()

const copied = ref(false)
const showQr = ref(false)

const currentUrl = computed(() => {
  if (typeof window === 'undefined') return ''
  if (props.lotId && !window.location.pathname.includes(props.lotId)) {
    return `${window.location.origin}/auctions/${props.lotId}`
  }
  return window.location.href
})

const shareMessage = computed(() => {
  const tmpl = t('shareSheet.shareMessage') || 'Посмотрите этот лот на аукционе iTorgo: {title} за {price}. Ссылка: {url}'
  return tmpl
    .replace('{title}', props.title || 'Лот')
    .replace('{price}', props.price || '')
    .replace('{url}', currentUrl.value)
})

const canNativeShare = computed(() => {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
})

function close() {
  showQr.value = false
  emit('update:modelValue', false)
}

function handleCopyLink() {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(currentUrl.value).then(() => {
      copied.value = true
      uiStore.toastSuccess(t('shareSheet.copied') || 'Ссылка скопирована!', currentUrl.value)
      setTimeout(() => copied.value = false, 2500)
    }).catch(() => {
      copied.value = true
      setTimeout(() => copied.value = false, 2500)
    })
  } else {
    copied.value = true
    setTimeout(() => copied.value = false, 2500)
  }
}

function shareWhatsApp() {
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage.value)}`
  window.open(url, '_blank')
}

function shareTelegram() {
  const shortText = `${props.title}${props.price ? ' • ' + props.price : ''}`
  const url = `https://t.me/share/url?url=${encodeURIComponent(currentUrl.value)}&text=${encodeURIComponent(shortText)}`
  window.open(url, '_blank')
}

function shareEmail() {
  const subject = `${props.title} — iTorgo Аукцион`
  const body = `${shareMessage.value}`
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function shareSMS() {
  window.location.href = `sms:?&body=${encodeURIComponent(shareMessage.value)}`
}

async function shareNative() {
  if (canNativeShare.value) {
    try {
      await navigator.share({
        title: props.title,
        text: shareMessage.value,
        url: currentUrl.value
      })
    } catch {
      // User cancelled native share sheet
    }
  }
}

const qrCodeUrl = computed(() => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentUrl.value)}&margin=10`
})
</script>

<template>
  <Teleport to="body">
    <div 
      v-if="modelValue" 
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity"
    >
      <!-- Backdrop with iOS blur -->
      <div 
        class="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity" 
        @click="close" 
      />

      <!-- iOS Style Sheet Container -->
      <div 
        class="relative w-full sm:max-w-md bg-[#F2F2F7] dark:bg-[#1C1C1E] rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in slide-in-from-bottom-6 duration-200 border border-black/10 dark:border-white/10"
        role="dialog"
        aria-modal="true"
      >
        <!-- iOS Sheet Grabber / Drag Indicator -->
        <div class="pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing sm:hidden">
          <div class="w-10 h-1.5 rounded-full bg-black/20 dark:bg-white/20" />
        </div>

        <!-- Sheet Header -->
        <div class="px-5 pt-2 pb-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Share2 class="w-4 h-4 text-blue-600" />
            <h3 class="text-sm font-bold text-gray-900 dark:text-white">
              {{ t('shareSheet.title') || 'Поделиться лотом' }}
            </h3>
          </div>
          <button 
            type="button" 
            class="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
            @click="close"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- iOS Rich Link Preview Card -->
        <div class="mx-4 mb-4 p-3 bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-xs border border-black/5 dark:border-white/5 flex items-center gap-3">
          <div class="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0 border border-black/5 flex items-center justify-center">
            <img 
              v-if="imageUrl" 
              :src="imageUrl" 
              :alt="title" 
              class="w-full h-full object-cover" 
            />
            <Sparkles v-else class="w-6 h-6 text-amber-500" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
              <ShieldCheck class="w-3 h-3 text-emerald-500" />
              <span>itorgo.kg • {{ categoryName || 'Аукцион' }}</span>
            </div>
            <h4 class="text-xs font-bold text-gray-900 dark:text-white truncate mt-0.5">
              {{ title }}
            </h4>
            <div class="flex items-center gap-2 mt-1">
              <span v-if="price" class="text-xs font-black text-emerald-600 dark:text-emerald-400">
                {{ price }}
              </span>
              <span v-if="sellerName" class="text-[10px] text-gray-400 truncate">
                {{ sellerName }}
              </span>
            </div>
          </div>
        </div>

        <!-- App Icons Grid (iOS Style Share Row) -->
        <div class="px-4 mb-4">
          <div class="grid grid-cols-5 gap-2 text-center">
            
            <!-- WhatsApp -->
            <button 
              type="button" 
              class="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
              @click="shareWhatsApp"
            >
              <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-md group-hover:scale-105 group-active:scale-95 transition-all">
                <svg class="w-6 h-6 sm:w-7 sm:h-7 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
              </div>
              <span class="text-[11px] font-medium text-gray-700 dark:text-gray-300">WhatsApp</span>
            </button>

            <!-- Telegram -->
            <button 
              type="button" 
              class="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
              @click="shareTelegram"
            >
              <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#229ED9] text-white flex items-center justify-center shadow-md group-hover:scale-105 group-active:scale-95 transition-all">
                <svg class="w-6 h-6 sm:w-7 sm:h-7 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.34-.674.34l.202-3.036 5.563-5.023c.242-.216-.053-.336-.374-.122l-6.877 4.331-2.943-.919c-.64-.201-.653-.64.135-.947l11.503-4.432c.533-.195.998.13.965.836z"/>
                </svg>
              </div>
              <span class="text-[11px] font-medium text-gray-700 dark:text-gray-300">Telegram</span>
            </button>

            <!-- Messages / SMS -->
            <button 
              type="button" 
              class="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
              @click="shareSMS"
            >
              <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#34C759] text-white flex items-center justify-center shadow-md group-hover:scale-105 group-active:scale-95 transition-all">
                <MessageSquare class="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span class="text-[11px] font-medium text-gray-700 dark:text-gray-300">{{ t('shareSheet.sms') || 'SMS' }}</span>
            </button>

            <!-- Mail -->
            <button 
              type="button" 
              class="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
              @click="shareEmail"
            >
              <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#007AFF] text-white flex items-center justify-center shadow-md group-hover:scale-105 group-active:scale-95 transition-all">
                <Mail class="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span class="text-[11px] font-medium text-gray-700 dark:text-gray-300">{{ t('shareSheet.email') || 'Mail' }}</span>
            </button>

            <!-- Native iOS/Android or QR -->
            <button 
              v-if="canNativeShare"
              type="button" 
              class="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
              @click="shareNative"
            >
              <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gray-700 text-white flex items-center justify-center shadow-md group-hover:scale-105 group-active:scale-95 transition-all">
                <Share2 class="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span class="text-[11px] font-medium text-gray-700 dark:text-gray-300">{{ t('shareSheet.systemShare') || 'Еще' }}</span>
            </button>

            <!-- QR Code Button (if not native share) -->
            <button 
              v-else
              type="button" 
              class="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
              @click="showQr = !showQr"
            >
              <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gray-700 text-white flex items-center justify-center shadow-md group-hover:scale-105 group-active:scale-95 transition-all">
                <QrCode class="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span class="text-[11px] font-medium text-gray-700 dark:text-gray-300">QR-код</span>
            </button>

          </div>
        </div>

        <!-- Secondary Actions Card (iOS Style List) -->
        <div class="mx-4 mb-4 bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-xs border border-black/5 dark:border-white/5 divide-y divide-gray-100 dark:divide-white/5 overflow-hidden">
          
          <!-- Copy Link Action -->
          <button 
            type="button" 
            class="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
            @click="handleCopyLink"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 flex items-center justify-center">
                <Check v-if="copied" class="w-4 h-4 text-emerald-600" />
                <Copy v-else class="w-4 h-4" />
              </div>
              <div>
                <span class="text-xs font-bold text-gray-900 dark:text-white block">
                  {{ copied ? (t('shareSheet.copied') || 'Ссылка скопирована!') : (t('shareSheet.copyLink') || 'Скопировать ссылку') }}
                </span>
                <span class="text-[11px] text-gray-400 truncate max-w-[220px] block">
                  {{ currentUrl }}
                </span>
              </div>
            </div>
            <span 
              class="text-xs font-semibold px-2 py-0.5 rounded-md transition-all"
              :class="copied ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300'"
            >
              {{ copied ? 'OK' : 'Copy' }}
            </span>
          </button>

          <!-- Toggle QR Code Action -->
          <button 
            type="button" 
            class="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
            @click="showQr = !showQr"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 flex items-center justify-center">
                <QrCode class="w-4 h-4" />
              </div>
              <span class="text-xs font-bold text-gray-900 dark:text-white">
                {{ showQr ? 'Скрыть QR-код' : (t('shareSheet.qrCode') || 'Показать QR-код') }}
              </span>
            </div>
            <span class="text-xs text-blue-600 dark:text-blue-400 font-semibold">
              {{ showQr ? '▲' : '▼' }}
            </span>
          </button>

        </div>

        <!-- Expandable QR Code Section -->
        <div v-if="showQr" class="mx-4 mb-4 p-4 bg-white dark:bg-[#2C2C2E] rounded-2xl text-center space-y-2.5 border border-black/5 dark:border-white/5">
          <div class="inline-block p-2 bg-white rounded-xl shadow-xs border border-gray-100">
            <img 
              :src="qrCodeUrl" 
              alt="QR Code" 
              class="w-40 h-40 mx-auto" 
              loading="lazy" 
            />
          </div>
          <p class="text-[11px] text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
            {{ t('shareSheet.scanToOpen') || 'Отсканируйте камерой смартфона для перехода к лоту' }}
          </p>
        </div>

        <!-- iOS Bottom Cancel Button -->
        <div class="p-4 pt-1">
          <button 
            type="button" 
            class="w-full py-3 rounded-2xl bg-white dark:bg-[#2C2C2E] text-blue-600 dark:text-blue-400 font-bold text-sm text-center shadow-xs border border-black/5 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 active:scale-[0.99] transition-all cursor-pointer"
            @click="close"
          >
            {{ t('shareSheet.close') || 'Отмена' }}
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>
