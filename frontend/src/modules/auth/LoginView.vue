<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

async function submit() {
  error.value = null
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.replace(redirect)
  } catch (e: any) {
    error.value = e?.response?.data?.detail ?? 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="grid min-h-full place-items-center bg-gradient-to-br from-brand-50 via-white to-slate-100 p-6">
    <div class="card w-full max-w-md p-8">
      <div class="mb-6 text-center">
        <div class="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-600 text-lg font-bold text-white">O</div>
        <h1 class="text-2xl font-semibold">Welcome back</h1>
        <p class="text-sm text-slate-500">Sign in to OmniDesk AI</p>
      </div>
      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="label">Email</label>
          <input v-model="email" type="email" class="input" required autocomplete="email" />
        </div>
        <div>
          <label class="label">Password</label>
          <input v-model="password" type="password" class="input" required autocomplete="current-password" />
        </div>
        <div v-if="error" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</div>
        <button class="btn-primary w-full" :disabled="loading">
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
      <p class="mt-6 text-center text-sm text-slate-500">
        No account?
        <router-link to="/register" class="font-medium text-brand-600 hover:underline">Create one</router-link>
      </p>
    </div>
  </div>
</template>
