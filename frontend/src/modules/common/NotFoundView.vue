<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="grid min-h-full place-items-center bg-gradient-to-br from-brand-50 via-white to-slate-100 p-6">
    <div class="card p-10 text-center">
      <div class="text-6xl font-bold text-brand-600">404</div>
      <p class="mt-2 text-slate-600">Page not found.</p>
      <RouterLink to="/" class="btn-primary mt-4 inline-flex">Go home</RouterLink>
    </div>
  </div>
</template>
