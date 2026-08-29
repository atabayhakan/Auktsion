// src/composables/useEcho.ts
// Real-time transport for iTorgo. Connects directly to the backend's native
// `ws` server (server/src/services/websocketService.ts) — there is no
// Pusher/Soketi broadcaster running anywhere, so this does not use
// laravel-echo/pusher-js. The connection is a module-level singleton: every
// component that calls useEcho() shares the same socket instead of opening
// one per call.
import { ref } from 'vue'
import { useBiddingStore } from '@/stores/bidding'
import { useAuctionStore } from '@/stores/auction'
import { useUIStore } from '@/stores/ui'
import { useActivityStore } from '@/stores/activity'

let socket: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectDelay = 1000
let intentionalDisconnect = false
const RECONNECT_MAX_DELAY = 30000
const joinedAuctions = new Set<string>()

const isConnected = ref(false)
const connectionError = ref<string | null>(null)

function resolveWsUrl(): string {
  if (typeof window === 'undefined') return ''
  const override = import.meta.env.VITE_WS_URL
  if (override) return override
  // Mirrors ApiClient's own dev/prod split (services/api.ts) so the socket
  // always points at the same backend the REST calls do.
  if (window.location.origin.includes(':5173')) return 'ws://localhost:5000/ws'
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/ws`
}

// Optional identity upgrade: the backend verifies the JWT at connection time
// (query param — the browser WebSocket API cannot set custom headers).
function buildSocketUrl(): string {
  const base = resolveWsUrl()
  if (!base) return ''
  const token = localStorage.getItem('token')
  if (!token) return base
  return `${base}?token=${encodeURIComponent(token)}`
}

function sendFrame(frame: Record<string, unknown>) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(frame))
  }
}

function handleMessage(raw: MessageEvent) {
  let frame: { event?: string; data?: any }
  try {
    frame = JSON.parse(raw.data)
  } catch {
    return
  }
  if (!frame.event || !frame.data) return

  switch (frame.event) {
    case 'bid.placed': {
      useBiddingStore().handleRealTimeBid(frame.data)

      // The broadcast bid row has no auction join (see auctionController.ts's
      // placeBidAtomic call site), so auctionTitle/auctionImage come back
      // empty — resolve them from whatever the client already has loaded.
      const auction = useAuctionStore().getAuctionById(frame.data.auctionId)
      const bid = frame.data.bid || {}
      useActivityStore().pushLive({
        id: bid.id || `live-${frame.data.auctionId}-${bid.sequence ?? Date.now()}`,
        auctionId: frame.data.auctionId,
        auctionTitle: auction?.title || bid.auctionTitle || '',
        auctionImage: auction?.images?.[0] || bid.auctionImage || '',
        bidderName: bid.bidderName || bid.bidder?.fullName || '',
        amount: bid.amount,
        placedAt: bid.placedAt || frame.data.timestamp,
      })
      break
    }
    case 'auction.status_changed': {
      useAuctionStore().setAuctionStatus(frame.data.auctionId, frame.data.status)
      break
    }
    // 'auction.created' is broadcast but has no UI consumer yet.
    // There is no backend event for "auction ended with a winner" today —
    // auction.status_changed only fires from the admin draft/active toggle,
    // so it must not be wired to the winner-toast flow (handleAuctionEnded).
  }
}

function connect() {
  if (typeof window === 'undefined') return
  // Also blocks while the previous socket is still CLOSING — without this,
  // a connect() issued mid-close could create a second live socket that
  // double-delivers every event to handleMessage.
  if (socket && socket.readyState !== WebSocket.CLOSED) return

  intentionalDisconnect = false
  const url = buildSocketUrl()
  if (!url) return

  socket = new WebSocket(url)

  socket.onopen = () => {
    isConnected.value = true
    connectionError.value = null
    reconnectDelay = 1000
    useUIStore().setOnlineStatus(true)
    // (Re-)subscribe to every auction room after connect or reconnect.
    for (const auctionId of joinedAuctions) {
      sendFrame({ event: 'subscribe', auctionId })
    }
  }

  socket.onmessage = handleMessage

  socket.onclose = () => {
    isConnected.value = false
    useUIStore().setOnlineStatus(false)
    socket = null
    // A deliberate disconnect() must not resurrect itself once this async
    // close handshake finally completes.
    if (intentionalDisconnect) return
    reconnectTimer = setTimeout(connect, reconnectDelay)
    reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_DELAY)
  }

  socket.onerror = () => {
    connectionError.value = 'WebSocket error'
  }
}

function disconnect() {
  intentionalDisconnect = true
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  joinedAuctions.clear()
  socket?.close()
  socket = null
  isConnected.value = false
}

export function useEcho() {
  function initialize() {
    connect()
  }

  // The backend now scopes bid.placed delivery to per-auction rooms, so
  // joining/leaving sends real subscribe/unsubscribe frames. handleRealTimeBid
  // still scopes outbid logic to the currently-viewed auction via
  // biddingStore.currentAuctionId.
  function joinAuctionChannel(auctionId: string) {
    if (joinedAuctions.has(auctionId)) return
    joinedAuctions.add(auctionId)
    sendFrame({ event: 'subscribe', auctionId })
  }

  function leaveAuctionChannel(auctionId: string) {
    joinedAuctions.delete(auctionId)
    sendFrame({ event: 'unsubscribe', auctionId })
  }

  return {
    isConnected,
    connectionError,
    initialize,
    joinAuctionChannel,
    leaveAuctionChannel,
    disconnect,
  }
}
