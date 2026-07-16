import { useEffect, useEffectEvent, useRef, useState } from 'react'

import { createBookingChatSocket } from '../api/services/chatSocket.js'


const ACK_TIMEOUT_MS = 7000


export function useBookingChatSocket({ bookingId, enabled = true, onEvent }) {
  const [status, setStatus] = useState(bookingId && enabled ? 'connecting' : 'disconnected')
  const socketRef = useRef(null)
  const pendingRef = useRef(new Map())
  const handleEvent = useEffectEvent((event) => onEvent?.(event))

  useEffect(() => {
    if (!bookingId || !enabled) {
      return undefined
    }

    let stopped = false
    let reconnectTimer = null
    let retryCount = 0

    function rejectPending(reason) {
      for (const pending of pendingRef.current.values()) {
        clearTimeout(pending.timeoutId)
        pending.reject(new Error(reason))
      }
      pendingRef.current.clear()
    }

    function scheduleReconnect() {
      if (stopped || !navigator.onLine) {
        setStatus(navigator.onLine ? 'disconnected' : 'offline')
        return
      }
      setStatus('reconnecting')
      const delay = Math.min(1000 * (2 ** retryCount), 15000)
      retryCount += 1
      reconnectTimer = window.setTimeout(connect, delay)
    }

    function connect() {
      if (stopped) return
      if (!navigator.onLine) {
        setStatus('offline')
        return
      }

      setStatus(retryCount ? 'reconnecting' : 'connecting')
      let socket
      try {
        socket = createBookingChatSocket(bookingId)
      } catch {
        setStatus('unavailable')
        return
      }
      socketRef.current = socket

      socket.addEventListener('open', () => {
        if (stopped) return
        retryCount = 0
        setStatus('connected')
      })
      socket.addEventListener('message', (messageEvent) => {
        let event
        try {
          event = JSON.parse(messageEvent.data)
        } catch {
          return
        }

        const pending = event.client_id ? pendingRef.current.get(event.client_id) : null
        if (event.type === 'message.created' && pending) {
          clearTimeout(pending.timeoutId)
          pendingRef.current.delete(event.client_id)
          pending.resolve(event.message)
        } else if (event.type === 'message.error' && pending) {
          clearTimeout(pending.timeoutId)
          pendingRef.current.delete(event.client_id)
          pending.reject(new Error(event.detail || 'The real-time message could not be sent.'))
        }
        handleEvent(event)
      })
      socket.addEventListener('close', () => {
        if (socketRef.current === socket) socketRef.current = null
        rejectPending('The live connection was interrupted.')
        if (!stopped) scheduleReconnect()
      })
      socket.addEventListener('error', () => socket.close())
    }

    function handleOffline() {
      setStatus('offline')
      socketRef.current?.close()
    }

    function handleOnline() {
      window.clearTimeout(reconnectTimer)
      retryCount = 0
      connect()
    }

    connect()
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      stopped = true
      window.clearTimeout(reconnectTimer)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      rejectPending('The conversation changed before the message was confirmed.')
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [bookingId, enabled])

  function sendMessage({ message, client_id: clientId }) {
    const socket = socketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('Live messaging is not connected.'))
    }

    return new Promise((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        pendingRef.current.delete(clientId)
        reject(new Error('The live message acknowledgement timed out.'))
      }, ACK_TIMEOUT_MS)
      pendingRef.current.set(clientId, { resolve, reject, timeoutId })
      socket.send(JSON.stringify({ type: 'message.send', message, client_id: clientId }))
    })
  }

  return { status: bookingId && enabled ? status : 'disconnected', sendMessage }
}
