<script setup lang="ts">
import { ref, computed } from 'vue'
import { CheckCircle2, Clock, Upload, FileText, X, AlertCircle, ShieldCheck } from 'lucide-vue-next'
import { useUIStore } from '@/stores/ui'
import { useUserStore } from '@/stores/user'
import { useI18n } from '@/composables/useI18n'

interface Props {
  title: string
  description: string
  accepted: string
  maxSize: string
  uploaded?: string | null
  documentType?: string
}

const props = defineProps<Props>()

const uiStore = useUIStore()
const userStore = useUserStore()
const { t } = useI18n()
const emit = defineEmits<{
  'update:uploaded': [url: string]
}>()

const isDragging = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)

const fileInput = ref<HTMLInputElement | null>(null)
const file = ref<File | null>(null)
const preview = ref<string | null>(props.uploaded || null)

const isUploaded = computed(() => !!props.uploaded || (!!preview.value && !isUploading.value))

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  isDragging.value = true
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false
  
  const droppedFile = event.dataTransfer?.files[0]
  if (droppedFile) {
    handleFileSelect(droppedFile)
  }
}

function handleFileInput(event: Event) {
  const target = event.target as HTMLInputElement
  const selectedFile = target.files?.[0]
  if (selectedFile) {
    handleFileSelect(selectedFile)
  }
}

function handleFileSelect(selectedFile: File) {
  const acceptedTypes = props.accepted.split(',').map(t => t.trim())
  const isValidType = acceptedTypes.some(type => {
    if (type.startsWith('.')) return selectedFile.name.toLowerCase().endsWith(type.toLowerCase())
    return selectedFile.type.match(type.replace('*', '.*'))
  })
  
  if (!isValidType) {
    uiStore.toastError(t('common.error') || 'Hata', `Desteklenmeyen dosya formatı: ${props.accepted}`)
    return
  }
  
  const maxSizeMB = parseInt(props.maxSize) || 10
  if (selectedFile.size > maxSizeMB * 1024 * 1024) {
    uiStore.toastError(t('common.error') || 'Hata', `Maksimum dosya boyutu: ${props.maxSize}`)
    return
  }
  
  file.value = selectedFile
  preview.value = URL.createObjectURL(selectedFile)
  
  void handleUpload(selectedFile)
}

function inferDocumentType(): string {
  if (props.documentType) return props.documentType
  const titleLower = (props.title || '').toLowerCase()
  if (titleLower.includes('selfie')) return 'selfie'
  if (titleLower.includes('address') || titleLower.includes('adres') || titleLower.includes('дарек')) return 'proofOfAddress'
  if (titleLower.includes('back') || titleLower.includes('arka')) return 'idBack'
  return 'idFront'
}

async function handleUpload(selectedFile: File) {
  isUploading.value = true
  uploadProgress.value = 25
  try {
    const type = inferDocumentType()
    const res: any = await userStore.uploadKycDocument(type, selectedFile)
    const url = res?.url || (res?.data as any)?.url || preview.value || ''
    uploadProgress.value = 100
    uiStore.toastSuccess(t('toasts.success') || 'Başarılı', `${selectedFile.name} yüklendi`)
    emit('update:uploaded', url)
  } catch (err: any) {
    uploadProgress.value = 0
    const msg = err?.response?.data?.error || err?.data?.error || err?.message || 'Yükleme başarısız'
    uiStore.toastError(t('common.error') || 'Hata', msg)
    file.value = null
    if (preview.value && !props.uploaded) {
      URL.revokeObjectURL(preview.value)
      preview.value = null
    }
    if (fileInput.value) fileInput.value.value = ''
  } finally {
    isUploading.value = false
  }
}

function removeFile() {
  file.value = null
  preview.value = null
  uploadProgress.value = 0
  if (fileInput.value) fileInput.value.value = ''
  emit('update:uploaded', '')
}

function triggerFileInput() {
  fileInput.value?.click()
}
</script>

