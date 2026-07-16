import React, { useEffect, useRef, useState } from 'react'
import { queryKeys } from '../api/queryKeys'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getApiErrorMessage } from '../api/errors'
import { useAuth } from '../context/AuthContext.jsx'
import { useBookingChatSocket } from '../hooks/useBookingChatSocket.js'
import {
  getUnreadChatCount,
  listBookingMessages,
  listConversationThreads,
  markBookingMessagesRead,
  sendBookingMessage,
} from '../api/services/chats'
import './MessagesPage.css'

const EMPTY_LIST = []

const CONNECTION_COPY = {
  connected: 'Live updates',
  connecting: 'Connecting',
  reconnecting: 'Reconnecting',
  offline: 'Offline fallback',
  unavailable: 'REST fallback',
  disconnected: 'REST fallback',
}

function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en-RW', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function createClientMessageId() {
  const randomPart = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`

  return `chat_${randomPart.replaceAll('-', '_')}`
}

function ThreadItem({ thread, isActive, onClick }) {
  return (
    <button
      className={'messages-thread-button ' + (isActive ? 'is-active' : '')}
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
    >
      <span className="messages-thread-row">
        <strong>{thread.participant_name}</strong>
        <time>{formatDateTime(thread.last_message_at || thread.start_datetime)}</time>
      </span>
      <span className="messages-thread-subject">{thread.subject_name} / Booking #{thread.booking_id}</span>
      <span className="messages-thread-preview">{thread.last_message}</span>
      <span className="messages-thread-meta">
        <span className="messages-thread-status">{thread.booking_status}</span>
        {thread.unread_count ? <span className="messages-thread-unread">{thread.unread_count}</span> : null}
      </span>
    </button>
  )
}

function MessageBubble({ message, isMine }) {
  return (
    <article className={'messages-bubble ' + (isMine ? 'is-mine' : '')}>
      <p>{message.message}</p>
      <div className="messages-bubble-meta">
        <span>{isMine ? 'You' : message.sender_name}</span>
        <time>{formatDateTime(message.created_at)}</time>
      </div>
    </article>
  )
}

export function MessagesPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [draft, setDraft] = useState('')
  const [threadSearch, setThreadSearch] = useState('')
  const feedEndRef = useRef(null)
  const selectedBookingId = searchParams.get('booking')

  const unreadQuery = useQuery({
    queryKey: queryKeys.chats.unread,
    queryFn: async () => (await getUnreadChatCount()).data,
  })

  const threadsQuery = useQuery({
    queryKey: queryKeys.chats.threads,
    queryFn: async () => (await listConversationThreads()).data,
    initialData: EMPTY_LIST,
  })

  const threads = threadsQuery.data
  const normalizedSearch = threadSearch.trim().toLowerCase()
  const filteredThreads = normalizedSearch
    ? threads.filter((thread) => (
      thread.participant_name?.toLowerCase().includes(normalizedSearch)
      || thread.subject_name?.toLowerCase().includes(normalizedSearch)
      || String(thread.booking_id).includes(normalizedSearch)
    ))
    : threads
  const activeThread = threads.find(
    (thread) => String(thread.booking_id) === String(selectedBookingId),
  )

  useEffect(() => {
    if (!selectedBookingId && threads.length) {
      setSearchParams({ booking: String(threads[0].booking_id) }, { replace: true })
    }
  }, [selectedBookingId, threads, setSearchParams])

  const messagesQuery = useQuery({
    queryKey: queryKeys.chats.messages(selectedBookingId),
    queryFn: async () => (await listBookingMessages(selectedBookingId)).data,
    enabled: Boolean(selectedBookingId),
    initialData: EMPTY_LIST,
  })

  const messages = messagesQuery.data

  function handleRealtimeEvent(event) {
    if (Number.isFinite(Number(event.unread_count))) {
      queryClient.setQueryData(queryKeys.chats.unread, { unread_count: Number(event.unread_count) })
    }

    if (event.type === 'message.created' && event.message) {
      const eventBookingId = String(event.message.booking)
      queryClient.setQueryData(queryKeys.chats.messages(eventBookingId), (current = EMPTY_LIST) => {
        if (current.some((message) => message.id === event.message.id)) return current
        return [...current, event.message]
      })
    }

    if (event.type === 'messages.read' && event.booking_id) {
      const eventBookingId = String(event.booking_id)
      const readIds = new Set(event.message_ids || [])
      queryClient.setQueryData(queryKeys.chats.messages(eventBookingId), (current = EMPTY_LIST) => (
        current.map((message) => (
          readIds.has(message.id) ? { ...message, is_read: true } : message
        ))
      ))
    }

    if (['message.created', 'messages.read', 'thread.updated'].includes(event.type)) {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.threads })
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    }
  }

  const { status: connectionStatus, sendMessage: sendRealtimeMessage } = useBookingChatSocket({
    bookingId: selectedBookingId,
    enabled: Boolean(user?.id),
    onEvent: handleRealtimeEvent,
  })

  const sendMutation = useMutation({
    mutationFn: async (payload) => {
      try {
        return await sendRealtimeMessage(payload)
      } catch {
        return (await sendBookingMessage(selectedBookingId, payload)).data
      }
    },
    onSuccess: async () => {
      setDraft('')
      toast.success('Message sent.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.chats.messages(selectedBookingId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.chats.threads }),
        queryClient.invalidateQueries({ queryKey: queryKeys.chats.unread }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
      ])
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not send this message.')),
  })

  const { mutate: markMessagesRead } = useMutation({
    mutationFn: (ids) => markBookingMessagesRead(selectedBookingId, ids),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.chats.threads }),
        queryClient.invalidateQueries({ queryKey: queryKeys.chats.unread }),
      ])
    },
  })

  useEffect(() => {
    if (!messages.length || !user?.id || !selectedBookingId) return

    const unreadIds = messages
      .filter((message) => message.receiver === user.id && !message.is_read)
      .map((message) => message.id)

    if (unreadIds.length) markMessagesRead(unreadIds)
  }, [messages, user?.id, selectedBookingId, markMessagesRead])

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, selectedBookingId])

  function selectThread(bookingId) {
    setDraft('')
    setSearchParams({ booking: String(bookingId) })
  }

  function submitMessage(event) {
    event.preventDefault()
    const message = draft.trim()
    if (!message) {
      toast.error('Write a message before sending.')
      return
    }
    const clientId = createClientMessageId()
    sendMutation.mutate({ message, client_id: clientId })
  }

  return (
    <section className="messages-workspace">
      <header className="messages-workspace-hero">
        <div>
          <p className="eyebrow">Messages</p>
          <h1>Keep lesson conversations together.</h1>
          <p className="supporting-text">
            Each conversation stays connected to one booking so schedules, goals, and updates remain easy to follow.
          </p>
        </div>
        <div className="messages-unread-card">
          <strong>{unreadQuery.data?.unread_count ?? 0}</strong>
          <span>Unread messages</span>
        </div>
      </header>

      <section className="messages-workspace-layout">
        <aside className="messages-thread-panel">
          <div className="messages-thread-toolbar">
            <div className="messages-thread-title">
              <h2>Booking conversations</h2>
              <span>{threads.length}</span>
            </div>
            <input
              className="messages-thread-search"
              type="search"
              placeholder="Search tutor, subject, or booking"
              aria-label="Search conversations"
              value={threadSearch}
              onChange={(event) => setThreadSearch(event.target.value)}
            />
          </div>

          <div className="messages-thread-list">
            {threadsQuery.isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div className="messages-thread-skeleton" key={index} aria-busy="true">
                  <span className="skeleton skeleton-line skeleton-title" />
                  <span className="skeleton skeleton-line" />
                </div>
              ))
            ) : threadsQuery.isError ? (
              <div className="messages-panel-state">
                <p>{getApiErrorMessage(threadsQuery.error, 'Could not load conversations.')}</p>
                <button className="secondary-button" type="button" onClick={() => threadsQuery.refetch()}>Try again</button>
              </div>
            ) : filteredThreads.length ? (
              filteredThreads.map((thread) => (
                <ThreadItem
                  key={thread.booking_id}
                  thread={thread}
                  isActive={String(thread.booking_id) === String(selectedBookingId)}
                  onClick={() => selectThread(thread.booking_id)}
                />
              ))
            ) : (
              <div className="messages-panel-state">
                <h2>{threads.length ? 'No matching conversations' : 'No booking conversations yet'}</h2>
                <p>{threads.length ? 'Try a different search.' : 'Create or accept a booking to start messaging.'}</p>
                {!threads.length ? <Link className="secondary-button" to="/bookings">View bookings</Link> : null}
              </div>
            )}
          </div>
        </aside>

        <section className="messages-conversation-panel">
          {!selectedBookingId ? (
            <div className="messages-panel-state">
              <p className="eyebrow">Conversation</p>
              <h2>Select a booking</h2>
              <p>Choose a conversation to read messages and send an update.</p>
            </div>
          ) : messagesQuery.isError ? (
            <div className="messages-panel-state">
              <p className="eyebrow">Conversation unavailable</p>
              <h2>We could not open this booking conversation.</h2>
              <p>{getApiErrorMessage(messagesQuery.error)}</p>
              <button className="secondary-button" type="button" onClick={() => messagesQuery.refetch()}>Try again</button>
            </div>
          ) : (
            <>
              <header className="messages-conversation-head">
                <div>
                  <p className="eyebrow">Booking #{selectedBookingId}</p>
                  <h2>{activeThread?.participant_name || 'Booking conversation'}</h2>
                </div>
                <div className="messages-conversation-context">
                  <strong>{activeThread?.subject_name || 'Lesson'}</strong>
                  <span> / {activeThread?.booking_status || 'Active'}</span>
                  <span className={`messages-live-status is-${connectionStatus}`}>
                    {CONNECTION_COPY[connectionStatus] || 'REST fallback'}
                  </span>
                </div>
              </header>

              <div className="messages-feed" aria-live="polite">
                {messagesQuery.isLoading ? (
                  <div className="messages-panel-state" aria-busy="true">
                    <p>Loading messages...</p>
                  </div>
                ) : messages.length ? (
                  messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isMine={message.sender === user?.id}
                    />
                  ))
                ) : (
                  <div className="messages-panel-state">
                    <p className="eyebrow">Start the conversation</p>
                    <h2>No messages yet.</h2>
                    <p>Share the learner's goals or ask a practical question about the lesson.</p>
                  </div>
                )}
                <span ref={feedEndRef} />
              </div>

              {user?.role === 'ADMIN' ? (
                <div className="messages-composer">
                  <p className="supporting-text">Admins can review conversations but cannot send messages.</p>
                </div>
              ) : (
                <form className="messages-composer" onSubmit={submitMessage}>
                  {connectionStatus !== 'connected' ? (
                    <p className="messages-connection-note">
                      Live updates are {connectionStatus === 'offline' ? 'offline' : 'reconnecting'}. Messages still use the secure REST fallback.
                    </p>
                  ) : null}
                  <textarea
                    aria-label="Message"
                    rows="3"
                    maxLength="2000"
                    placeholder="Write a message about this lesson..."
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    disabled={sendMutation.isPending}
                  />
                  <div className="messages-composer-actions">
                    <small>{draft.length}/2000</small>
                    <button className="primary-button" type="submit" disabled={sendMutation.isPending}>
                      {sendMutation.isPending ? 'Sending...' : 'Send message'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </section>
      </section>
    </section>
  )
}
