import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { HowItWorksPage } from './HowItWorksPage.jsx'

describe('HowItWorksPage', () => {
  it('presents the marketplace journeys and primary public actions', () => {
    render(<MemoryRouter><HowItWorksPage /></MemoryRouter>)

    expect(screen.getByRole('heading', { level: 1, name: /find the right support/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'One platform, three clear journeys.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /learning support should show what changed/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /find a tutor/i })).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: /find a tutor/i })[0]).toHaveAttribute('href', '/tutors')
    expect(screen.getByRole('link', { name: /browse courses/i })).toHaveAttribute('href', '/courses')
    expect(screen.getByText('Verified before visible')).toBeInTheDocument()
  })
})
