import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { ContactPage } from './ContactPage.jsx'

describe('ContactPage', () => {
  it('selects Rwanda provinces and sends the form to the support mailbox', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><ContactPage /></MemoryRouter>)

    expect(screen.getByRole('heading', { level: 1, name: /one clear conversation/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kigali City' })).toBeInTheDocument()
    expect(screen.getByText('Kigali City', { selector: '.contact-map-selection strong' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Northern' }))
    expect(screen.getByText('Northern', { selector: '.contact-map-selection strong' })).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'Email Isomo support' })).toHaveAttribute(
      'action',
      expect.stringContaining('mailto:treanparentcharityupdates@gmail.com'),
    )
    expect(screen.getByRole('link', { name: 'treanparentcharityupdates@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:treanparentcharityupdates@gmail.com',
    )
  })
})
