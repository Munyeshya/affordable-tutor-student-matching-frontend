import React from 'react'
import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { listCoursePurchases, listPayments } from '../api/services/payments.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useBookingsQuery } from '../hooks/useCommonQueries.js'
import { renderWithProviders } from '../test/render.jsx'
import { PaymentsPage } from './PaymentsPage.jsx'

vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }))
vi.mock('../hooks/useCommonQueries.js', () => ({ useBookingsQuery: vi.fn() }))
vi.mock('../api/services/payments.js', () => ({
  createCoursePurchase: vi.fn(),
  getPaymentTransaction: vi.fn(),
  getPrintablePaymentReceipt: vi.fn(),
  initiateBookingPayment: vi.fn(),
  initiateSchedulePayment: vi.fn(),
  listCoursePurchases: vi.fn(),
  listPaymentProviders: vi.fn(),
  listPayments: vi.fn(),
}))

describe('PaymentsPage', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      user: { id: 3, role: 'PARENT', first_name: 'Parent' },
    })
    useBookingsQuery.mockReturnValue({
      data: [{
        id: 21,
        student: 7,
        student_name: 'Aline Student',
        tutor_name: 'Eric Tutor',
        subject_name: 'Mathematics',
        start_datetime: '2030-01-10T10:00:00Z',
        status: 'CONFIRMED',
        total_amount: 8000,
        currency: 'RWF',
      }],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    listPayments.mockResolvedValue({
      data: [{
        id: 40,
        booking_id: 20,
        student: 7,
        learner_name: 'Aline Student',
        payer: 3,
        payer_name: 'Parent One',
        amount: 5000,
        currency: 'RWF',
        status: 'PAID',
        receipt_number: 'ISO-DEMO-BKG-000020',
        paid_at: '2026-07-18T08:00:00Z',
      }],
    })
    listCoursePurchases.mockResolvedValue({
      data: [{
        id: 9,
        student: 7,
        learner_name: 'Aline Student',
        payer: 3,
        payer_name: 'Parent One',
        course: 5,
        course_title: 'Algebra foundations',
        amount: 12000,
        currency: 'RWF',
        status: 'PAID',
        receipt_number: 'ISO-DEMO-CRS-000009',
        purchased_at: '2026-07-17T08:00:00Z',
      }],
    })
  })

  it('shows outstanding lessons and a combined receipt-ready history', async () => {
    renderWithProviders(<PaymentsPage />)

    expect(await screen.findByRole('heading', { name: 'Learning payments, clearly recorded.' })).toBeInTheDocument()
    expect(screen.getByText('Outstanding lesson payments')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Pay now' })).toBeInTheDocument()
    expect(screen.getByText('Algebra foundations')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Receipt' })).toHaveLength(2)
    expect(screen.getAllByText('8,000 RWF')).toHaveLength(2)
  })
})
