<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import {
  useLeadsQuery,
  useLeadStagesQuery,
  useCreateLead,
  useUpdateLead,
  useCreateLeadStage,
} from '@/composables/queries/useLeadsQuery'
import { useContactsQuery } from '@/composables/queries/useContactsQuery'
import { useDebouncedRef } from '@/composables/useDebouncedRef'
import { useToast } from '@/composables/useToast'
import { qk } from '@/services/queryKeys'
import { P } from '@/auth/permissions'

import UiButton from '@/components/ui/UiButton.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiFormField from '@/components/ui/UiFormField.vue'
import UiModal from '@/components/ui/UiModal.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiEmptyState from '@/components/ui/UiEmptyState.vue'
import UiSpinner from '@/components/ui/UiSpinner.vue'

import type { Lead, LeadStage, Contact } from '@/types/domain'
import type { Page, ApiError } from '@/types/api'

const toast = useToast()
const qc = useQueryClient()

/* ------------------------------ queries ------------------------------ */

const stagesQuery = useLeadStagesQuery()
const leadsQuery = useLeadsQuery({ page: 1, size: 500 })

const stages = computed<LeadStage[]>(() =>
  [...(stagesQuery.data.value ?? [])].sort((a, b) => a.position - b.position),
)
const leads = computed<Lead[]>(() => leadsQuery.data.value?.items ?? [])

/* ------------------- seed default stages on first load ---------------- */

const seedStage = useCreateLeadStage()
async function seedDefaults() {
  const defaults = ['New', 'Qualified', 'Demo', 'Proposal', 'Won', 'Lost']
  for (let i = 0; i < defaults.length; i++) {
    await seedStage.mutateAsync({
      name: defaults[i],
      code: defaults[i].toLowerCase(),
      position: i,
    })
  }
}
watch(
  [stagesQuery.isSuccess, stages],
  ([ok, list]) => {
    if (ok && Array.isArray(list) && list.length === 0) seedDefaults()
  },
  { immediate: true },
)

/* ------------------------------ grouping ----------------------------- */

const grouped = computed(() => {
  const map = new Map<string, Lead[]>()
  for (const s of stages.value) map.set(s.id, [])
  for (const l of leads.value) {
    if (!l.stage_id) continue
    const bucket = map.get(l.stage_id) ?? []
    bucket.push(l)
    map.set(l.stage_id, bucket)
  }
  return map
})

function stageTotal(s: LeadStage): number {
  return (grouped.value.get(s.id) ?? []).reduce((acc, l) => {
    const v = typeof l.value === 'string' ? Number(l.value) : l.value ?? 0
    return acc + (Number.isFinite(v) ? (v as number) : 0)
  }, 0)
}

function fmtCurrency(n: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
  } catch {
    return `${currency} ${n.toFixed(0)}`
  }
}

/* -------------------------- optimistic DnD --------------------------- */

const updateLead = useUpdateLead()
const draggingId = ref<string | null>(null)
const dropTarget = ref<string | null>(null)

function onDragStart(ev: DragEvent, lead: Lead) {
  draggingId.value = lead.id
  ev.dataTransfer?.setData('text/plain', lead.id)
  if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move'
}

function onDragEnd() {
  draggingId.value = null
  dropTarget.value = null
}

function onDragEnter(stageId: string) {
  dropTarget.value = stageId
}

async function onDrop(stage: LeadStage) {
  const id = draggingId.value
  draggingId.value = null
  dropTarget.value = null
  if (!id) return
  const lead = leads.value.find((l) => l.id === id)
  if (!lead || lead.stage_id === stage.id) return

  // Optimistic cache patch: update the single list query holding leads.
  const key = qk.leads.list({ page: 1, size: 500 })
  const snapshot = qc.getQueryData<Page<Lead>>(key)
  if (snapshot) {
    qc.setQueryData<Page<Lead>>(key, {
      ...snapshot,
      items: snapshot.items.map((l) =>
        l.id === lead.id ? { ...l, stage_id: stage.id } : l,
      ),
    })
  }

  try {
    await updateLead.mutateAsync({ id: lead.id, payload: { stage_code: stage.code } })
  } catch {
    // Roll back to the pre-optimistic snapshot.
    if (snapshot) qc.setQueryData(key, snapshot)
    // Global interceptor already surfaced the error toast.
  }
}

