<script setup lang="ts">
import { ref, computed } from 'vue'
import { CheckCircle, Clock, XCircle, Upload, Image, FileText, Shield, X } from 'lucide-vue-next'
import { useUIStore } from '@/stores/ui'
import { useUserStore } from '@/stores/user'
import { useI18n } from '@/composables/useI18n'
import Card from '@/components/ui/Card.vue'

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
const uploadProgress = ref(0)

const fileInput = ref<HTMLInputElement | null>(null)
const file = ref<File | null>(null)
const preview = ref<string | null>(null)

const isUploaded = computed(() => !!props.uploaded)
const isComplete = computed(() => isUploaded.value || !!file.value)

const statusIcon = computed(() => {
  if (isUploaded.value) return CheckCircle
  if (file.value) return Clock
  return Upload
})

const statusColor = computed(() => {
  if (isUploaded.value) return 'text-green-400'
  if (file.value) return 'text-amber-400'
  return 'text-gray-500'
})

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
  // Validate file type
  const acceptedTypes = props.accepted.split(',').map(t => t.trim())
  const isValidType = acceptedTypes.some(type => {
    if (type.startsWith('.')) return selectedFile.name.toLowerCase().endsWith(type.toLowerCase())
    return selectedFile.type.match(type.replace('*', '.*'))
  })
  
  if (!isValidType) {
    uiStore.toastError(t('common.error'), `${t('toasts.errorOccurred')}: ${props.accepted}`)
    return
  }
  
  // Validate file size (supports "10MB", "5MB" etc)
  const maxSizeMB = parseInt(props.maxSize) || 10
  if (selectedFile.size > maxSizeMB * 1024 * 1024) {
    uiStore.toastError(t('common.error'), `${t('toasts.errorOccurred')}: max ${props.maxSize}`)
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
  if (titleLower.includes('address') || titleLower.includes('proof')) return 'proofOfAddress'
  if (titleLower.includes('back')) return 'idBack'
  return 'idFront'
}

async function handleUpload(selectedFile: File) {
  uploadProgress.value = 10
  try {
    const type = inferDocumentType()
    const res: any = await userStore.uploadKycDocument(type, selectedFile)
    const url = res?.url || (res?.data as any)?.url || preview.value || ''
    uploadProgress.value = 100
    uiStore.toastSuccess(t('toasts.success'), `${selectedFile.name} — ${t('toasts.uploaded')}`)
    emit('update:uploaded', url)
  } catch (err: any) {
    uploadProgress.value = 0
    const msg = err?.response?.data?.error || err?.data?.error || err?.message || 'Upload failed'
    uiStore.toastError(t('common.error'), msg)
    file.value = null
    if (preview.value) URL.revokeObjectURL(preview.value)
    preview.value = null
    if (fileInput.value) fileInput.value.value = ''
  }
}

function removeFile() {
  file.value = null
  preview.value = null
  uploadProgress.value = 0
  if (fileInput.value) fileInput.value.value = ''
}

function triggerFileInput() {
  fileInput.value?.click()
}
</script>

<template>
  <Card :variant="isUploaded ? 'gold' : 'glass'" class="p-6">
    <div class="flex items-start justify-between mb-4">
      <div>
        <h4 class="font-semibold text-text-primary mb-1">{{ title }}</h4>
        <p class="text-text-muted text-sm">{{ description }}</p>
      </div>

      <div v-if="isUploaded" class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/20 border border-green-500/30">
        <CheckCircle class="w-4 h-4 text-green-400" />
        <span class="text-sm text-green-300">{{ t('status.kyc.verified') }}</span>
      </div>
    </div>

    <!-- Upload Zone -->
    <div
      class="relative"
      :class="[
        'rounded-2xl border-2 border-dashed transition-all duration-300',
        isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
        isComplete ? 'border-green-500/50' : ''
      ]"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="props.accepted"
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        @change="handleFileInput"
      />
      
      <div 
        class="flex flex-col items-center justify-center p-8 min-h-[160px]"
        :class="isComplete ? 'opacity-50' : ''"
      >
        <div v-if="isComplete && preview" class="relative mb-4">
          <img 
            v-if="preview.startsWith('data:image') || preview.startsWith('blob:')" 
            :src="preview" 
            alt="Preview" 
            class="max-w-full max-h-48 rounded-xl object-cover"
          />
          <div v-else class="w-24 h-24 rounded-xl bg-black/5 flex items-center justify-center">
            <FileText class="w-8 h-8 text-text-muted" />
          </div>
          
          <button 
            type="button"
            class="absolute top-2 right-2 p-1 rounded-full bg-red-500/80 text-white hover:bg-red-500 transition-colors"
            aria-label="Remove"
            @click="removeFile"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
        
        <div v-else class="flex flex-col items-center gap-3">
          <div class="w-16 h-16 rounded-full bg-black/5 border border-border flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/10 transition-all">
            <component :is="statusIcon" :class="['w-7 h-7', statusColor]" />
          </div>

          <p class="text-text-primary font-medium">{{ t('sell.dragDrop') }}</p>
          <p class="text-text-muted text-sm text-center max-w-xs">
            <button type="button" class="text-primary hover:underline font-medium" @click="triggerFileInput">{{ t('sell.browseFiles') }}</button>
          </p>

          <p class="text-text-muted text-xs mt-2">
            {{ props.accepted }} | max: {{ props.maxSize }}
          </p>
        </div>
      </div>

      <!-- Progress Bar -->
      <div v-if="file && uploadProgress < 100" class="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-2xl overflow-hidden">
        <div
          class="h-full bg-primary transition-all duration-300 ease-out"
          :style="{ width: uploadProgress + '%' }"
        />
      </div>
    </div>

    <!-- Requirements -->
    <div class="mt-4 p-4 rounded-xl bg-black/[0.03] border border-border">
      <p class="text-xs text-text-muted mb-2">Requirements:</p>
      <ul class="space-y-1 text-xs text-text-muted">
        <li class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-gray-600 flex-shrink-0" />
          Format: {{ props.accepted }}
        </li>
        <li class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-gray-600 flex-shrink-0" />
          Max size: {{ props.maxSize }}
        </li>
      </ul>
    </div>
  </Card>
</template>