import { ref } from 'vue'

/**
 * WebSocket client with auto-reconnect and sub-protocol bearer auth.
 *
 * Why sub-protocol auth?  Previously the JWT was sent as `?token=<jwt>` in
 * the URL, which ends up in access logs, HTTP proxy trace files and browser
 * history.  We now pass it as the second WebSocket sub-protocol:
 *
 *     new WebSocket(url, ['bearer', '<jwt>'])
 *
 * The server parses the `Sec-WebSocket-Protocol` header, validates the token,
 * and completes the handshake echoing only `bearer` (so the token never
 * appears in the response).  The URL is now credential-free.
 */

type Listener = (event: string, data: unknown) => void

const WS_BASE = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000/ws'

let socket: WebSocket | null = null
let currentToken: string | null = null
let reconnectTimer: number | null = null
let reconnectAttempts = 0
let manualDisconnect = false

const listeners = new Set<Listener>()
export const wsStatus = ref<'idle' | 'connecting' | 'open' | 'closed'>('idle')

const MAX_BACKOFF_MS = 30_000

export function connectWebSocket(token: string) {
  currentToken = token
  manualDisconnect = false
  openSocket()
}

function openSocket() {
  if (!currentToken) return
  if (socket && socket.readyState <= WebSocket.OPEN) {
    socket.close()
  }
  wsStatus.value = 'connecting'
  try {
    socket = new WebSocket(WS_BASE, ['bearer', currentToken])
  } catch (err) {
    console.warn('[ws] construction failed', err)
    scheduleReconnect()
    return
  }

  socket.onopen = () => {
    reconnectAttempts = 0
    wsStatus.value = 'open'
  }

  socket.onclose = (ev) => {
    wsStatus.value = 'closed'
    // 1008 policy violation = auth rejection — don't loop.
    if (ev.code === 1008) {
      console.warn('[ws] auth rejected, not reconnecting')
      return
    }
    if (!manualDisconnect) scheduleReconnect()
  }

  socket.onerror = (ev) => {
    console.warn('[ws] error', ev)
  }

  socket.onmessage = (ev) => {
    try {
      const { event, data } = JSON.parse(ev.data)
      listeners.forEach((l) => l(event, data))
    } catch {
      /* ignore malformed frames */
    }
  }
}

function scheduleReconnect() {
  if (reconnectTimer !== null) return
  reconnectAttempts++
  const delay = Math.min(MAX_BACKOFF_MS, 500 * 2 ** Math.min(reconnectAttempts, 6))
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null
    openSocket()
  }, delay)
}

export function disconnectWebSocket() {
  manualDisconnect = true
  currentToken = null
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  socket?.close()
  socket = null
  wsStatus.value = 'closed'
}

export function onWsEvent(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * Send a JSON frame to the server.  Silent no-op when the socket isn't open —
 * callers don't need to care whether the connection is currently up.
 */
export function sendWsMessage(event: string, data: unknown) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ event, data }))
  }
}
