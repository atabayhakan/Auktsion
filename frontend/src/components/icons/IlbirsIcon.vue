<script setup lang="ts">
// Geometric mark of the snow leopard (ilbirs / ирбис) — a national symbol of
// Kyrgyzstan (featured on the coat of arms). Replaces the placeholder "A"
// letter-mark. Meant to sit inside the existing gold badge container, so it
// carries no background of its own.
</script>

<template>
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
    <path d="M8 15 L4.5 4 L16.5 11.5 Z" fill="currentColor" />
    <path d="M32 15 L35.5 4 L23.5 11.5 Z" fill="currentColor" />
    <ellipse cx="20" cy="23" rx="14.5" ry="13" fill="currentColor" />
    <g fill="rgb(var(--color-primary))">
      <circle cx="12" cy="15" r="1.5" />
      <circle cx="28" cy="15" r="1.5" />
      <circle cx="8.5" cy="25" r="1.3" />
      <circle cx="31.5" cy="25" r="1.3" />
      <circle cx="20" cy="12.5" r="1.2" />
      <ellipse cx="14.5" cy="21.5" rx="1.7" ry="2.2" />
      <ellipse cx="25.5" cy="21.5" rx="1.7" ry="2.2" />
      <path d="M20 26.5 L17.7 29.3 L22.3 29.3 Z" />
      <line x1="20" y1="29.3" x2="20" y2="31.5" stroke="rgb(var(--color-primary))" stroke-width="1.1" stroke-linecap="round" />
    </g>
  </svg>
</template>
