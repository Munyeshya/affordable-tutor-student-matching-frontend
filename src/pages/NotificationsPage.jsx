import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'

import { getApiErrorMessage } from '../api/errors'
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/services/notifications'
import { queryKeys } from '../api/queryKeys'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { InlineIcon } from '../components/ui/InlineIcon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './NotificationsPage.css'

function formatKind(value) {
  if (!value) return 'Isomo update'
  const label = String(value).replaceAll('_', ' ').replaceAll('.', ' ').toLowerCase()
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatNotificationTime(value) {
  if (!value) return 'Recently'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`
  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400)
    return `${days} day${days === 1 ? '' : 's'} ago`
  }

  return new Intl.DateTimeFormat('en-RW', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  }).format(date)
}

function getNotificationIcon(kind = '') {
  const normalizedKind = String(kind).toLowerCase()
  if (normalizedKind.includes('message')) return 'messages'
  if (normalizedKind.includes('booking') || normalizedKind.includes('schedule')) return 'bookings'
  if (normalizedKind.includes('course') || normalizedKind.includes('lesson')) return 'courses'
  if (normalizedKind.includes('payment') || normalizedKind.includes('payout')) return 'earnings'
  if (normalizedKind.includes('verification') || normalizedKind.includes('document')) return 'verification'
  return 'bell'
}

function NotificationRow({ item, onRead, busy }) {
  return (
    <article className={`notification-row ${item.is_read ? 'is-read' : 'is-unread'}`}>
      <span className="notification-state-dot" aria-label={item.is_read ? 'Read' : 'Unread'} />
      <span className="notification-type-icon">
        <DashboardIcon name={getNotificationIcon(item.kind)} size={19} />
      </span>

      <div className="notification-row-content">
        <div className="notification-row-heading">
          <div>
            <span>{formatKind(item.kind)}</span>
            <h2>{item.title}</h2>
          </div>
          <time dateTime={item.created_at || undefined}>
            {formatNotificationTime(item.created_at)}
          </time>
        </div>
        <p>{item.body}</p>
        <small>From {item.actor_name || 'Isomo'}</small>
      </div>

      <div className="notification-row-actions">
        {item.link ? (
          <Link
            to={item.link}
            aria-label={`Open notification: ${item.title}`}
            onClick={() => {
              if (!item.is_read) onRead(item.id)
            }}
          >
            <span>Open</span>
            <InlineIcon name="arrow" />
          </Link>
        ) : null}
        {!item.is_read ? (
          <button
            type="button"
            onClick={() => onRead(item.id)}
            disabled={busy}
            aria-label={`Mark ${item.title} as read`}
          >
            Mark read
          </button>
        ) : null}
      </div>
    </article>
  )
}

function NotificationSkeleton() {
  return (
    <div className="notification-row notification-row-skeleton" aria-hidden="true">
      <span />
      <span />
      <div><i /><i /><i /></div>
    </div>
  )
}

export function NotificationsPage() {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications.list({ unread: showUnreadOnly }),
    queryFn: () => listNotifications(showUnreadOnly ? { unread: true } : {}).then((response) => response.data),
    enabled: isAuthenticated,
  })

  const unreadQuery = useQuery({
    queryKey: queryKeys.notifications.unread,
    queryFn: () => getUnreadNotificationCount().then((response) => response.data),
    enabled: isAuthenticated,
  })

  const markOneMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: async () => {
      toast.success('Notification marked as read.')
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not mark this notification as read.')),
  })

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: async () => {
      toast.success('All notifications marked as read.')
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not update notifications.')),
  })

  if (!isAuthenticated) {
    return (
      <section className="page-card card">
        <p className="eyebrow">Notifications</p>
        <h1>Sign in to view notifications</h1>
        <p className="supporting-text">Platform updates, booking alerts, and tutor messages appear here.</p>
        <div className="hero-actions">
          <Link className="primary-button" to="/sign-in">Sign in</Link>
          <Link className="secondary-button" to="/join">Join now</Link>
        </div>
      </section>
    )
  }

  const notifications = Array.isArray(notificationsQuery.data) ? notificationsQuery.data : []
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const visibleNotifications = normalizedSearch
    ? notifications.filter((item) => (
      [item.title, item.body, item.kind, item.actor_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))
    ))
    : notifications
  const unreadCount = Number(unreadQuery.data?.unread_count) || 0

  return (
    <section className="notifications-page">
      <header className="notifications-header">
        <div className="notifications-title">
          <span><DashboardIcon name="bell" size={21} /></span>
          <div>
            <p>Communication center</p>
            <h1>Notifications</h1>
            <span>Review lesson, account, payment, and marketplace updates.</span>
          </div>
        </div>
        <button
          className="notifications-mark-all"
          type="button"
          onClick={() => markAllMutation.mutate()}
          disabled={markAllMutation.isPending || unreadCount === 0}
        >
          <DashboardIcon name="verification" size={17} />
          {markAllMutation.isPending ? 'Updating...' : 'Mark all as read'}
        </button>
      </header>

      <section className="notifications-center">
        <div className="notifications-tools">
          <div>
            <strong>{showUnreadOnly ? unreadCount : notifications.length}</strong>
            <span>{showUnreadOnly ? 'unread' : 'notification'}{(!showUnreadOnly && notifications.length !== 1) ? 's' : ''}</span>
          </div>
          <label className="notifications-search">
            <DashboardIcon name="search" size={18} />
            <span className="sr-only">Search notifications</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search notifications"
            />
          </label>
        </div>

        <div className="notifications-tabs" role="tablist" aria-label="Notification filters">
          <button
            className={showUnreadOnly ? '' : 'is-active'}
            type="button"
            role="tab"
            aria-selected={!showUnreadOnly}
            onClick={() => setShowUnreadOnly(false)}
          >
            All
          </button>
          <button
            className={showUnreadOnly ? 'is-active' : ''}
            type="button"
            role="tab"
            aria-selected={showUnreadOnly}
            onClick={() => setShowUnreadOnly(true)}
          >
            Unread <span>{unreadCount}</span>
          </button>
        </div>

        {notificationsQuery.isLoading ? (
          <div className="notifications-list" aria-label="Loading notifications">
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
          </div>
        ) : notificationsQuery.isError ? (
          <div className="notifications-state" role="alert">
            <span><DashboardIcon name="bell" size={24} /></span>
            <h2>Notifications are temporarily unavailable</h2>
            <p>{getApiErrorMessage(notificationsQuery.error, 'We could not load your notifications.')}</p>
            <button type="button" onClick={() => notificationsQuery.refetch()}>Try again</button>
          </div>
        ) : visibleNotifications.length ? (
          <div className="notifications-list">
            {visibleNotifications.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                busy={markOneMutation.isPending}
                onRead={(id) => markOneMutation.mutate(id)}
              />
            ))}
          </div>
        ) : (
          <div className="notifications-state">
            <span><DashboardIcon name={normalizedSearch ? 'search' : 'bell'} size={24} /></span>
            <h2>{normalizedSearch ? 'No matching notifications' : `No ${showUnreadOnly ? 'unread ' : ''}notifications`}</h2>
            <p>
              {normalizedSearch
                ? 'Try a different title, category, or sender.'
                : 'You are all caught up. New Isomo activity will appear here.'}
            </p>
            {normalizedSearch ? <button type="button" onClick={() => setSearchTerm('')}>Clear search</button> : null}
          </div>
        )}
      </section>
    </section>
  )
}
