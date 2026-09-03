<script setup lang="ts">
import { useI18n } from '@/composables/useI18n'
import { ShieldCheck, Lock, Smartphone, CreditCard, Mail, MapPin, Building2, Gavel } from 'lucide-vue-next'
import IlbirsIcon from '@/components/icons/IlbirsIcon.vue'

const { t } = useI18n()
const currentYear = new Date().getFullYear()

const footerLinks = {
  platform: [
    { label: 'footer.allAuctions', path: '/auctions' },
    { label: 'footer.allCategories', path: '/categories' },
    { label: 'footer.howItWorks', path: '/how-it-works' },
    { label: 'nav.sell', path: '/sell' },
  ],
  company: [
    { label: 'footer.aboutUs', path: '/about' },
    { label: 'footer.contact', path: '/contact' },
  ],
  legal: [
    { label: 'footer.terms', path: '/terms' },
    { label: 'footer.privacy', path: '/privacy' },
  ],
}
</script>

<template>
  <footer class="bg-white border-t border-black/[0.08] text-gray-900 font-sans" aria-label="Alt bilgi">
    
    <!-- Trust & Payment Methods Banner -->
    <div class="border-b border-black/[0.06] bg-slate-50/70 py-6 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3 text-xs font-bold text-gray-700">
          <div class="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-800 flex items-center justify-center border border-amber-500/20">
            <ShieldCheck class="w-4 h-4" />
          </div>
          <div>
            <p class="font-extrabold text-gray-950">{{ t('footer.nbkrTitle') || 'Kırgızistan Ulusal Bankası AML/CFT Uyumlu' }}</p>
            <p class="text-gray-500 text-[11px]">{{ t('footer.nbkrDesc') || '256-Bit SSL Şifreleme ve DemirBank Escrow Emanet Güvencesi' }}</p>
          </div>
        </div>

        <!-- Bank & Payment Badges -->
        <div class="flex flex-wrap items-center gap-2">
          <span class="px-3 py-1.5 rounded-xl bg-white border border-black/10 text-xs font-black text-emerald-800 shadow-2xs">
            MBank Pay
          </span>
          <span class="px-3 py-1.5 rounded-xl bg-white border border-black/10 text-xs font-black text-rose-800 shadow-2xs">
            Optima Bank
          </span>
          <span class="px-3 py-1.5 rounded-xl bg-white border border-black/10 text-xs font-black text-blue-800 shadow-2xs">
            DemirBank
          </span>
          <span class="px-3 py-1.5 rounded-xl bg-white border border-black/10 text-xs font-black text-gray-800 shadow-2xs">
            Elkart
          </span>
          <span class="px-3 py-1.5 rounded-xl bg-white border border-black/10 text-xs font-bold text-gray-600 shadow-2xs">
            Visa / MC
          </span>
        </div>
      </div>
    </div>

    <!-- Main Footer Columns -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-8">
        
        <!-- Brand & About Column (2 cols wide) -->
        <div class="col-span-2 space-y-4">
          <router-link to="/" class="flex items-center gap-2.5 group" aria-label="iTorgo Ana Sayfa">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 border border-amber-300/30 p-1.5 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-all">
              <IlbirsIcon class="w-full h-full text-gray-950" />
            </div>
            <div class="flex flex-col">
              <span class="font-black text-xl text-gray-950 tracking-tight leading-none flex items-center">
                iTorgo<span class="w-1.5 h-1.5 rounded-full bg-amber-500 ml-1 shrink-0" />
              </span>
              <span class="text-[8.5px] text-gray-400 font-mono font-black uppercase tracking-widest mt-1 leading-none">REAL-TIME PLATFORM</span>
            </div>
          </router-link>

          <p class="text-xs text-gray-500 leading-relaxed max-w-sm">
            {{ t('footer.tagline') || 'Kırgızistan\'ın 1 numaralı online açık artırma platformu. MBank, Optima Bank ve DemirBank güvencesiyle %100 güvenli işlemler.' }}
          </p>

          <div class="pt-2 space-y-1.5 text-xs text-gray-500 font-medium">
            <div class="flex items-center gap-2">
              <MapPin class="w-3.5 h-3.5 text-gray-400" />
              <span>Bişkek, Kırgızistan Cumhuriyeti</span>
            </div>
            <div class="flex items-center gap-2">
              <Mail class="w-3.5 h-3.5 text-gray-400" />
              <span>support@itorgo.kg</span>
            </div>
          </div>
        </div>

        <!-- Platform Links -->
        <nav aria-label="Platform" class="space-y-3">
          <h4 class="font-black text-xs uppercase tracking-wider text-gray-900">{{ t('footer.platform') || 'Platform' }}</h4>
          <ul class="space-y-2.5">
            <li v-for="link in footerLinks.platform" :key="link.path">
              <router-link
                :to="link.path"
                class="text-xs font-bold text-gray-500 hover:text-gray-950 hover:underline transition-colors"
              >
                {{ t(link.label) }}
              </router-link>
            </li>
          </ul>
        </nav>

        <!-- Company Links -->
        <nav aria-label="Şirket" class="space-y-3">
          <h4 class="font-black text-xs uppercase tracking-wider text-gray-900">{{ t('footer.company') || 'Şirket' }}</h4>
          <ul class="space-y-2.5">
            <li v-for="link in footerLinks.company" :key="link.path">
              <router-link
                :to="link.path"
                class="text-xs font-bold text-gray-500 hover:text-gray-950 hover:underline transition-colors"
              >
                {{ t(link.label) }}
              </router-link>
            </li>
          </ul>
        </nav>

        <!-- Legal Links -->
        <nav aria-label="Yasal" class="space-y-3">
          <h4 class="font-black text-xs uppercase tracking-wider text-gray-900">{{ t('footer.legal') || 'Yasal Bilgiler' }}</h4>
          <ul class="space-y-2.5">
            <li v-for="link in footerLinks.legal" :key="link.path">
              <router-link
                :to="link.path"
                class="text-xs font-bold text-gray-500 hover:text-gray-950 hover:underline transition-colors"
              >
                {{ t(link.label) }}
              </router-link>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Bottom Bar -->
    <div class="bg-slate-50 border-t border-black/[0.06]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-gray-500">
          <p>&copy; {{ currentYear }} iTorgo. {{ t('footer.copyright') || 'Tüm hakları saklıdır. Kırgızistan, Bişkek' }}</p>

          <div class="flex flex-wrap items-center gap-4">
            <router-link
              v-for="link in footerLinks.legal"
              :key="link.path"
              :to="link.path"
              class="hover:text-gray-950 transition-colors"
            >
              {{ t(link.label) }}
            </router-link>
            <span class="text-gray-300">|</span>
            <span class="font-mono font-bold text-gray-700">KGS (Сом)</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
