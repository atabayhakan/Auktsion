<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Home, Store, Radio, Heart, User } from 'lucide-vue-next'
import { useAuctionStore } from '@/stores/auction'
import { useUserStore } from '@/stores/user'
import { useI18n } from '@/composables/useI18n'

const route = useRoute()
const auctionStore = useAuctionStore()
const userStore = useUserStore()
const { t } = useI18n()

onMounted(() => {
  if (auctionStore.auctions.length === 0) {
    auctionStore.fetchAuctions()
  }
})

// Same real signal as the rest of the "live" surface this session — count of
// active auctions that have at least one bid, not a fabricated viewer count.
const liveCount = computed(() =>
  auctionStore.auctions.filter(a => a.status === 'active' && a.bidCount > 0).length
)

const items = computed(() => [
  { to: '/', label: t('nav.home'), icon: Home, match: (p: string) => p === '/' },
  { to: '/auctions', label: t('nav.auctions'), icon: Store, match: (p: string) => p === '/auctions' },
  { to: '/auctions?status=live', label: t('nav.liveAuctions'), icon: Radio, match: (p: string) => p === '/auctions' && route.query.status === 'live', badge: liveCount.value },
  { to: userStore.isAuthenticated ? '/dashboard/watchlist' : '/login', label: t('dashboard.watchlist'), icon: Heart, match: (p: string) => p === '/dashboard/watchlist' },
  { to: userStore.isAuthenticated ? '/dashboard' : '/login', label: t('nav.myProfile'), icon: User, match: (p: string) => p.startsWith('/dashboard') && p !== '/dashboard/watchlist' },
])

function isActive(item: { match: (p: string) => boolean }) {
  return item.match(route.path)
}
</script>

<template>
  <nav
    class="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 backdrop-blur-lg border-t border-border shadow-[0_-2px_12px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]"
    aria-label="Mobile navigation"
  >
    <div class="grid grid-cols-5">
      <RouterLink
        v-for="item in items"
        :key="item.label"
        :to="item.to"
        class="relative flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[44px] text-[11px] font-semibold transition-colors"
        :class="isActive(item) ? 'text-primary' : 'text-text-muted'"
      >
        <span class="relative">
          <component :is="item.icon" class="w-5 h-5" />
          <span
            v-if="item.badge"
            class="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-[3px] rounded-full bg-error text-white text-[9px] font-bold flex items-center justify-center leading-none"
          >
            {{ item.badge > 9 ? '9+' : item.badge }}
          </span>
        </span>
        <span>{{ item.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>
