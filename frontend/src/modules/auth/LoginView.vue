<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import UiFormField from '@/components/ui/UiFormField.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiButton from '@/components/ui/UiButton.vue'
import AnimatedBlob from '@/components/ui/AnimatedBlob.vue'
import type { ApiError } from '@/types/api'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const formError = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})
const loading = ref(false)
const shake = ref(false)

async function submit() {
  formError.value = null
  fieldErrors.value = {}
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    toast.success('Signed in')
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.replace(redirect)
  } catch (e) {
    const err = e as ApiError
    formError.value = err?.message ?? 'Sign-in failed'
    if (err?.fieldErrors) fieldErrors.value = err.fieldErrors
    // Shake the card once so the failure is unmistakable.
    shake.value = false
    await nextTick()
    shake.value = true
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative grid min-h-full place-items-center overflow-hidden p-6">
    <AnimatedBlob intensity="soft" />

    <div
      class="card w-full max-w-md p-8"
      :class="{ shake }"
      @animationend="shake = false"
    >
      <!-- Brand mark -->
      <div class="mb-6 text-center">
        <div
          class="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-bold text-white shadow-[0_8px_24px_-8px_rgba(36,74,237,0.55)]"
          aria-hidden="true"
        >
          O
        </div>
        <h1 class="text-2xl font-semibold text-slate-900">
          Welcome <span class="gradient-text">back</span>
        </h1>
        <p class="mt-1 text-sm text-slate-500">Sign in to OmniDesk AI</p>
      </div>

      <!-- Inline error banner -->
      <Transition name="fade-up">
        <div
          v-if="formError"
          class="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50/80 px-3 py-2 text-sm text-rose-700"
          role="alert"
          aria-live="polite"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 h-4 w-4 shrink-0">
            <circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" />
          </svg>
          <span>{{ formError }}</span>
        </div>
      </Transition>

      <form class="space-y-4" novalidate @submit.prevent="submit">
        <UiFormField label="Email" required :error="fieldErrors.email">
          <UiInput
            v-model="email"
            type="email"
            autocomplete="email"
            autofocus
            placeholder="you@company.com"
          >
            <template #leading>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                <rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m3.5 6.5 8.5 6 8.5-6" />
              </svg>
            </template>
          </UiInput>
        </UiFormField>

        <UiFormField label="Password" required :error="fieldErrors.password">
          <UiInput
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="••••••••"
          >
            <template #leading>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                <rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V8a4 4 0 1 1 8 0v3" />
              </svg>
            </template>
            <template #trailing>
              <button
                type="button"
                class="grid h-6 w-6 place-items-center rounded text-slate-400 transition hover:text-slate-700"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                :aria-pressed="showPassword"
                tabindex="-1"
                @click="showPassword = !showPassword"
              >
                <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                  <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                  <path d="M6.5 6.8C4.5 8.1 3 10 2 12c2 4 6 7 10 7a11 11 0 0 0 4.9-1.2M17.5 17.2c2-1.3 3.5-3.2 4.5-5.2-2-4-6-7-10-7a11 11 0 0 0-4.9 1.2" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </template>
          </UiInput>
        </UiFormField>

        <UiButton type="submit" variant="primary" block size="lg" :loading="loading">
          Sign in
        </UiButton>
      </form>

      <p class="mt-6 text-center text-sm text-slate-500">
        No account?
        <router-link to="/register" class="font-medium text-brand-600 hover:text-brand-700 hover:underline">
          Create one
        </router-link>
      </p>
    </div>
  </div>
</template>
