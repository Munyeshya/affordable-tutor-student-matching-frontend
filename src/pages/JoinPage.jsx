import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Page } from '../App'
import { InfoCard, MinimalList } from '../components/ui/PagePrimitives.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const joinChecklist = [
  'Qualification documents',
  'Signed agreement form',
  'Lessons and levels taught',
  'Profile photo and bio',
]
export function JoinPage() {
  const { signUp, submitting, error, setError } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    password: '',
    role: 'STUDENT',
  })
  const [successMessage, setSuccessMessage] = useState('')

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSuccessMessage('')
    setError('')

    try {
      await signUp(form)
      setSuccessMessage('Account created. Please sign in to continue.')
      navigate('/sign-in', { state: { registeredEmail: form.email } })
    } catch {
      // context already sets the error message
    }
  }

  return (
    <>
      <Page
        title="Join now"
        text="Create an account as a student or tutor."
        action="Create account"
        secondary={{ to: '/tutors', label: 'Browse tutors' }}
      />

      <section className="benefits-grid">
        <InfoCard title="Student" text="Search tutors and request lessons quickly." />
        <InfoCard title="Tutor" text="Upload documents and present your lessons." />
        <InfoCard title="Approval" text="Admin reviews keep the marketplace trusted." />
      </section>

      <section className="split-layout">
        <article className="panel card">
          <p className="eyebrow">Create account</p>
          <h2>Choose the role that fits you.</h2>
          <form className="steps-list" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Full name"
              aria-label="Full name"
              value={form.full_name}
              onChange={(event) => updateField('full_name', event.target.value)}
            />
            <select
              aria-label="Account type"
              value={form.role}
              onChange={(event) => updateField('role', event.target.value)}
            >
              <option value="STUDENT">Student</option>
              <option value="TUTOR">Tutor</option>
              <option value="PARENT">Parent</option>
            </select>
            <input
              type="tel"
              placeholder="Phone number"
              aria-label="Phone number"
              value={form.phone_number}
              onChange={(event) => updateField('phone_number', event.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email address"
              aria-label="Email address"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              aria-label="Password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
            />
            {error ? <p className="supporting-text">{error}</p> : null}
            {successMessage ? <p className="supporting-text">{successMessage}</p> : null}
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </article>

        <article className="panel card">
          <p className="eyebrow">Tutor checklist</p>
          <h2>What tutors should prepare.</h2>
          <MinimalList items={joinChecklist} />
        </article>
      </section>
    </>
  )
}
