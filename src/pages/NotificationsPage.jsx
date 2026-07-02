import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getUnreadNotificationCount, listNotifications, markAllNotificationsRead, markNotificationRead } from '../api/services/notifications'
import { useAuth } from '../context/AuthContext.jsx'

function NotificationCard({ item, onRead, busy }) {
  return (
    <article className={`panel notification-card ${item.is_read ? 'is-read' : 'is-unread'}`}>
      <div className="notification-head">
        <div>
          <p className="eyebrow">{item.kind || 'Update'}</p>
          <h3>{item.title}</h3>
          <p className="supporting-text">{item.body}</p>
        </div>
        <span className="status-pill">{item.is_read ? 'Read' : 'Unread'}</span>
      </div>

      <div className="notification-meta">
        <span>{item.actor_name || 'Isomo'}</span>
        <span>{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</span>
      </div>

      {item.link ? (
        <Link className="secondary-button" to={item.link}>
          Open
        </Link>
      ) : null}

      {!item.is_read ? (
        <button className="primary-button" type="button" onClick={() => onRead(item.id)} disabled={busy}>
          Mark read
        </button>
      ) : null}
    </article>
  )
}

export function NotificationsPage() {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const notificationsQuery = useQuery({
    queryKey: ['notifications', showUnreadOnly],
    queryFn: () => listNotifications(showUnreadOnly ? { unread: true } : {}).then((response) => response.data),
    enabled: isAuthenticated,
  })

  const unreadQuery = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => getUnreadNotificationCount().then((response) => response.data),
    enabled: isAuthenticated,
  })

  const markOneMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
      await queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
      await queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })

  if (!isAuthenticated) {
    return (
      <section className="page-card card">
        <p className="eyebrow">Notifications</p>
        <h1>Sign in to view notifications</h1>
        <p className="supporting-text">Platform updates, booking alerts, and tutor messages appear here.</p>
        <div className="hero-actions">
          <Link className="primary-button" to="/sign-in">
            Sign in
          </Link>
          <Link className="secondary-button" to="/join">
            Join now
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="notifications-page">
      <section className="page-card card notifications-hero">
        <div>
          <p className="eyebrow">Notifications</p>
          <h1>Stay on top of platform updates</h1>
          <p className="supporting-text">
            Booking changes, tutor responses, and system updates are grouped here for {user?.email}.
          </p>
        </div>

        <div className="notifications-summary">
          <article className="stat-card">
            <strong>{unreadQuery.data?.unread_count ?? 0}</strong>
            <span>Unread</span>
          </article>
          <button
            className="primary-button"
            type="button"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
          >
            {markAllMutation.isPending ? 'Clearing...' : 'Mark all read'}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => setShowUnreadOnly((current) => !current)}
          >
            {showUnreadOnly ? 'Show all' : 'Show unread'}
          </button>
        </div>
      </section>

      {notificationsQuery.isLoading ? (
        <section className="page-card card">
          <p className="supporting-text">Loading notifications...</p>
        </section>
      ) : notificationsQuery.isError ? (
        <section className="page-card card">
          <p className="supporting-text">We could not load notifications right now.</p>
        </section>
      ) : notificationsQuery.data?.length ? (
        <section className="notifications-list">
          {notificationsQuery.data.map((item) => (
            <NotificationCard
              key={item.id}
              item={item}
              busy={markOneMutation.isPending}
              onRead={(id) => markOneMutation.mutate(id)}
            />
          ))}
        </section>
      ) : (
        <section className="page-card card">
          <p className="eyebrow">Notifications</p>
          <h2>No notifications yet</h2>
          <p className="supporting-text">You will see updates here when something new happens.</p>
        </section>
      )}
    </section>
  )
}
