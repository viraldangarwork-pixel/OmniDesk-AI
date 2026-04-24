<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  useKbListQuery,
  useKbSearchQuery,
  useIngestKbUrl,
  useUploadKbFile,
  useDeleteKbDocument,
} from '@/composables/queries/useKbQuery'
import { usePagination } from '@/composables/usePagination'
import { useDebouncedRef } from '@/composables/useDebouncedRef'
import { useToast } from '@/composables/useToast'
import { P } from '@/auth/permissions'
import { safeUrl, EXTERNAL_REL } from '@/utils/safeUrl'

import UiButton from '@/components/ui/UiButton.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiVirtualList from '@/components/ui/UiVirtualList.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiFormField from '@/components/ui/UiFormField.vue'
import UiModal from '@/components/ui/UiModal.vue'
import UiConfirm from '@/components/ui/UiConfirm.vue'
import UiPagination from '@/components/ui/UiPagination.vue'
import UiEmptyState from '@/components/ui/UiEmptyState.vue'
import UiSpinner from '@/components/ui/UiSpinner.vue'

import type { KBDocument } from '@/types/domain'
import type { TableColumn, Tone } from '@/types/ui'
import type { ApiError } from '@/types/api'

const toast = useToast()

/* ------------------------------ list state ----------------------------- */

const { page, size, sort, params } = usePagination({ size: 25 })
const listSearch = ref('')
const debouncedList = useDebouncedRef('', 250)
watch(listSearch, (v) => (debouncedList.value = v))

const listParams = computed(() => ({ ...params.value, q: debouncedList.value || undefined }))
const docsQuery = useKbListQuery(listParams)

const total = computed(() => docsQuery.data.value?.total ?? 0)
const rows = computed(() => docsQuery.data.value?.items ?? [])

/* ----------------------------- delete flow ----------------------------- */

const deleteTarget = ref<KBDocument | null>(null)
const deleteMutation = useDeleteKbDocument()

async function runDelete() {
  if (!deleteTarget.value) return
  try {
    await deleteMutation.mutateAsync(deleteTarget.value.id)
    toast.success('Document removed')
  } finally {
    deleteTarget.value = null
  }
}

/* ---------------------- URL ingest + file upload ----------------------- */

const ingestOpen = ref(false)
const ingestTab = ref<'url' | 'file'>('url')

const urlForm = ref({ url: '', title: '' })
const urlErrors = ref<Record<string, string>>({})
const file = ref<File | null>(null)

const urlMutation = useIngestKbUrl()
const uploadMutation = useUploadKbFile()

async function submitUrl() {
  urlErrors.value = {}
  try {
    await urlMutation.mutateAsync({ url: urlForm.value.url, title: urlForm.value.title || undefined })
    toast.success('URL queued for ingestion')
    ingestOpen.value = false
    urlForm.value = { url: '', title: '' }
  } catch (err) {
    const apiErr = err as ApiError
    if (apiErr?.fieldErrors) urlErrors.value = apiErr.fieldErrors
  }
}

async function submitUpload() {
  if (!file.value) return
  try {
    const name = file.value.name
    await uploadMutation.mutateAsync({ file: file.value, title: undefined })
    toast.success(`Uploaded ${name}`)
    ingestOpen.value = false
    file.value = null
  } catch {
    /* global toast fired */
  }
}

function onFilePick(ev: Event) {
  const input = ev.target as HTMLInputElement
  file.value = input.files?.[0] ?? null
}

/* ------------------------------ semantic search ------------------------ */

const searchInput = ref('')
const debouncedSearch = useDebouncedRef('', 300)
watch(searchInput, (v) => (debouncedSearch.value = v))
const searchQuery = useKbSearchQuery(debouncedSearch)
const searchHits = computed(() => searchQuery.data.value?.results ?? [])

/* ---------------------------- table config ----------------------------- */

const statusTone: Record<string, Tone> = {
  pending: 'amber',
  ready: 'emerald',
  indexed: 'emerald',
  failed: 'rose',
}

