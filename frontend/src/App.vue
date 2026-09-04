<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from '@/components/layout/Header.vue'
import Footer from '@/components/layout/Footer.vue'
import MobileBottomNav from '@/components/layout/MobileBottomNav.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const route = useRoute()
const isAdminRoute = computed(() => route.path.startsWith('/admin'))
// The auction detail page gets its own sticky bid bar on mobile instead —
// two competing fixed bottom bars would fight for the same thumb real estate.
const showMobileNav = computed(() => !isAdminRoute.value && route.name !== 'AuctionDetail')
</script>

<template>
  <div class="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-background text-text-primary font-sans antialiased">
    <!-- Fixed Header (public & user routes) -->
    <Header v-if="!isAdminRoute" />
    
    <!-- Main Content -->
    <main id="main-content" role="main" class="flex-1 w-full max-w-full overflow-x-hidden" :class="{ 'pb-24 lg:pb-0': showMobileNav }">
      <RouterView v-slot="{ Component }">
        <transition name="page" :duration="300">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>

    <!-- Footer (public & user routes) -->
    <Footer v-if="!isAdminRoute" />

    <!-- Mobile Bottom Navigation (public & user routes, not on auction detail) -->
    <MobileBottomNav v-if="showMobileNav" />

    
    <!-- Global Toast Container -->
    <ToastContainer />
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