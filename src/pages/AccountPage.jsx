import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getApiErrorMessage } from '../api/errors'
import {
  removeProfileImage,
  updateCurrentUser,
  uploadProfileImage,
} from '../api/services/auth'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { UserAvatar } from '../components/ui/UserAvatar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useSubjectsQuery } from '../hooks/useCommonQueries.js'
import './AccountPage.css'

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024
const ACCEPTED_PROFILE_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const TUTOR_AGE_GROUPS = [
  ['', 'Select an age group'],
  ['AGE_18_24', '18-24'],
  ['AGE_25_34', '25-34'],
  ['AGE_35_44', '35-44'],
  ['AGE_45_PLUS', '45 or older'],
  ['PREFER_NOT_TO_SAY', 'Prefer not to say'],
]
const TUTOR_EMPLOYMENT_STATUSES = [
  ['', 'Select employment status'],
  ['UNEMPLOYED', 'Unemployed'],
  ['UNDEREMPLOYED', 'Underemployed'],
  ['EMPLOYED', 'Employed'],
  ['SELF_EMPLOYED', 'Self-employed'],
  ['STUDENT', 'Student'],
  ['PREFER_NOT_TO_SAY', 'Prefer not to say'],
]

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
    school_name: profile.school_name ?? '',
    subjects_needing_help: Array.isArray(profile.subjects_needing_help)
      ? profile.subjects_needing_help.map(String)
      : [],
    learning_goals: profile.learning_goals ?? '',
    budget_min: profile.budget_min ?? '',
    budget_max: profile.budget_max ?? '',
    prefers_online: Boolean(profile.prefers_online),
    prefers_in_person: Boolean(profile.prefers_in_person),
    headline: profile.headline ?? '',
    bio: profile.bio ?? '',
    education_level: profile.education_level ?? '',
    teaching_experience: profile.teaching_experience ?? '',
    hourly_rate: profile.hourly_rate ?? '',
    currency: profile.currency ?? '',
    teaches_online: Boolean(profile.teaches_online),
    teaches_in_person: Boolean(profile.teaches_in_person),
    age_group: profile.age_group ?? '',
    employment_status: profile.employment_status ?? '',
  }
}

function SettingsSection({ icon, label, title, description, children }) {
  return (
    <section className="account-settings-section">
      <header>
        <span className="account-settings-section-icon"><DashboardIcon name={icon} size={20} /></span>
        <div>
          <p>{label}</p>
          <h2>{title}</h2>
          <span>{description}</span>
        </div>
      </header>
      <div className="account-settings-fields">{children}</div>
    </section>
  )
}

