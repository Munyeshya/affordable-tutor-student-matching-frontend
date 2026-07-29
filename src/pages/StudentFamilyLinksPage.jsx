import React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'

import { getApiErrorMessage } from '../api/errors.js'
import { queryKeys } from '../api/queryKeys.js'
import { listStudentParentLinkRequests, respondToParentLinkRequest } from '../api/services/parents.js'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { EmptyState, ErrorState, SkeletonLoader } from '../components/ui/DashboardPrimitives.jsx'
import './StudentFamilyLinksPage.css'

const STATUS_COPY = {
  PENDING: 'Waiting for your decision',
  ACCEPTED: 'Access approved',
  REJECTED: 'Access declined',
}

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-RW', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function StudentFamilyLinksPage() {
  const queryClient = useQueryClient()
  const linksQuery = useQuery({
    queryKey: queryKeys.parents.linkRequests,
    queryFn: () => listStudentParentLinkRequests().then((response) => response.data),
  })
  const responseMutation = useMutation({
    mutationFn: ({ id, action }) => respondToParentLinkRequest(id, action),
    onSuccess: async (response) => {
      const accepted = response.data.status === 'ACCEPTED'
      toast.success(accepted ? 'Parent access approved.' : 'Parent access request declined.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.parents.linkRequests }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
      ])
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not update this family access request.')),
  })

  const links = linksQuery.data || []
  const pendingCount = links.filter((link) => link.status === 'PENDING').length

  return (
    <section className="student-family-page">
      <header className="student-family-hero">
        <div>
          <p className="eyebrow">Privacy and family</p>
          <h1>Choose who can follow your learning.</h1>
          <p>Parents receive access only after you approve their request. You can safely reject any person you do not recognize.</p>
        </div>
        <aside><strong>{pendingCount}</strong><span>Awaiting your decision</span></aside>
      </header>

      <section className="student-family-panel">
        <header>
          <div><p className="eyebrow">Family access</p><h2>Parent and guardian requests</h2></div>
          <span>{links.length} total</span>
        </header>

        {linksQuery.isLoading ? (
          <SkeletonLoader rows={4} />
        ) : linksQuery.isError ? (
          <ErrorState title="Family requests could not be loaded." message={getApiErrorMessage(linksQuery.error)} onRetry={linksQuery.refetch} />
        ) : links.length ? (
          <div className="student-family-list">
            {links.map((link) => (
              <article key={link.id} className={`is-${link.status.toLowerCase()}`}>
                <span className="student-family-icon"><DashboardIcon name="students" /></span>
                <div className="student-family-person">
                  <span>{link.label || 'Parent or guardian'}</span>
                  <strong>{link.parent_name || link.parent_email}</strong>
                  <small>{link.parent_email} / Requested {formatDate(link.created_at)}</small>
                </div>
                <div className="student-family-status">
                  <b>{STATUS_COPY[link.status] || link.status}</b>
                  {link.responded_at ? <small>Updated {formatDate(link.responded_at)}</small> : null}
                </div>
                {link.status === 'PENDING' ? (
                  <div className="student-family-actions">
                    <button type="button" className="secondary-button" disabled={responseMutation.isPending} onClick={() => responseMutation.mutate({ id: link.id, action: 'REJECT' })}>Reject</button>
                    <button type="button" className="primary-button" disabled={responseMutation.isPending} onClick={() => responseMutation.mutate({ id: link.id, action: 'ACCEPT' })}>Accept access</button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<DashboardIcon name="students" size={28} />}
            title="No family access requests"
            description="If a parent asks to link your account, the request will appear here before they can see any learning records."
          />
        )}
      </section>
    </section>
  )
}