const columns: TableColumn<KBDocument>[] = [
  { key: 'title', label: 'Title', sortable: 'title', width: 'minmax(260px, 2fr)' },
  { key: 'source_type', label: 'Source', width: '120px', hideBelow: 'sm' },
  { key: 'status', label: 'Status', width: '120px' },
  {
    key: 'created_at',
    label: 'Added',
    sortable: 'created_at',
    hideBelow: 'md',
    width: '140px',
    align: 'right',
  },
  { key: 'actions', label: '', width: '60px', align: 'right' },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="space-y-5">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Knowledge base</h1>
        <p class="mt-0.5 text-sm text-slate-500">
          <span class="tabular-nums font-medium text-slate-700">{{ total.toLocaleString() }}</span>
          document{{ total === 1 ? '' : 's' }} indexed for AI retrieval.
        </p>
      </div>
      <UiButton v-can="P.kb.manage" variant="primary" @click="ingestOpen = true">
        <template #leading>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </template>
        Add document
      </UiButton>
    </header>

    <!-- Semantic search panel -->
    <section class="card p-4">
      <div class="flex items-center gap-2">
        <div class="flex-1">
          <UiInput
            v-model="searchInput"
            placeholder="Ask a question — answers retrieved from your KB…"
            size="lg"
          >
            <template #leading>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
              </svg>
            </template>
            <template v-if="searchQuery.isFetching.value" #trailing>
              <UiSpinner size="sm" />
            </template>
          </UiInput>
        </div>
      </div>

      <div v-if="searchInput.trim().length >= 2" class="mt-4 space-y-2">
        <div
          v-for="hit in searchHits"
          :key="hit.id"
          class="rounded-lg border border-slate-200/70 bg-slate-50/60 p-3"
        >
          <div class="mb-1 flex items-center gap-2 text-xs text-slate-500">
            <UiBadge tone="brand" variant="soft">score {{ hit.score.toFixed(2) }}</UiBadge>
          </div>
          <p class="text-sm leading-relaxed text-slate-700">{{ hit.content }}</p>
        </div>
        <div
          v-if="!searchHits.length && !searchQuery.isFetching.value"
          class="py-6 text-center text-sm text-slate-400"
        >
          No matches.
        </div>
      </div>
      <UiEmptyState
        v-else
        icon="search"
        title="Ask your knowledge base"
        description="Type at least two characters. Results come from your indexed documents."
        compact
      />
    </section>

    <!-- List toolbar -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="w-full max-w-sm">
        <UiInput v-model="listSearch" placeholder="Search documents by title…" size="md" autocomplete="off">
          <template #leading>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
          </template>
        </UiInput>
      </div>
    </div>

    <UiVirtualList
      :rows="rows"
      :columns="columns"
      row-key="id"
      :loading="docsQuery.isPending.value"
      :sort="sort"
      :row-height="60"
      :max-height="'55vh'"
      empty-title="No documents yet"
      empty-description="Upload a file or ingest a URL to start building your KB."
      empty-icon="folder"
      @update:sort="(v) => (sort = v)"
    >
      <template #cell-title="{ row }">
        <div class="flex min-w-0 items-center gap-2.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 shrink-0 text-slate-400">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h8M8 9h2" />
          </svg>
          <a
            v-if="(row as KBDocument).source_url && safeUrl((row as KBDocument).source_url)"
            :href="safeUrl((row as KBDocument).source_url)!"
            target="_blank"
            :rel="EXTERNAL_REL"
            class="truncate font-medium text-slate-800 hover:text-brand-700 hover:underline"
          >
            {{ (row as KBDocument).title }}
          </a>
          <span v-else class="truncate font-medium text-slate-800">{{ (row as KBDocument).title }}</span>
        </div>
      </template>

      <template #cell-source_type="{ value }">
        <UiBadge tone="slate" variant="soft">{{ value || 'file' }}</UiBadge>
      </template>

      <template #cell-status="{ value }">
        <UiBadge
          :tone="statusTone[value as string] ?? 'slate'"
          variant="soft"
          dot
          :pulse="value === 'pending'"
        >
          {{ value }}
        </UiBadge>
      </template>

      <template #cell-created_at="{ value }">
        <span class="text-slate-500">{{ fmtDate(value as string) }}</span>
      </template>

      <template #cell-actions="{ row }">
        <UiButton
          v-can="P.kb.manage"
          variant="ghost"
          size="sm"
          icon-only
          label="Delete document"
          @click.stop="deleteTarget = row as KBDocument"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-rose-500">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14M10 11v6M14 11v6" />
          </svg>
        </UiButton>
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

    <!-- Ingest modal — tabbed URL / file upload -->
    <UiModal v-model="ingestOpen" title="Add to knowledge base" size="md">
      <div class="mb-4 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-sm">
        <button
          type="button"
          class="rounded-md px-3 py-1 font-medium transition-colors"
          :class="ingestTab === 'url' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
          @click="ingestTab = 'url'"
        >
          From URL
        </button>
        <button
          type="button"
          class="rounded-md px-3 py-1 font-medium transition-colors"
          :class="ingestTab === 'file' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
          @click="ingestTab = 'file'"
        >
          Upload file
        </button>
      </div>

      <form v-if="ingestTab === 'url'" class="space-y-4" @submit.prevent="submitUrl">
        <UiFormField label="URL" required :error="urlErrors.url">
          <UiInput v-model="urlForm.url" type="url" placeholder="https://docs.yourcompany.com/article" autofocus />
        </UiFormField>
        <UiFormField label="Title" hint="Optional — defaults to the URL" :error="urlErrors.title">
          <UiInput v-model="urlForm.title" />
        </UiFormField>
      </form>

      <div v-else class="space-y-3">
        <label
          class="flex cursor-pointer items-center justify-center gap-3 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600 transition-colors hover:border-brand-400 hover:bg-brand-50/40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-slate-400">
            <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
          </svg>
          <span v-if="!file">Click to choose a file (PDF, DOCX, TXT, MD)</span>
          <span v-else class="truncate font-medium text-slate-800">{{ file.name }}</span>
          <input type="file" class="sr-only" accept=".pdf,.txt,.md,.docx" @change="onFilePick" />
        </label>
      </div>

      <template #footer>
        <UiButton variant="ghost" @click="ingestOpen = false">Cancel</UiButton>
        <UiButton
          v-if="ingestTab === 'url'"
          variant="primary"
          :loading="urlMutation.isPending.value"
          @click="submitUrl"
        >
          Ingest
        </UiButton>
        <UiButton
          v-else
          variant="primary"
          :disabled="!file"
          :loading="uploadMutation.isPending.value"
          @click="submitUpload"
        >
          Upload
        </UiButton>
      </template>
    </UiModal>

    <!-- Delete confirm -->
    <UiConfirm
      :model-value="!!deleteTarget"
      :title="deleteTarget ? `Delete “${deleteTarget.title}”?` : 'Delete document?'"
      description="The document and all indexed chunks will be removed. This can't be undone."
      confirm-label="Delete"
      tone="danger"
      :on-confirm="runDelete"
      @update:model-value="(v) => !v && (deleteTarget = null)"
    />
  </div>
</template>
