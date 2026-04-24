<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  useUsersQuery,
  useCreateUser,
} from '@/composables/queries/useUsersQuery'
import { usePagination } from '@/composables/usePagination'
import { useDebouncedRef } from '@/composables/useDebouncedRef'
import { useToast } from '@/composables/useToast'
import { downloadCsv } from '@/utils/csv'
import { P } from '@/auth/permissions'

import UiButton from '@/components/ui/UiButton.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiVirtualList from '@/components/ui/UiVirtualList.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiFormField from '@/components/ui/UiFormField.vue'
import UiModal from '@/components/ui/UiModal.vue'
import UiPagination from '@/components/ui/UiPagination.vue'

import type { User } from '@/types/domain'
import type { TableColumn } from '@/types/ui'
import type { ApiError } from '@/types/api'

const toast = useToast()

const { page, size, sort, params } = usePagination({ size: 25 })

const searchInput = ref('')
const debouncedSearch = useDebouncedRef('', 250)
watch(searchInput, (v) => (debouncedSearch.value = v))

const searchParams = computed(() => ({ ...params.value, q: debouncedSearch.value || undefined }))
const usersQuery = useUsersQuery(searchParams)
const createMutation = useCreateUser()

/* -------------------------------- create ------------------------------- */

const createOpen = ref(false)
const form = ref({ email: '', full_name: '', password: '', role_codes: ['owner'] as string[] })
const fieldErrors = ref<Record<string, string>>({})

function resetForm() {
  form.value = { email: '', full_name: '', password: '', role_codes: ['owner'] }
  fieldErrors.value = {}
}

async function submitCreate() {
  fieldErrors.value = {}
  try {
    await createMutation.mutateAsync({ ...form.value })
    toast.success(`Invited ${form.value.email}`)
    createOpen.value = false
    resetForm()
  } catch (err) {
    const apiErr = err as ApiError
    if (apiErr?.fieldErrors) fieldErrors.value = apiErr.fieldErrors
  }
}

/* -------------------------------- export ------------------------------- */

function exportCsv() {
  const rows = usersQuery.data.value?.items ?? []
  downloadCsv('users', rows, [
    { key: 'full_name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'roles', label: 'Roles' },
    { key: 'created_at', label: 'Created at' },
  ])
  toast.info(`Exported ${rows.length} row${rows.length === 1 ? '' : 's'}`)
}

/* ---------------------------- table config ----------------------------- */

const columns: TableColumn<User>[] = [
  { key: 'full_name', label: 'Name', sortable: 'full_name', width: 'minmax(200px, 1.5fr)' },
  { key: 'email', label: 'Email', sortable: 'email', width: 'minmax(220px, 1.8fr)' },
  { key: 'roles', label: 'Roles', width: 'minmax(140px, 1fr)', hideBelow: 'md' },
  {
    key: 'created_at',
    label: 'Joined',
    sortable: 'created_at',
    hideBelow: 'md',
    width: '140px',
    align: 'right',
  },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const total = computed(() => usersQuery.data.value?.total ?? 0)
const rows = computed(() => usersQuery.data.value?.items ?? [])
</script>

<template>
  <div class="space-y-4">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Users</h1>
        <p class="mt-0.5 text-sm text-slate-500">
          <span class="tabular-nums font-medium text-slate-700">{{ total.toLocaleString() }}</span>
          team member{{ total === 1 ? '' : 's' }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <UiButton variant="secondary" :disabled="!rows.length" @click="exportCsv">
          <template #leading>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
              <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
            </svg>
          </template>
          Export CSV
        </UiButton>
        <UiButton v-can="P.users.write" variant="primary" @click="createOpen = true">
          <template #leading>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </template>
          Invite user
        </UiButton>
      </div>
    </header>

    <div class="w-full max-w-sm">
      <UiInput v-model="searchInput" placeholder="Search name or email…" size="md" autocomplete="off">
        <template #leading>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
        </template>
      </UiInput>
    </div>

    <UiVirtualList
      :rows="rows"
      :columns="columns"
      row-key="id"
      :loading="usersQuery.isPending.value"
      :sort="sort"
      :row-height="60"
      :max-height="'62vh'"
      empty-title="No users yet"
      empty-description="Invite the first teammate to this workspace."
      empty-icon="users"
      @update:sort="(v) => (sort = v)"
    >
      <template #cell-full_name="{ row }">
        <div class="flex min-w-0 items-center gap-2.5">
          <div
            class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-xs font-semibold text-brand-700 ring-1 ring-brand-500/15"
            aria-hidden="true"
          >
            {{ ((row as User).full_name || (row as User).email || '·').slice(0, 1).toUpperCase() }}
          </div>
          <span class="truncate font-medium text-slate-800">
            {{ (row as User).full_name || 'Unnamed' }}
          </span>
        </div>
      </template>

      <template #cell-email="{ value }">
        <span class="truncate text-slate-600">{{ value }}</span>
      </template>

      <template #cell-roles="{ row }">
        <div class="flex flex-wrap gap-1">
          <UiBadge
            v-for="r in (row as User).roles.slice(0, 3)"
            :key="r"
            tone="brand"
            variant="soft"
          >
            {{ r }}
          </UiBadge>
          <span
            v-if="!(row as User).roles.length"
            class="text-xs text-slate-400"
          >member</span>
        </div>
      </template>

      <template #cell-created_at="{ value }">
        <span class="text-slate-500">{{ fmtDate(value as string) }}</span>
      </template>

      <template #footer>
        <UiPagination
          :page="page"
          :page-size="size"
          :total="total"
          @update:page="(v) => (page = v)"
          @update:page-size="(v) => (size = v)"
        />
      </template>
    </UiVirtualList>

    <UiModal
      v-model="createOpen"
      title="Invite a team member"
      description="They'll receive an email to set up their credentials."
      size="md"
      @close="resetForm"
    >
      <form class="space-y-4" @submit.prevent="submitCreate">
        <UiFormField label="Full name" :error="fieldErrors.full_name">
          <UiInput v-model="form.full_name" autofocus autocomplete="name" />
        </UiFormField>
        <UiFormField label="Work email" required :error="fieldErrors.email">
          <UiInput v-model="form.email" type="email" autocomplete="email" />
        </UiFormField>
        <UiFormField
          label="Temporary password"
          required
          hint="Minimum 8 characters. They'll be prompted to change it."
          :error="fieldErrors.password"
        >
          <UiInput v-model="form.password" type="password" autocomplete="new-password" />
        </UiFormField>
      </form>
      <template #footer>
        <UiButton variant="ghost" :disabled="createMutation.isPending.value" @click="createOpen = false">
          Cancel
        </UiButton>
        <UiButton variant="primary" :loading="createMutation.isPending.value" @click="submitCreate">
          Send invite
        </UiButton>
      </template>
    </UiModal>
  </div>
</template>
