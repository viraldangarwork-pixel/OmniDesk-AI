<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { ApiError } from '@/types/api'

const auth = useAuthStore()
const router = useRouter()

const form = ref({
  tenant_name: '',
  tenant_slug: '',
  full_name: '',
  email: '',
  password: '',
})
const error = ref<string | null>(null)
const loading = ref(false)

async function submit() {
  error.value = null
  loading.value = true
  try {
    await auth.register({ ...form.value })
    router.replace('/dashboard')
  } catch (e) {
    error.value = (e as ApiError)?.message ?? 'Registration failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="grid min-h-full place-items-center bg-gradient-to-br from-brand-50 via-white to-slate-100 p-6">
    <div class="card w-full max-w-lg p-8">
      <h1 class="mb-1 text-2xl font-semibold">Create your workspace</h1>
      <p class="mb-6 text-sm text-slate-500">Start your OmniDesk AI trial in seconds.</p>
      <form class="space-y-4" @submit.prevent="submit">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Company</label>
            <input v-model="form.tenant_name" class="input" required />
          </div>
          <div>
            <label class="label">Slug</label>
            <input v-model="form.tenant_slug" class="input" pattern="[a-z0-9-]+" required />
          </div>
        </div>
        <div>
          <label class="label">Your name</label>
          <input v-model="form.full_name" class="input" />
        </div>
        <div>
          <label class="label">Work email</label>
          <input v-model="form.email" type="email" class="input" required />
        </div>
        <div>
          <label class="label">Password</label>
          <input v-model="form.password" type="password" class="input" minlength="8" required />
        </div>
        <div v-if="error" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</div>
        <button class="btn-primary w-full" :disabled="loading">
          {{ loading ? 'Creating…' : 'Create workspace' }}
        </button>
      </form>
      <p class="mt-6 text-center text-sm text-slate-500">
        Already have an account?
        <router-link to="/login" class="font-medium text-brand-600 hover:underline">Sign in</router-link>
      </p>
    </div>
  </div>
</template>
