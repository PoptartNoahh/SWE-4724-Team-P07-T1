import { API_BASE_URL } from './projectService.js'

function getSessionUserId() {
  try {
    const raw = sessionStorage.getItem('mi_current_user')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const id = parsed?.id
    if (id == null) return null
    const n = Number(id)
    return Number.isFinite(n) ? String(Math.trunc(n)) : null
  } catch {
    return null
  }
}

async function fetchJson(path, options) {
  const res = await fetch(`${API_BASE_URL}${path}`, options)
  const text = await res.text().catch(() => '')
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}): ${text}`)
  }
  return text ? JSON.parse(text) : null
}

export async function getAuditLogEntries({ limit, offset } = {}) {
  const uid = getSessionUserId()
  const params = new URLSearchParams()
  if (limit != null) params.set('limit', String(limit))
  if (offset != null) params.set('offset', String(offset))
  const qs = params.toString() ? `?${params.toString()}` : ''

  const data = await fetchJson(`/api/audit-log${qs}`, {
    method: 'GET',
    headers: { ...(uid ? { 'X-User-Id': uid } : {}) },
  })

  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.items)) return data.items
  return []
}

