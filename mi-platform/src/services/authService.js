import users from '../data/sampleUsers.json'

const SESSION_USER_KEY = 'currentUser'

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

function stripPassword(user) {
  const { password, ...safeUser } = user
  return safeUser
}

export function loginWithCredentials(email, password) {
  const normalizedEmail = normalizeEmail(email)
  const rawPassword = String(password ?? '')

  const matchedUser = users.find(
    (user) => user.active && normalizeEmail(user.email) === normalizedEmail && user.password === rawPassword
  )

  if (!matchedUser) {
    return { ok: false, error: 'Invalid email or password.' }
  }

  const safeUser = stripPassword(matchedUser)
  sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(safeUser))
  return { ok: true, user: safeUser }
}

export function getCurrentUser() {
  const raw = sessionStorage.getItem(SESSION_USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    sessionStorage.removeItem(SESSION_USER_KEY)
    return null
  }
}

export function isAuthenticated() {
  return Boolean(getCurrentUser())
}

export function logout() {
  sessionStorage.removeItem(SESSION_USER_KEY)
}
