<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Folder,
  FolderPlus,
  FolderOpen,
  Upload,
  Image as ImageIcon,
  Trash2,
  Copy,
  ExternalLink,
  ChevronRight,
  Search,
  Grid,
  List,
  CheckCircle2,
  Circle,
  X,
  FileText,
  Eye,
  Info,
  Layers,
  Sparkles,
  ArrowLeft,
  Gavel,
  User,
  ShieldCheck
} from 'lucide-vue-next'
import { useAdminStore } from '@/stores/admin'
import { useUIStore } from '@/stores/ui'
import type { MediaFolderItem, MediaExplorerFile } from '@/types/admin'

const adminStore = useAdminStore()
const uiStore = useUIStore()

const currentFolderId = ref('root')
const viewMode = ref<'grid' | 'list'>('grid')
const searchQuery = ref('')
const isSelectMode = ref(false)
const selectedFileIds = ref<Set<string>>(new Set())
const selectedFolderIds = ref<Set<string>>(new Set())

const showNewFolderModal = ref(false)
const newFolderName = ref('')
const newFolderColor = ref('#3B82F6')
const previewFile = ref<MediaExplorerFile | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)

const folderColors = [
  { name: 'Mavi', hex: '#3B82F6' },
  { name: 'Zümrüt', hex: '#10B981' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Mor', hex: '#8B5CF6' },
  { name: 'Gül', hex: '#EC4899' },
  { name: 'Gri', hex: '#6B7280' }
]

onMounted(async () => {
  await loadFolder('root')
})

async function loadFolder(folderId: string) {
  currentFolderId.value = folderId
  selectedFileIds.value.clear()
  selectedFolderIds.value.clear()
  await adminStore.fetchMediaExplorer(folderId)
}

const breadcrumbs = computed(() => {
  return adminStore.mediaExplorer?.breadcrumbs || [{ id: 'root', name: 'Medya Kütüphanesi' }]
})

const subfolders = computed(() => {
  let list = adminStore.mediaExplorer?.subfolders || []
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(f => f.name.toLowerCase().includes(q))
  }
  return list
})

const files = computed(() => {
  let list = adminStore.mediaExplorer?.files || []
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(f => 
      f.name.toLowerCase().includes(q) || 
      (f.entityTitle && f.entityTitle.toLowerCase().includes(q)) ||
      (f.ownerName && f.ownerName.toLowerCase().includes(q))
    )
  }
  return list
})

const stats = computed(() => {
  return adminStore.mediaExplorer?.stats || {
    totalFiles: 0,
    totalFolders: 0,
    totalSizeBytes: 0,
    formattedTotalSize: '0 MB'
  }
})

function handleFolderClick(folder: MediaFolderItem) {
  if (isSelectMode.value) {
    if (selectedFolderIds.value.has(folder.id)) selectedFolderIds.value.delete(folder.id)
    else selectedFolderIds.value.add(folder.id)
  } else {
    loadFolder(folder.id)
  }
}

function handleFileClick(file: MediaExplorerFile) {
  if (isSelectMode.value) {
    if (selectedFileIds.value.has(file.id)) selectedFileIds.value.delete(file.id)
    else selectedFileIds.value.add(file.id)
  } else {
    previewFile.value = file
  }
}

function toggleSelectMode() {
  isSelectMode.value = !isSelectMode.value
  if (!isSelectMode.value) {
    selectedFileIds.value.clear()
    selectedFolderIds.value.clear()
  }
}

async function handleCreateFolder() {
  if (!newFolderName.value.trim()) return
  try {
    await adminStore.createMediaFolder(newFolderName.value, currentFolderId.value, newFolderColor.value)
    uiStore.toastSuccess('Папка түзүлдү', `"${newFolderName.value}" папкасы ийгиликтүү түзүлдү`)
    newFolderName.value = ''
    showNewFolderModal.value = false
  } catch (err: any) {
    uiStore.toastError('Ката', err.message || 'Папка түзүүдө ката кетти')
  }
}

