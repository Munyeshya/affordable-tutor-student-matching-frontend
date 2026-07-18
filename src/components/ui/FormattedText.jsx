import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'

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
  { command: 'insertUnorderedList', label: 'Bullet list', content: <><span aria-hidden="true">&bull;</span> List</> },
]

export function FormattedTextEditor({
  id,
  value,
  onChange,
  disabled = false,
  placeholder = '',
}) {
  const editorRef = useRef(null)
  const savedRangeRef = useRef(null)
  const [activeCommands, setActiveCommands] = useState({})

  useLayoutEffect(() => {
    const editor = editorRef.current
    if (!editor || document.activeElement === editor) return
    const safeValue = sanitizeFormattedHtml(value)
    if (editor.innerHTML !== safeValue) editor.innerHTML = safeValue
  }, [value])

  useEffect(() => {
    function rememberEditorSelection() {
      const editor = editorRef.current
      const selection = window.getSelection()
      if (!editor || !selection?.rangeCount) return

      const range = selection.getRangeAt(0)
      if (editor.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange()
      }
    }

    document.addEventListener('selectionchange', rememberEditorSelection)
    return () => document.removeEventListener('selectionchange', rememberEditorSelection)
  }, [])

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
    const editor = editorRef.current
    const selection = window.getSelection()
    editor?.focus()

    if (selection && savedRangeRef.current) {
      selection.removeAllRanges()
      selection.addRange(savedRangeRef.current)
    }

    document.execCommand('styleWithCSS', false, false)
    document.execCommand(command, false, null)
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
