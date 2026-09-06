<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Compass,
  Flame,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Loader2,
  RotateCcw
} from 'lucide-vue-next'
import { useFeatureStore } from '@/stores/feature'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const router = useRouter()
const featureStore = useFeatureStore()

const promptInput = ref('')
const inputEl = ref<HTMLInputElement | null>(null)
const messagesContainer = ref<HTMLDivElement | null>(null)
const isLoading = ref(false)

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  recommendedAuctions?: Array<{
    id: string
    title: string
    currentPrice: number
    category: string
    city: string
    imageUrl: string
  }>
}

const messages = ref<ChatMessage[]>([
  {
    role: 'assistant',
    content: 'Саламатсызбы! Мен iTorgo акылдуу соода жардамчысымын. Кандай товар издеп жатасыз? Бюджетиңизди же талаптарыңызды жазыңыз, мен сизге ылайыктуу лотторду тандап берем! 🛍️'
  }
])

const quickChips = [
  'iPhone 13 же 14 арзан баада',
  'Бишкекте растаможкасы бар унаалар',
  'Арашан породасындагы кочкорлор',
  'Бүгүн бүтө турган кызуу аукциондор'
]

watch(() => props.modelValue, (open) => {
  if (open) {
    nextTick(() => {
      inputEl.value?.focus()
      scrollToBottom()
    })
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

function close() {
  emit('update:modelValue', false)
}

function resetChat() {
  messages.value = [
    {
      role: 'assistant',
      content: 'Маек жаңыртылды. Сизге кайсы товар же категория боюнча кеңеш керек?'
    }
  ]
}

async function sendQuery(text?: string) {
  const query = (text || promptInput.value).trim()
  if (!query || isLoading.value) return

  promptInput.value = ''
  messages.value.push({ role: 'user', content: query })
  scrollToBottom()

  isLoading.value = true
  try {
    const history = messages.value.slice(-6).map(m => ({ role: m.role, content: m.content }))
    const res = await featureStore.askAiAssistant(query, history)

    messages.value.push({
      role: 'assistant',
      content: res.reply,
      recommendedAuctions: res.recommendedAuctions
    })
  } catch (err) {
    // Fallback response with suggested category search
    messages.value.push({
      role: 'assistant',
      content: `Сиздин сурооңуз боюнча платформадагы актуалдуу лоттор текшерилди. "${query}" боюнча жаңы сунуштарды көрүү үчүн каталокторду карап чыгууну сунуштайм.`,
      recommendedAuctions: []
    })
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
        @click.self="close"
      >
        <div class="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-black/10 overflow-hidden flex flex-col h-[640px] max-h-[92vh] animate-scale-in">
          <!-- Header -->
          <div class="p-4 sm:p-5 bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 text-white shrink-0 relative flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center shadow-lg text-gray-950">
                <Bot class="w-5 h-5" />
              </div>
              <div>
                <div class="flex items-center gap-1.5">
                  <h3 class="text-base font-black tracking-tight">Akıllı Alışveriş Asistanı</h3>
                  <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-gray-950">AI COPILOT</span>
                </div>
                <p class="text-[11px] text-gray-400">Сиздин жеке шопинг кеңешчиңиз</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Чататты тазалоо"
                @click="resetChat"
              >
                <RotateCcw class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                @click="close"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Messages Stream Container -->
          <div
            ref="messagesContainer"
            class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50"
          >
            <div
              v-for="(msg, i) in messages"
              :key="i"
              class="flex flex-col space-y-2"
              :class="msg.role === 'user' ? 'items-end' : 'items-start'"
            >
              <div class="flex items-start gap-2.5 max-w-[88%]">
                <!-- Avatar -->
                <div
                  v-if="msg.role === 'assistant'"
                  class="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs shadow-2xs mt-0.5"
                >
                  <Sparkles class="w-3.5 h-3.5" />
                </div>

                <!-- Text Bubble -->
                <div
                  class="rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-2xs whitespace-pre-wrap"
                  :class="msg.role === 'user'
                    ? 'bg-amber-400 text-gray-950 font-medium rounded-tr-xs'
                    : 'bg-white text-gray-800 border border-black/5 rounded-tl-xs'"
                >
                  {{ msg.content }}
                </div>
              </div>

              <!-- Recommended Lot Cards Carousel/Grid -->
              <div
                v-if="msg.recommendedAuctions && msg.recommendedAuctions.length > 0"
                class="w-full pl-9 pr-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1"
              >
                <RouterLink
                  v-for="lot in msg.recommendedAuctions"
                  :key="lot.id"
                  :to="`/auctions/${lot.id}`"
                  class="p-2.5 rounded-2xl bg-white hover:bg-amber-500/[0.04] border border-black/5 hover:border-amber-400/50 transition-all flex items-center gap-3 shadow-2xs group"
                  @click="close"
                >
                  <img
                    :src="lot.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=160&auto=format&fit=crop&q=80'"
                    :alt="lot.title"
                    class="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div class="min-w-0 flex-1">
                    <h4 class="text-xs font-bold text-gray-900 truncate group-hover:text-amber-800">
                      {{ lot.title }}
                    </h4>
                    <span class="text-xs font-black text-amber-700 font-mono block mt-0.5">
                      {{ lot.currentPrice?.toLocaleString() }} сом
                    </span>
                    <span class="text-[10px] text-gray-400 block truncate">
                      {{ lot.city }} • {{ lot.category }}
                    </span>
                  </div>
                  <ArrowUpRight class="w-4 h-4 text-gray-300 group-hover:text-amber-600 shrink-0" />
                </RouterLink>
              </div>
            </div>

            <!-- Loading Spinner -->
            <div v-if="isLoading" class="flex items-center gap-2 pl-9 text-xs text-gray-400 font-medium">
              <Loader2 class="w-3.5 h-3.5 animate-spin text-amber-500" />
              <span>Сунуштар талданууда...</span>
            </div>
          </div>

          <!-- Quick Chips Bar (shown if enabled in admin) -->
          <div
            v-if="featureStore.config.aiAssistant.showSuggestions"
            class="px-4 py-2 bg-white border-t border-black/[0.04] flex items-center gap-1.5 overflow-x-auto shrink-0"
          >
            <button
              v-for="chip in quickChips"
              :key="chip"
              type="button"
              class="px-3 py-1 rounded-xl bg-black/[0.03] hover:bg-amber-100 hover:text-amber-900 border border-black/5 text-[11px] font-semibold text-gray-600 transition-all whitespace-nowrap cursor-pointer"
              @click="sendQuery(chip)"
            >
              {{ chip }}
            </button>
          </div>

          <!-- Input Footer -->
          <div class="p-3 sm:p-4 bg-white border-t border-black/[0.06] shrink-0">
            <div class="relative flex items-center">
              <input
                ref="inputEl"
                v-model="promptInput"
                type="text"
                placeholder="Мисалы: 20 000 сомго телефон сунуштаңыз..."
                class="w-full bg-black/[0.03] border border-black/10 focus:border-amber-400 focus:bg-white rounded-2xl pl-4 pr-12 py-3 text-xs sm:text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition-all"
                :disabled="isLoading"
                @keydown.enter="sendQuery()"
                @keydown.esc="close"
              />
              <button
                type="button"
                :disabled="!promptInput.trim() || isLoading"
                class="absolute right-2 p-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-gray-950 transition-all cursor-pointer shadow-xs disabled:opacity-40"
                @click="sendQuery()"
              >
                <Send class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.animate-scale-in {
  animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
