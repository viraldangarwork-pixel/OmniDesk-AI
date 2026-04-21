<script setup lang="ts">
/**
 * Soft animated background blobs for hero / empty states.
 * Pure CSS, GPU-friendly transforms only. Hidden on small screens
 * and disabled when reduced-motion is preferred.
 */
interface Props {
  intensity?: 'subtle' | 'soft' | 'vivid'
}
withDefaults(defineProps<Props>(), { intensity: 'soft' })
</script>

<template>
  <div
    class="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden md:block"
    aria-hidden="true"
  >
    <div
      class="blob blob-a"
      :class="{
        'opacity-30': intensity === 'subtle',
        'opacity-50': intensity === 'soft',
        'opacity-70': intensity === 'vivid',
      }"
    />
    <div
      class="blob blob-b"
      :class="{
        'opacity-20': intensity === 'subtle',
        'opacity-40': intensity === 'soft',
        'opacity-60': intensity === 'vivid',
      }"
    />
  </div>
</template>

<style scoped>
.blob {
  position: absolute;
  border-radius: 9999px;
  filter: blur(72px);
  will-change: transform;
}
.blob-a {
  width: 28rem;
  height: 28rem;
  top: -8rem;
  left: -6rem;
  background: radial-gradient(circle at 30% 30%, #a5b4fc, #6366f1 60%, transparent 80%);
  animation: blob-float-a 18s ease-in-out infinite;
}
.blob-b {
  width: 22rem;
  height: 22rem;
  bottom: -8rem;
  right: -6rem;
  background: radial-gradient(circle at 50% 50%, #c7d2fe, #38bdf8 65%, transparent 80%);
  animation: blob-float-b 22s ease-in-out infinite;
}
@keyframes blob-float-a {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(40px, 20px, 0) scale(1.05); }
}
@keyframes blob-float-b {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(-30px, -25px, 0) scale(1.07); }
}
@media (prefers-reduced-motion: reduce) {
  .blob {
    animation: none;
  }
}
</style>
