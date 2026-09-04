<script setup lang="ts">
defineProps<{
  code: string
  customClass?: string
}>()
</script>

<template>
  <span :class="customClass || 'w-4 h-3 inline-flex items-center justify-center overflow-hidden rounded-xs shadow-xs flex-shrink-0'">
    <svg v-if="code === 'ky' || code === 'kg'" viewBox="0 0 640 480" class="w-full h-full object-cover">
      <rect width="640" height="480" fill="#e8112d"/>
      <circle cx="320" cy="240" r="90" fill="#ffe600"/>
      <circle cx="320" cy="240" r="70" fill="#e8112d"/>
      <path d="M320 175 L320 305 M255 240 L385 240" stroke="#ffe600" stroke-width="12" stroke-linecap="round"/>
      <circle cx="320" cy="240" r="42" fill="none" stroke="#ffe600" stroke-width="10"/>
    </svg>
    <svg v-else-if="code === 'ru'" viewBox="0 0 640 480" class="w-full h-full object-cover">
      <rect width="640" height="160" fill="#ffffff"/>
      <rect y="160" width="640" height="160" fill="#0039a6"/>
      <rect y="320" width="640" height="160" fill="#d52b1e"/>
    </svg>
    <svg v-else-if="code === 'tr'" viewBox="0 0 640 480" class="w-full h-full object-cover">
      <rect width="640" height="480" fill="#e30a17"/>
      <circle cx="260" cy="240" r="120" fill="#ffffff"/>
      <circle cx="285" cy="240" r="96" fill="#e30a17"/>
      <polygon points="375,240 342,251 354,218 322,231 347,208 347,240" fill="#ffffff" transform="translate(15, 0) scale(1.1)" transform-origin="350 240"/>
    </svg>
  </span>
</template>