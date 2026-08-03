import { describe, expect, it } from 'vitest'

import { getEmbeddableVideo } from './videoEmbed.js'

describe('getEmbeddableVideo', () => {
  it('creates privacy-conscious YouTube embeds', () => {
    expect(getEmbeddableVideo('https://youtu.be/dQw4w9WgXcQ')).toEqual({
      type: 'embed',
      provider: 'YouTube',
      src: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    })
  })

  it('keeps direct video files playable in the native player', () => {
    expect(getEmbeddableVideo('https://media.example.test/lesson.mp4?token=1')).toEqual({
      type: 'video',
      src: 'https://media.example.test/lesson.mp4?token=1',
    })
  })

  it('falls back to a link for unsupported hosts', () => {
    expect(getEmbeddableVideo('https://example.test/watch/lesson')).toEqual({
      type: 'link',
      src: 'https://example.test/watch/lesson',
    })
  })
})
