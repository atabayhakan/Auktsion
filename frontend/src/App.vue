<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Bot, Sparkles } from 'lucide-vue-next'
import Header from '@/components/layout/Header.vue'
import Footer from '@/components/layout/Footer.vue'
import MobileBottomNav from '@/components/layout/MobileBottomNav.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import AiAssistantModal from '@/components/layout/AiAssistantModal.vue'
import BrandSplashScreen from '@/components/common/BrandSplashScreen.vue'
import { useFeatureStore } from '@/stores/feature'
import { useI18n } from '@/composables/useI18n'

const route = useRoute()
const { t } = useI18n()
const featureStore = useFeatureStore()
const showAiAssistant = ref(false)

onMounted(() => {
  featureStore.fetchFeaturesConfig()
  featureStore.fetchBanksConfig()
})

// The auction detail page gets its own sticky bid bar on mobile instead —
// two competing fixed bottom bars would fight for the same thumb real estate.
const showMobileNav = computed(() => route.name !== 'AuctionDetail')
</script>

<template>
  <div class="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-background text-text-primary font-sans antialiased">
    <!-- Fixed Header -->
    <Header />
    
    <!-- Main Content -->
    <main id="main-content" role="main" class="flex-1 w-full max-w-full overflow-x-hidden" :class="{ 'pb-24 lg:pb-0': showMobileNav }">
      <RouterView v-slot="{ Component }">
        <transition name="page" :duration="300">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>

    <!-- Footer -->
    <Footer />

    <!-- Mobile Bottom Navigation (not on auction detail) -->
    <MobileBottomNav v-if="showMobileNav" />

    <!-- Floating AI Shopping Assistant Button (controlled via Admin Feature Flags) -->
    <button
      v-if="featureStore.isAiAssistantEnabled"
      type="button"
      class="fixed bottom-20 lg:bottom-7 right-5 z-40 p-3.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-gray-950 font-black text-xs shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border-2 border-white/50 backdrop-blur-md cursor-pointer group"
      @click="showAiAssistant = true"
      :title="t('modules.aiAssistant.title')"
    >
      <div class="relative">
        <Bot class="w-5 h-5 text-gray-950" />
        <span class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse"></span>
      </div>
      <span class="hidden sm:inline font-black tracking-tight">{{ t('modules.aiAssistant.floatingButton') }}</span>
    </button>

    <!-- AI Assistant Modal -->
    <AiAssistantModal v-if="featureStore.isAiAssistantEnabled" v-model="showAiAssistant" />
    
    <!-- Global Toast Container -->
    <ToastContainer />

    <!-- 2-Second Cinematic Brand Splash Screen (Admin Configurable) -->
    <BrandSplashScreen />
  </div>
</template>

<style scoped>
.page-enter-active,
.page-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>