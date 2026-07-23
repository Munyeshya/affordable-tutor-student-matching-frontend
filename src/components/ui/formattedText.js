const ALLOWED_TAGS = new Set(['H2', 'H3', 'P', 'BR', 'STRONG', 'EM', 'U', 'UL', 'LI'])
const NORMALIZED_TAGS = {
  B: 'STRONG',
  DIV: 'P',
  I: 'EM',
}
const BLOCKED_TAGS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT'])

function styledSpanTags(element) {
  const tags = []
  const fontWeight = String(element.style.fontWeight || '').toLowerCase()
  const textDecoration = String(element.style.textDecorationLine || element.style.textDecoration || '').toLowerCase()

  if (fontWeight === 'bold' || fontWeight === 'bolder' || Number.parseInt(fontWeight, 10) >= 600) tags.push('STRONG')
  if (['italic', 'oblique'].includes(String(element.style.fontStyle || '').toLowerCase())) tags.push('EM')
  if (textDecoration.includes('underline')) tags.push('U')
  return tags
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function legacyTextToHtml(value) {
  const lines = String(value || '').split(/\r?\n/)
  const blocks = []
  let bullets = []

  function formatInline(line) {
    return escapeHtml(line)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/_([^_\n]+)_/g, '<em>$1</em>')
  }

  function flushBullets() {
    if (!bullets.length) return
    blocks.push(`<ul>${bullets.map((line) => `<li>${formatInline(line)}</li>`).join('')}</ul>`)
    bullets = []
  }

  lines.forEach((line) => {
    const bullet = line.match(/^\s*-\s+(.+)$/)
    if (bullet) {
      bullets.push(bullet[1])
      return
    }
    flushBullets()
    if (line.trim()) blocks.push(`<p>${formatInline(line.trim())}</p>`)
  })
  flushBullets()
  return blocks.join('')
}

export function sanitizeFormattedHtml(value) {
  const source = String(value || '').trim()
  if (!source) return ''
  if (typeof DOMParser === 'undefined' || typeof document === 'undefined') {
    return escapeHtml(source)
  }

  const hasHtml = /<\/?(?:h2|h3|p|br|strong|b|em|i|u|ul|li|div)\b/i.test(source)
  const parser = new DOMParser()
  const parsed = parser.parseFromString(hasHtml ? source : legacyTextToHtml(source), 'text/html')
  const output = document.implementation.createHTMLDocument('')
  const container = output.createElement('div')

  function appendSafeNode(node, parent) {
    if (node.nodeType === 3) {
      parent.appendChild(output.createTextNode(node.textContent || ''))
      return
    }
    if (node.nodeType !== 1) return

    const normalizedTag = NORMALIZED_TAGS[node.tagName] || node.tagName
    if (BLOCKED_TAGS.has(normalizedTag)) return
    const safeTags = node.tagName === 'SPAN' ? styledSpanTags(node) : [normalizedTag]
    if (!safeTags.length || safeTags.some((tag) => !ALLOWED_TAGS.has(tag))) {
      Array.from(node.childNodes).forEach((child) => appendSafeNode(child, parent))
      return
    }

    let childParent = parent
    safeTags.forEach((tag) => {
      const safeElement = output.createElement(tag.toLowerCase())
      childParent.appendChild(safeElement)
      childParent = safeElement
    })
    Array.from(node.childNodes).forEach((child) => appendSafeNode(child, childParent))
  }

  Array.from(parsed.body.childNodes).forEach((node) => appendSafeNode(node, container))
  return container.innerHTML
}

export function toPlainFormattedText(value) {
  const safeHtml = sanitizeFormattedHtml(value)
  if (!safeHtml || typeof document === 'undefined') return String(value || '').trim()

  const container = document.createElement('div')
  container.innerHTML = safeHtml
  container.querySelectorAll('br').forEach((element) => element.replaceWith(' '))
  container.querySelectorAll('h2, h3, p, li').forEach((element) => element.append(' '))
  return String(container.textContent || '').replace(/\s+/g, ' ').trim()
}
