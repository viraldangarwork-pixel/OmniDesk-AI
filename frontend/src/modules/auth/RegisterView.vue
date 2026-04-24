<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import UiFormField from '@/components/ui/UiFormField.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiButton from '@/components/ui/UiButton.vue'
import AnimatedBlob from '@/components/ui/AnimatedBlob.vue'
import type { ApiError } from '@/types/api'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()

const form = ref({
  tenant_name: '',
  tenant_slug: '',
  full_name: '',
  email: '',
  password: '',
})
const showPassword = ref(false)
const formError = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})
const loading = ref(false)
const shake = ref(false)
const slugEdited = ref(false)

// Auto-suggest the slug from the company name — only until the user
// touches the slug field themselves.
watch(
  () => form.value.tenant_name,
  (name) => {
    if (slugEdited.value) return
    form.value.tenant_slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40)
  },
)

function onSlugInput(v: string) {
  slugEdited.value = true
  form.value.tenant_slug = v
}

// Password strength indicator — simple heuristic, bands 0..4.
const pwStrength = computed(() => {
  const p = form.value.password
  if (!p) return 0
  let score = 0
  if (p.length >= 8) score++
  if (p.length >= 12) score++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) score++
  return score
})
const pwLabel = computed(() =>
  ['', 'Weak', 'Fair', 'Good', 'Strong'][pwStrength.value] || '',
)

async function submit() {
  formError.value = null
  fieldErrors.value = {}
  loading.value = true
  try {
    await auth.register({ ...form.value })
    toast.success('Workspace created')
    router.replace('/dashboard')
  } catch (e) {
    const err = e as ApiError
    formError.value = err?.message ?? 'Registration failed'
    if (err?.fieldErrors) fieldErrors.value = err.fieldErrors
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
      class="card w-full max-w-lg p-8"
      :class="{ shake }"
      @animationend="shake = false"
    >
      <header class="mb-6">
        <h1 class="text-2xl font-semibold text-slate-900">
          Create your <span class="gradient-text">workspace</span>
        </h1>
        <p class="mt-1 text-sm text-slate-500">
          Start your OmniDesk AI trial in seconds. No credit card.
        </p>
      </header>

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
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <UiFormField label="Company" required :error="fieldErrors.tenant_name">
            <UiInput v-model="form.tenant_name" autocomplete="organization" autofocus />
          </UiFormField>

          <UiFormField
            label="Slug"
            required
            hint="omnidesk.ai/your-slug"
            :error="fieldErrors.tenant_slug"
          >
            <UiInput
              :model-value="form.tenant_slug"
              placeholder="your-company"
              @update:model-value="onSlugInput"
            />
          </UiFormField>
        </div>

        <UiFormField label="Your name" :error="fieldErrors.full_name">
          <UiInput v-model="form.full_name" autocomplete="name" />
        </UiFormField>

        <UiFormField label="Work email" required :error="fieldErrors.email">
          <UiInput v-model="form.email" type="email" autocomplete="email" placeholder="you@company.com">
            <template #leading>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                <rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m3.5 6.5 8.5 6 8.5-6" />
              </svg>
            </template>
          </UiInput>
        </UiFormField>

        <UiFormField label="Password" required hint="Minimum 8 characters" :error="fieldErrors.password">
          <UiInput
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
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

          <!-- Strength meter -->
          <div v-if="form.password" class="mt-1.5 flex items-center gap-1.5">
            <div class="flex flex-1 gap-1">
              <span
                v-for="i in 4"
                :key="i"
                class="h-1 flex-1 rounded-full transition-colors duration-300"
                :class="[
                  i <= pwStrength
                    ? ['bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'][pwStrength - 1]
                    : 'bg-slate-200',
                ]"
              />
            </div>
            <span class="w-12 text-right text-[11px] font-medium text-slate-500">{{ pwLabel }}</span>
          </div>
        </UiFormField>

        <UiButton type="submit" variant="primary" block size="lg" :loading="loading">
          Create workspace
        </UiButton>
      </form>

      <p class="mt-6 text-center text-sm text-slate-500">
        Already have an account?
        <router-link to="/login" class="font-medium text-brand-600 hover:text-brand-700 hover:underline">
          Sign in
        </router-link>
      </p>
    </div>
  </div>
</template>
