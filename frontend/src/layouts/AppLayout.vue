<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import AppTopbar from '@/components/AppTopbar.vue'
import PageTransition from '@/components/ui/PageTransition.vue'
import { useInboxStore } from '@/stores/inbox'
import { useUiStore } from '@/stores/ui'

const inbox = useInboxStore()
const ui = useUiStore()
const route = useRoute()

onMounted(() => {
  inbox.initWs()
})

// Close the mobile drawer when the route changes.
watch(
  () => route.fullPath,
  () => ui.closeMobileNav(),
)
</script>

<template>
  <div class="relative flex h-full bg-slate-50">
    <!-- Desktop sidebar -->
    <AppSidebar class="hidden md:flex" />

    <!-- Mobile slide-in drawer + scrim -->
    <Transition name="fade">
      <div
        v-if="ui.mobileNavOpen"
        class="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
        @click="ui.closeMobileNav()"
      />
    </Transition>
    <Transition name="slide-left">
      <AppSidebar
        v-if="ui.mobileNavOpen"
        class="fixed inset-y-0 left-0 z-50 flex md:hidden"
        mobile
      />
    </Transition>

    <div class="flex min-w-0 flex-1 flex-col">
      <AppTopbar />
      <main class="relative flex-1 overflow-auto p-6">
        <PageTransition>
          <RouterView />
        </PageTransition>
      </main>
    </div>
  </div>
</template>
