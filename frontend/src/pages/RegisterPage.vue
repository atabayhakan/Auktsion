<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useUIStore } from '@/stores/ui'
import { useI18n } from '@/composables/useI18n'
import { AlertCircle, Loader2, ArrowRight } from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import IlbirsIcon from '@/components/icons/IlbirsIcon.vue'

const router = useRouter()
const userStore = useUserStore()
const uiStore = useUIStore()
const { t } = useI18n()

const fullName = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const confirmPassword = ref('')
const agreeTerms = ref(true)

const error = ref<string | null>(null)
const isLoading = ref(false)

async function handleSubmit() {
  isLoading.value = true
  error.value = null
  
  try {
    if (!fullName.value.trim()) throw new Error(t('auth.nameRequired'))
    if (!phone.value.trim()) throw new Error(t('auth.phoneRequired'))
    if (!email.value.trim()) throw new Error(t('auth.emailRequired'))
    if (password.value.length < 6) throw new Error(t('auth.passwordLength'))
    if (password.value !== confirmPassword.value) throw new Error(t('auth.passwordMismatch'))
    if (!agreeTerms.value) throw new Error(t('auth.termsRequired'))

    await userStore.register({
      fullName: fullName.value,
      email: email.value,
      phone: phone.value,
      password: password.value,
    })
    uiStore.toastSuccess(t('auth.registerSuccess'), t('auth.registerSuccessDesc'))

    const redirect = (router.currentRoute.value.query.redirect as string) || '/dashboard'
    await router.push(redirect)
    if (router.currentRoute.value.name === 'Register') {
      // Navigation was bounced back to Register by a guard; surface it instead of
      // leaving the form silently stuck with no feedback.
      throw new Error(t('auth.registerError'))
    }
  } catch (err: any) {
    error.value = err.message || t('auth.registerError')
    uiStore.toastError(t('common.error'), error.value || t('auth.checkCredentials'))
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#f8f9fa] text-text-primary flex items-center justify-center px-4 py-20 font-sans">
    
    <div class="relative w-full max-w-md space-y-6">
      
      <!-- Brand Header -->
      <div class="text-center space-y-3">
        <RouterLink to="/" class="inline-flex items-center gap-2 group">
          <div class="w-11 h-11 rounded-2xl bg-primary p-2 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center">
            <IlbirsIcon class="w-full h-full text-text-primary" />
          </div>
          <span class="font-bold text-2xl text-text-primary tracking-tight">
            iTorgo <span class="text-primary text-xs px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/30">KG</span>
          </span>
        </RouterLink>

        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-text-primary">
            {{ t('auth.registerTitle') }}
          </h1>
          <p class="text-xs sm:text-sm text-text-secondary mt-1">
            {{ t('auth.registerSubtitle') }}
          </p>
        </div>
      </div>

      <!-- Auth Form Card -->
      <div class="glass p-6 sm:p-8 rounded-3xl border border-black/[0.08] bg-white/95 shadow-sm space-y-5">
        
        <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
          
          <div v-if="error" class="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle class="w-4 h-4 flex-shrink-0" />
            <span>{{ error }}</span>
          </div>

          <div>
            <label class="block text-xs font-bold text-text-secondary mb-1.5">{{ t('auth.fullName') }} *</label>
            <Input
              v-model="fullName"
              :placeholder="t('auth.fullNamePlaceholder')"
              autocomplete="name"
            />
          </div>
          
          <div>
            <label class="block text-xs font-bold text-text-secondary mb-1.5">{{ t('auth.phone') }} *</label>
            <Input
              v-model="phone"
              :placeholder="t('auth.phonePlaceholder')"
              autocomplete="tel"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-text-secondary mb-1.5">{{ t('auth.email') }} *</label>
            <Input
              v-model="email"
              type="email"
              :placeholder="t('auth.emailPlaceholder')"
              autocomplete="email"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-text-secondary mb-1.5">{{ t('auth.password') }} *</label>
            <Input
              v-model="password"
              type="password"
              :placeholder="t('auth.passwordPlaceholder')"
              autocomplete="new-password"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-text-secondary mb-1.5">{{ t('auth.confirmPassword') }} *</label>
            <Input
              v-model="confirmPassword"
              type="password"
              :placeholder="t('auth.confirmPasswordPlaceholder')"
              autocomplete="new-password"
            />
          </div>

          <div class="flex items-start gap-2 pt-1">
            <input
              id="terms"
              v-model="agreeTerms"
              type="checkbox"
              class="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label for="terms" class="text-xs text-text-secondary">
              {{ t('auth.agreeTerms') }} <RouterLink to="/terms" class="text-primary hover:underline font-semibold">{{ t('termsPage.title') }}</RouterLink> & <RouterLink to="/privacy" class="text-primary hover:underline font-semibold">{{ t('privacyPage.title') }}</RouterLink>
            </label>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-3 px-5 rounded-2xl bg-primary text-text-primary font-extrabold text-sm hover:bg-primary-hover shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
          >
            <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
            <span>{{ t('auth.registerBtn') }}</span>
            <ArrowRight v-if="!isLoading" class="w-4 h-4" />
          </button>

          <div class="text-center pt-2 text-xs text-text-secondary">
            <span>{{ t('auth.haveAccount') }}</span>
            <RouterLink 
              to="/login"
              class="text-amber-700 font-bold hover:underline ml-1.5"
            >
              {{ t('auth.goToLogin') }}
            </RouterLink>
          </div>

        </form>

      </div>

    </div>
  </div>
</template>