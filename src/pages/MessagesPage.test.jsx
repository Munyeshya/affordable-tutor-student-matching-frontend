import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getUnreadChatCount,
  listBookingMessages,
  listConversationThreads,
  markBookingMessagesRead,
  sendBookingMessage,
} from '../api/services/chats.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useBookingChatSocket } from '../hooks/useBookingChatSocket.js'
import { renderWithProviders } from '../test/render.jsx'
import { MessagesPage } from './MessagesPage.jsx'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
const sendRealtimeMessage = vi.hoisted(() => vi.fn())

vi.mock('react-toastify', () => ({ toast }))
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }))
vi.mock('../hooks/useBookingChatSocket.js', () => ({ useBookingChatSocket: vi.fn() }))
vi.mock('../api/services/chats.js', () => ({
  getUnreadChatCount: vi.fn(),
  listBookingMessages: vi.fn(),
  listConversationThreads: vi.fn(),
  markBookingMessagesRead: vi.fn(),
  sendBookingMessage: vi.fn(),
}))

const thread = {
  booking_id: 101,
  participant_name: 'Alice Uwase',
  subject_name: 'Mathematics',
  booking_status: 'CONFIRMED',
  last_message: 'See you tomorrow.',
  unread_count: 1,
  start_datetime: '2030-01-10T10:00:00Z',
}

describe('MessagesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ user: { id: 1, role: 'STUDENT' } })
    useBookingChatSocket.mockReturnValue({ status: 'unavailable', sendMessage: sendRealtimeMessage })
    getUnreadChatCount.mockResolvedValue({ data: { unread_count: 1 } })
    listConversationThreads.mockResolvedValue({ data: [thread] })
    listBookingMessages.mockResolvedValue({
      data: [{
        id: 8,
        booking: 101,
        sender: 20,
        receiver: 1,
        sender_name: 'Alice Uwase',
        message: 'See you tomorrow.',
        is_read: false,
        created_at: '2030-01-09T12:00:00Z',
      }],
    })
    markBookingMessagesRead.mockResolvedValue({ data: {} })
    sendRealtimeMessage.mockRejectedValue(new Error('WebSocket unavailable'))
    sendBookingMessage.mockResolvedValue({ data: { id: 9, message: 'Thank you.' } })
  })

  it('loads a booking conversation and marks received messages read', async () => {
    renderWithProviders(<MessagesPage />, { route: '/messages?booking=101' })

    expect(await screen.findByRole('heading', { name: 'Alice Uwase' })).toBeInTheDocument()
    expect(screen.getAllByText('See you tomorrow.').length).toBeGreaterThan(0)
    expect(screen.getByText('REST fallback')).toBeInTheDocument()
    await waitFor(() => expect(markBookingMessagesRead).toHaveBeenCalledWith('101', [8]))
  })

  it('falls back to REST when live sending is unavailable', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MessagesPage />, { route: '/messages?booking=101' })
    await screen.findByRole('heading', { name: 'Alice Uwase' })

    await user.type(screen.getByLabelText('Message'), 'Thank you.')
    await user.click(screen.getByRole('button', { name: 'Send message' }))

    await waitFor(() => expect(sendBookingMessage).toHaveBeenCalledWith(
      '101',
      expect.objectContaining({ message: 'Thank you.', client_id: expect.stringMatching(/^chat_/) }),
    ))
    expect(toast.success).toHaveBeenCalledWith('Message sent.')
  })

  it('prevents administrators from sending participant messages', async () => {
    useAuth.mockReturnValue({ user: { id: 99, role: 'ADMIN' } })
    renderWithProviders(<MessagesPage />, { route: '/messages?booking=101' })

    expect(await screen.findByText('Admins can review conversations but cannot send messages.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Send message' })).not.toBeInTheDocument()
  })
})
