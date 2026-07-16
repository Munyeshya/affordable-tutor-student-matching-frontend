import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { assertNoHorizontalOverflow, demoAccounts, signIn } from './helpers.js'

async function expectNoSeriousAccessibilityViolations(page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const seriousViolations = results.violations.filter(
    (violation) => violation.impact === 'critical' || violation.impact === 'serious',
  )

  expect(seriousViolations).toEqual([])
}

test('public pages support skip navigation and have no serious WCAG violations', async ({ page, browserName }) => {
  await page.goto('/')
  const skipLink = page.getByRole('link', { name: 'Skip to main content' })
  if (browserName === 'webkit') {
    // Safari requires Full Keyboard Access before Tab focuses links by default.
    await skipLink.focus()
  } else {
    await page.keyboard.press('Tab')
  }
  await expect(skipLink).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
  await expectNoSeriousAccessibilityViolations(page)

  await page.goto('/tutors')
  await expect(page.getByRole('heading', { name: 'Find trusted tutoring at a price that works.' })).toBeVisible()
  await expectNoSeriousAccessibilityViolations(page)
})

test('dashboard guide traps focus, closes with Escape, and restores focus', async ({ page }) => {
  await signIn(page, demoAccounts.student)
  const guideButton = page.getByRole('button', { name: 'Role guide' })

  await guideButton.click()
  await expect(page.getByRole('dialog', { name: 'What you can do in Isomo' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close role guide' })).toBeFocused()
  await page.keyboard.press('Escape')

  await expect(page.getByRole('dialog', { name: 'What you can do in Isomo' })).toBeHidden()
  await expect(guideButton).toBeFocused()
  await expectNoSeriousAccessibilityViolations(page)
})

test('public and dashboard layouts remain usable without horizontal overflow', async ({ page, isMobile }) => {
  await page.goto('/')
  await assertNoHorizontalOverflow(page)

  await page.goto('/tutors')
  await assertNoHorizontalOverflow(page)

  await signIn(page, demoAccounts.parent)
  await assertNoHorizontalOverflow(page)

  if (isMobile) {
    const menuButton = page.getByRole('button', { name: 'Open dashboard navigation' })
    await menuButton.click()
    await expect(page.getByRole('dialog', { name: 'Dashboard sidebar' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Linked students', exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(menuButton).toBeFocused()
  }
})

test('mobile public navigation closes with Escape and restores trigger focus', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile navigation behavior is only present at the mobile breakpoint.')

  await page.goto('/')
  const menuButton = page.getByRole('button', { name: 'Open navigation menu' })
  await menuButton.click()
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(menuButton).toBeFocused()
})
