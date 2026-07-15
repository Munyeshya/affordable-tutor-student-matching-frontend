import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { listParentLinks } from '../api/services/parents'
import { apiClient } from '../api/client'
import { API_ENDPOINTS } from '../api/endpoints'
import { useAuth } from '../context/AuthContext.jsx'
import { getApiErrorMessage } from '../api/errors'
import { queryKeys } from '../api/queryKeys'
import { StatusBadge } from '../components/ui/StatusBadge.jsx'

function StudentLinkCard({ link }) {
  return (
    <article className="panel parent-link-card">
      <div className="parent-link-head">
        <div>
          <p className="eyebrow">Linked student</p>
          <h3>{link.student_name || 'Student'}</h3>
          <p className="supporting-text">{link.student_email}</p>
        </div>
        <StatusBadge className="status-pill" tone={link.is_primary ? 'warning' : 'neutral'}>
          {link.is_primary ? 'Primary' : 'Linked'}
        </StatusBadge>
      </div>

      <div className="parent-link-meta">
        <span><strong>Label:</strong> {link.label || 'No label'}</span>
        <span><strong>Created:</strong> {link.created_at ? new Date(link.created_at).toLocaleDateString() : 'Unknown'}</span>
      </div>
    </article>
  )
}

export function ParentStudentsPage() {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [studentEmail, setStudentEmail] = useState('')
  const [label, setLabel] = useState('')
  const [isPrimary, setIsPrimary] = useState(false)
  const [message, setMessage] = useState('')

  const linksQuery = useQuery({
    queryKey: queryKeys.parents.links,
    queryFn: () => listParentLinks().then((response) => response.data),
    enabled: isAuthenticated && user?.role === 'PARENT',
  })

  const createMutation = useMutation({
    mutationFn: (payload) => apiClient.post(API_ENDPOINTS.parents.links, payload),
    onSuccess: async () => {
      setStudentEmail('')
      setLabel('')
      setIsPrimary(false)
      setMessage('Student linked successfully.')
      toast.success('Student linked successfully.')
      await queryClient.invalidateQueries({ queryKey: queryKeys.parents.links })
      await queryClient.invalidateQueries({ queryKey: queryKeys.parents.dashboard })
    },
    onError: (error) => {
      const errorMessage = getApiErrorMessage(error, 'Could not link the student.')
      setMessage(errorMessage)
      toast.error(errorMessage)
    },
  })

  if (!isAuthenticated || user?.role !== 'PARENT') {
    return (
      <section className="page-card card">
        <p className="eyebrow">Parent students</p>
        <h1>Only parent accounts can manage student links.</h1>
        <p className="supporting-text">Sign in with a parent account to link students to your profile.</p>
        <div className="hero-actions">
          <Link className="primary-button" to="/sign-in">Sign in</Link>
          <Link className="secondary-button" to="/join">Create account</Link>
        </div>
      </section>
    )
  }

  function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    createMutation.mutate({
      student_email: studentEmail.trim(),
      label: label.trim(),
      is_primary: isPrimary,
    })
  }

  return (
    <section className="dashboard-page">
      <section className="page-card card dashboard-hero">
        <div>
          <p className="eyebrow">Parent students</p>
          <h1>Manage linked students</h1>
          <p className="supporting-text">
            Add students by email so you can monitor bookings and outcomes from your parent account.
          </p>
        </div>
      </section>

      <section className="page-card card">
        <p className="eyebrow">Link a student</p>
        <form className="parent-link-form" onSubmit={handleSubmit}>
          <label className="account-field">
            <span>Student email</span>
            <input type="email" value={studentEmail} onChange={(event) => setStudentEmail(event.target.value)} required />
          </label>
          <label className="account-field">
            <span>Label</span>
            <input type="text" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. Primary learner" />
          </label>
          <label className="account-check">
            <input type="checkbox" checked={isPrimary} onChange={() => setIsPrimary((current) => !current)} />
            <span>Mark as primary student</span>
          </label>
          <div className="account-actions">
            <button className="primary-button" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Linking...' : 'Link student'}
            </button>
            <p className="account-status" aria-live="polite">{message}</p>
          </div>
        </form>
      </section>

      <section className="dashboard-students-grid">
        {linksQuery.isLoading ? (
          <article className="page-card card">
            <p className="supporting-text">Loading linked students...</p>
          </article>
        ) : linksQuery.data?.length ? (
          linksQuery.data.map((link) => <StudentLinkCard key={link.id} link={link} />)
        ) : (
          <article className="page-card card">
            <p className="eyebrow">Linked students</p>
            <h2>No linked students yet</h2>
            <p className="supporting-text">Link a student to start seeing booking and learning summaries.</p>
          </article>
        )}
      </section>
    </section>
  )
}
