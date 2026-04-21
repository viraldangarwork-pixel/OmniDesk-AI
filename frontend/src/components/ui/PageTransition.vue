<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

/**
 * Wrap a <RouterView> with a fade + soft-slide page transition.
 * Keys on the top-level route segment so nested param changes
 * (e.g. /inbox/:id) don't unmount the parent view.
 *
 * Usage:
 *   <PageTransition>
 *     <RouterView v-slot="{ Component }">
 *       <component :is="Component" />
 *     </RouterView>
 *   </PageTransition>
 */
const route = useRoute()
const transitionKey = computed(() => route.path.split('/')[1] || 'root')
defineExpose({ transitionKey })
</script>

<template>
  <Transition name="page" mode="out-in">
    <div :key="transitionKey" class="page-shell h-full">
      <slot />
    </div>
  </Transition>
</template>

<style scoped>
.page-enter-from {
  opacity: 0;
  transform: translate3d(0, 8px, 0);
  filter: blur(2px);
}
.page-enter-active {
  transition: opacity 320ms cubic-bezier(0.22, 1, 0.36, 1),
              transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
              filter 320ms cubic-bezier(0.22, 1, 0.36, 1);
}
.page-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
  position: absolute;
  inset: 0;
}
.page-leave-to {
  opacity: 0;
  transform: translate3d(0, -4px, 0);
}
@media (prefers-reduced-motion: reduce) {
  .page-enter-from,
  .page-leave-to {
    opacity: 1;
    transform: none;
    filter: none;
  }
  .page-enter-active,
  .page-leave-active {
    transition: none;
  }
}
</style>
