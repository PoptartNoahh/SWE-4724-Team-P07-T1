import { projects, meetings, reports } from './mockData.js'

// These functions are wired to the FastAPI backend when it's running.
// If the backend is unreachable, they fall back to the existing mock data so the UI keeps working.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

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
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Request failed (${res.status}): ${text}`)
  }
  return res.json()
}

export async function getProject(projectId) {
  try {
    return await fetchJson(`/api/projects/${projectId}`)
  } catch (e) {
    return projects[projectId] || null
  }
}

export async function getProjectMeetings(projectId) {
  try {
    return await fetchJson(`/api/projects/${projectId}/meetings`)
  } catch (e) {
    return meetings[projectId] || []
  }
}

export async function getProjectReports(projectId) {
  try {
    return await fetchJson(`/api/projects/${projectId}/reports`)
  } catch (e) {
    const fallbackMeetings = meetings[projectId] || []
    return fallbackMeetings.map((m) => {
      const full = reports[m.reportId]
      const d = full?.details
      const description =
        full?.description ??
        (typeof d === 'string' ? (d.length > 220 ? `${d.slice(0, 220)}…` : d) : '')
      return {
        id: m.reportId,
        riskScore: full?.riskScore ?? 0,
        reportDate: full?.reportDate ?? m.meetingDate,
        description,
      }
    })
  }
}

export async function getAdvisors() {
  return await fetchJson('/api/advisors')
}

export async function getProjectSettings(projectId) {
  return await fetchJson(`/api/projects/${projectId}/settings`)
}

export async function updateProject(projectId, payload) {
  const uid = getSessionUserId()
  return await fetchJson(`/api/projects/${projectId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(uid ? { 'X-User-Id': uid } : {}) },
    body: JSON.stringify(payload),
  })
}

export async function createProject(payload) {
  const uid = getSessionUserId()
  return await fetchJson('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(uid ? { 'X-User-Id': uid } : {}) },
    body: JSON.stringify(payload)
  })
}

export async function uploadProjectFile(projectId, file) {
  // TODO: wire this to `POST /api/projects/:id/files` once the backend upload endpoint is implemented.
  console.log(`[mock] uploaded ${file.name} to project ${projectId}`)
  return { success: true }
}

export async function getReport(reportId) {
  try {
    return await fetchJson(`/api/reports/${reportId}`)
  } catch (e) {
    return reports[reportId] || null
  }
}

export async function updateFlagStatus(flagId, newStatus) {
  try {
    return await fetchJson(`/api/flags/${flagId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
  } catch (e) {
    return { id: flagId, status: newStatus }
  }
}

export async function emailReport(reportId) {
  try {
    return await fetchJson(`/api/reports/${reportId}/email`, { method: 'POST' })
  } catch (e) {
    console.log(`[mock] emailed report ${reportId}`)
    return { success: true }
  }
}

export async function registerFaculty({ username, email, password, role }) {
  const uid = getSessionUserId()
  return await fetchJson('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(uid ? { 'X-User-Id': uid } : {}) },
    body: JSON.stringify({ username, email, password, role }),
  })
}

// Quick connectivity check (returns plain text: "hey it works!")
export async function pingBackend() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/ping`)
    return await res.text()
  } catch (e) {
    return null
  }
}
