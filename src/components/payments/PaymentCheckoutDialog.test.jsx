import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createCoursePurchase,
  getPaymentTransaction,
  listPaymentProviders,
} from '../../api/services/payments'
import { renderWithProviders } from '../../test/render.jsx'
import { PaymentCheckoutDialog } from './PaymentCheckoutDialog.jsx'

const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}))

vi.mock('react-toastify', () => ({ toast }))
vi.mock('../../api/services/payments', () => ({
  createCoursePurchase: vi.fn(),
  getPaymentTransaction: vi.fn(),
  getPrintablePaymentReceipt: vi.fn(),
  initiateBookingPayment: vi.fn(),
  initiateSchedulePayment: vi.fn(),
  listPaymentProviders: vi.fn(),
}))

const baseProps = {
  open: true,
  kind: 'course',
  itemId: 15,
  title: 'Algebra foundations',
  amount: 5000,
  currency: 'RWF',
  onClose: vi.fn(),
  onSettled: vi.fn(),
}

describe('PaymentCheckoutDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listPaymentProviders.mockResolvedValue({
      data: {
        default: 'SIMULATED',
        providers: [{
          code: 'SIMULATED',
          name: 'Development payment',
          description: 'Local simulation only.',
          networks: ['MTN', 'AIRTEL', 'CARD', 'BANK'],
        }],
      },
    })
  })

  it('settles a provider-confirmed payment and reports success', async () => {
    const user = userEvent.setup()
    createCoursePurchase.mockResolvedValue({
      data: {
        id: 61,
        kind: 'course',
        status: 'PAID',
        amount: 5000,
        currency: 'RWF',
        receipt_number: 'ISO-202607-CRS-00000061',
      },
    })

    renderWithProviders(<PaymentCheckoutDialog {...baseProps} />)

    await user.click(await screen.findByRole('button', { name: 'Choose payment method' }))
    await user.click(screen.getByRole('button', { name: 'Review payment' }))
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Complete payment simulation' }))

    expect(await screen.findByRole('heading', { name: 'Payment completed' })).toBeInTheDocument()
    await waitFor(() => expect(baseProps.onSettled).toHaveBeenCalledWith(expect.objectContaining({
      id: 61,
      status: 'PAID',
    })))
    expect(createCoursePurchase).toHaveBeenCalledWith(
      {
        course_id: 15,
        provider: 'SIMULATED',
        phone_number: '',
        network: 'MTN',
      },
      expect.any(String),
    )
  })

  it('keeps asynchronous mobile money in a visible pending state', async () => {
    const user = userEvent.setup()
    listPaymentProviders.mockResolvedValue({
      data: {
        default: 'FLUTTERWAVE',
        providers: [{
          code: 'FLUTTERWAVE',
          name: 'Mobile Money',
          description: 'MTN MoMo or Airtel Money.',
          networks: ['MTN', 'AIRTEL'],
        }],
      },
    })
    const pending = {
      id: 62,
      kind: 'course',
      status: 'PENDING',
      amount: 5000,
      currency: 'RWF',
    }
    createCoursePurchase.mockResolvedValue({ data: pending })
    getPaymentTransaction.mockResolvedValue({ data: pending })

    renderWithProviders(<PaymentCheckoutDialog {...baseProps} />)

    await user.click(await screen.findByRole('button', { name: 'Choose payment method' }))
    await user.type(screen.getByLabelText('Mobile money number'), '250788000001')
    await user.click(screen.getByRole('button', { name: 'Review payment' }))
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Complete payment simulation' }))

    expect(await screen.findByRole('heading', { name: 'Waiting for approval' })).toBeInTheDocument()
    expect(screen.getByText(/Approve the payment prompt/)).toBeInTheDocument()
    expect(baseProps.onSettled).not.toHaveBeenCalled()
  })
})
