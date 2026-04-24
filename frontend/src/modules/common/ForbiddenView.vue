<script setup lang="ts">
import { useRouter } from 'vue-router'
import UiButton from '@/components/ui/UiButton.vue'

const router = useRouter()
</script>

<template>
  <div class="grid min-h-full place-items-center bg-gradient-to-br from-rose-50 via-white to-slate-50 p-6">
    <div class="card max-w-md p-8 text-center">
      <div
        class="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-200/70"
        aria-hidden="true"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="h-7 w-7">
          <rect x="4" y="11" width="16" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 1 1 8 0v3" />
        </svg>
      </div>

      <h1 class="text-xl font-semibold text-slate-900">Access restricted</h1>
      <p class="mt-2 text-sm text-slate-600">
        You don't have permission to view this page. If you think this is a mistake,
        ask your workspace admin to update your role.
      </p>

      <div class="mt-6 flex items-center justify-center gap-2">
        <UiButton variant="ghost" @click="router.back()">Go back</UiButton>
        <UiButton variant="primary" to="/dashboard">Dashboard</UiButton>
      </div>
    </div>
  </div>
</template>
