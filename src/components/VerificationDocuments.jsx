import React from 'react'
import { Link } from 'react-router-dom'
import { StatusBadge } from './ui/StatusBadge.jsx'

const DOCUMENT_REVIEW_REASONS = [
  { value: 'UNREADABLE', label: 'Unreadable document' },
  { value: 'EXPIRED', label: 'Expired document' },
  { value: 'INFORMATION_MISMATCH', label: 'Information mismatch' },
  { value: 'WRONG_DOCUMENT_TYPE', label: 'Wrong document type' },
  { value: 'MISSING_PAGES', label: 'Missing pages' },
  { value: 'OTHER', label: 'Other' },
]

function formatDocumentType(docType) {
  if (docType === 'ID') return 'National ID'
  if (docType === 'CERTIFICATE') return 'Qualification certificate'
  return 'Supporting document'
}

function formatAction(action) {
  if (action === 'UPLOAD') return 'Upload required'
  if (action === 'REPLACE') return 'Replacement required'
  if (action === 'WAIT_FOR_REVIEW') return 'Waiting for review'
  return 'Contact support'
}

export function DocumentActionSummary({ summary, onSelectDocument }) {
  if (!summary) {
    return (
      <section className="panel card verification-actions" aria-busy="true">
        <p className="eyebrow">Document review</p>
        <h2>Loading document status...</h2>
        <div className="skeleton skeleton-line" />
      </section>
    )
  }

  const actions = Array.isArray(summary.action_required)
    ? summary.action_required
    : []

  return (
    <section className="panel card verification-actions">
      <div className="verification-section-head">
        <div>
          <p className="eyebrow">Document review</p>
          <h2>
            {summary?.all_required_approved
              ? 'Required documents approved.'
              : 'Complete the actions below.'}
          </h2>
        </div>
        <StatusBadge className="status-pill" tone={summary?.all_required_approved ? 'success' : 'warning'}>
          {summary?.all_required_approved ? 'Approved' : `${actions.length} actions`}
        </StatusBadge>
      </div>

      {actions.length ? (
        <div className="verification-action-grid">
          {actions.map((item) => (
            <article
              className="verification-action-card"
              key={`${item.doc_type}-${item.document_id || item.action}`}
            >
              <div>
                <StatusBadge className="status-pill" tone="warning">{formatAction(item.action)}</StatusBadge>
                <h3>{formatDocumentType(item.doc_type)}</h3>
                <p>{item.message}</p>
                {item.reason ? <small>Reason: {item.reason.replaceAll('_', ' ')}</small> : null}
              </div>

              {item.action === 'UPLOAD' || item.action === 'REPLACE' ? (
                onSelectDocument ? (
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => onSelectDocument(item.doc_type)}
                  >
                    {item.action === 'REPLACE' ? 'Upload replacement' : 'Choose document'}
                  </button>
                ) : (
                  <Link className="primary-button" to="/tutor-documents">
                    Manage documents
                  </Link>
                )
              ) : item.action === 'CONTACT_SUPPORT' ? (
                <Link className="secondary-button" to="/contact">
                  Contact support
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="supporting-text">
          There are no outstanding document actions.
        </p>
      )}
    </section>
  )
}

export function AdminDocumentReview({
  document,
  reviewValue,
  busy,
  onChange,
  onReview,
}) {
  const reason = reviewValue?.reason || 'UNREADABLE'
  const message = reviewValue?.message || ''

  return (
    <article className="admin-document-card">
      <div className="verification-section-head">
        <div>
          <h3>{document.doc_type_display || formatDocumentType(document.doc_type)}</h3>
          <p className="supporting-text">
            {document.review_message || 'No review feedback yet.'}
          </p>
        </div>
        <StatusBadge
          className="status-pill"
          tone={document.status === 'APPROVED' ? 'success' : document.status === 'REJECTED' ? 'danger' : 'warning'}
        >
          {document.status_display || document.status}
        </StatusBadge>
      </div>

      <div className="document-meta-row">
        <a href={document.file} target="_blank" rel="noreferrer">
          Open document
        </a>
        {document.review_reason_display ? (
          <span>{document.review_reason_display}</span>
        ) : null}
      </div>

      <div className="document-review-fields">
        <select
          aria-label={`Review reason for ${document.doc_type_display || document.doc_type}`}
          value={reason}
          onChange={(event) => onChange({ reason: event.target.value, message })}
        >
          {DOCUMENT_REVIEW_REASONS.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <textarea
          aria-label="Document review message"
          rows="2"
          placeholder="Explain what the tutor needs to correct"
          value={message}
          onChange={(event) => onChange({ reason, message: event.target.value })}
        />
      </div>

      <div className="hero-actions document-review-actions">
        <button
          className="primary-button"
          type="button"
          disabled={busy}
          onClick={() => onReview({ status: 'APPROVED' })}
        >
          Approve document
        </button>
        <button
          className="secondary-button"
          type="button"
          disabled={busy}
          onClick={() => onReview({
            status: 'REPLACEMENT_REQUESTED',
            review_reason: reason,
            review_message: message,
          })}
        >
          Request replacement
        </button>
        <button
          className="secondary-button"
          type="button"
          disabled={busy}
          onClick={() => onReview({
            status: 'REJECTED',
            review_reason: reason,
            review_message: message,
          })}
        >
          Reject document
        </button>
      </div>
    </article>
  )
}