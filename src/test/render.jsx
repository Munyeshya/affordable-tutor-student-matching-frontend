import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export function renderWithProviders(ui, options = {}) {
  const {
    route = '/',
    queryClient = createTestQueryClient(),
    withRouter = true,
    ...renderOptions
  } = options

  const queryWrapped = (
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
  const wrapped = withRouter
    ? <MemoryRouter initialEntries={[route]}>{queryWrapped}</MemoryRouter>
    : queryWrapped

  return {
    queryClient,
    ...render(wrapped, renderOptions),
  }
}
