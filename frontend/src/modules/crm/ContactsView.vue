<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import {
  useContactsQuery,
  useCreateContact,
  useDeleteContact,
} from '@/composables/queries/useContactsQuery'
import { usePagination } from '@/composables/usePagination'
import { useDebouncedRef } from '@/composables/useDebouncedRef'
import { useToast } from '@/composables/useToast'
import { qk } from '@/services/queryKeys'
import { contactsApi } from '@/services/resources/contacts'
import { downloadCsv } from '@/utils/csv'
import { P } from '@/auth/permissions'

import UiButton from '@/components/ui/UiButton.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiVirtualList from '@/components/ui/UiVirtualList.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiFormField from '@/components/ui/UiFormField.vue'
import UiModal from '@/components/ui/UiModal.vue'
import UiConfirm from '@/components/ui/UiConfirm.vue'
import UiPagination from '@/components/ui/UiPagination.vue'

import type { Contact } from '@/types/domain'
import type { TableColumn } from '@/types/ui'
import type { ApiError } from '@/types/api'

const toast = useToast()
const qc = useQueryClient()

/* ------------------------------ query state ----------------------------- */

const { page, size, sort, params } = usePagination({ size: 25 })

// Debounced search input — pushes to the pagination params after 250ms idle
// so we don't fire a request on every keystroke.
const searchInput = ref('')
const debouncedSearch = useDebouncedRef('', 250)
watch(searchInput, (v) => {
  debouncedSearch.value = v
})

// Mirror the debounced value into the pagination composable's `q` ref.
const searchParams = computed(() => ({ ...params.value, q: debouncedSearch.value || undefined }))

const contactsQuery = useContactsQuery(searchParams)
const createMutation = useCreateContact()
const deleteMutation = useDeleteContact()

/* ----------------------------- selection ------------------------------- */

const selected = ref<(string | number)[]>([])
// Clear selection whenever the page / filter changes — selected IDs might
// not even exist on the new page.
watch([page, size, debouncedSearch, sort], () => {
  selected.value = []
})

/* -------------------------------- create ------------------------------- */

const createOpen = ref(false)
const form = ref({ full_name: '', email: '', phone: '', notes: '' })
const fieldErrors = ref<Record<string, string>>({})

function resetForm() {
  form.value = { full_name: '', email: '', phone: '', notes: '' }
  fieldErrors.value = {}
}

async function submitCreate() {
  fieldErrors.value = {}
  try {
    await createMutation.mutateAsync({
      full_name: form.value.full_name || null,
      email: form.value.email || null,
      phone: form.value.phone || null,
      notes: form.value.notes || null,
    })
    toast.success('Contact created')
    createOpen.value = false
    resetForm()
  } catch (err) {
    // The global interceptor already fired an error toast; show inline
    // field errors too if the server returned any (FastAPI 422).
    const apiErr = err as ApiError
    if (apiErr?.fieldErrors) fieldErrors.value = apiErr.fieldErrors
  }
}

/* ----------------------------- bulk delete ----------------------------- */

const confirmDeleteOpen = ref(false)

async function runBulkDelete() {
  const ids = selected.value as string[]
  // Run deletions in parallel but surface a single summary toast.
  // Each individual request is silent so the global interceptor
  // doesn't spam N error toasts on a partial failure.
  const results = await Promise.allSettled(ids.map((id) => contactsApi.remove(id)))
  const failed = results.filter((r) => r.status === 'rejected').length
  const succeeded = results.length - failed
  if (succeeded) toast.success(`Deleted ${succeeded} contact${succeeded === 1 ? '' : 's'}`)
  if (failed) toast.error(`${failed} deletion${failed === 1 ? '' : 's'} failed`)
  selected.value = []
  qc.invalidateQueries({ queryKey: qk.contacts.all })
}

/* -------------------------------- export ------------------------------- */