async function handleDeleteSelected() {
  const totalSelected = selectedFileIds.value.size + selectedFolderIds.value.size
  if (totalSelected === 0) return
  if (!confirm(`Тандалган ${totalSelected} элементти өчүрүүнү каалайсызбы? (Seçilen ${totalSelected} öğeyi silmek istediğinize emin misiniz?)`)) return

  try {
    for (const folderId of selectedFolderIds.value) {
      await adminStore.deleteMediaFolder(folderId)
    }
    for (const fileId of selectedFileIds.value) {
      await adminStore.deleteMediaFile(fileId)
    }
    uiStore.toastSuccess('Өчүрүлдү', `${totalSelected} элемент өчүрүлдү`)
    isSelectMode.value = false
    selectedFileIds.value.clear()
    selectedFolderIds.value.clear()
  } catch (err: any) {
    uiStore.toastError('Ката', err.message || 'Өчүрүүдө ката кетти')
  }
}

async function handleDeleteFile(file: MediaExplorerFile) {
  if (!confirm(`"${file.name}" файлын өчүрүүнү каалайсызбы?`)) return
  try {
    await adminStore.deleteMediaFile(file.id)
    uiStore.toastSuccess('Өчүрүлдү', 'Файл ийгиликтүү өчүрүлдү')
    if (previewFile.value?.id === file.id) {
      previewFile.value = null
    }
  } catch (err: any) {
    uiStore.toastError('Ката', err.message || 'Файлды өчүрүүдө ката кетти')
  }
}

