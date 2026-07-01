import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { updateCurrentUser } from '../api/services/auth'
import { useAuth } from '../context/AuthContext.jsx'

function toInputValue(value) {
  return value ?? ''
}

function toNullableNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

function getProfileDefaults(user) {
  const profile = user?.profile?.data ?? {}

  return {
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    full_name: profile.full_name ?? '',
    location: profile.location ?? '',
    phone_number: profile.phone_number ?? '',
    notes: profile.notes ?? '',
    level: profile.level ?? '',
    budget_min: profile.budget_min ?? '',
    budget_max: profile.budget_max ?? '',
    prefers_online: Boolean(profile.prefers_online),
    prefers_in_person: Boolean(profile.prefers_in_person),
    headline: profile.headline ?? '',
    bio: profile.bio ?? '',
    hourly_rate: profile.hourly_rate ?? '',
    currency: profile.currency ?? '',
    teaches_online: Boolean(profile.teaches_online),
    teaches_in_person: Boolean(profile.teaches_in_person),
  }
}

export function AccountPage() {
  const { user, loading, refreshUser } = useAuth()
  const [form, setForm] = useState(() => getProfileDefaults(user))
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    setForm(getProfileDefaults(user))
  }, [user])

  const saveMutation = useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: async () => {
      await refreshUser()
      setStatusMessage('Your profile has been updated.')
    },
    onError: () => {
      setStatusMessage('We could not save your changes. Please try again.')
    },
  })

  if (loading) {
    return (
      <section className="page-card card account-page">
        <p className="eyebrow">Account</p>
        <h1>Loading your profile...</h1>
        <p className="supporting-text">We are fetching the latest profile details.</p>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="page-card card account-page">
        <p className="eyebrow">Account</p>
        <h1>Sign in to manage your profile</h1>
        <p className="supporting-text">
          You need an active session before you can update your account details.
        </p>
        <div className="hero-actions">
          <Link className="primary-button" to="/sign-in">
            Sign in
          </Link>
          <Link className="secondary-button" to="/join">
            Create account
          </Link>
        </div>
      </section>
    )
  }

  const role = user.role || 'USER'
  const profileType = user.profile?.type || 'none'
  const profile = user.profile?.data ?? {}

  function updateField(name, value) {
    setStatusMessage('')
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function toggleField(name) {
    setStatusMessage('')
    setForm((current) => ({
      ...current,
      [name]: !current[name],
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    setStatusMessage('')

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
    }

    if (role === 'STUDENT') {
      payload.full_name = form.full_name.trim()
      payload.level = form.level.trim()
      payload.location = form.location.trim()
      payload.budget_min = toNullableNumber(form.budget_min)
      payload.budget_max = toNullableNumber(form.budget_max)
      payload.prefers_online = form.prefers_online
      payload.prefers_in_person = form.prefers_in_person
    }

    if (role === 'TUTOR') {
      payload.full_name = form.full_name.trim()
      payload.headline = form.headline.trim()
      payload.bio = form.bio.trim()
      payload.hourly_rate = toNullableNumber(form.hourly_rate)
      payload.currency = form.currency.trim()
      payload.location = form.location.trim()
      payload.teaches_online = form.teaches_online
      payload.teaches_in_person = form.teaches_in_person
    }

    if (role === 'PARENT') {
      payload.full_name = form.full_name.trim()
      payload.location = form.location.trim()
      payload.phone_number = form.phone_number.trim()
      payload.notes = form.notes.trim()
    }

    saveMutation.mutate(payload)
  }

  return (
    <section className="page-card card account-page">
      <div className="account-header">
        <div>
          <p className="eyebrow">My account</p>
          <h1>Manage your profile</h1>
          <p className="supporting-text">
            Update the details that help students, parents, and admins understand your profile.
          </p>
        </div>

        <div className="account-summary">
          <span className="account-summary-label">Role</span>
          <strong>{role}</strong>
          <span className="account-summary-label">Profile</span>
          <strong>{profileType}</strong>
          {role === 'TUTOR' ? (
            <>
              <span className="account-summary-label">Verification</span>
              <strong>{profile.verification_status || 'Pending'}</strong>
            </>
          ) : null}
        </div>
      </div>

      <form className="account-form" onSubmit={handleSubmit}>
        <div className="account-form-grid">
          <label className="account-field">
            <span>First name</span>
            <input
              type="text"
              value={toInputValue(form.first_name)}
              onChange={(event) => updateField('first_name', event.target.value)}
            />
          </label>

          <label className="account-field">
            <span>Last name</span>
            <input
              type="text"
              value={toInputValue(form.last_name)}
              onChange={(event) => updateField('last_name', event.target.value)}
            />
          </label>

          {(role === 'STUDENT' || role === 'TUTOR' || role === 'PARENT') ? (
            <label className="account-field account-field-wide">
              <span>Full name</span>
              <input
                type="text"
                value={toInputValue(form.full_name)}
                onChange={(event) => updateField('full_name', event.target.value)}
              />
            </label>
          ) : null}

          {(role === 'STUDENT' || role === 'TUTOR' || role === 'PARENT') ? (
            <label className="account-field account-field-wide">
              <span>Location</span>
              <input
                type="text"
                value={toInputValue(form.location)}
                onChange={(event) => updateField('location', event.target.value)}
              />
            </label>
          ) : null}

          {role === 'STUDENT' ? (
            <>
              <label className="account-field">
                <span>Level</span>
                <input
                  type="text"
                  value={toInputValue(form.level)}
                  onChange={(event) => updateField('level', event.target.value)}
                />
              </label>

              <label className="account-field">
                <span>Budget min</span>
                <input
                  type="number"
                  step="0.01"
                  value={toInputValue(form.budget_min)}
                  onChange={(event) => updateField('budget_min', event.target.value)}
                />
              </label>

              <label className="account-field">
                <span>Budget max</span>
                <input
                  type="number"
                  step="0.01"
                  value={toInputValue(form.budget_max)}
                  onChange={(event) => updateField('budget_max', event.target.value)}
                />
              </label>

              <label className="account-check">
                <input
                  type="checkbox"
                  checked={form.prefers_online}
                  onChange={() => toggleField('prefers_online')}
                />
                <span>Prefers online lessons</span>
              </label>

              <label className="account-check">
                <input
                  type="checkbox"
                  checked={form.prefers_in_person}
                  onChange={() => toggleField('prefers_in_person')}
                />
                <span>Prefers in-person lessons</span>
              </label>
            </>
          ) : null}

          {role === 'TUTOR' ? (
            <>
              <label className="account-field account-field-wide">
                <span>Headline</span>
                <input
                  type="text"
                  value={toInputValue(form.headline)}
                  onChange={(event) => updateField('headline', event.target.value)}
                />
              </label>

              <label className="account-field account-field-wide">
                <span>Bio</span>
                <textarea
                  rows="5"
                  value={toInputValue(form.bio)}
                  onChange={(event) => updateField('bio', event.target.value)}
                />
              </label>

              <label className="account-field">
                <span>Hourly rate</span>
                <input
                  type="number"
                  step="0.01"
                  value={toInputValue(form.hourly_rate)}
                  onChange={(event) => updateField('hourly_rate', event.target.value)}
                />
              </label>

              <label className="account-field">
                <span>Currency</span>
                <input
                  type="text"
                  value={toInputValue(form.currency)}
                  onChange={(event) => updateField('currency', event.target.value)}
                />
              </label>

              <label className="account-check">
                <input
                  type="checkbox"
                  checked={form.teaches_online}
                  onChange={() => toggleField('teaches_online')}
                />
                <span>Teaches online</span>
              </label>

              <label className="account-check">
                <input
                  type="checkbox"
                  checked={form.teaches_in_person}
                  onChange={() => toggleField('teaches_in_person')}
                />
                <span>Teaches in person</span>
              </label>
            </>
          ) : null}

          {role === 'PARENT' ? (
            <>
              <label className="account-field account-field-wide">
                <span>Phone number</span>
                <input
                  type="text"
                  value={toInputValue(form.phone_number)}
                  onChange={(event) => updateField('phone_number', event.target.value)}
                />
              </label>

              <label className="account-field account-field-wide">
                <span>Notes</span>
                <textarea
                  rows="5"
                  value={toInputValue(form.notes)}
                  onChange={(event) => updateField('notes', event.target.value)}
                />
              </label>
            </>
          ) : null}
        </div>

        <div className="account-actions">
          <button className="primary-button" type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : 'Save profile'}
          </button>
          <p className="account-status" aria-live="polite">
            {statusMessage || 'Your profile stays hidden from public search until your tutor approval is complete.'}
          </p>
        </div>
      </form>
    </section>
  )
}