function exportCsv() {
  const rows = contactsQuery.data.value?.items ?? []
  downloadCsv('contacts', rows, [
    { key: 'full_name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'tags', label: 'Tags' },
    { key: 'created_at', label: 'Created at' },
  ])
  toast.info(`Exported ${rows.length} row${rows.length === 1 ? '' : 's'}`)
}

/* ---------------------------- table config ----------------------------- */

const columns: TableColumn<Contact>[] = [
  { key: 'full_name', label: 'Name', sortable: 'full_name', width: 'minmax(180px, 1.4fr)' },
  { key: 'email', label: 'Email', sortable: 'email', width: 'minmax(200px, 1.6fr)' },
  { key: 'phone', label: 'Phone', hideBelow: 'md', width: 'minmax(140px, 1fr)' },
  { key: 'tags', label: 'Tags', hideBelow: 'lg', width: 'minmax(160px, 1fr)' },
  {
    key: 'created_at',
    label: 'Created',
    sortable: 'created_at',
    hideBelow: 'md',
    width: '140px',
    align: 'right',
  },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const total = computed(() => contactsQuery.data.value?.total ?? 0)
const rows = computed(() => contactsQuery.data.value?.items ?? [])
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Contacts</h1>
        <p class="mt-0.5 text-sm text-slate-500">
          <span class="tabular-nums font-medium text-slate-700">{{ total.toLocaleString() }}</span>
          total
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
        <UiButton
          v-can="P.contacts.manage"
          variant="primary"
          @click="createOpen = true"
        >
          <template #leading>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </template>
          New contact
        </UiButton>
      </div>
    </header>

    <!-- Toolbar -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="w-full max-w-sm">
        <UiInput
          v-model="searchInput"
          placeholder="Search name, email or phone…"
          size="md"
          autocomplete="off"
        >
          <template #leading>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
          </template>
        </UiInput>
      </div>

      <!-- Bulk-action rail — appears only when rows are selected -->
      <Transition name="fade-up">
        <div
          v-if="selected.length"
          class="flex items-center gap-2 rounded-lg border border-brand-200/70 bg-brand-50/80 px-3 py-1.5 text-xs"
        >
          <span class="font-medium text-brand-800">{{ selected.length }} selected</span>
          <UiButton variant="ghost" size="sm" @click="selected = []">Clear</UiButton>
          <UiButton
            v-can="P.contacts.manage"
            variant="danger"
            size="sm"
            @click="confirmDeleteOpen = true"
          >
            Delete
          </UiButton>
        </div>
      </Transition>
    </div>

    <!-- Virtualized list -->
    <UiVirtualList
      :rows="rows"
      :columns="columns"
      row-key="id"
      :loading="contactsQuery.isPending.value"
      :sort="sort"
      selectable
      :selected="selected"
      :row-height="56"
      :max-height="'62vh'"
      empty-title="No contacts yet"
      empty-description="Create your first contact or import from CSV."
      empty-icon="users"
      @update:sort="(v) => (sort = v)"
      @update:selected="(v) => (selected = v)"
    >
      <template #cell-full_name="{ row }">
        <div class="flex min-w-0 items-center gap-2.5">
          <div
            class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-xs font-semibold text-brand-700 ring-1 ring-brand-500/15"
            aria-hidden="true"
          >
            {{ ((row as Contact).full_name || (row as Contact).email || '·').slice(0, 1).toUpperCase() }}
          </div>
          <span class="truncate font-medium text-slate-800">
            {{ (row as Contact).full_name || 'Unnamed' }}
          </span>
        </div>
      </template>

      <template #cell-email="{ value }">
        <span class="truncate text-slate-600">{{ value || '—' }}</span>
      </template>

      <template #cell-phone="{ value }">
        <span class="truncate text-slate-600">{{ value || '—' }}</span>
      </template>

      <template #cell-tags="{ row }">
        <div class="flex flex-wrap gap-1">
          <UiBadge
            v-for="t in (row as Contact).tags?.slice(0, 3) ?? []"
            :key="t"
            tone="brand"
            variant="soft"
          >
            {{ t }}
          </UiBadge>
          <span
            v-if="((row as Contact).tags?.length ?? 0) === 0"
            class="text-xs text-slate-400"
          >—</span>
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

    <!-- Create modal -->
    <UiModal
      v-model="createOpen"
      title="New contact"
      description="Save contact details to reach them across channels."
      size="md"
      @close="resetForm"
    >
      <form class="space-y-4" @submit.prevent="submitCreate">
        <UiFormField label="Full name" :error="fieldErrors.full_name">
          <UiInput v-model="form.full_name" autofocus autocomplete="name" />
        </UiFormField>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <UiFormField label="Email" :error="fieldErrors.email">
            <UiInput v-model="form.email" type="email" autocomplete="email" />
          </UiFormField>
          <UiFormField label="Phone" :error="fieldErrors.phone">
            <UiInput v-model="form.phone" type="tel" autocomplete="tel" />
          </UiFormField>
        </div>
        <UiFormField label="Notes" :error="fieldErrors.notes">
          <UiInput v-model="form.notes" placeholder="Optional internal notes" />
        </UiFormField>
      </form>

      <template #footer>
        <UiButton variant="ghost" :disabled="createMutation.isPending.value" @click="createOpen = false">
          Cancel
        </UiButton>
        <UiButton
          variant="primary"
          :loading="createMutation.isPending.value"
          @click="submitCreate"
        >
          Create contact
        </UiButton>
      </template>
    </UiModal>

    <!-- Bulk delete confirmation -->
    <UiConfirm
      v-model="confirmDeleteOpen"
      :title="`Delete ${selected.length} contact${selected.length === 1 ? '' : 's'}?`"
      description="This action can't be undone. Related conversations remain but will no longer be attributed to these contacts."
      confirm-label="Delete"
      tone="danger"
      :on-confirm="runBulkDelete"
    />
  </div>
</template>
