<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import AppTopbar from '@/components/AppTopbar.vue'
import { onMounted } from 'vue'
import { useInboxStore } from '@/stores/inbox'

const inbox = useInboxStore()

onMounted(() => {
  inbox.initWs()
})
</script>

<template>
  <div class="flex h-full">
    <AppSidebar />
    <div class="flex min-w-0 flex-1 flex-col">
      <AppTopbar />
      <main class="flex-1 overflow-auto bg-slate-50 p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