async function copyFileUrl(url: string) {
  try {
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`
    await navigator.clipboard.writeText(fullUrl)
    uiStore.toastSuccess('Көчүрүлдү', 'Файлдын шилтемеси алмашуу буферине көчүрүлдү (URL kopyalandı)')
  } catch {
    uiStore.toastError('Ката', 'URL дарегин көчүрүү мүмкүн болгон жок')
  }
}

function triggerUpload() {
  fileInputRef.value?.click()
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  isUploading.value = true
  const formData = new FormData()
  formData.append('file', file)

  try {
    const token = localStorage.getItem('token') || ''
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    })
    const resData = await response.json()

    if (resData.success && resData.url) {
      await adminStore.addMediaFile({
        name: file.name,
        url: resData.url,
        folderId: currentFolderId.value,
        sizeBytes: file.size,
        mimeType: file.type,
        dimensions: 'Original'
      })
      uiStore.toastSuccess('Жүктөлдү', 'Файл ийгиликтүү жүктөлдү')
    } else {
      throw new Error(resData.error || 'Жүктөө катасы')
    }
  } catch (err: any) {
    uiStore.toastError('Жүктөө катасы', err.message || 'Файлды жүктөө мүмкүн болгон жок')
  } finally {
    isUploading.value = false
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatDate(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="space-y-5 max-w-7xl pb-16">
    <!-- Header & Storage Stats -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2.5">
          <FolderOpen class="w-6 h-6 text-primary" />
          <span>Medya Kütüphanesi & Dosya Yöneticisi</span>
        </h1>
        <p class="text-xs text-text-secondary mt-1">
          iOS Files & Finder tarzı gelişmiş dosya yöneticisi — sitedeki tüm ilan, avatar, KYC ve platform görselleri
        </p>
      </div>

      <!-- Quick Metrics -->
      <div class="flex items-center gap-2">
        <div class="px-3 py-1.5 rounded-xl bg-white border border-border text-xs font-bold text-text-secondary shadow-xs">
          Toplam: <span class="text-text-primary">{{ stats.totalFiles }} dosya</span>
        </div>
        <div class="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-text-primary shadow-xs">
          Alan: <span class="text-primary font-black">{{ stats.formattedTotalSize }}</span>
        </div>
      </div>
    </div>

    <!-- iOS / Finder Toolbar -->
    <div class="bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-border shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
      <!-- Breadcrumbs Path -->
      <div class="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto py-1">
        <button
          v-if="currentFolderId !== 'root'"
          type="button"
          class="p-1.5 rounded-lg hover:bg-black/5 text-text-secondary hover:text-text-primary transition-colors shrink-0"
          title="Üst Dizine Çık"
          @click="loadFolder('root')"
        >
          <ArrowLeft class="w-4 h-4" />
        </button>

        <div
          v-for="(crumb, idx) in breadcrumbs"
          :key="crumb.id"
          class="flex items-center gap-1.5 shrink-0"
        >
          <ChevronRight v-if="idx > 0" class="w-3.5 h-3.5 text-text-muted shrink-0" />
          <button
            type="button"
            :class="[
              'px-2.5 py-1 rounded-lg text-xs font-bold transition-all',
              crumb.id === currentFolderId
                ? 'bg-primary/20 text-text-primary font-black'
                : 'text-text-secondary hover:text-text-primary hover:bg-black/5'
            ]"
            @click="loadFolder(crumb.id)"
          >
            {{ crumb.name }}
          </button>
        </div>
      </div>

      <!-- Actions & Search -->
      <div class="flex items-center gap-2 w-full md:w-auto justify-end">
        <!-- Live Search -->
        <div class="relative flex-1 md:w-48">
          <Search class="w-3.5 h-3.5 text-text-muted absolute left-3 top-2.5" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Ada göre ara..."
            class="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border bg-black/[0.02] text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <!-- View Mode Switcher -->
        <div class="flex items-center bg-black/5 p-0.5 rounded-xl border border-black/[0.04]">
          <button
            type="button"
            :class="[
              'p-1.5 rounded-lg text-xs font-bold transition-all',
              viewMode === 'grid' ? 'bg-white text-text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'
            ]"
            title="Grid Görünümü"
            @click="viewMode = 'grid'"
          >
            <Grid class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            :class="[
              'p-1.5 rounded-lg text-xs font-bold transition-all',
              viewMode === 'list' ? 'bg-white text-text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'
            ]"
            title="Liste Görünümü"
            @click="viewMode = 'list'"
          >
            <List class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Select Mode -->
        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-bold transition-all border',
            isSelectMode
              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
              : 'bg-white text-text-secondary border-border hover:bg-black/5'
          ]"
          @click="toggleSelectMode"
        >
          {{ isSelectMode ? 'İptal' : 'Seç' }}
        </button>

        <!-- Delete Selected Button -->
        <button
          v-if="isSelectMode && (selectedFileIds.size > 0 || selectedFolderIds.size > 0)"
          type="button"
          class="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs flex items-center gap-1.5 transition-all"
          @click="handleDeleteSelected"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>Sil ({{ selectedFileIds.size + selectedFolderIds.size }})</span>
        </button>

        <!-- New Folder Button -->
        <button
          type="button"
          class="px-3 py-1.5 rounded-xl text-xs font-bold text-text-secondary bg-white hover:bg-black/5 border border-border shadow-xs flex items-center gap-1.5 transition-all"
          @click="showNewFolderModal = true"
        >
          <FolderPlus class="w-3.5 h-3.5 text-primary" />
          <span class="hidden sm:inline">Yeni Klasör</span>
        </button>

        <!-- Upload File Button -->
        <button
          type="button"
          :disabled="isUploading"
          class="px-3.5 py-1.5 rounded-xl text-xs font-bold text-text-primary bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
          @click="triggerUpload"
        >
          <Upload class="w-3.5 h-3.5" />
          <span>{{ isUploading ? 'Yükleniyor...' : 'Dosya Yükle' }}</span>
        </button>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileUpload"
        />
      </div>
    </div>

    <!-- MAIN CONTENT AREA -->
    <div class="space-y-6">
      <!-- 1. SUB-FOLDERS SECTION -->
      <div v-if="subfolders.length > 0">
        <h2 class="text-xs font-extrabold text-text-muted uppercase tracking-wider mb-3 px-1 flex items-center gap-1.5">
          <Folder class="w-3.5 h-3.5" />
          <span>Klasörler ({{ subfolders.length }})</span>
        </h2>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          <div
            v-for="folder in subfolders"
            :key="folder.id"
            :class="[
              'group relative p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex flex-col items-center justify-center text-center gap-2',
              selectedFolderIds.has(folder.id)
                ? 'bg-primary/15 border-primary shadow-md ring-2 ring-primary/40'
                : 'bg-white hover:bg-accent/60 border-border shadow-xs hover:shadow-md'
            ]"
            @click="handleFolderClick(folder)"
          >
            <!-- Checkbox in select mode -->
            <div
              v-if="isSelectMode"
              class="absolute top-2 right-2 z-10"
            >
              <CheckCircle2 v-if="selectedFolderIds.has(folder.id)" class="w-4 h-4 text-primary fill-primary" />
              <Circle v-else class="w-4 h-4 text-text-muted" />
            </div>

            <!-- Folder Icon with Custom Color -->
            <div
              class="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105"
              :style="{ backgroundColor: `${folder.color || '#3B82F6'}15`, color: folder.color || '#3B82F6' }"
            >
              <Folder class="w-7 h-7 fill-current" />
            </div>

            <!-- Folder Name -->
            <div class="w-full">
              <span class="text-xs font-bold text-text-primary truncate block">{{ folder.name }}</span>
              <span class="text-[10px] text-text-muted font-medium block mt-0.5">
                {{ folder.itemCount !== undefined ? `${folder.itemCount} öğe` : 'Klasör' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. FILES SECTION -->
      <div>
        <h2 class="text-xs font-extrabold text-text-muted uppercase tracking-wider mb-3 px-1 flex items-center gap-1.5">
          <ImageIcon class="w-3.5 h-3.5" />
          <span>Dosyalar & Görseller ({{ files.length }})</span>
        </h2>

        <!-- Empty State -->
        <div
          v-if="subfolders.length === 0 && files.length === 0"
          class="bg-white rounded-2xl p-12 border border-border text-center flex flex-col items-center justify-center space-y-3"
        >
          <div class="w-14 h-14 rounded-2xl bg-black/5 flex items-center justify-center text-text-muted">
            <FolderOpen class="w-8 h-8 stroke-1" />
          </div>
          <div class="space-y-1">
            <h3 class="text-sm font-bold text-text-primary">Bu klasör boş</h3>
            <p class="text-xs text-text-secondary max-w-sm">
              Bu klasöre görsel yükleyebilir veya yeni alt klasörler oluşturabilirsiniz.
            </p>
          </div>
          <button
            type="button"
            class="px-4 py-2 rounded-xl text-xs font-bold text-text-primary bg-primary hover:bg-primary/90 shadow-xs flex items-center gap-1.5 transition-all mt-2"
            @click="triggerUpload"
          >
            <Upload class="w-3.5 h-3.5" />
            <span>Görsel Yükle</span>
          </button>
        </div>

        <!-- GRID VIEW -->
        <div
          v-else-if="viewMode === 'grid'"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5"
        >
          <div
            v-for="file in files"
            :key="file.id"
            :class="[
              'group relative rounded-2xl border transition-all cursor-pointer select-none overflow-hidden bg-white shadow-xs hover:shadow-md flex flex-col',
              selectedFileIds.has(file.id)
                ? 'border-primary ring-2 ring-primary/40 bg-primary/5'
                : 'border-border hover:border-black/20'
            ]"
            @click="handleFileClick(file)"
          >
            <!-- Checkbox in select mode -->
            <div
              v-if="isSelectMode"
              class="absolute top-2 right-2 z-20 bg-white/90 rounded-full p-0.5 shadow-xs"
            >
              <CheckCircle2 v-if="selectedFileIds.has(file.id)" class="w-4 h-4 text-primary fill-primary" />
              <Circle v-else class="w-4 h-4 text-text-muted" />
            </div>

            <!-- Thumbnail Container -->
            <div class="relative w-full aspect-square bg-black/[0.03] overflow-hidden flex items-center justify-center">
              <img
                :src="file.url"
                :alt="file.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />

              <!-- Source Badge -->
              <span
                v-if="file.source === 'auction'"
                class="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-blue-600/80 backdrop-blur-xs text-[9px] font-bold text-white uppercase"
              >
                İlan
              </span>
              <span
                v-else-if="file.source === 'avatar'"
                class="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-emerald-600/80 backdrop-blur-xs text-[9px] font-bold text-white uppercase"
              >
                Avatar
              </span>
              <span
                v-else-if="file.source === 'kyc'"
                class="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-amber-600/80 backdrop-blur-xs text-[9px] font-bold text-white uppercase"
              >
                KYC
              </span>
            </div>

            <!-- File Metadata Footer -->
            <div class="p-2.5 border-t border-border bg-white flex flex-col justify-between flex-1">
              <span class="text-xs font-bold text-text-primary truncate block" :title="file.name">
                {{ file.name }}
              </span>
              <div class="flex items-center justify-between text-[10px] text-text-muted mt-1">
                <span>{{ formatBytes(file.sizeBytes) }}</span>
                <span>{{ formatDate(file.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- LIST VIEW -->
        <div
          v-else
          class="bg-white rounded-2xl border border-border shadow-xs overflow-hidden"
        >
          <table class="w-full text-left text-xs">
            <thead class="bg-black/[0.02] border-b border-border text-[11px] font-bold text-text-muted uppercase">
              <tr>
                <th class="py-3 px-4 w-10" v-if="isSelectMode"></th>
                <th class="py-3 px-4">Dosya Adı</th>
                <th class="py-3 px-4">Kaynak</th>
                <th class="py-3 px-4">Boyut</th>
                <th class="py-3 px-4">Çözünürlük</th>
                <th class="py-3 px-4">Tarih</th>
                <th class="py-3 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr
                v-for="file in files"
                :key="file.id"
                :class="[
                  'hover:bg-accent/50 cursor-pointer transition-colors',
                  selectedFileIds.has(file.id) ? 'bg-primary/5' : ''
                ]"
                @click="handleFileClick(file)"
              >
                <td class="py-2.5 px-4" v-if="isSelectMode">
                  <CheckCircle2 v-if="selectedFileIds.has(file.id)" class="w-4 h-4 text-primary fill-primary" />
                  <Circle v-else class="w-4 h-4 text-text-muted" />
                </td>
                <td class="py-2.5 px-4 flex items-center gap-3">
                  <img
                    :src="file.url"
                    :alt="file.name"
                    class="w-8 h-8 rounded-lg object-cover bg-black/5 shrink-0"
                  />
                  <div class="truncate max-w-xs font-bold text-text-primary">
                    {{ file.name }}
                  </div>
                </td>
                <td class="py-2.5 px-4 text-text-secondary">
                  <span class="px-2 py-0.5 rounded-md bg-black/5 font-semibold text-[10px]">
                    {{ file.source }}
                  </span>
                </td>
                <td class="py-2.5 px-4 text-text-secondary font-mono">{{ formatBytes(file.sizeBytes) }}</td>
                <td class="py-2.5 px-4 text-text-secondary font-mono">{{ file.dimensions || '1200x800' }}</td>
                <td class="py-2.5 px-4 text-text-muted">{{ formatDate(file.createdAt) }}</td>
                <td class="py-2.5 px-4 text-right" @click.stop>
                  <div class="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      class="p-1.5 rounded-lg hover:bg-black/5 text-text-muted hover:text-text-primary transition-colors"
                      title="URL Kopyala"
                      @click="copyFileUrl(file.url)"
                    >
                      <Copy class="w-3.5 h-3.5" />
                    </button>
                    <a
                      :href="file.url"
                      target="_blank"
                      class="p-1.5 rounded-lg hover:bg-black/5 text-text-muted hover:text-text-primary transition-colors"
                      title="Yeni Sekmede Aç"
                    >
                      <ExternalLink class="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      class="p-1.5 rounded-lg hover:bg-rose-50 text-text-muted hover:text-rose-600 transition-colors"
                      title="Sil"
                      @click="handleDeleteFile(file)"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL 1: NEW FOLDER MODAL (iOS Style) -->
    <div
      v-if="showNewFolderModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
      @click.self="showNewFolderModal = false"
    >
      <div class="bg-white rounded-3xl p-6 w-full max-w-md border border-border shadow-2xl space-y-5 animate-scale-in">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <FolderPlus class="w-5 h-5" />
            </div>
            <h3 class="text-base font-extrabold text-text-primary">Yeni Klasör Oluştur</h3>
          </div>
          <button
            type="button"
            class="p-1.5 rounded-xl hover:bg-black/5 text-text-muted hover:text-text-primary"
            @click="showNewFolderModal = false"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-text-secondary mb-1">Klasör Adı</label>
            <input
              v-model="newFolderName"
              type="text"
              placeholder="Örn: Araç İlanları, Kampanya Bannerları..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-border bg-black/[0.02] text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              @keydown.enter="handleCreateFolder"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-text-secondary mb-2">Klasör Rengi (iOS Tag)</label>
            <div class="flex items-center gap-3">
              <button
                v-for="c in folderColors"
                :key="c.hex"
                type="button"
                :style="{ backgroundColor: c.hex }"
                :class="[
                  'w-8 h-8 rounded-full transition-transform shadow-xs',
                  newFolderColor === c.hex ? 'scale-125 ring-2 ring-offset-2 ring-black/20' : 'hover:scale-110'
                ]"
                :title="c.name"
                @click="newFolderColor = c.hex"
              />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2.5 border-t border-border pt-3">
          <button
            type="button"
            class="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary bg-white hover:bg-accent border border-border"
            @click="showNewFolderModal = false"
          >
            İptal
          </button>
          <button
            type="button"
            :disabled="!newFolderName.trim()"
            class="px-5 py-2 rounded-xl text-xs font-bold text-text-primary bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 disabled:opacity-50"
            @click="handleCreateFolder"
          >
            Klasörü Oluştur
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 2: iOS QuickLook Inspector / Preview Modal -->
    <div
      v-if="previewFile"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
      @click.self="previewFile = null"
    >
      <div class="bg-white rounded-3xl max-w-3xl w-full border border-border shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh] animate-scale-in">
        <!-- Preview Left: Large Image View -->
        <div class="md:w-3/5 bg-black/5 flex items-center justify-center p-6 relative overflow-hidden">
          <img
            :src="previewFile.url"
            :alt="previewFile.name"
            class="max-h-[55vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
          />
        </div>

        <!-- Details Right: Metadata & Actions -->
        <div class="md:w-2/5 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-border bg-white space-y-4 overflow-y-auto">
          <div class="space-y-4">
            <div class="flex items-start justify-between gap-2">
              <div class="truncate">
                <span class="text-sm font-black text-text-primary block truncate" :title="previewFile.name">
                  {{ previewFile.name }}
                </span>
                <span class="text-[11px] text-text-muted block mt-0.5">
                  {{ previewFile.mimeType || 'image/jpeg' }}
                </span>
              </div>
              <button
                type="button"
                class="p-1.5 rounded-xl hover:bg-black/5 text-text-muted hover:text-text-primary shrink-0"
                @click="previewFile = null"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- Metadata List -->
            <div class="space-y-2.5 text-xs text-text-secondary bg-black/[0.02] p-3.5 rounded-2xl border border-border">
              <div class="flex items-center justify-between">
                <span class="text-text-muted">Dosya Boyutu:</span>
                <span class="font-bold text-text-primary font-mono">{{ formatBytes(previewFile.sizeBytes) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-text-muted">Çözünürlük:</span>
                <span class="font-bold text-text-primary font-mono">{{ previewFile.dimensions || '1600x1200' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-text-muted">Kaynak Türü:</span>
                <span class="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold uppercase text-[10px]">
                  {{ previewFile.source }}
                </span>
              </div>
              <div v-if="previewFile.entityTitle" class="flex items-center justify-between">
                <span class="text-text-muted">İlişkili Öğe:</span>
                <span class="font-bold text-text-primary truncate max-w-[140px]" :title="previewFile.entityTitle">
                  {{ previewFile.entityTitle }}
                </span>
              </div>
              <div v-if="previewFile.ownerName" class="flex items-center justify-between">
                <span class="text-text-muted">Sahibi:</span>
                <span class="font-bold text-text-primary">{{ previewFile.ownerName }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-text-muted">Yüklenme:</span>
                <span class="font-semibold text-text-primary">{{ formatDate(previewFile.createdAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="space-y-2 pt-2 border-t border-border">
            <button
              type="button"
              class="w-full py-2 px-3 rounded-xl text-xs font-bold text-text-primary bg-accent hover:bg-black/10 border border-border shadow-xs flex items-center justify-center gap-2 transition-all"
              @click="copyFileUrl(previewFile.url)"
            >
              <Copy class="w-3.5 h-3.5 text-primary" />
              <span>URL Adresini Kopyala</span>
            </button>

            <a
              :href="previewFile.url"
              target="_blank"
              class="w-full py-2 px-3 rounded-xl text-xs font-bold text-text-secondary bg-white hover:bg-accent border border-border shadow-xs flex items-center justify-center gap-2 transition-all"
            >
              <ExternalLink class="w-3.5 h-3.5" />
              <span>Tam Boyutta Aç</span>
            </a>

            <button
              type="button"
              class="w-full py-2 px-3 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200/60 shadow-xs flex items-center justify-center gap-2 transition-all"
              @click="handleDeleteFile(previewFile)"
            >
              <Trash2 class="w-3.5 h-3.5" />
              <span>Bu Dosyayı Sil</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
  animation: fadeIn 0.15s ease-out;
}
.animate-scale-in {
  animation: scaleIn 0.18s ease-out;
}
</style>

