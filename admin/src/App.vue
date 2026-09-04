<script setup lang="ts">
import ToastContainer from '@/components/ui/ToastContainer.vue'
</script>

<template>
  <div class="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-slate-950 text-slate-100 font-sans antialiased">
    <main id="main-content" role="main" class="flex-1 w-full max-w-full">
      <RouterView v-slot="{ Component }">
        <transition name="page" :duration="200">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>

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