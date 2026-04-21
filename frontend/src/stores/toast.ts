import { defineStore } from 'pinia'
import type { Toast, ToastKind } from '@/types/ui'

let seq = 0

interface State {
  items: Toast[]
}

export const useToastStore = defineStore('toast', {
  state: (): State => ({ items: [] }),
  actions: {
    push(t: Omit<Toast, 'id'>): string {
      const id = `t_${Date.now().toString(36)}_${++seq}`
      const duration = t.duration ?? defaultDuration(t.kind)
      this.items.push({ id, ...t, duration })
      if (duration > 0) {
        window.setTimeout(() => this.dismiss(id), duration)
      }
      return id
    },
    dismiss(id: string) {
      this.items = this.items.filter((x) => x.id !== id)
    },
    clear() {
      this.items = []
    },
  },
})

function defaultDuration(kind: ToastKind): number {
  return kind === 'error' ? 7000 : 4500
}
