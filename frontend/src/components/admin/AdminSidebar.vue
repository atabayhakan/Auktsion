<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
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
  Settings,
  Globe,
  ExternalLink,
  Shield,
  FolderOpen,
  Palette
} from 'lucide-vue-next'
import { useAdminStore } from '@/stores/admin'
import IlbirsIcon from '@/components/icons/IlbirsIcon.vue'
import { useI18n } from '@/composables/useI18n'
import { usePublicSiteUrl } from '@/composables/usePublicSiteUrl'

const route = useRoute()
const adminStore = useAdminStore()
const { t } = useI18n()
const publicSiteUrl = usePublicSiteUrl('/')

const navSections = computed(() => [
  {
    title: 'ANA MERKEZ & CANLI',
    items: [
      {
        name: 'Genel Bakış',
        path: '/admin/overview',
        icon: LayoutDashboard,
        badge: null
      },
      {
        name: 'Canlı İzleme (War Room)',
        path: '/admin/monitoring',
        icon: Activity,
        badge: null
      },
      {
        name: 'Analitik & Raporlar',
        path: '/admin/analytics',
        icon: BarChart3,
        badge: null
      }
    ]
  },
  {
    title: 'OPERASYON & MODERASYON',
    items: [
      {
        name: 'Kullanıcılar',
        path: '/admin/users',
        icon: Users,
        badge: null
      },
      {
        name: 'İlan Moderasyonu',
        path: '/admin/listings',
        icon: Gavel,
        badge: adminStore.listings.filter(l => l.status === 'pending_approval').length || null,
        badgeColor: 'bg-amber-500 text-white'
      },
      {
        name: 'KYC Doğrulama',
        path: '/admin/kyc',
        icon: ShieldCheck,
        badge: adminStore.pendingKycCount || null,
        badgeColor: 'bg-blue-500 text-white'
      },
      {
        name: 'Uyuşmazlıklar & Şikayetler',
        path: '/admin/disputes',
        icon: AlertCircle,
        badge: adminStore.openDisputesCount || null,
        badgeColor: 'bg-rose-500 text-white'
      }
    ]
  },
  {
    title: 'FİNANS, MEDYA & TASARIM',
    items: [
      {
        name: 'Finanslar & Ödemeler',
        path: '/admin/financials',
        icon: Wallet,
        badge: adminStore.pendingPayoutsCount || null,
        badgeColor: 'bg-purple-500 text-white'
      },
      {
        name: 'Medya Kütüphanesi',
        path: '/admin/media',
        icon: FolderOpen,
        badge: null
      },
      {
        name: 'Site Tasarımı & Stüdyo',
        path: '/admin/design',
        icon: Palette,
        badge: 'YENİ',
        badgeColor: 'bg-primary text-text-primary font-black'
      }
    ]
  }
])

function isActive(path: string) {
  if (path === '/admin/overview') {
    return route.path === '/admin' || route.path === '/admin/overview'
  }
  return route.path.startsWith(path)
}

function handleNavClick() {
  if (window.innerWidth < 768) {
    adminStore.sidebarCollapsed = true
  }
}
</script>

