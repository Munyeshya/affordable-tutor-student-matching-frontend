export const ROLE_HOME_PATHS = Object.freeze({
  ADMIN: '/admin',
  TUTOR: '/tutor',
  STUDENT: '/student',
  PARENT: '/parent',
})

export function getRoleHomePath(role) {
  return ROLE_HOME_PATHS[String(role || '').toUpperCase()] || '/'
}
