import { API_BASE_URL } from './projectService.js'

const SESSION_USER_KEY = 'mi_current_user'

function parseErrorDetail(detail) {
  if (detail == null) return 'Login failed.'
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const first = detail[0]
    if (first && typeof first.msg === 'string') return first.msg
  }
  return 'Login failed.'
}

function toSessionUser(apiUser) {
  if (!apiUser) return null
  const name = apiUser.name ?? apiUser.fullName ?? ''
  return {
    id: apiUser.id,
    fullName: name || 'User',
    email: apiUser.email ?? '',
    role: apiUser.role != null ? String(apiUser.role) : '',
  }
}

export async function loginWithCredentials(email, password) {
  const body = { email: String(email ?? '').trim(), password: String(password ?? '') }
  try {
    const res = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const text = await res.text()
    let data
    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      data = {}
    }
    if (!res.ok) {
      const msg = parseErrorDetail(data.detail)
      return { ok: false, error: msg }
    }
    const user = toSessionUser(data.user)
    if (!user) {
      return { ok: false, error: 'Invalid response from server.' }
    }
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user))
    return { ok: true, user }
  } catch {
    return {
      ok: false,
      error: `Could not reach API at ${API_BASE_URL}. Start the FastAPI server or set VITE_API_BASE_URL.`,
    }
  }
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