<template>
  <aside 
    :class="[
      'bg-white/95 backdrop-blur-xl text-text-secondary flex flex-col transition-all duration-300 ease-in-out border-r border-black/[0.08] select-none shrink-0 shadow-sm',
      // Mobile (< md): Fixed off-canvas drawer
      'fixed inset-y-0 left-0 z-40 w-72 h-full',
      adminStore.sidebarCollapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0',
      // Desktop (>= md): Sticky sidebar
      'md:static md:z-30 md:min-h-screen md:sticky md:top-0 md:h-screen',
      adminStore.sidebarCollapsed ? 'md:w-20' : 'md:w-64 lg:md:w-72'
    ]"
  >
    <!-- Brand Header -->
    <div class="h-16 flex items-center justify-between px-4 border-b border-black/[0.06]">
      <a :href="publicSiteUrl" class="flex items-center gap-3 overflow-hidden">
        <div class="w-10 h-10 rounded-xl bg-primary p-2 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
          <IlbirsIcon class="w-full h-full text-text-primary" />
        </div>
        <div v-if="!adminStore.sidebarCollapsed" class="flex flex-col truncate">
          <span class="font-extrabold text-text-primary text-base tracking-tight">iTorgo Admin</span>
          <span class="text-[11px] text-text-muted font-medium tracking-wide">Yönetim Paneli Suite</span>
        </div>
      </a>

      <!-- Collapse / Expand Toggle Button -->
      <button 
        type="button"
        class="hidden md:flex p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-accent transition-colors"
        :title="adminStore.sidebarCollapsed ? 'Menüyü Genişlet' : 'Menüyü Daralt'"
        @click="adminStore.toggleSidebar"
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
          <span class="text-text-secondary font-semibold">Sistem Çevrimiçi</span>
          <span class="text-[10px] text-text-muted font-mono">Bishkek UTC+6</span>
        </div>
      </div>
    </div>

    <!-- Grouped Main Navigation Items -->
    <nav class="flex-1 px-3 py-2 space-y-4 overflow-y-auto custom-scrollbar">
      <div v-for="(section, sIdx) in navSections" :key="sIdx" class="space-y-1">
        <!-- Section Header -->
        <div
          v-if="!adminStore.sidebarCollapsed"
          class="px-3 py-1 text-[10px] font-extrabold text-text-muted/80 uppercase tracking-wider"
        >
          {{ section.title }}
        </div>

        <!-- Section Items -->
        <router-link
          v-for="item in section.items"
          :key="item.path"
          :to="item.path"
          :class="[
            'flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-sm transition-all relative group',
            isActive(item.path)
              ? 'bg-primary text-text-primary font-bold shadow-md shadow-primary/20'
              : 'text-text-secondary hover:text-text-primary hover:bg-black/5'
          ]"
          :title="item.name"
          @click="handleNavClick"
        >
          <!-- Icon -->
          <component :is="item.icon" class="w-4 h-4 shrink-0" />

          <!-- Title -->
          <span v-if="!adminStore.sidebarCollapsed" class="truncate flex-1 text-xs">
            {{ item.name }}
          </span>

          <!-- Badge -->
          <span
            v-if="item.badge"
            :class="[
              'text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0',
              item.badgeColor || 'bg-accent text-text-secondary',
              adminStore.sidebarCollapsed ? 'absolute -top-1 -right-1 ring-2 ring-white' : ''
            ]"
          >
            {{ item.badge }}
          </span>

          <!-- Tooltip for collapsed mode -->
          <div
            v-if="adminStore.sidebarCollapsed"
            class="absolute left-full ml-2 px-2.5 py-1 bg-white text-text-primary text-xs rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 border border-black/10 font-bold"
          >
            {{ item.name }}
          </div>
        </router-link>
      </div>
    </nav>

    <!-- Bottom Actions: Site Genel Ayarları & Siteyi Gör -->
    <div class="p-3 border-t border-black/[0.06] space-y-1.5 bg-black/[0.01]">
      <!-- 1. Site Genel Ayarları -->
      <router-link
        to="/admin/settings"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all relative group',
          isActive('/admin/settings')
            ? 'bg-primary text-text-primary font-bold shadow-md shadow-primary/20'
            : 'text-text-secondary hover:text-text-primary hover:bg-black/5'
        ]"
        :title="'Site Genel Ayarları'"
        @click="handleNavClick"
      >
        <Settings class="w-4 h-4 shrink-0 text-text-primary" />
        <span v-if="!adminStore.sidebarCollapsed" class="truncate flex-1 text-xs font-bold text-text-primary">
          Site Genel Ayarları
        </span>
        <div
          v-if="adminStore.sidebarCollapsed"
          class="absolute left-full ml-2 px-2.5 py-1 bg-white text-text-primary text-xs rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 border border-black/10 font-bold"
        >
          Site Genel Ayarları
        </div>
      </router-link>

      <!-- 2. Siteyi Gör (Open Public Site in New Tab) -->
      <a
        :href="publicSiteUrl"
        target="_blank"
        rel="noopener noreferrer"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-primary/10 hover:border-primary/30 border border-border bg-white shadow-xs transition-all',
          adminStore.sidebarCollapsed ? 'justify-center' : ''
        ]"
        :title="'Siteyi Canlı Gör'"
      >
        <Globe class="w-4 h-4 shrink-0 text-primary" />
        <span v-if="!adminStore.sidebarCollapsed" class="truncate flex-1">
          Siteyi Gör
        </span>
        <ExternalLink v-if="!adminStore.sidebarCollapsed" class="w-3.5 h-3.5 text-text-muted" />
      </a>

      <!-- Security / AML Tag -->
      <div
        v-if="!adminStore.sidebarCollapsed"
        class="bg-black/5 rounded-lg p-2 border border-black/[0.04] text-[10px] text-text-muted flex items-center gap-2 mt-1"
      >
        <Shield class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span class="truncate">%100 Escrow & AML Güvencesi</span>
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
