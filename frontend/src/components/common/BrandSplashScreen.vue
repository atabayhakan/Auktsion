<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useFeatureStore } from '@/stores/feature'
import { useI18n } from '@/composables/useI18n'
import IlbirsIcon from '@/components/icons/IlbirsIcon.vue'

const featureStore = useFeatureStore()
const { t } = useI18n()

const isVisible = ref(false)
const isExiting = ref(false)
const progressWidth = ref(0)
let exitTimer: ReturnType<typeof setTimeout> | null = null
let animationFrame: number | null = null

const splashConfig = computed(() => featureStore.splashScreenConfig)
const durationMs = computed(() => splashConfig.value?.durationMs || 2000)
const tagline = computed(() => splashConfig.value?.taglineText || t('splash.tagline') || 'КЫРГЫЗСТАН • REAL-TIME AUCTION PLATFORM')
const canShowSkip = computed(() => splashConfig.value?.showSkipButton ?? true)

onMounted(() => {
  // Check if enabled by admin
  if (!featureStore.isSplashScreenEnabled) {
    isVisible.value = false
    return
  }

  // Check session storage if oncePerSession is true
  if (splashConfig.value?.oncePerSession) {
    const hasSeen = sessionStorage.getItem('itorgo_splash_seen')
    if (hasSeen === 'true') {
      isVisible.value = false
      return
    }
  }

  // Show splash
  isVisible.value = true

  // Start progress bar animation
  const startTime = performance.now()
  const duration = durationMs.value

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime
    const p = Math.min(100, (elapsed / duration) * 100)
    progressWidth.value = p

    if (p < 100 && isVisible.value && !isExiting.value) {
      animationFrame = requestAnimationFrame(step)
    }
  }
  animationFrame = requestAnimationFrame(step)

  // Schedule automatic exit
  exitTimer = setTimeout(() => {
    triggerExit()
  }, duration)
})

onUnmounted(() => {
  if (exitTimer) clearTimeout(exitTimer)
  if (animationFrame) cancelAnimationFrame(animationFrame)
})

function triggerExit() {
  if (isExiting.value) return
  isExiting.value = true

  if (splashConfig.value?.oncePerSession) {
    try {
      sessionStorage.setItem('itorgo_splash_seen', 'true')
    } catch {
      // Ignore private mode quota error
    }
  }

  setTimeout(() => {
    isVisible.value = false
  }, 500)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="splash-fade">
      <div 
        v-if="isVisible" 
        class="fixed inset-0 z-[999999] bg-[#07090E] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden transition-all duration-500 ease-out"
        :class="{ 'opacity-0 scale-[1.03] filter blur-[2px] pointer-events-none': isExiting }"
        role="dialog"
        aria-label="iTorgo Splash Screen"
      >
        <!-- Background Ambient Radial Illuminations -->
        <div class="absolute inset-0 bg-radial from-amber-500/15 via-transparent to-transparent pointer-events-none" />
        <div class="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-amber-500/10 filter blur-3xl pointer-events-none" />
        <div class="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-amber-600/10 filter blur-3xl pointer-events-none" />

        <!-- High-Tech Ambient Grid Lines (subtle) -->
        <div 
          class="absolute inset-0 opacity-[0.03] pointer-events-none"
          style="background-image: radial-gradient(circle, #F59E0B 1px, transparent 1px); background-size: 32px 32px;"
        />

        <!-- Top Right Skip Button -->
        <button
          v-if="canShowSkip"
          type="button"
          class="absolute top-6 right-6 z-20 px-3.5 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] text-white/80 hover:text-white text-xs font-semibold backdrop-blur-md border border-white/10 transition-all cursor-pointer shadow-sm active:scale-95"
          @click="triggerExit"
        >
          <span>{{ t('splash.skip') || 'Пропустить ✕' }}</span>
        </button>

        <!-- Main Content Core -->
        <div class="relative z-10 flex flex-col items-center max-w-sm mx-auto space-y-7">
          
          <!-- Ilbirs Centerpiece Box with Orbital Pulsing Rings -->
          <div class="relative flex items-center justify-center">
            
            <!-- Outer Pulsing Radar Ring -->
            <div 
              class="absolute -inset-6 sm:-inset-8 rounded-full border border-amber-500/20 animate-ping pointer-events-none" 
              style="animation-duration: 2.2s;" 
            />
            
            <!-- Rotating Golden Orbital Arc -->
            <div 
              class="absolute -inset-3 sm:-inset-4 rounded-full border border-amber-500/40 animate-spin border-t-amber-300 border-r-transparent border-b-transparent pointer-events-none" 
              style="animation-duration: 3s;" 
            />
            
            <!-- Core Emblem Frame -->
            <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 p-0.5 shadow-[0_0_50px_rgba(245,158,11,0.35)] relative overflow-hidden group">
              <!-- Internal dark glass container -->
              <div class="w-full h-full rounded-[22px] bg-[#0A0D14] flex items-center justify-center p-4 sm:p-5 relative overflow-hidden">
                
                <!-- Laser Shimmer Beam across Ilbirs -->
                <div 
                  class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer pointer-events-none" 
                />
                
                <IlbirsIcon class="w-full h-full text-amber-400 drop-shadow-[0_2px_12px_rgba(245,158,11,0.5)] transform group-hover:scale-105 transition-transform" />
              </div>
            </div>
          </div>

          <!-- Brand Typography & Status Indicator -->
          <div class="space-y-2">
            <div class="flex items-center justify-center text-3xl sm:text-4xl font-black text-white tracking-tight">
              <span>iTorgo</span>
              <span class="inline-block w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 ml-1.5 shadow-[0_0_12px_#F59E0B] animate-pulse" />
              <span class="text-amber-500 text-sm sm:text-base font-mono font-bold ml-1">.kg</span>
            </div>

            <p class="text-[10px] sm:text-xs uppercase font-mono font-black tracking-[0.25em] text-amber-400/90 leading-tight">
              {{ tagline }}
            </p>
          </div>

          <!-- Sleek Micro Progress Bar -->
          <div class="w-36 sm:w-44 h-1 rounded-full bg-white/10 overflow-hidden relative shadow-inner">
            <div 
              class="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-300 rounded-full transition-all duration-75 ease-out shadow-[0_0_10px_#F59E0B]"
              :style="{ width: `${progressWidth}%` }"
            />
          </div>

        </div>

      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 1.8s infinite cubic-bezier(0.4, 0, 0.2, 1);
}

.splash-fade-enter-active,
.splash-fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.splash-fade-enter-from {
  opacity: 0;
  transform: scale(0.98);
}

.splash-fade-leave-to {
  opacity: 0;
  transform: scale(1.04);
}
</style>
