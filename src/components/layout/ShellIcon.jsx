import React from 'react'

const paths = {
  search: 'M21 21l-4.2-4.2m1.2-5.3a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z',
  shield: 'M12 3l7 3v5c0 4.9-3.1 9.4-7 10.9C8.1 20.4 5 15.9 5 11V6l7-3z',
  star: 'M12 17.3l-5.5 3 1.1-6.2L3 9.7l6.2-.9L12 3.2l2.8 5.6 6.2.9-4.6 4.4 1.1 6.2-5.5-3z',
  users: 'M7.5 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zm9 0a3 3 0 100-6 3 3 0 000 6zM3.5 19c0-2.5 2.3-4.5 5-4.5h1m2 4.5c0-2.7 2.5-4.5 5.5-4.5h1',
  book: 'M6 4.5h11a2 2 0 012 2V19a2 2 0 01-2 2H6a2 2 0 01-2-2V6.5a2 2 0 012-2zm0 0v13m2-9h9m-9 3h9',
  arrow: 'M5 12h12m0 0-5-5m5 5-5 5',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6L6 18',
}

export function ShellIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  )
}
