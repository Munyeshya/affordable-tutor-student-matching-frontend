import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/services/notifications.js'
import { useAuth } from '../context/AuthContext.jsx'
import { renderWithProviders } from '../test/render.jsx'
import { NotificationsPage } from './NotificationsPage.jsx'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('react-toastify', () => ({ toast }))
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }))
vi.mock('../api/services/notifications.js', () => ({
  getUnreadNotificationCount: vi.fn(),
  listNotifications: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}))

const notifications = [
  {
    id: 1,
    title: 'Lesson request accepted',
    body: 'Your mathematics lesson request has been accepted.',
    kind: 'BOOKING_ACCEPTED',
    actor_name: 'Aline Tutor',
    is_read: false,
    created_at: '2026-07-18T07:00:00Z',
    link: '/bookings',
  },
  {
    id: 2,
    title: 'Payment confirmed',
    body: 'Your course payment was confirmed.',
    kind: 'PAYMENT_CONFIRMED',
    actor_name: 'Isomo',
    is_read: true,
    created_at: '2026-07-17T07:00:00Z',
    link: '/learning',
  },
]

describe('NotificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ isAuthenticated: true })
    listNotifications.mockResolvedValue({ data: notifications })
    getUnreadNotificationCount.mockResolvedValue({ data: { unread_count: 1 } })
    markNotificationRead.mockResolvedValue({ data: { ...notifications[0], is_read: true } })
    markAllNotificationsRead.mockResolvedValue({ data: { updated_count: 1 } })
  })

  it('searches the notification list and keeps mark-read actions available', async () => {
    const user = userEvent.setup()
    renderWithProviders(<NotificationsPage />)

    expect(await screen.findByText('Lesson request accepted')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Payment confirmed' })).toBeInTheDocument()

    await user.type(screen.getByLabelText('Search notifications'), 'payment')
    expect(screen.queryByText('Lesson request accepted')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Payment confirmed' })).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Search notifications'))
    await user.click(screen.getByRole('button', { name: 'Mark Lesson request accepted as read' }))

    await waitFor(() => expect(markNotificationRead).toHaveBeenCalled())
    expect(markNotificationRead.mock.calls[0][0]).toBe(1)
  })
})
