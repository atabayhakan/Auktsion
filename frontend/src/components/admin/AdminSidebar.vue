<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard,
  Users,
  Gavel,
  AlertCircle,
  ShieldCheck,
  Wallet,
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Shield,
  Image
} from 'lucide-vue-next'
import { useAdminStore } from '@/stores/admin'
import IlbirsIcon from '@/components/icons/IlbirsIcon.vue'
import { useI18n } from '@/composables/useI18n'
import { usePublicSiteUrl } from '@/composables/usePublicSiteUrl'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()
const { t } = useI18n()
const publicSiteUrl = usePublicSiteUrl('/')

const navItems = computed(() => [
  {
    name: t('admin.nav.overview'),
    shortName: t('admin.sidebar.collapse'),
    path: '/admin/overview',
    icon: LayoutDashboard,
    badge: null
  },
  {
    name: t('admin.nav.users'),
    shortName: t('admin.nav.users'),
    path: '/admin/users',
    icon: Users,
    badge: null
  },
  {
    name: t('admin.nav.listings'),
    shortName: t('admin.nav.listings'),
    path: '/admin/listings',
    icon: Gavel,
    badge: adminStore.listings.filter(l => l.status === 'pending_approval').length || null,
    badgeColor: 'bg-amber-500 text-white'
  },
  {
    name: t('admin.nav.disputes'),
    shortName: t('admin.nav.disputes'),
    path: '/admin/disputes',
    icon: AlertCircle,
    badge: adminStore.openDisputesCount || null,
    badgeColor: 'bg-rose-500 text-white'
  },
  {
    name: t('admin.nav.kyc'),
    shortName: t('admin.nav.kyc'),
    path: '/admin/kyc',
    icon: ShieldCheck,
    badge: adminStore.pendingKycCount || null,
    badgeColor: 'bg-blue-500 text-white'
  },
  {
    name: t('admin.nav.financials'),
    shortName: t('admin.nav.financials'),
    path: '/admin/financials',
    icon: Wallet,
    badge: adminStore.pendingPayoutsCount || null,
    badgeColor: 'bg-purple-500 text-white'
  },
  {
    name: t('admin.nav.monitoring'),
    shortName: t('admin.nav.monitoring'),
    path: '/admin/monitoring',
    icon: Activity,
    badge: null
  },
  {
    name: t('admin.nav.analytics'),
    shortName: t('admin.nav.analytics'),
    path: '/admin/analytics',
    icon: BarChart3,
    badge: null
  },
  {
    name: t('admin.nav.media'),
    shortName: t('admin.nav.media'),
    path: '/admin/media',
    icon: Image,
    badge: null
  }
])

function isActive(path: string) {
  if (path === '/admin/overview') {
    return route.path === '/admin' || route.path === '/admin/overview'
  }
  return route.path.startsWith(path)
}
</script>

<template>
  <aside 
    :class="[
      'bg-white/95 backdrop-blur-xl text-text-secondary flex flex-col transition-all duration-300 ease-in-out border-r border-black/[0.08] z-30 select-none shrink-0 min-h-screen sticky top-0 h-screen shadow-sm',
      adminStore.sidebarCollapsed ? 'w-20' : 'w-64 lg:w-72'
    ]"
  >
    <!-- Brand Header -->
    <div class="h-16 flex items-center justify-between px-4 border-b border-black/[0.06]">
      <a :href="publicSiteUrl" class="flex items-center gap-3 overflow-hidden">
        <div class="w-10 h-10 rounded-xl bg-primary p-2 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
          <IlbirsIcon class="w-full h-full text-text-primary" />
        </div>
        <div v-if="!adminStore.sidebarCollapsed" class="flex flex-col truncate">
          <span class="font-extrabold text-text-primary text-base tracking-tight">iTorgo</span>
          <span class="text-[11px] text-text-muted font-medium tracking-wide">{{ t('admin.sidebar.systemOnline') }}</span>
        </div>
      </a>

      <!-- Collapse / Expand Toggle Button -->
      <button 
        @click="adminStore.toggleSidebar"
        type="button"
        class="hidden md:flex p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-accent transition-colors"
        :title="adminStore.sidebarCollapsed ? t('admin.sidebar.expand') : t('admin.sidebar.collapse')"
      >
        <ChevronRight v-if="adminStore.sidebarCollapsed" class="w-4 h-4" />
        <ChevronLeft v-else class="w-4 h-4" />
      </button>
    </div>

    <!-- Live Status Pill (War Room Indicator) -->
    <div class="px-3 py-2.5">
      <div
        :class="[
          'rounded-lg bg-black/5 border border-black/[0.06] flex items-center gap-2.5 transition-all',
          adminStore.sidebarCollapsed ? 'justify-center p-2' : 'px-3 py-2'
        ]"
      >
        <span class="relative flex h-2.5 w-2.5 shrink-0">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <div v-if="!adminStore.sidebarCollapsed" class="flex items-center justify-between w-full text-xs">
          <span class="text-text-secondary font-medium">{{ t('admin.sidebar.systemOnline') }}</span>
          <span class="text-[10px] text-text-muted font-mono">Bishkek UTC+6</span>
        </div>
      </div>
    </div>

    <!-- Main Navigation Items -->
    <nav class="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
      <div v-if="!adminStore.sidebarCollapsed" class="px-3 py-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
        {{ t('admin.sidebar.collapse') }} (9)
      </div>

      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all relative group',
          isActive(item.path)
            ? 'bg-primary text-text-primary font-semibold shadow-md shadow-primary/30'
            : 'text-text-secondary hover:text-text-primary hover:bg-accent'
        ]"
        :title="item.name"
      >
        <!-- Icon -->
        <component :is="item.icon" class="w-5 h-5 shrink-0" />

        <!-- Title -->
        <span v-if="!adminStore.sidebarCollapsed" class="truncate flex-1">
          {{ item.name }}
        </span>

        <!-- Badge -->
        <span
          v-if="item.badge"
          :class="[
            'text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0',
            item.badgeColor || 'bg-accent text-text-secondary',
            adminStore.sidebarCollapsed ? 'absolute -top-1 -right-1 ring-2 ring-white' : ''
          ]"
        >
          {{ item.badge }}
        </span>

        <!-- Tooltip for collapsed mode -->
        <div
          v-if="adminStore.sidebarCollapsed"
          class="absolute left-full ml-2 px-2.5 py-1 bg-white text-text-primary text-xs rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 border border-black/10"
        >
          {{ item.name }}
        </div>
      </router-link>
    </nav>

    <!-- Bottom Actions & Return to Marketplace -->
    <div class="p-3 border-t border-black/[0.06] space-y-2">
      <!-- Return to Main Site -->
      <a
        :href="publicSiteUrl"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-accent transition-colors',
          adminStore.sidebarCollapsed ? 'justify-center' : ''
        ]"
        :title="t('admin.sidebar.returnToSite')"
      >
        <ArrowLeft class="w-4 h-4 shrink-0 text-primary" />
        <span v-if="!adminStore.sidebarCollapsed" class="truncate font-semibold text-text-primary">
          {{ t('admin.sidebar.returnToSite') }}
        </span>
      </a>

      <!-- Security / Regulatory Tag -->
      <div
        v-if="!adminStore.sidebarCollapsed"
        class="bg-accent rounded-lg p-2.5 border border-border text-[11px] text-text-muted flex items-start gap-2"
      >
        <Shield class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span class="text-text-secondary font-medium block">{{ t('admin.sidebar.systemOnline') }}</span>
          <span>{{ t('admin.sidebar.amlNotice') }}</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 4px;
}
</style>
