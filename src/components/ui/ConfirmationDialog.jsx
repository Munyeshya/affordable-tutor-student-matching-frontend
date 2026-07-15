import React, { useEffect, useEffectEvent, useRef } from 'react'

export function ConfirmationDialog({ open, onClose, labelledBy, describedBy, backdropClassName = '', dialogClassName = '', children }) {
  const dialogRef = useRef(null)
  const closeDialog = useEffectEvent(() => onClose?.())

  useEffect(() => {
    if (!open) return undefined

    const previouslyFocused = document.activeElement
    const previousOverflow = document.body.style.overflow
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const getFocusableElements = () => Array.from(dialogRef.current?.querySelectorAll(focusableSelector) || [])
    const focusFrame = window.requestAnimationFrame(() => {
      const focusableElements = getFocusableElements()
      const initialFocusTarget = focusableElements[0] || dialogRef.current
      initialFocusTarget?.focus()
    })
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeDialog()
        return
      }

      if (event.key !== 'Tab') return
      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) {
        event.preventDefault()
        dialogRef.current?.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      if (event.shiftKey && (document.activeElement === firstElement || document.activeElement === dialogRef.current)) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div className={'ui-dialog-backdrop ' + backdropClassName} role="presentation" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className={'ui-confirmation-dialog ' + dialogClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex="-1"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </section>
    </div>
  )
}
