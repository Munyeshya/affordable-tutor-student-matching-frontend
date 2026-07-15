import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'

import { getApiErrorMessage } from '../api/errors'
import { openAdminPrintableReport, openMyPrintableReport } from '../api/services/reports.js'
import { useAuth } from '../context/AuthContext.jsx'

export function ReportsPage() {
  const { user, isAuthenticated } = useAuth()
  const [notice, setNotice] = useState('')

  if (!isAuthenticated) {
    return (
      <section className="page-card card">
        <p className="eyebrow">Reports</p>
        <h1>Sign in to open printable reports.</h1>
        <div className="hero-actions">
          <Link className="primary-button" to="/sign-in">Sign in</Link>
          <Link className="secondary-button" to="/join">Create account</Link>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="page-card card">
        <p className="eyebrow">Reports</p>
        <h1>Printable reports for your account.</h1>
        <p className="supporting-text">Open a report in a new tab for printing or saving as PDF.</p>
        {notice ? <p className="supporting-text">{notice}</p> : null}
      </section>

      <section className="split-layout">
        <article className="panel card">
          <p className="eyebrow">My report</p>
          <h2>Personal printable summary.</h2>
          <p className="supporting-text">
            Shows role-based details for students, tutors, and parents.
          </p>
          <button
            className="primary-button"
            type="button"
            onClick={async () => {
              try {
                await openMyPrintableReport()
                setNotice('Your printable report opened in a new tab.')
                toast.success('Your printable report opened in a new tab.')
              } catch (error) {
                const message = getApiErrorMessage(error)
                setNotice(message)
                toast.error(message)
              }
            }}
          >
            Open my report
          </button>
        </article>

        <article className="panel card">
          <p className="eyebrow">Admin report</p>
          <h2>Platform-wide summary.</h2>
          <p className="supporting-text">
            Available to admin users for a full printable platform overview.
          </p>
          {user?.role === 'ADMIN' ? (
            <button
              className="primary-button"
              type="button"
              onClick={async () => {
                try {
                  await openAdminPrintableReport()
                  setNotice('Admin printable report opened in a new tab.')
                  toast.success('Admin printable report opened in a new tab.')
                } catch (error) {
                  const message = getApiErrorMessage(error)
                  setNotice(message)
                  toast.error(message)
                }
              }}
            >
              Open admin report
            </button>
          ) : (
            <p className="supporting-text">Admin-only report access.</p>
          )}
        </article>
      </section>
    </>
  )
}
