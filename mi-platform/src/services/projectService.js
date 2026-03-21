import { projects, meetings, reports } from './mockData.js'

// These functions are wired to the FastAPI backend when it's running.
// If the backend is unreachable, they fall back to the existing mock data so the UI keeps working.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

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

// Quick connectivity check (returns plain text: "hey it works!")
export async function pingBackend() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/ping`)
    return await res.text()
  } catch (e) {
    return null
  }
}
