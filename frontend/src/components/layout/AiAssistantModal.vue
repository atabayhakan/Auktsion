<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  Sparkles, X, ArrowRight, Bot, Compass, Flame, ShieldCheck, Zap
} from 'lucide-vue-next'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const router = useRouter()
const promptInput = ref('')
const inputEl = ref<HTMLInputElement | null>(null)

const suggestions = [
  {
    icon: Flame,
    title: 'Горячие аукционы',
    desc: 'Лоты, завершающиеся в ближайшие 2 часа с активной борьбой',
    action: () => {
      close()
      router.push({ path: '/auctions', query: { sort: 'ending_soon', status: 'live' } })
    }
  },
  {
    icon: Sparkles,
    title: 'Флагманские смартфоны',
    desc: 'iPhone и Samsung с официальным IMEI в Бишкеке',
    action: () => {
      close()
      router.push({ path: '/auctions', query: { category: 'electronics', search: 'iPhone' } })
    }
  },
  {
    icon: Compass,
    title: 'Авто с растаможкой в КР',
    desc: 'Toyota, Lexus, электромобили с чистой историей',
    action: () => {
      close()
      router.push({ path: '/auctions', query: { category: 'vehicles', search: 'Растаможен' } })
    }
  },
  {
    icon: ShieldCheck,
    title: 'Племенной скот Арашан',
    desc: 'Породистые бараны и лошади от проверенных фермеров',
    action: () => {
      close()
      router.push({ path: '/auctions', query: { category: 'livestock', search: 'Арашан' } })
    }
  }
]

watch(() => props.modelValue, (open) => {
  if (open) {
    nextTick(() => inputEl.value?.focus())
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

function close() {
  emit('update:modelValue', false)
}

function handleAsk() {
  const query = promptInput.value.trim()
  if (!query) return
  close()
  router.push({ path: '/auctions', query: { search: query } })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="close"
      >
        <div class="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-black/10 overflow-hidden animate-scale-in">
          <!-- Header -->
          <div class="p-6 bg-gradient-to-br from-gray-950 via-gray-900 to-slate-900 text-white relative">
            <button
              type="button"
              class="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              @click="close"
            >
              <X class="w-4 h-4" />
            </button>

            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center shadow-lg text-gray-950">
                <Bot class="w-6 h-6" />
              </div>
              <div>
                <div class="flex items-center gap-1.5">
                  <h3 class="text-lg font-black tracking-tight">ITOrgo AI Assistant</h3>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-gray-950">2026</span>
                </div>
                <p class="text-xs text-gray-400 mt-0.5">Умный поиск товаров, сравнение ставок и экспертный подбор</p>
              </div>
            </div>

            <!-- Input Box -->
            <div class="mt-5 relative flex items-center">
              <input
                ref="inputEl"
                v-model="promptInput"
                type="text"
                placeholder="Что вы хотите найти или купить?"
                class="w-full bg-white/10 border border-white/20 focus:border-amber-400 focus:bg-white/15 rounded-2xl px-4 py-3 text-sm font-medium text-white placeholder-gray-400 outline-none pr-12 transition-all"
                @keydown.enter="handleAsk"
                @keydown.esc="close"
              />
              <button
                type="button"
                class="absolute right-2 p-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-gray-950 transition-all cursor-pointer shadow-xs"
                @click="handleAsk"
              >
                <ArrowRight class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Body Suggestions -->
          <div class="p-5 space-y-3 bg-slate-50/50">
            <div class="text-[11px] font-black uppercase text-gray-400 tracking-wider">
              Быстрые сценарии
            </div>
            <div class="grid grid-cols-1 gap-2">
              <button
                v-for="sug in suggestions"
                :key="sug.title"
                type="button"
                class="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-black/5 flex items-center gap-3.5 transition-all text-left shadow-2xs group cursor-pointer"
                @click="sug.action"
              >
                <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <component :is="sug.icon" class="w-5 h-5" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-black text-gray-900 group-hover:text-amber-800 transition-colors">
                    {{ sug.title }}
                  </div>
                  <div class="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                    {{ sug.desc }}
                  </div>
                </div>
                <ArrowRight class="w-4 h-4 text-gray-300 group-hover:text-amber-600 transition-colors" />
              </button>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-3.5 bg-white border-t border-black/[0.06] text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
            <Zap class="w-3.5 h-3.5 text-amber-500" />
            <span>Прямой поиск по всей базе актуальных лотов Кыргызстана</span>
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
