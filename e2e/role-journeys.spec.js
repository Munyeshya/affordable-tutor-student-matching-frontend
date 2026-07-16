import { expect, test } from '@playwright/test'

import { demoAccounts, openDashboardLink, signIn } from './helpers.js'

test('public tutor discovery supports search, profile review, and affordability details', async ({ page }) => {
  await page.goto('/tutors')
  await expect(page.getByRole('heading', { name: 'Find trusted tutoring at a price that works.' })).toBeVisible()

  const filtersButton = page.getByRole('button', { name: /^Filters/ })
  if (await filtersButton.isVisible()) {
    await filtersButton.click()
  }

  await page.getByLabel('Search tutors').fill('Nicolas')
  await page.getByRole('button', { name: 'Show tutors' }).click()
  await expect(page).toHaveURL(/q=Nicolas/)
  await expect(page.getByRole('heading', { name: 'Nicolas U.' })).toBeVisible()
  await expect(page.getByText('Hourly rate').first()).toBeVisible()

  await page.getByRole('link', { name: 'View profile' }).first().click()
  await expect(page.getByRole('heading', { name: 'Nicolas U.' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Sign in to request|Request a lesson/ }).first()).toBeVisible()
})

test('student can enter the learning workspace and find an affordable tutor', async ({ page }) => {
  await signIn(page, demoAccounts.student)
  await openDashboardLink(page, 'Find tutors')

  await expect(page).toHaveURL(/\/tutors/)
  await expect(page.getByRole('heading', { name: 'Find trusted tutoring at a price that works.' })).toBeVisible()
  await expect(page.getByText('Hourly rate').first()).toBeVisible()

  await page.getByRole('link', { name: 'Request tutor' }).first().click()
  await expect(page).toHaveURL(/\/book\?tutor=/)
  await expect(page.getByRole('heading', { name: 'Plan the lesson in a few clear steps.' })).toBeVisible()

  await openDashboardLink(page, 'Messages')
  await expect(page).toHaveURL(/\/messages/)
  await expect(page.getByRole('heading', { name: 'Keep lesson conversations together.' })).toBeVisible()
})

test('parent can enter the family workspace and review linked students', async ({ page }) => {
  await signIn(page, demoAccounts.parent)
  await openDashboardLink(page, 'Linked students')

  await expect(page).toHaveURL(/\/parent-students/)
  await expect(page.getByRole('heading', { name: 'Manage linked students' })).toBeVisible()
  await expect(page.getByText('Linked students', { exact: true }).first()).toBeVisible()
})

test('tutor can manage teaching and earnings from the tutor workspace', async ({ page }) => {
  await signIn(page, demoAccounts.tutor)
  await openDashboardLink(page, 'Verification documents')

  await expect(page).toHaveURL(/\/tutor-documents/)
  await expect(page.getByRole('heading', { name: 'Upload your documents and sign the agreement.' })).toBeVisible()

  await openDashboardLink(page, 'Courses and lessons')

  await expect(page).toHaveURL(/\/tutor-teaching/)
  await expect(page.getByRole('heading', { name: 'Manage the subjects, courses, and lessons you teach.' })).toBeVisible()

  await openDashboardLink(page, 'Earnings')
  await expect(page).toHaveURL(/\/tutor-earnings/)
  await expect(page.getByRole('heading', { name: 'Track your revenue and payout requests' })).toBeVisible()
})

test('admin can open user, course, and review moderation workspaces', async ({ page }) => {
  await signIn(page, demoAccounts.admin)
  await openDashboardLink(page, 'Tutor verification')

  await expect(page).toHaveURL(/\/admin\/tutor-reviews/)
  await expect(page.getByRole('heading', { name: 'Review tutor verification requests.' })).toBeVisible()

  await openDashboardLink(page, 'User management')

  await expect(page).toHaveURL(/\/admin\/users/)
  await expect(page.getByRole('heading', { name: 'User management' })).toBeVisible()

  await openDashboardLink(page, 'Course moderation')
  await expect(page.getByRole('heading', { name: 'Course moderation' })).toBeVisible()

  await openDashboardLink(page, 'Review moderation')
  await expect(page.getByRole('heading', { name: 'Review moderation' })).toBeVisible()
})

test('protected routes preserve authentication and role authorization boundaries', async ({ page }) => {
  await page.goto('/admin/users')
  await expect(page).toHaveURL(/\/sign-in/)

  await page.getByLabel('Email address').fill(demoAccounts.student.email)
  await page.getByLabel('Password').fill(demoAccounts.student.password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()

  await expect(page).toHaveURL(/\/unauthorized/)
  await expect(page.getByRole('heading', { name: 'You do not have permission to open this page.' })).toBeVisible()
})
