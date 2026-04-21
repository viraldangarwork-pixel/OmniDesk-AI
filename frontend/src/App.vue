<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import Toaster from '@/components/ui/Toaster.vue'
import ErrorBoundary from '@/components/ui/ErrorBoundary.vue'

const auth = useAuthStore()

onMounted(async () => {
  if (auth.accessToken) {
    try {
      await auth.fetchMe()
    } catch {
      auth.logout()
    }
  }
})
</script>

<template>
  <ErrorBoundary scope="app">
    <router-view />
  </ErrorBoundary>
  <Toaster />
</template>