<template>
  <div 
    class="bg-white rounded-3xl p-5 sm:p-6 border transition-all duration-300 flex flex-col justify-between shadow-2xs group"
    :class="isUploaded 
      ? 'border-emerald-200 ring-1 ring-emerald-500/20 bg-emerald-500/[0.02]' 
      : 'border-black/[0.08] hover:border-primary/50'"
  >
    <!-- Card Header -->
    <div class="flex items-start justify-between gap-3 mb-4">
      <div>
        <div class="flex items-center gap-2">
          <h4 class="font-extrabold text-sm sm:text-base text-gray-950">{{ title }}</h4>
        </div>
        <p class="text-xs text-gray-500 mt-0.5">{{ description }}</p>
      </div>

      <div 
        v-if="isUploaded" 
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold shrink-0"
      >
        <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" />
        <span>{{ t('status.kyc.verified') || 'Yüklendi' }}</span>
      </div>
      <div 
        v-else 
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-gray-500 text-[11px] font-bold shrink-0"
      >
        <Clock class="w-3.5 h-3.5 text-gray-400" />
        <span>Bekliyor</span>
      </div>
    </div>

    <!-- Upload Dropzone -->
    <div
      class="relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden flex flex-col items-center justify-center p-5 min-h-[160px]"
      :class="[
        isDragging 
          ? 'border-primary bg-primary/10 scale-[0.99]' 
          : isUploaded 
            ? 'border-emerald-300/80 bg-white' 
            : 'border-black/10 bg-slate-50 hover:bg-slate-100/80 hover:border-primary/50'
      ]"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="props.accepted"
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        :disabled="isUploading"
        @change="handleFileInput"
      />
      
      <!-- Uploaded Preview -->
      <div v-if="preview" class="relative w-full h-full flex flex-col items-center justify-center">
        <div class="relative max-h-36 max-w-full rounded-xl overflow-hidden shadow-2xs border border-black/10">
          <img 
            v-if="preview.startsWith('data:image') || preview.startsWith('blob:') || preview.startsWith('http')" 
            :src="preview" 
            alt="Preview" 
            class="max-h-36 w-auto object-contain rounded-xl"
          />
          <div v-else class="w-28 h-28 rounded-xl bg-slate-100 flex flex-col items-center justify-center gap-2">
            <FileText class="w-8 h-8 text-primary" />
            <span class="text-[10px] font-bold text-gray-600 truncate max-w-[90px]">{{ file?.name || 'Doküman' }}</span>
          </div>

          <button 
            type="button"
            class="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-transform hover:scale-110 z-20 cursor-pointer"
            aria-label="Remove"
            @click.stop="removeFile"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <button 
          type="button" 
          class="text-xs font-bold text-primary hover:text-primary-hover mt-3 z-20 cursor-pointer"
          @click.stop="triggerFileInput"
        >
          Değiştir / Yeniden Yükle
        </button>
      </div>
      
      <!-- Empty Upload State -->
      <div v-else class="flex flex-col items-center text-center gap-2.5">
        <div class="w-12 h-12 rounded-2xl bg-white border border-black/[0.08] shadow-2xs flex items-center justify-center group-hover:scale-110 transition-transform">
          <Upload class="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
        </div>

        <div>
          <p class="text-xs font-extrabold text-gray-800">
            {{ t('sell.dragDrop') || 'Dosyayı buraya sürükleyin' }}
          </p>
          <p class="text-[11px] text-primary font-bold mt-0.5 hover:underline cursor-pointer">
            {{ t('sell.browseFiles') || 'veya dosya seçin' }}
          </p>
        </div>
      </div>

      <!-- Upload Progress Indicator -->
      <div v-if="isUploading" class="absolute inset-x-0 bottom-0 h-1.5 bg-slate-200 overflow-hidden">
        <div 
          class="h-full bg-primary transition-all duration-300 ease-out" 
          :style="{ width: uploadProgress + '%' }" 
        />
      </div>
    </div>

    <!-- Requirements Pill Footer -->
    <div class="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] text-gray-400 font-medium">
      <span class="truncate">Format: {{ props.accepted.replace('image/*', 'JPG, PNG') }}</span>
      <span class="font-bold text-gray-500 shrink-0">Maks {{ props.maxSize }}</span>
    </div>
  </div>
</template>
