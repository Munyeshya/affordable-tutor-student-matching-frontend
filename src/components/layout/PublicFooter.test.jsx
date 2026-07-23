import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { PublicFooter } from './PublicFooter.jsx'

const expectedLinks = {
  Home: '/',
  'Find tutors': '/tutors',
  'Browse courses': '/courses',
  'How it works': '/how-it-works',
  'About us': '/about',
  'Contact and support': '/contact',
  'Sign in': '/sign-in',
  'Create an account': '/join',
}

const workingRoutes = new Set(['/', '/tutors', '/courses', '/how-it-works', '/about', '/contact', '/sign-in', '/join'])

describe('PublicFooter', () => {
  it('contains only real navigation actions and no inactive newsletter form', () => {
    render(<MemoryRouter><PublicFooter /></MemoryRouter>)

    Object.entries(expectedLinks).forEach(([name, href]) => {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', href)
    })
    screen.getAllByRole('link').forEach((link) => {
      expect(workingRoutes.has(link.getAttribute('href'))).toBe(true)
    })
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByText(/privacy policy/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/terms of service/i)).not.toBeInTheDocument()
  })
})
