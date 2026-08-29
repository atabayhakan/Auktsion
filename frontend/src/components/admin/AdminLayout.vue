<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminSidebar from './AdminSidebar.vue'
import AdminHeader from './AdminHeader.vue'
import { useAdminStore } from '@/stores/admin'

const adminStore = useAdminStore()
const route = useRoute()

// This layout mounts once per session (Vue Router layouts don't remount on
// child-route navigation), so a plain onMounted fetch would leave the
// sidebar badges and live-monitoring feed stale for the rest of the
// session. Watching the route path instead refreshes them on every page
// change; `immediate: true` covers the initial load too.
watch(() => route.path, () => {
  adminStore.fetchOverview()
  adminStore.fetchMonitoring()
}, { immediate: true })
</script>

<template>
  <div class="min-h-screen bg-background text-text-primary flex flex-row antialiased font-sans">
    <!-- Admin Sidebar -->
    <AdminSidebar />

    <!-- Main Content Shell -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Admin Top Header -->
      <AdminHeader />

      <!-- Page Content Area -->
      <main class="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto max-w-[1600px] w-full mx-auto">
        <router-view v-slot="{ Component }">
          <transition name="admin-fade" :duration="200">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-fade-enter-active,
.admin-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.admin-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.admin-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
