import sampleUsersData from '../data/sampleUsers.json'

const SESSION_USER_KEY = 'miPlatform.currentUser'

function toSafeSessionUser(user) {
  return {
    user_id: user.user_id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role,
    department: user.department,
    is_active: user.is_active,
  }
}

function normalize(value) {
  return String(value ?? '').trim().toLowerCase()
}

export function loginUser({ identifier, password }) {
  const normalizedIdentifier = normalize(identifier)
  const rawPassword = String(password ?? '')

  if (!normalizedIdentifier || !rawPassword) {
    return { ok: false, error: 'Please enter both email/username and password.' }
  }

  const users = Array.isArray(sampleUsersData?.users) ? sampleUsersData.users : []

  const matchedUser = users.find((user) => {
    const email = normalize(user.email)
    const username = normalize(user.login?.username)
    const storedPassword = String(user.login?.password ?? '')

    return (
      (normalizedIdentifier === email || normalizedIdentifier === username) &&
      rawPassword === storedPassword
    )
  })

  if (!matchedUser) {
    return { ok: false, error: 'Invalid credentials.' }
  }

  if (!matchedUser.is_active) {
    return { ok: false, error: 'This user account is inactive.' }
  }

  const sessionUser = toSafeSessionUser(matchedUser)
  sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(sessionUser))

  return { ok: true, user: sessionUser }
}

export function getCurrentUser() {
  const raw = sessionStorage.getItem(SESSION_USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearCurrentUser() {
  sessionStorage.removeItem(SESSION_USER_KEY)
}

export { SESSION_USER_KEY }