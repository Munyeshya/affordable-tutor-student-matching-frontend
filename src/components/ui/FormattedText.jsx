import React, { useLayoutEffect, useRef, useState } from 'react'

import { sanitizeFormattedHtml } from './formattedText.js'
import './FormattedText.css'

export function FormattedText({ value, fallback = '', className = '', id }) {
  const safeHtml = sanitizeFormattedHtml(value || fallback)
  return (
    <div
      id={id}
      className={`formatted-text ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  )
}

const COMMANDS = [
  { command: 'bold', label: 'Bold', content: <strong>B</strong> },
  { command: 'italic', label: 'Italic', content: <em>I</em> },
  { command: 'underline', label: 'Underline', content: <u>U</u> },
  { command: 'insertUnorderedList', label: 'Bullet list', content: <><span aria-hidden="true">•</span> List</> },
]

export function FormattedTextEditor({
  id,
  value,
  onChange,
  disabled = false,
  placeholder = '',
}) {
  const editorRef = useRef(null)
  const [activeCommands, setActiveCommands] = useState({})

  useLayoutEffect(() => {
    const editor = editorRef.current
    if (!editor || document.activeElement === editor) return
    const safeValue = sanitizeFormattedHtml(value)
    if (editor.innerHTML !== safeValue) editor.innerHTML = safeValue
  }, [value])

  function updateActiveCommands() {
    if (typeof document.queryCommandState !== 'function') return
    setActiveCommands(Object.fromEntries(
      COMMANDS.map(({ command }) => [command, document.queryCommandState(command)]),
    ))
  }

  function publishValue() {
    const editor = editorRef.current
    if (!editor) return
    onChange(sanitizeFormattedHtml(editor.innerHTML))
    updateActiveCommands()
  }

  function applyCommand(command) {
    if (disabled || typeof document.execCommand !== 'function') return
    editorRef.current?.focus()
    document.execCommand(command, false)
    publishValue()
  }

  function handlePaste(event) {
    event.preventDefault()
    const plainText = event.clipboardData.getData('text/plain')
    if (typeof document.execCommand === 'function') {
      document.execCommand('insertText', false, plainText)
      publishValue()
    }
  }

  return (
    <div className={`formatted-text-editor${disabled ? ' is-disabled' : ''}`}>
      <div className="formatted-text-toolbar" role="toolbar" aria-label="Course description formatting">
        {COMMANDS.map(({ command, label, content }) => (
          <button
            key={command}
            type="button"
            disabled={disabled}
            className={activeCommands[command] ? 'is-active' : ''}
            aria-label={label}
            aria-pressed={Boolean(activeCommands[command])}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyCommand(command)}
          >
            {content}
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        id={id}
        className="formatted-text-input"
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-disabled={disabled}
        data-placeholder={placeholder}
        onInput={publishValue}
        onKeyUp={updateActiveCommands}
        onMouseUp={updateActiveCommands}
        onBlur={publishValue}
        onPaste={handlePaste}
      />
      <small>Formatting appears immediately. Select text for bold, italic, or underline, and use List for bullet points.</small>
    </div>
  )
}
