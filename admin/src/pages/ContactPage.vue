<script setup lang="ts">
import { ref } from 'vue'
import { Mail, MapPin, Phone, Clock, Send, Loader2, CheckCircle, ChevronRight, MessageSquare } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useI18n } from '@/composables/useI18n'
import Input from '@/components/ui/Input.vue'

const uiStore = useUIStore()
const { t } = useI18n()

const formData = ref({
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
})

const isSubmitting = ref(false)

async function handleSubmit() {
  if (!formData.value.name.trim()) {
    uiStore.toastError(t('common.error'), t('auth.nameRequired'))
    return
  }
  if (!formData.value.email.trim() && !formData.value.phone.trim()) {
    uiStore.toastError(t('common.error'), t('auth.emailRequired'))
    return
  }
  if (!formData.value.message.trim()) {
    uiStore.toastError(t('common.error'), t('contactPage.errorToast'))
    return
  }

  isSubmitting.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 800))
    uiStore.toastSuccess(t('common.success'), t('contactPage.successToast'))
    formData.value = { name: '', email: '', phone: '', subject: '', message: '' }
  } catch {
    uiStore.toastError(t('common.error'), t('contactPage.errorToast'))
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-background text-text-primary pt-26 lg:pt-30 pb-20 px-4 sm:px-6 lg:px-8 font-sans">
    <div class="max-w-5xl mx-auto space-y-12">

      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-xs font-medium text-text-muted" aria-label="Breadcrumb">
        <RouterLink to="/" class="hover:text-primary transition-colors">{{ t('auction.breadcrumbHome') }}</RouterLink>
        <ChevronRight class="w-3.5 h-3.5" />
        <span class="text-text-primary font-bold">{{ t('contactPage.title') }}</span>
      </nav>

      <!-- Header -->
      <div class="text-center max-w-2xl mx-auto space-y-3">
        <h1 class="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
          {{ t('contactPage.title') }}
        </h1>
        <p class="text-xs sm:text-sm text-text-secondary">
          {{ t('contactPage.subtitle') }}
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <!-- Left: Contact Details -->
        <div class="space-y-4">

          <div class="glass p-5 rounded-3xl shadow-sm flex items-start gap-3.5">
            <div class="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 flex-shrink-0">
              <Phone class="w-5 h-5" />
            </div>
            <div>
              <h4 class="text-xs font-bold text-text-primary">{{ t('contactPage.phoneTitle') }}</h4>
              <p class="text-xs text-text-secondary mt-0.5">{{ t('contactPage.phone') }}</p>
              <p class="text-xs text-text-secondary">+996 700 900 800 (WhatsApp / TG)</p>
            </div>
          </div>

          <div class="glass p-5 rounded-3xl shadow-sm flex items-start gap-3.5">
            <div class="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 flex-shrink-0">
              <Mail class="w-5 h-5" />
            </div>
            <div>
              <h4 class="text-xs font-bold text-text-primary">{{ t('contactPage.emailTitle') }}</h4>
              <p class="text-xs text-text-secondary mt-0.5">{{ t('contactPage.email') }}</p>
              <p class="text-xs text-text-secondary">info@itorgo.kg</p>
            </div>
          </div>

          <div class="glass p-5 rounded-3xl shadow-sm flex items-start gap-3.5">
            <div class="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <MapPin class="w-5 h-5" />
            </div>
            <div>
              <h4 class="text-xs font-bold text-text-primary">{{ t('contactPage.addressTitle') }}</h4>
              <p class="text-xs text-text-secondary mt-0.5">{{ t('contactPage.address') }}</p>
              <p class="text-[11px] text-text-muted mt-0.5">{{ t('contactPage.hours') }}</p>
            </div>
          </div>

        </div>

        <!-- Right: Message Form -->
        <div class="lg:col-span-2 glass p-6 sm:p-8 rounded-3xl shadow-sm">
          <form class="space-y-4" @submit.prevent="handleSubmit">

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1.5">{{ t('contactPage.nameLabel') }}</label>
                <Input
                  v-model="formData.name"
                  :placeholder="t('contactPage.namePlaceholder')"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1.5">{{ t('contactPage.phoneLabel') }}</label>
                <Input
                  v-model="formData.phone"
                  :placeholder="t('contactPage.phonePlaceholder')"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-text-secondary mb-1.5">{{ t('contactPage.emailLabel') }}</label>
              <Input
                v-model="formData.email"
                type="email"
                :placeholder="t('contactPage.emailPlaceholder')"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-text-secondary mb-1.5">{{ t('contactPage.subjectLabel') }}</label>
              <Input
                v-model="formData.subject"
                :placeholder="t('contactPage.subjectPlaceholder')"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-text-secondary mb-1.5">{{ t('contactPage.messageLabel') }}</label>
              <textarea
                v-model="formData.message"
                rows="4"
                :placeholder="t('contactPage.messagePlaceholder')"
                class="w-full bg-white border border-gray-200 rounded-xl p-3.5 text-base text-text-primary focus:outline-none focus:border-primary shadow-sm leading-relaxed"
              ></textarea>
            </div>

            <button
              type="submit"
              :disabled="isSubmitting"
              class="w-full sm:w-auto px-8 py-3 rounded-2xl bg-primary text-text-primary font-extrabold text-xs sm:text-sm hover:bg-primary-hover shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <span>{{ isSubmitting ? t('contactPage.sending') : t('contactPage.sendBtn') }}</span>
              <Send v-if="!isSubmitting" class="w-4 h-4" />
            </button>

          </form>
        </div>

      </div>

    </div>
  </div>
</template>