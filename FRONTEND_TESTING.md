# Frontend Automated Testing

The frontend uses Vitest and React Testing Library with a jsdom browser environment. Tests exercise user-visible behavior and service contracts without requiring the Django server or a live database.

## Commands

- `npm test` runs the full suite once.
- `npm run test:watch` reruns affected tests while developing.
- `npm run test:coverage` runs the suite and writes an HTML report to `coverage/index.html`.
- `npm run lint` validates source and test code.
- `npm run build` verifies the production bundle.
- `npm run e2e` starts isolated local services and runs the complete Playwright browser matrix.
- `npm run e2e:chromium` runs the Chromium project for faster local feedback.
- `npm run e2e:report` opens the generated Playwright HTML report.

## Test Structure

Test files live beside the modules or pages they cover and use the `.test.js` or `.test.jsx` suffix. Shared browser mocks and cleanup are in `src/test/setup.js`. `src/test/render.jsx` provides an isolated React Query client and Memory Router for component tests.

Each test receives a fresh Query Client with retries disabled. API service functions and the WebSocket hook are mocked at module boundaries, which keeps the suite deterministic and prevents requests to local or production services.

## Covered Behavior

- API error messages and paginated response normalization;
- authentication hydration, successful and failed sign-in, and session expiry;
- protected-route loading, sign-in redirects, and role authorization;
- role-specific navigation and dashboard destinations;
- sign-in form submission and protected return paths;
- tutor marketplace results, affordability details, filters, loading skeletons, and failures;
- booking validation, slot selection, request payloads, and success feedback;
- booking chat loading, read receipts, REST fallback, and administrator read-only access;
- student profile loading and role-specific profile updates;
- administrator user suspension with a required reason;
- administrator course preview and publication; and
- administrator review evidence and visibility moderation.

## Adding Tests

- Assert what a user can read, select, submit, or navigate to instead of component implementation details.
- Mock API service modules, not Axios internals, for page tests.
- Keep error, loading, empty, and success states represented for critical pages.
- Use accessible queries such as `getByRole` and `getByLabelText` whenever possible.
- Never depend on execution order or data left by another test.

## End-to-End Structure

Playwright specifications live in `e2e/` and are intentionally excluded from Vitest. The Playwright configuration starts a seeded Django backend on port `8001` and Vite on port `5174`.

The browser matrix covers Chromium, Firefox, WebKit, and a Pixel 5 mobile viewport. It verifies:

- public tutor search, pricing, profiles, and booking entry;
- student, parent, tutor, and administrator journeys;
- protected routes and role authorization;
- keyboard navigation, accessible labels, focus restoration, Axe WCAG checks, and responsive overflow;
- token and API authorization behavior; and
- repeatable authentication, tutor-search, booking, and messaging timing budgets.

See `../NON_FUNCTIONAL_VERIFICATION.md` for the latest actual results, operating conditions, and unresolved limitations.
