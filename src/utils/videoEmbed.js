const VIDEO_FILE_PATTERN = /\.(mp4|webm|mov|m4v)(?:$|[?#])/i

function safeId(value, pattern) {
  return pattern.test(value || '') ? value : ''
}

export function getEmbeddableVideo(value) {
  if (!value) return null

  let url
  try {
    url = new URL(value)
  } catch {
    return { type: 'link', src: value }
  }

  if (!['http:', 'https:'].includes(url.protocol)) return null
  if (VIDEO_FILE_PATTERN.test(url.pathname)) return { type: 'video', src: url.href }

  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  if (host === 'youtu.be') {
    const id = safeId(url.pathname.split('/').filter(Boolean)[0], /^[\w-]{6,}$/)
    if (id) return { type: 'embed', provider: 'YouTube', src: `https://www.youtube-nocookie.com/embed/${id}` }
  }
  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const segments = url.pathname.split('/').filter(Boolean)
    const candidate = url.searchParams.get('v') || (['embed', 'shorts', 'live'].includes(segments[0]) ? segments[1] : '')
    const id = safeId(candidate, /^[\w-]{6,}$/)
    if (id) return { type: 'embed', provider: 'YouTube', src: `https://www.youtube-nocookie.com/embed/${id}` }
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = url.pathname.split('/').filter(Boolean).find((segment) => /^\d+$/.test(segment))
    if (id) return { type: 'embed', provider: 'Vimeo', src: `https://player.vimeo.com/video/${id}` }
  }
  if (host === 'loom.com') {
    const segments = url.pathname.split('/').filter(Boolean)
    const id = safeId(segments[1], /^[\w-]{6,}$/)
    if (segments[0] === 'share' && id) return { type: 'embed', provider: 'Loom', src: `https://www.loom.com/embed/${id}` }
  }

  return { type: 'link', src: url.href }
}
