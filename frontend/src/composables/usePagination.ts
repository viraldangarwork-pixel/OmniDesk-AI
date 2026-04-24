import { computed, ref, watch } from 'vue'
import type { PageParams } from '@/types/api'
import type { SortState } from '@/types/ui'

interface Defaults {
  page?: number
  size?: number
  sort?: SortState | null
  q?: string
}

/**
 * Reactive paging + sort + search state bound together.  Drop-in companion
 * for `useQuery` + `UiDataTable` + `UiPagination`.
 *
 * Design notes:
 *  - Changing `size` resets `page` to 1 — otherwise a user on page 12 at
 *    size 25 would land on a non-existent page when they select size 100.
 *  - Clearing the search string (`q=''`) sends `undefined` so the backend
 *    short-circuits its (usually expensive) full-text path.
 */
export function usePagination(defaults: Defaults = {}) {
  const page = ref(defaults.page ?? 1)
  const size = ref(defaults.size ?? 25)
  const sort = ref<SortState | null>(defaults.sort ?? null)
  const q = ref<string>(defaults.q ?? '')

  watch(size, () => {
    page.value = 1
  })
  watch(sort, () => {
    page.value = 1
  })
  watch(q, () => {
    page.value = 1
  })

  const params = computed<PageParams>(() => ({
    page: page.value,
    size: size.value,
    q: q.value.trim() ? q.value.trim() : undefined,
    sort: sort.value?.key,
    order: sort.value?.order,
  }))

  function reset() {
    page.value = defaults.page ?? 1
    size.value = defaults.size ?? 25
    sort.value = defaults.sort ?? null
    q.value = defaults.q ?? ''
  }

  return { page, size, sort, q, params, reset }
}
