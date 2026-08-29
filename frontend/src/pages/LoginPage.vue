<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useUIStore } from '@/stores/ui'
import { useI18n } from '@/composables/useI18n'
import { Mail, Lock, User, AlertCircle, Loader2, Sparkles, ArrowRight, ShieldCheck } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import IlbirsIcon from '@/components/icons/IlbirsIcon.vue'

const router = useRouter()
const userStore = useUserStore()
const uiStore = useUIStore()
const { t } = useI18n()

const isLogin = ref(true)
const email = ref('ulan@itorgo.kg')
const password = ref('DemoPass123!')
const fullName = ref('')
const phone = ref('')
const confirmPassword = ref('')
const agreeTerms = ref(true)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const error = ref<string | null>(null)
const isLoading = ref(false)

async function handleSubmit() {
  isLoading.value = true
  error.value = null
  
  try {
    if (isLogin.value) {
      await userStore.login({ email: email.value, password: password.value })
      uiStore.toastSuccess(t('auth.loginSuccess'), t('auth.loginSuccessDesc'))
    } else {
      if (!fullName.value.trim()) throw new Error(t('auth.nameRequired'))
      if (!phone.value.trim()) throw new Error(t('auth.phoneRequired'))
      if (password.value !== confirmPassword.value) throw new Error(t('auth.passwordMismatch'))
      if (!agreeTerms.value) throw new Error(t('auth.termsRequired'))

      await userStore.register({
        fullName: fullName.value,
        email: email.value,
        phone: phone.value,
        password: password.value,
      })
      uiStore.toastSuccess(t('auth.registerSuccess'), t('auth.registerSuccessDesc'))
    }
    
    const redirect = (router.currentRoute.value.query.redirect as string) || '/dashboard'
    await router.push(redirect)
    if (router.currentRoute.value.name === 'Login') {
      // Navigation was bounced back to Login by a guard; surface it instead of
      // leaving the form silently stuck with no feedback.
      throw new Error(isLogin.value ? t('auth.loginError') : t('auth.registerError'))
    }
  } catch (err: any) {
    error.value = err.message || (isLogin.value ? t('auth.loginError') : t('auth.registerError'))
    uiStore.toastError(t('common.error'), error.value || t('auth.checkCredentials'))
  } finally {
    isLoading.value = false
  }
}

function switchMode() {
  isLogin.value = !isLogin.value
  error.value = null
  if (!isLogin.value) {
    email.value = ''
    password.value = ''
  } else {
    email.value = 'ulan@itorgo.kg'
    password.value = 'DemoPass123!'
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
            {{ isLogin ? t('auth.loginTitle') : t('auth.registerTitle') }}
          </h1>
          <p class="text-xs sm:text-sm text-text-secondary mt-1">
            {{ isLogin ? t('auth.loginSubtitle') : t('auth.registerSubtitle') }}
          </p>
        </div>
      </div>

      <!-- Auth Form Card -->
      <div class="glass p-6 sm:p-8 rounded-3xl border border-black/[0.08] bg-white/95 shadow-sm space-y-5">
        
        <form @submit.prevent="handleSubmit" class="space-y-4" novalidate>
          
          <div v-if="error" class="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle class="w-4 h-4 flex-shrink-0" />
            <span>{{ error }}</span>
          </div>

          <!-- Registration extra fields -->
          <template v-if="!isLogin">
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
          </template>

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
              autocomplete="current-password"
            />
          </div>

          <template v-if="!isLogin">
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
                type="checkbox"
                id="terms"
                class="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                v-model="agreeTerms"
              />
              <label for="terms" class="text-xs text-text-secondary">
                {{ t('auth.agreeTerms') }} <RouterLink to="/terms" class="text-primary hover:underline font-semibold">{{ t('termsPage.title') }}</RouterLink> & <RouterLink to="/privacy" class="text-primary hover:underline font-semibold">{{ t('privacyPage.title') }}</RouterLink>
              </label>
            </div>
          </template>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-3 px-5 rounded-2xl bg-primary text-text-primary font-extrabold text-sm hover:bg-primary-hover shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
          >
            <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
            <span>{{ isLogin ? t('auth.loginBtn') : t('auth.registerBtn') }}</span>
            <ArrowRight v-if="!isLoading" class="w-4 h-4" />
          </button>

          <div class="text-center pt-2 text-xs text-text-secondary">
            <span>{{ isLogin ? t('auth.noAccount') : t('auth.haveAccount') }}</span>
            <button 
              type="button"
              @click="switchMode"
              class="text-amber-700 font-bold hover:underline ml-1.5"
            >
              {{ isLogin ? t('auth.goToRegister') : t('auth.goToLogin') }}
            </button>
          </div>

        </form>

        <!-- Demo Account Hint -->
        <div v-if="isLogin" class="pt-4 border-t border-black/[0.06] text-center">
          <div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800">
            <strong>{{ t('auth.demoAccount') }}:</strong> ulan@itorgo.kg <br />
            <strong>{{ t('auth.demoPassword') }}:</strong> DemoPass123!
          </div>
        </div>

      </div>

    </div>
  </div>
</template>