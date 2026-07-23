import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { ContactPage } from './ContactPage.jsx'

describe('ContactPage', () => {
  it('provides working support email actions and public help links', () => {
    render(<MemoryRouter><ContactPage /></MemoryRouter>)

    expect(screen.getByRole('heading', { level: 1, name: /learning journey needs support/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Email support' })).toHaveAttribute('href', expect.stringContaining('mailto:support@isomo.rw'))
    expect(screen.getByRole('link', { name: 'Read how Isomo works' })).toHaveAttribute('href', '/how-it-works')
    expect(screen.getByRole('form', { name: 'Email Isomo support' })).toHaveAttribute('action', expect.stringContaining('mailto:support@isomo.rw'))
    expect(screen.getByRole('link', { name: 'Open tutor search' })).toHaveAttribute('href', '/tutors')
  })
})
