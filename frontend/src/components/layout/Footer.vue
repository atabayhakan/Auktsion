<script setup lang="ts">
import { useI18n } from '@/composables/useI18n'
import IlbirsIcon from '@/components/icons/IlbirsIcon.vue'

const { t } = useI18n()

const currentYear = new Date().getFullYear()

const footerLinks = {
  platform: [
    { label: 'footer.allAuctions', path: '/auctions' },
    { label: 'footer.allCategories', path: '/categories' },
    { label: 'footer.howItWorks', path: '/how-it-works' },
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
  <footer class="bg-[rgb(var(--color-surface))] border-t border-[rgb(var(--color-border))]" aria-label="Alt bilgi">
    <!-- Main Footer Links -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
        <!-- Brand Column -->
        <div class="col-span-2 md:col-span-1">
          <router-link to="/" class="flex items-center gap-2 mb-4" aria-label="iTorgo Ana Sayfa">
            <div class="w-10 h-10 rounded-xl bg-primary p-1.5 flex items-center justify-center">
              <IlbirsIcon class="w-full h-full text-text-primary" />
            </div>
            <span class="font-bold text-xl text-[rgb(var(--color-text-primary))]">iTorgo</span>
          </router-link>

          <p class="text-[rgb(var(--color-text-secondary))] text-sm leading-relaxed">
            {{ t('footer.tagline') }}
          </p>
        </div>

        <!-- Platform Links -->
        <nav aria-label="Platform">
          <h4 class="font-semibold text-[rgb(var(--color-text-primary))] mb-4">{{ t('footer.platform') }}</h4>
          <ul class="space-y-3">
            <li v-for="link in footerLinks.platform" :key="link.path">
              <router-link
                :to="link.path"
                class="text-sm text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-primary))] transition-colors"
              >
                {{ t(link.label) }}
              </router-link>
            </li>
          </ul>
        </nav>

        <!-- Company Links -->
        <nav aria-label="Şirket">
          <h4 class="font-semibold text-[rgb(var(--color-text-primary))] mb-4">{{ t('footer.company') }}</h4>
          <ul class="space-y-3">
            <li v-for="link in footerLinks.company" :key="link.path">
              <router-link
                :to="link.path"
                class="text-sm text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-primary))] transition-colors"
              >
                {{ t(link.label) }}
              </router-link>
            </li>
          </ul>
        </nav>

        <!-- Legal Links -->
        <nav aria-label="Yasal">
          <h4 class="font-semibold text-[rgb(var(--color-text-primary))] mb-4">{{ t('footer.legal') }}</h4>
          <ul class="space-y-3">
            <li v-for="link in footerLinks.legal" :key="link.path">
              <router-link
                :to="link.path"
                class="text-sm text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-primary))] transition-colors"
              >
                {{ t(link.label) }}
              </router-link>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Bottom Bar -->
    <div class="bg-[rgb(var(--color-background))] border-t border-[rgb(var(--color-border))/0.3]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-[rgb(var(--color-text-muted))]">
          <p>&copy; {{ currentYear }} iTorgo. {{ t('footer.copyright') }}</p>

          <div class="flex flex-wrap items-center justify-center md:justify-end gap-4">
            <router-link
              v-for="link in footerLinks.legal"
              :key="link.path"
              :to="link.path"
              class="hover:text-[rgb(var(--color-primary))] transition-colors"
            >
              {{ t(link.label) }}
            </router-link>
            <span class="text-[rgb(var(--color-border))]">|</span>
            <span>{{ t('footer.currencyLabel') }}</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
