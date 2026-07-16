import { expect } from '@playwright/test'

export const demoAccounts = {
  student: {
    email: 'student@isomo.rw',
    password: 'Password123!',
    homePath: '/student',
  },
  parent: {
    email: 'parent@isomo.rw',
    password: 'Password123!',
    homePath: '/parent',
  },
  tutor: {
    email: 'maths@isomo.rw',
    password: 'Password123!',
    homePath: '/tutor',
  },
  admin: {
    email: 'admin@isomo.rw',
    password: 'Password123!',
    homePath: '/admin',
  },
}

export async function signIn(page, account) {
  await page.goto('/sign-in')
  await page.getByLabel('Email address').fill(account.email)
  await page.getByLabel('Password').fill(account.password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()

  await expect(page).toHaveURL(new RegExp(`${account.homePath.replace('/', '\\/')}/?$`))
  await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible()
}

export async function openDashboardLink(page, label) {
  const link = page.getByRole('link', { name: label, exact: true }).first()
  const menuButton = page.getByRole('button', { name: 'Open dashboard navigation' })
  if (await menuButton.isVisible()) {
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    await menuButton.click()
  }
  await expect(link).toBeVisible()
  await link.click()
}

export async function assertNoHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }))

  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 1)
}
