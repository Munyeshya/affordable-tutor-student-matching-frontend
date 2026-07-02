import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext.jsx'
import { getUnreadChatCount, listBookingMessages, listConversationThreads, markBookingMessagesRead, sendBookingMessage } from '../api/services/chats'

function ThreadItem({ thread, isActive, onClick }) {
  return (
    <button className={`thread-item ${isActive ? 'is-active' : ''}`} type="button" onClick={onClick}>
      <strong>Booking #{thread.booking_id}</strong>
      <span>{thread.sender_name} ? {thread.receiver_name}</span>
      <small>{thread.last_message}</small>
      <span className="status-pill">{thread.unread_count || 0} unread</span>
    </button>
  )
}

function MessageBubble({ message, isMine }) {
  return (
    <article className={`message-bubble ${isMine ? 'is-mine' : 'is-theirs'}`}>
      <p>{message.message}</p>
      <div className="message-meta">
        <span>{message.sender_name || 'You'}</span>
        <span>{message.created_at ? new Date(message.created_at).toLocaleString() : ''}</span>
      </div>
    </article>
  )
}

export function MessagesPage() {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [draft, setDraft] = useState('')
  const selectedBookingId = searchParams.get('booking')

  const unreadQuery = useQuery({
    queryKey: ['chat-unread-count'],
    queryFn: () => getUnreadChatCount().then((response) => response.data),
    enabled: isAuthenticated,
  })

  const threadsQuery = useQuery({
    queryKey: ['chat-threads'],
    queryFn: () => listConversationThreads().then((response) => response.data),
    enabled: isAuthenticated,
  })

  useEffect(() => {
    if (!selectedBookingId && threadsQuery.data?.length) {
      setSearchParams({ booking: String(threadsQuery.data[0].booking_id) }, { replace: true })
    }
  }, [selectedBookingId, threadsQuery.data, setSearchParams])

  const messagesQuery = useQuery({
    queryKey: ['chat-messages', selectedBookingId],
    queryFn: () => listBookingMessages(selectedBookingId).then((response) => response.data),
    enabled: isAuthenticated && Boolean(selectedBookingId),
  })

  const sendMutation = useMutation({
    mutationFn: (payload) => sendBookingMessage(selectedBookingId, payload),
    onSuccess: async () => {
      setDraft('')
      await queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedBookingId] })
      await queryClient.invalidateQueries({ queryKey: ['chat-threads'] })
      await queryClient.invalidateQueries({ queryKey: ['chat-unread-count'] })
    },
  })

  const markReadMutation = useMutation({
    mutationFn: (ids) => markBookingMessagesRead(selectedBookingId, ids),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['chat-threads'] })
      await queryClient.invalidateQueries({ queryKey: ['chat-unread-count'] })
    },
  })

  useEffect(() => {
    if (!messagesQuery.data?.length || !user?.id || !selectedBookingId) {
      return
    }

    const unreadIds = messagesQuery.data
      .filter((message) => message.receiver === user.id && !message.is_read)
      .map((message) => message.id)

    if (unreadIds.length) {
      markReadMutation.mutate(unreadIds)
    }
  }, [messagesQuery.data, user?.id, selectedBookingId])

  const activeThread = useMemo(
    () => threadsQuery.data?.find((thread) => String(thread.booking_id) === String(selectedBookingId)),
    [threadsQuery.data, selectedBookingId],
  )

  if (!isAuthenticated) {
    return (
      <section className="page-card card">
        <p className="eyebrow">Messages</p>
        <h1>Sign in to view booking conversations</h1>
        <p className="supporting-text">Students, tutors, and parents can use chat once a booking exists.</p>
        <div className="hero-actions">
          <Link className="primary-button" to="/sign-in">Sign in</Link>
          <Link className="secondary-button" to="/join">Join now</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="messages-page">
      <section className="page-card card messages-hero">
        <div>
          <p className="eyebrow">Messages</p>
          <h1>Booking conversations</h1>
          <p className="supporting-text">Keep one conversation per booking and stay close to lesson updates.</p>
        </div>
        <div className="notifications-summary">
          <article className="stat-card">
            <strong>{unreadQuery.data?.unread_count ?? 0}</strong>
            <span>Unread messages</span>
          </article>
        </div>
      </section>

      <section className="messages-layout">
        <aside className="page-card card messages-sidebar">
          <div className="messages-sidebar-head">
            <p className="eyebrow">Threads</p>
            <span className="status-pill">{threadsQuery.data?.length || 0}</span>
          </div>
          {threadsQuery.isLoading ? (
            <p className="supporting-text">Loading conversations...</p>
          ) : threadsQuery.data?.length ? (
            <div className="thread-list">
              {threadsQuery.data.map((thread) => (
                <ThreadItem
                  key={thread.booking_id}
                  thread={thread}
                  isActive={String(thread.booking_id) === String(selectedBookingId)}
                  onClick={() => setSearchParams({ booking: String(thread.booking_id) })}
                />
              ))}
            </div>
          ) : (
            <p className="supporting-text">No conversations yet.</p>
          )}
        </aside>

        <section className="page-card card messages-panel">
          {activeThread ? (
            <>
              <div className="messages-panel-head">
                <div>
                  <p className="eyebrow">Booking #{activeThread.booking_id}</p>
                  <h2>{activeThread.sender_name} ? {activeThread.receiver_name}</h2>
                </div>
                <span className="status-pill">{activeThread.unread_count || 0} unread</span>
              </div>

              <div className="message-list">
                {messagesQuery.isLoading ? (
                  <p className="supporting-text">Loading messages...</p>
                ) : messagesQuery.data?.length ? (
                  messagesQuery.data.map((message) => (
                    <MessageBubble key={message.id} message={message} isMine={message.sender === user.id} />
                  ))
                ) : (
                  <p className="supporting-text">No messages in this booking yet.</p>
                )}
              </div>

              <form
                className="message-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (!draft.trim()) return
                  sendMutation.mutate({ message: draft.trim() })
                }}
              >
                <textarea rows="4" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message..." />
                <div className="hero-actions">
                  <button className="primary-button" type="submit" disabled={sendMutation.isPending}>
                    {sendMutation.isPending ? 'Sending...' : 'Send message'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="messages-empty">
              <p className="eyebrow">Messages</p>
              <h2>Select a booking thread</h2>
              <p className="supporting-text">Choose a thread from the sidebar to view the conversation.</p>
            </div>
          )}
        </section>
      </section>
    </section>
  )
}
