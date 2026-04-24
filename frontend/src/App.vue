<script setup lang="ts">
import Toaster from '@/components/ui/Toaster.vue'
import ErrorBoundary from '@/components/ui/ErrorBoundary.vue'

// Profile hydration runs inside the router's navigation guard — see
// router/index.ts — so we don't need to kick it off here.
</script>

<template>
  <ErrorBoundary scope="app">
    <router-view />
  </ErrorBoundary>
  <Toaster />
</template>