/* ------------------------------ create ------------------------------- */

const createOpen = ref(false)
const createMutation = useCreateLead()
const form = ref({
  contact_id: '',
  title: '',
  value: '' as string,
  currency: 'USD',
  stage_code: '',
})
const fieldErrors = ref<Record<string, string>>({})

// Contact picker — lightweight: search contacts as the user types.
const contactSearch = ref('')
const debouncedContact = useDebouncedRef('', 200)
watch(contactSearch, (v) => (debouncedContact.value = v))
const contactResults = useContactsQuery(
  computed(() => ({ page: 1, size: 6, q: debouncedContact.value || undefined })),
)
const pickedContact = ref<Contact | null>(null)
function pickContact(c: Contact) {
  pickedContact.value = c
  form.value.contact_id = c.id
  contactSearch.value = c.full_name || c.email || c.id
}

const stageOptions = computed(() =>
  stages.value.map((s) => ({ value: s.code, label: s.name })),
)

function resetCreate() {
  form.value = { contact_id: '', title: '', value: '', currency: 'USD', stage_code: '' }
  pickedContact.value = null
  contactSearch.value = ''
  fieldErrors.value = {}
}

async function submitCreate() {
  fieldErrors.value = {}
  try {
    await createMutation.mutateAsync({
      contact_id: form.value.contact_id,
      title: form.value.title,
      value: form.value.value ? Number(form.value.value) : null,
      currency: form.value.currency || 'USD',
      stage_code: form.value.stage_code || undefined,
    })
    toast.success('Lead created')
    createOpen.value = false
    resetCreate()
  } catch (err) {
    const apiErr = err as ApiError
    if (apiErr?.fieldErrors) fieldErrors.value = apiErr.fieldErrors
  }
}

