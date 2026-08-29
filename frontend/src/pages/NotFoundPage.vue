<script setup lang="ts">
import { Search, Home, ArrowRight, RefreshCw, Mail } from 'lucide-vue-next'
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from '@/composables/useI18n'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'

const router = useRouter()
const { t } = useI18n()

function goHome() {
  router.push('/')
}

function refreshPage() {
  window.location.reload()
}
</script>

<template>
  <div class="min-h-screen bg-background text-text-primary flex items-center justify-center px-4 py-12">
    <!-- Background -->
    <div class="absolute inset-0 bg-gradient-liquid" />
    <div class="absolute inset-0" aria-hidden="true">
      <div class="absolute top-20 left-10 w-32 h-32 border border-primary/10 rotate-45 animate-float" />
      <div class="absolute bottom-20 right-10 w-24 h-24 border-2 border-primary/10 rounded-full animate-float" style="animation-delay: 1s" />
    </div>

    <div class="relative text-center max-w-md mx-auto animate-fade-in-up">
      <!-- Error Code -->
      <div class="mb-8">
        <span class="text-9xl font-bold text-primary/30">404</span>
      </div>

      <!-- Message -->
      <h1 class="text-3xl font-extrabold text-text-primary mb-4">{{ t('notFoundPage.title') }}</h1>
      <p class="text-text-muted text-lg mb-8">
        {{ t('notFoundPage.description') }}
      </p>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button size="lg" variant="primary" @click="goHome" icon="Home" iconRight>
          {{ t('notFoundPage.goHome') }}
        </Button>
        <Button size="lg" variant="outline" @click="refreshPage" icon="RefreshCw">
          {{ t('notFoundPage.refresh') }}
        </Button>
      </div>

      <!-- Suggestions -->
      <div class="mt-10 pt-8 border-t border-black/10">
        <p class="text-text-muted text-sm mb-4">{{ t('notFoundPage.suggestionsTitle') }}</p>
        <div class="flex flex-wrap justify-center gap-2">
          <RouterLink to="/auctions" class="px-3 py-1.5 rounded-xl bg-white border border-border text-text-secondary hover:text-text-primary hover:border-primary/30 hover:bg-black/5 transition-all text-sm">
            {{ t('notFoundPage.linkAuctions') }}
          </RouterLink>
          <RouterLink to="/categories" class="px-3 py-1.5 rounded-xl bg-white border border-border text-text-secondary hover:text-text-primary hover:border-primary/30 hover:bg-black/5 transition-all text-sm">
            {{ t('notFoundPage.linkCategories') }}
          </RouterLink>
          <RouterLink to="/how-it-works" class="px-3 py-1.5 rounded-xl bg-white border border-border text-text-secondary hover:text-text-primary hover:border-primary/30 hover:bg-black/5 transition-all text-sm">
            {{ t('notFoundPage.linkHowItWorks') }}
          </RouterLink>
          <RouterLink to="/contact" class="px-3 py-1.5 rounded-xl bg-white border border-border text-text-secondary hover:text-text-primary hover:border-primary/30 hover:bg-black/5 transition-all text-sm">
            {{ t('notFoundPage.linkContact') }}
          </RouterLink>
        </div>
      </div>

      <!-- Contact Support -->
      <div class="mt-10 pt-8 border-t border-black/10">
        <p class="text-text-muted text-sm mb-3">{{ t('notFoundPage.supportNotice') }}</p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <RouterLink to="/contact">
            <Button variant="outline" icon="Mail">
              {{ t('notFoundPage.contactFormBtn') }}
            </Button>
          </RouterLink>
          <Button variant="ghost" @click="() => window.open('mailto:' + t('notFoundPage.supportEmail'))">
            {{ t('notFoundPage.supportEmail') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
  opacity: 0;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>