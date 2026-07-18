import { describe, expect, it } from 'vitest'

import { sanitizeFormattedHtml, toPlainFormattedText } from './formattedText.js'

describe('formatted course descriptions', () => {
  it('preserves approved live formatting', () => {
    expect(sanitizeFormattedHtml(
      '<p><strong>Core topic</strong> with <em>practice</em> and <u>feedback</u>.</p><ul><li>First outcome</li></ul>',
    )).toBe(
      '<p><strong>Core topic</strong> with <em>practice</em> and <u>feedback</u>.</p><ul><li>First outcome</li></ul>',
    )
  })

  it('removes scripts, event handlers, and unsupported elements', () => {
    expect(sanitizeFormattedHtml(
      '<p onclick="alert(1)">Safe <script>alert(1)</script><a href="javascript:alert(1)">description</a></p>',
    )).toBe('<p>Safe description</p>')
  })

  it('creates clean summaries from formatted descriptions', () => {
    expect(toPlainFormattedText('<p><strong>Learn algebra</strong></p><ul><li>Solve equations</li></ul>'))
      .toBe('Learn algebra Solve equations')
  })
})
