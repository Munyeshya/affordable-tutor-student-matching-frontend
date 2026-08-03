import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'

import { getApiErrorMessage } from '../api/errors.js'
import { queryKeys } from '../api/queryKeys.js'
import {
  createAvailability,
  deleteAvailability,
  listMyAvailability,
} from '../api/services/availability.js'
import { DashboardIcon } from '../components/layout/DashboardIcon.jsx'
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog.jsx'
import { EmptyState, ErrorState, SkeletonLoader } from '../components/ui/DashboardPrimitives.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './TutorAvailabilityPage.css'

function pad(value) {
  return String(value).padStart(2, '0')
}

function localDateValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function initialForm() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return {
    date: localDateValue(tomorrow),
    startTime: '09:00',
    endTime: '10:00',
    mode: 'ONLINE',
  }
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-RW', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function formatTime(value) {
  return new Intl.DateTimeFormat('en-RW', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function TutorAvailabilityPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(initialForm)
  const [slotToDelete, setSlotToDelete] = useState(null)
  const availabilityQuery = useQuery({
    queryKey: queryKeys.availability.mine,
    queryFn: () => listMyAvailability().then((response) => response.data),
  })

  const createMutation = useMutation({
    mutationFn: createAvailability,
    onSuccess: async () => {
      toast.success('Availability published successfully.')
      setForm(initialForm())
      await queryClient.invalidateQueries({ queryKey: queryKeys.availability.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not publish this availability.')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAvailability,
    onSuccess: async () => {
      toast.success('Open availability removed.')
      setSlotToDelete(null)
      await queryClient.invalidateQueries({ queryKey: queryKeys.availability.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not remove this availability.')),
  })

  const slots = [...(availabilityQuery.data || [])].sort(
    (left, right) => new Date(left.start_datetime) - new Date(right.start_datetime),
  )
  const upcomingSlots = slots.filter((slot) => new Date(slot.end_datetime) >= new Date())
  const openCount = upcomingSlots.filter((slot) => !slot.is_booked).length
  const hourlyRate = Number(user?.profile?.data?.hourly_rate || 0)
  const canPublishAvailability = hourlyRate > 0

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function submitAvailability(event) {
    event.preventDefault()
    if (!canPublishAvailability) {
      toast.error('Set a positive hourly rate before publishing availability.')
      return
    }
    const start = new Date(`${form.date}T${form.startTime}:00`)
    const end = new Date(`${form.date}T${form.endTime}:00`)
    if (end <= start) {
      toast.error('End time must be later than start time.')
      return
    }
    if (start <= new Date()) {
      toast.error('Availability must start in the future.')
      return
    }
    createMutation.mutate({
      start_datetime: start.toISOString(),
      end_datetime: end.toISOString(),
      mode: form.mode,
    })
  }

  return (
    <section className="tutor-availability-page">
      <header className="tutor-availability-hero">
        <div>
          <p className="eyebrow">Tutor availability</p>
          <h1>Publish the times learners can book.</h1>
          <p>Set your normal teaching hours here. Custom proposals stay separate until both sides agree.</p>
        </div>
        <div className="tutor-availability-summary">
          <DashboardIcon name="schedule" size={22} />
          <span><strong>{openCount}</strong> open upcoming {openCount === 1 ? 'slot' : 'slots'}</span>
        </div>
      </header>

      <div className="tutor-availability-layout">
        {canPublishAvailability ? <form className="tutor-availability-form" onSubmit={submitAvailability}>
          <header>
            <p className="eyebrow">Add a time</p>
            <h2>New available slot</h2>
            <p>Learners will see open times on your public tutor profile.</p>
          </header>
          <label>
            <span>Date</span>
            <input
              type="date"
              min={localDateValue(new Date())}
              value={form.date}
              onChange={(event) => updateField('date', event.target.value)}
              required
            />
          </label>
          <div className="tutor-availability-time-fields">
            <label>
              <span>Start time</span>
              <input type="time" value={form.startTime} onChange={(event) => updateField('startTime', event.target.value)} required />
            </label>
            <label>
              <span>End time</span>
              <input type="time" value={form.endTime} onChange={(event) => updateField('endTime', event.target.value)} required />
            </label>
          </div>
          <label>
            <span>Teaching mode</span>
            <select value={form.mode} onChange={(event) => updateField('mode', event.target.value)}>
              <option value="ONLINE">Online</option>
              <option value="IN_PERSON">In person</option>
            </select>
          </label>
          <button className="primary-button" type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Publishing...' : 'Publish availability'}
          </button>
          <aside>
            Accepted bookings and schedule proposals mark every overlapping open slot as booked. Already booked time can never be overridden.
          </aside>
        </form> : <section className="tutor-availability-prerequisite">
          <DashboardIcon name="earnings" size={26} />
          <p className="eyebrow">Pricing required</p>
          <h2>Set your hourly rate first</h2>
          <p>Learners need a clear lesson price before they can book any time you publish.</p>
          <Link className="primary-button" to="/account?section=pricing">Set hourly rate</Link>
        </section>}

        <section className="tutor-availability-list" aria-labelledby="upcoming-availability-title">
          <header>
            <div>
              <p className="eyebrow">Your schedule</p>
              <h2 id="upcoming-availability-title">Upcoming availability</h2>
            </div>
            <span>{upcomingSlots.length} total</span>
          </header>
          {availabilityQuery.isLoading ? (
            <SkeletonLoader rows={4} />
          ) : availabilityQuery.isError ? (
            <ErrorState title="Availability could not be loaded." message={getApiErrorMessage(availabilityQuery.error)} onRetry={availabilityQuery.refetch} />
          ) : upcomingSlots.length ? (
            <div className="tutor-availability-slots">
              {upcomingSlots.map((slot) => (
                <article key={slot.id}>
                  <div className="tutor-availability-slot-date">
                    <strong>{formatDate(slot.start_datetime)}</strong>
                    <span>{formatTime(slot.start_datetime)} - {formatTime(slot.end_datetime)}</span>
                  </div>
                  <div className="tutor-availability-slot-state">
                    <span>{slot.mode === 'IN_PERSON' ? 'In person' : 'Online'}</span>
                    <strong className={slot.is_booked ? 'is-booked' : 'is-open'}>{slot.is_booked ? 'Booked' : 'Open'}</strong>
                  </div>
                  {!slot.is_booked ? (
                    <button type="button" onClick={() => setSlotToDelete(slot)}>Remove</button>
                  ) : (
                    <small>Reserved by a confirmed lesson</small>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              className="tutor-availability-empty"
              icon={<DashboardIcon name="schedule" size={24} />}
              title="No upcoming availability"
              description="Publish your first open time so learners can request a lesson from your profile."
            />
          )}
        </section>
      </div>

      <ConfirmationDialog
        open={Boolean(slotToDelete)}
        onClose={() => !deleteMutation.isPending && setSlotToDelete(null)}
        labelledBy="remove-availability-title"
        backdropClassName="booking-dialog-backdrop"
        dialogClassName="booking-action-dialog"
      >
        <p className="eyebrow">Open availability</p>
        <h2 id="remove-availability-title">Remove this available time?</h2>
        <p>{slotToDelete ? `${formatDate(slotToDelete.start_datetime)}, ${formatTime(slotToDelete.start_datetime)} - ${formatTime(slotToDelete.end_datetime)}` : ''}</p>
        <div className="booking-review-actions">
          <button className="secondary-button" type="button" onClick={() => setSlotToDelete(null)} disabled={deleteMutation.isPending}>Keep time</button>
          <button className="booking-danger-button" type="button" onClick={() => deleteMutation.mutate(slotToDelete.id)} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Removing...' : 'Remove time'}
          </button>
        </div>
      </ConfirmationDialog>
    </section>
  )
}
