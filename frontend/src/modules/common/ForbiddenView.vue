<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import UiButton from '@/components/ui/UiButton.vue'

const router = useRouter()
const { t } = useI18n()
</script>

<template>
  <div class="grid min-h-full place-items-center bg-gradient-to-br from-rose-50 via-white to-slate-50 p-6 dark:from-rose-950/40 dark:via-slate-950 dark:to-slate-950">
    <div class="card max-w-md p-8 text-center">
      <div
        class="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-200/70 dark:bg-rose-900/30"
        aria-hidden="true"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="h-7 w-7">
          <rect x="4" y="11" width="16" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 1 1 8 0v3" />
        </svg>
      </div>

      <h1 class="text-xl font-semibold text-slate-900 dark:text-slate-50">
        {{ t('auth.accessRestricted') }}
      </h1>
      <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {{ t('auth.accessRestrictedBody') }}
      </p>

      <div class="mt-6 flex items-center justify-center gap-2">
        <UiButton variant="ghost" @click="router.back()">{{ t('auth.goBack') }}</UiButton>
        <UiButton variant="primary" to="/dashboard">{{ t('auth.dashboard') }}</UiButton>
      </div>
    </div>
  </div>
</template>