const loading = computed(() => leadsQuery.isPending.value || stagesQuery.isPending.value)
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Leads</h1>
        <p class="mt-0.5 text-sm text-slate-500">
          <span class="tabular-nums font-medium text-slate-700">{{ leads.length.toLocaleString() }}</span>
          open across <span class="tabular-nums font-medium text-slate-700">{{ stages.length }}</span>
          stage{{ stages.length === 1 ? '' : 's' }}
        </p>
      </div>
      <UiButton v-can="P.leads.manage" variant="primary" :disabled="!stages.length" @click="createOpen = true">
        <template #leading>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </template>
        New lead
      </UiButton>
    </header>

    <!-- Board -->
    <div
      v-if="loading"
      class="grid h-[60vh] place-items-center rounded-2xl border border-dashed border-slate-200 bg-white/60 text-sm text-slate-400"
    >
      <div class="flex items-center gap-2"><UiSpinner size="md" /> Loading board…</div>
    </div>
    <div
      v-else
      class="grid auto-cols-[minmax(280px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2"
    >
      <section
        v-for="stage in stages"
        :key="stage.id"
        class="card flex h-[70vh] flex-col p-3 transition-colors"
        :class="dropTarget === stage.id && 'ring-2 ring-brand-500/40 bg-brand-50/40'"
        @dragover.prevent
        @dragenter.prevent="onDragEnter(stage.id)"
        @drop.prevent="onDrop(stage)"
      >
        <header class="mb-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span
              class="h-2.5 w-2.5 rounded-full"
              :style="{ backgroundColor: stage.color ?? 'rgb(100 116 139)' }"
              aria-hidden="true"
            />
            <h2 class="text-sm font-semibold text-slate-800">{{ stage.name }}</h2>
            <UiBadge tone="slate" variant="soft">
              {{ (grouped.get(stage.id) ?? []).length }}
            </UiBadge>
          </div>
          <span class="text-xs tabular-nums text-slate-500">
            {{ fmtCurrency(stageTotal(stage), 'USD') }}
          </span>
        </header>

        <div class="flex-1 space-y-2 overflow-auto">
          <article
            v-for="lead in grouped.get(stage.id) ?? []"
            :key="lead.id"
            class="group cursor-grab rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-md"
            :class="draggingId === lead.id && 'opacity-60 scale-[0.98]'"
            draggable="true"
            @dragstart="(ev) => onDragStart(ev, lead)"
            @dragend="onDragEnd"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="truncate font-medium text-slate-800">{{ lead.title }}</div>
              <UiBadge v-if="lead.probability" tone="brand" variant="soft">
                {{ lead.probability }}%
              </UiBadge>
            </div>
            <div class="mt-1.5 flex items-center justify-between text-xs text-slate-500">
              <span class="tabular-nums">
                <template v-if="lead.value">
                  {{ fmtCurrency(Number(lead.value), lead.currency) }}
                </template>
                <template v-else>No value</template>
              </span>
              <span v-if="lead.source" class="truncate">{{ lead.source }}</span>
            </div>
          </article>

          <div
            v-if="(grouped.get(stage.id) ?? []).length === 0"
            class="rounded-lg border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400"
          >
            Drop a lead here
          </div>
        </div>
      </section>

      <!-- Sentinel when no stages exist yet (seeding) -->
      <div
        v-if="!stages.length"
        class="card grid min-h-[40vh] place-items-center p-6"
      >
        <UiEmptyState
          icon="folder"
          title="Setting up your pipeline"
          description="We’re seeding default stages — this should only take a moment."
          compact
        />
      </div>
    </div>

    <!-- Create modal -->
    <UiModal v-model="createOpen" title="New lead" size="md" @close="resetCreate">
      <form class="space-y-4" @submit.prevent="submitCreate">
        <UiFormField
          label="Contact"
          required
          hint="Search existing contacts by name, email or phone"
          :error="fieldErrors.contact_id"
        >
          <UiInput
            v-model="contactSearch"
            placeholder="Type to search…"
            autofocus
            autocomplete="off"
          >
            <template #leading>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
              </svg>
            </template>
          </UiInput>
          <!-- Result pickers -->
          <div
            v-if="contactSearch.trim() && !pickedContact && contactResults.data.value"
            class="mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
          >
            <button
              v-for="c in contactResults.data.value.items"
              :key="c.id"
              type="button"
              class="flex w-full items-center gap-2 border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-slate-50"
              @click="pickContact(c)"
            >
              <span
                class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700"
              >{{ (c.full_name || c.email || '·').slice(0, 1).toUpperCase() }}</span>
              <span class="min-w-0 flex-1 truncate">
                <span class="font-medium text-slate-800">{{ c.full_name || 'Unnamed' }}</span>
                <span v-if="c.email" class="text-slate-500"> · {{ c.email }}</span>
              </span>
            </button>
            <div
              v-if="!contactResults.data.value.items.length"
              class="px-3 py-2 text-sm text-slate-400"
            >
              No matches
            </div>
          </div>
        </UiFormField>

        <UiFormField label="Title" required :error="fieldErrors.title">
          <UiInput v-model="form.title" placeholder="e.g. Acme Corp — Enterprise plan" />
        </UiFormField>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <UiFormField label="Value" :error="fieldErrors.value">
            <UiInput v-model="form.value" type="number" placeholder="0" numeric />
          </UiFormField>
          <UiFormField label="Currency" :error="fieldErrors.currency">
            <UiInput v-model="form.currency" />
          </UiFormField>
          <UiFormField label="Stage" :error="fieldErrors.stage_code">
            <UiSelect
              v-model="form.stage_code"
              :options="stageOptions"
              placeholder="Select stage"
            />
          </UiFormField>
        </div>
      </form>

      <template #footer>
        <UiButton
          variant="ghost"
          :disabled="createMutation.isPending.value"
          @click="createOpen = false"
        >
          Cancel
        </UiButton>
        <UiButton
          variant="primary"
          :loading="createMutation.isPending.value"
          :disabled="!form.contact_id || !form.title.trim()"
          @click="submitCreate"
        >
          Create lead
        </UiButton>
      </template>
    </UiModal>
  </div>
</template>
