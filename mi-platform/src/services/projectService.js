import { projects, meetings, reports } from './mockData.js'

// TODO: replace these with actual fetch calls to our FastAPI endpoints

export async function getProject(projectId) {
  return projects[projectId] || null
}

export async function getProjectMeetings(projectId) {
  return meetings[projectId] || []
}

export async function uploadProjectFile(projectId, file) {
  // POST /api/projects/:id/files
  console.log(`[mock] uploaded ${file.name} to project ${projectId}`)
  return { success: true }
}

export async function getReport(reportId) {
  return reports[reportId] || null
}

export async function updateFlagStatus(flagId, newStatus) {
  // PATCH /api/flags/:id
  return { id: flagId, status: newStatus }
}

export async function emailReport(reportId) {
  // POST /api/reports/:id/email
  console.log(`[mock] emailed report ${reportId}`)
  return { success: true }
}
