import { ref } from 'vue'

type Listener = (event: string, data: unknown) => void

const WS_BASE = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000/ws'

let socket: WebSocket | null = null
const listeners = new Set<Listener>()
export const wsStatus = ref<'idle' | 'open' | 'closed'>('idle')

export function connectWebSocket(token: string) {
  if (socket && socket.readyState <= 1) socket.close()
  socket = new WebSocket(`${WS_BASE}?token=${encodeURIComponent(token)}`)
  socket.onopen = () => (wsStatus.value = 'open')
  socket.onclose = () => (wsStatus.value = 'closed')
  socket.onmessage = (ev) => {
    try {
      const { event, data } = JSON.parse(ev.data)
      listeners.forEach((l) => l(event, data))
    } catch {
      /* ignore */
    }
  }
}

export function disconnectWebSocket() {
  socket?.close()
  socket = null
  wsStatus.value = 'closed'
}

export function onWsEvent(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
