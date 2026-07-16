import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { changeAdminUserStatus, getAdminUser, listAdminUsers } from '../api/services/adminUsers.js'
import { renderWithProviders } from '../test/render.jsx'
import { AdminUsersPage } from './AdminUsersPage.jsx'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('react-toastify', () => ({ toast }))
vi.mock('../api/services/adminUsers.js', () => ({
  changeAdminUserStatus: vi.fn(),
  getAdminUser: vi.fn(),
  listAdminUsers: vi.fn(),
}))

const managedUser = {
  id: 31,
  username: 'student.one',
  email: 'student@isomo.test',
  full_name: 'Student One',
  role: 'STUDENT',
  account_status: 'ACTIVE',
  verification_status: 'NOT_APPLICABLE',
  date_joined: '2026-06-01T10:00:00Z',
  last_login: '2026-07-10T10:00:00Z',
  can_manage: true,
  profile: { data: { full_name: 'Student One', level: 'Secondary upper level' } },
}

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listAdminUsers.mockResolvedValue({ data: { count: 1, next: null, previous: null, results: [managedUser] } })
    getAdminUser.mockResolvedValue({ data: managedUser })
    changeAdminUserStatus.mockResolvedValue({ data: { ...managedUser, account_status: 'SUSPENDED' } })
  })

  it('requires a reason and submits a reversible account restriction', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminUsersPage />)

    await user.click(await screen.findByRole('button', { name: 'View and manage' }))
    expect(await screen.findByRole('dialog')).toHaveTextContent('Student One')
    await user.click(screen.getByRole('button', { name: 'Suspend account' }))
    await user.type(screen.getByLabelText('Required reason'), 'Repeated safety policy violations were confirmed.')
    await user.click(screen.getByRole('button', { name: 'Suspend account' }))

    await waitFor(() => expect(changeAdminUserStatus).toHaveBeenCalledWith(31, {
      action: 'SUSPEND',
      reason: 'Repeated safety policy violations were confirmed.',
    }))
    expect(toast.success).toHaveBeenCalledWith('Suspend account completed.')
  })
})