export function AccountPage() {
  const { user, loading, refreshUser } = useAuth()
  const subjectsQuery = useSubjectsQuery({ enabled: user?.role === 'STUDENT' })
  const [form, setForm] = useState(() => getProfileDefaults(user))
  const [statusMessage, setStatusMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => {
    setForm(getProfileDefaults(user))
  }, [user])

  const saveMutation = useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: async () => {
      await refreshUser()
      setStatusMessage('Your profile has been updated.')
      toast.success('Your profile has been updated.')
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, 'We could not save your changes. Please try again.')
      setStatusMessage(message)
      toast.error(message)
    },
  })

  const imageMutation = useMutation({
    mutationFn: uploadProfileImage,
    onSuccess: async () => {
      await refreshUser()
      setSelectedImage(null)
      setStatusMessage('Your profile picture has been updated.')
      toast.success('Your profile picture has been updated.')
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, 'We could not upload your profile picture.')
      setStatusMessage(message)
      toast.error(message)
    },
  })

  const removeImageMutation = useMutation({
    mutationFn: removeProfileImage,
    onSuccess: async () => {
      await refreshUser()
      setSelectedImage(null)
      setStatusMessage('Your profile picture has been removed.')
      toast.success('Your profile picture has been removed.')
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, 'We could not remove your profile picture.')
      setStatusMessage(message)
      toast.error(message)
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
      payload.phone_number = form.phone_number.trim()
      payload.level = form.level.trim()
      payload.school_name = form.school_name.trim()
      payload.location = form.location.trim()
      payload.subjects_needing_help = form.subjects_needing_help.map(Number)
      payload.learning_goals = form.learning_goals.trim()
      payload.budget_min = toNullableNumber(form.budget_min)
      payload.budget_max = toNullableNumber(form.budget_max)
      payload.prefers_online = form.prefers_online
      payload.prefers_in_person = form.prefers_in_person
    }

    if (role === 'TUTOR') {
      payload.full_name = form.full_name.trim()
      payload.phone_number = form.phone_number.trim()
      payload.headline = form.headline.trim()
      payload.bio = form.bio.trim()
      payload.education_level = form.education_level.trim()
      payload.teaching_experience = form.teaching_experience.trim()
      payload.hourly_rate = toNullableNumber(form.hourly_rate)
      payload.currency = form.currency.trim()
      payload.location = form.location.trim()
      payload.teaches_online = form.teaches_online
      payload.teaches_in_person = form.teaches_in_person
      payload.age_group = form.age_group
      payload.employment_status = form.employment_status
    }

    if (role === 'PARENT') {
      payload.full_name = form.full_name.trim()
      payload.location = form.location.trim()
      payload.phone_number = form.phone_number.trim()
      payload.notes = form.notes.trim()
    }

    saveMutation.mutate(payload)
  }

  function handleImageSelection(event) {
    const file = event.target.files?.[0] || null
    event.target.value = ''
    setStatusMessage('')

    if (!file) return
    if (!ACCEPTED_PROFILE_IMAGE_TYPES.has(file.type)) {
      const message = 'Choose a PNG, JPEG, or WebP image.'
      setSelectedImage(null)
      setStatusMessage(message)
      toast.error(message)
      return
    }
    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      const message = 'Profile pictures must be 5 MB or smaller.'
      setSelectedImage(null)
      setStatusMessage(message)
      toast.error(message)
      return
    }

    setSelectedImage(file)
  }

  function handleImageUpload() {
    if (selectedImage) imageMutation.mutate(selectedImage)
  }

  const profileName = form.full_name
    || [form.first_name, form.last_name].filter(Boolean).join(' ')
    || user.username
    || user.email
  const imageBusy = imageMutation.isPending || removeImageMutation.isPending
  const roleLabel = role.toLowerCase().replace(/^./, (letter) => letter.toUpperCase())
  const defaultStatus = role === 'TUTOR'
    ? 'Your public profile becomes visible after tutor approval requirements are complete.'
    : role === 'STUDENT'
      ? 'These details help Isomo recommend tutors that fit your learning needs and budget.'
      : role === 'PARENT'
        ? 'These details help you manage learning support for linked students.'
        : 'Keep your account identity accurate and up to date.'

  return (
    <section className="account-settings-page">
      <header className="account-settings-header">
        <div>
          <p className="admin-overview-eyebrow">Account preferences</p>
          <h1>Profile settings</h1>
          <p>Keep your identity, contact details, and {roleLabel.toLowerCase()} profile accurate across Isomo.</p>
        </div>
        <div className="account-settings-header-meta">
          <span>{roleLabel} account</span>
          {role === 'TUTOR' ? <strong>{profile.verification_status || 'Pending verification'}</strong> : <strong>{profileType === 'none' ? 'Basic profile' : `${roleLabel} profile`}</strong>}
        </div>
      </header>

      <div className="account-settings-layout">
        <aside className="account-profile-panel" aria-labelledby="profile-photo-heading">
          <div className="account-profile-identity">
            <UserAvatar className="account-photo-preview" src={user.profile_image_url} name={profileName} loading="eager" />
            <div><h2 id="profile-photo-heading">{profileName}</h2><p>{user.email}</p><span>{roleLabel}</span></div>
          </div>

          <div className="account-profile-facts">
            <div><span>Account role</span><strong>{roleLabel}</strong></div>
            <div><span>Profile type</span><strong>{profileType === 'none' ? 'Basic' : roleLabel}</strong></div>
            {role === 'TUTOR' ? <div><span>Verification</span><strong>{profile.verification_status || 'Pending'}</strong></div> : null}
          </div>

          <div className="account-photo-copy">
            <h3>Profile picture</h3>
            <p>Use a clear PNG, JPEG, or WebP image up to 5 MB.</p>
            {selectedImage ? <small>Ready to upload: {selectedImage.name}</small> : null}
          </div>
          <div className="account-photo-actions">
            <label className="secondary-button account-photo-select">
              {user.profile_image_url ? 'Choose replacement' : 'Choose picture'}
              <input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Choose profile picture" disabled={imageBusy} onChange={handleImageSelection} />
            </label>
            {selectedImage ? <button className="primary-button" type="button" disabled={imageBusy} onClick={handleImageUpload}>{imageMutation.isPending ? 'Uploading...' : 'Upload picture'}</button> : null}
            {user.profile_image_url ? <button className="account-photo-remove" type="button" disabled={imageBusy} onClick={() => removeImageMutation.mutate()}>{removeImageMutation.isPending ? 'Removing...' : 'Remove picture'}</button> : null}
          </div>
        </aside>

        <form className="account-settings-form" onSubmit={handleSubmit}>
          <SettingsSection icon="account" label="Identity" title="Personal information" description="Use the name people should see when interacting with your account.">
            <label className="account-field"><span>First name</span><input type="text" value={toInputValue(form.first_name)} onChange={(event) => updateField('first_name', event.target.value)} /></label>
            <label className="account-field"><span>Last name</span><input type="text" value={toInputValue(form.last_name)} onChange={(event) => updateField('last_name', event.target.value)} /></label>
            {(role === 'STUDENT' || role === 'TUTOR' || role === 'PARENT') ? <label className="account-field account-field-wide"><span>Full name</span><input type="text" value={toInputValue(form.full_name)} onChange={(event) => updateField('full_name', event.target.value)} /></label> : null}
            <div className="account-readonly-field account-field-wide"><span>Email address</span><strong>{user.email}</strong><small>Contact support if this sign-in address needs to change.</small></div>
          </SettingsSection>

          {(role === 'STUDENT' || role === 'TUTOR' || role === 'PARENT') ? (
            <SettingsSection icon="site" label="Contact" title="Contact and location" description="Keep these details current for account and lesson coordination.">
              <label className="account-field"><span>Phone number</span><input type="tel" value={toInputValue(form.phone_number)} onChange={(event) => updateField('phone_number', event.target.value)} /></label>
              <label className="account-field"><span>Location</span><input type="text" value={toInputValue(form.location)} onChange={(event) => updateField('location', event.target.value)} /></label>
            </SettingsSection>
          ) : null}

          {role === 'STUDENT' ? (
            <>
              <SettingsSection icon="assessments" label="Learning profile" title="Learning needs" description="Tell us where you study and what support would make the biggest difference.">
                <label className="account-field"><span>Level</span><input type="text" value={toInputValue(form.level)} onChange={(event) => updateField('level', event.target.value)} /></label>
                <label className="account-field"><span>School name</span><input type="text" value={toInputValue(form.school_name)} onChange={(event) => updateField('school_name', event.target.value)} /></label>
                <label className="account-field account-field-wide">
                  <span>Subjects needing help</span>
                  <select multiple value={form.subjects_needing_help} onChange={(event) => updateField('subjects_needing_help', Array.from(event.target.selectedOptions, (option) => option.value))} disabled={subjectsQuery.isLoading || subjectsQuery.isError}>
                    {(subjectsQuery.data || []).map((subject) => <option key={subject.id} value={String(subject.id)}>{subject.name}</option>)}
                  </select>
                  <small>{subjectsQuery.isError ? 'Subjects could not be loaded. Try refreshing the page.' : 'Select every subject where you would like tutor support.'}</small>
                </label>
                <label className="account-field account-field-wide"><span>Learning goals</span><textarea rows="4" value={toInputValue(form.learning_goals)} onChange={(event) => updateField('learning_goals', event.target.value)} /></label>
              </SettingsSection>

              <SettingsSection icon="earnings" label="Matching preferences" title="Budget and lesson format" description="Set practical preferences so tutor recommendations remain affordable and relevant.">
                <label className="account-field"><span>Budget min</span><input type="number" step="0.01" value={toInputValue(form.budget_min)} onChange={(event) => updateField('budget_min', event.target.value)} /></label>
                <label className="account-field"><span>Budget max</span><input type="number" step="0.01" value={toInputValue(form.budget_max)} onChange={(event) => updateField('budget_max', event.target.value)} /></label>
                <div className="account-preference-grid account-field-wide">
                  <label className="account-check"><input type="checkbox" checked={form.prefers_online} onChange={() => toggleField('prefers_online')} /><span><strong>Online lessons</strong><small>Include tutors who teach remotely.</small></span></label>
                  <label className="account-check"><input type="checkbox" checked={form.prefers_in_person} onChange={() => toggleField('prefers_in_person')} /><span><strong>In-person lessons</strong><small>Include tutors available near you.</small></span></label>
                </div>
              </SettingsSection>
            </>
          ) : null}

          {role === 'TUTOR' ? (
            <>
              <SettingsSection icon="courses" label="Marketplace profile" title="Professional introduction" description="Present your experience clearly so families can assess whether you are the right fit.">
                <label className="account-field account-field-wide"><span>Headline</span><input type="text" value={toInputValue(form.headline)} onChange={(event) => updateField('headline', event.target.value)} /></label>
                <label className="account-field account-field-wide"><span>Bio</span><textarea rows="5" value={toInputValue(form.bio)} onChange={(event) => updateField('bio', event.target.value)} /></label>
                <label className="account-field account-field-wide"><span>Education level</span><input type="text" value={toInputValue(form.education_level)} onChange={(event) => updateField('education_level', event.target.value)} /></label>
                <label className="account-field account-field-wide"><span>Teaching experience</span><textarea rows="4" value={toInputValue(form.teaching_experience)} onChange={(event) => updateField('teaching_experience', event.target.value)} /></label>
              </SettingsSection>

              <SettingsSection icon="earnings" label="Lesson offer" title="Pricing and teaching format" description="Keep your rate and supported lesson formats accurate for affordability matching.">
                <label className="account-field"><span>Hourly rate</span><input type="number" step="0.01" value={toInputValue(form.hourly_rate)} onChange={(event) => updateField('hourly_rate', event.target.value)} /></label>
                <label className="account-field"><span>Currency</span><input type="text" value={toInputValue(form.currency)} onChange={(event) => updateField('currency', event.target.value)} /></label>
                <div className="account-preference-grid account-field-wide">
                  <label className="account-check"><input type="checkbox" checked={form.teaches_online} onChange={() => toggleField('teaches_online')} /><span><strong>Teach online</strong><small>Accept remote lesson requests.</small></span></label>
                  <label className="account-check"><input type="checkbox" checked={form.teaches_in_person} onChange={() => toggleField('teaches_in_person')} /><span><strong>Teach in person</strong><small>Accept location-based lesson requests.</small></span></label>
                </div>
              </SettingsSection>

              <SettingsSection icon="reports" label="Platform impact" title="Optional employment context" description="Help Isomo measure whether tutor earnings are creating meaningful work opportunities.">
                <label className="account-field">
                  <span>Age group</span>
                  <select value={form.age_group} onChange={(event) => updateField('age_group', event.target.value)}>
                    {TUTOR_AGE_GROUPS.map(([value, label]) => <option key={value || 'empty-age'} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="account-field">
                  <span>Employment status</span>
                  <select value={form.employment_status} onChange={(event) => updateField('employment_status', event.target.value)}>
                    {TUTOR_EMPLOYMENT_STATUSES.map(([value, label]) => <option key={value || 'empty-employment'} value={value}>{label}</option>)}
                  </select>
                </label>
                <div className="account-readonly-field account-field-wide">
                  <span>How this information is used</span>
                  <strong>Aggregate impact reporting only</strong>
                  <small>These optional answers are not shown on your public tutor profile. Choose “Prefer not to say” if you do not want to provide this context.</small>
                </div>
              </SettingsSection>
            </>
          ) : null}

          {role === 'PARENT' ? (
            <SettingsSection icon="students" label="Family profile" title="Learning support notes" description="Add context that helps you coordinate tutoring for linked students.">
              <label className="account-field account-field-wide"><span>Notes</span><textarea rows="5" value={toInputValue(form.notes)} onChange={(event) => updateField('notes', event.target.value)} /></label>
            </SettingsSection>
          ) : null}

          <footer className="account-settings-actions">
            <div><strong>Save your changes</strong><p className="account-status" aria-live="polite">{statusMessage || defaultStatus}</p></div>
            <button className="primary-button" type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : 'Save profile'}</button>
          </footer>
        </form>
      </div>
    </section>
  )
}
