import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { ContactPage } from './ContactPage.jsx'

describe('ContactPage', () => {
  it('shows the Rwanda map and sends the contact form to the support mailbox', () => {
    render(<MemoryRouter><ContactPage /></MemoryRouter>)

    expect(screen.getByRole('heading', { level: 1, name: /one clear conversation/i })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Outline map of Rwanda' })).toHaveAttribute('src', '/rwanda-map.svg')
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
