import { defineStore } from 'pinia'

const STORAGE_KEY = 'omnidesk.ui'

interface State {
  sidebarCollapsed: boolean
  mobileNavOpen: boolean
}

function load(): Partial<State> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function persist(state: State) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ sidebarCollapsed: state.sidebarCollapsed }),
    )
  } catch {
    /* noop */
  }
}

export const useUiStore = defineStore('ui', {
  state: (): State => ({
    sidebarCollapsed: false,
    mobileNavOpen: false,
    ...load(),
  }),
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
      persist(this.$state)
    },
    setSidebarCollapsed(value: boolean) {
      this.sidebarCollapsed = value
      persist(this.$state)
    },
    toggleMobileNav() {
      this.mobileNavOpen = !this.mobileNavOpen
    },
    closeMobileNav() {
      this.mobileNavOpen = false
    },
  },
})
