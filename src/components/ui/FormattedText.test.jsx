import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FormattedText, FormattedTextEditor } from './FormattedText.jsx'
import { sanitizeFormattedHtml, toPlainFormattedText } from './formattedText.js'

describe('course description formatting', () => {
  beforeEach(() => {
    document.execCommand = vi.fn(() => true)
    document.queryCommandState = vi.fn(() => false)
    document.queryCommandValue = vi.fn(() => '')
  })

  afterEach(() => {
    delete document.execCommand
    delete document.queryCommandState
    delete document.queryCommandValue
  })

  it('keeps supported headings and removes unsafe markup', () => {
    const value = '<h2>What you will learn</h2><h3>Core skills</h3><script>alert(1)</script><p><strong>Algebra</strong></p>'

    expect(sanitizeFormattedHtml(value)).toBe(
      '<h2>What you will learn</h2><h3>Core skills</h3><p><strong>Algebra</strong></p>',
    )
    expect(toPlainFormattedText(value)).toBe('What you will learn Core skills Algebra')
  })

  it('provides heading, inline-style, and list controls', () => {
    render(<FormattedTextEditor value="" onChange={vi.fn()} placeholder="Describe the course" />)

    fireEvent.click(screen.getByRole('button', { name: 'Heading' }))
    fireEvent.click(screen.getByRole('button', { name: 'Subheading' }))
    fireEvent.click(screen.getByRole('button', { name: 'Italic' }))

    expect(document.execCommand).toHaveBeenCalledWith('formatBlock', false, 'h2')
    expect(document.execCommand).toHaveBeenCalledWith('formatBlock', false, 'h3')
    expect(document.execCommand).toHaveBeenCalledWith('italic', false, null)
    expect(screen.getByRole('button', { name: 'Bold' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Underline' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Bullet list' })).toBeEnabled()
  })

  it('renders formatted headings in course descriptions', () => {
    render(<FormattedText value="<h2>Course outcomes</h2><p>Build confidence.</p>" />)

    expect(screen.getByRole('heading', { name: 'Course outcomes', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('Build confidence.')).toBeInTheDocument()
  })
})
