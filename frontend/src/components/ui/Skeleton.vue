<script setup lang="ts">
interface Props {
  width?: string
  height?: string
  rounded?: string
  circle?: boolean
}
withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '1rem',
  rounded: '0.5rem',
  circle: false,
})
</script>

<template>
  <span
    class="skeleton block overflow-hidden bg-slate-200/70"
    :style="{
      width,
      height,
      borderRadius: circle ? '9999px' : rounded,
    }"
    aria-busy="true"
    aria-live="polite"
  />
</template>

<style scoped>
.skeleton {
  position: relative;
  isolation: isolate;
}
.skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.65) 50%,
    transparent 100%
  );
  transform: translateX(-100%);
  animation: shimmer 1.4s infinite;
  will-change: transform;
}
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .skeleton::after {
    animation: none;
  }
}
</style>
