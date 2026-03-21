import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProject, getProjectReports, uploadProjectFile } from '../services/projectService.js'
import './Project.css'

const RISK_META = {
  red:    { label: 'High',     className: 'risk--high' },
  yellow: { label: 'Moderate', className: 'risk--moderate' },
  green:  { label: 'Low',      className: 'risk--low' },
}

function Project() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [reports, setReports] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')

  useEffect(() => {
    getProject(projectId).then(setProject)
    getProjectReports(projectId).then(setReports)
  }, [projectId])

  function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setUploadMsg('')
    uploadProjectFile(projectId, file)
      .then(() => setUploadMsg(`Uploaded "${file.name}" successfully.`))
      .catch(() => setUploadMsg('Upload failed.'))
      .finally(() => setUploading(false))
  }

  function fmtDate(d) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function fmtTime(d) {
    return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  if (!project) {
    return <div className="proj-loading">Loading project&hellip;</div>
  }

  return (
    <div className="proj">
      {/* Breadcrumb */}
      <nav className="proj-breadcrumb">
        <button className="proj-breadcrumb-link" onClick={() => navigate('/')}>Dashboard</button>
        <span className="proj-breadcrumb-sep">/</span>
        <span className="proj-breadcrumb-current">{project.title}</span>
      </nav>

      {/* Header */}
      <div className="proj-header">
        <div>
          <h1 className="proj-title">{project.title}</h1>
          {project.latestMeetingAt && (
            <p className="proj-meta">
              Latest meeting: {fmtDate(project.latestMeetingAt)} at {fmtTime(project.latestMeetingAt)}
            </p>
          )}
        </div>
        <label className="proj-upload-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M8 10V3m0 0L5 6m3-3l3 3M3 12h10"/>
          </svg>
          {uploading ? 'Uploading...' : 'Upload File'}
          <input type="file" hidden onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {uploadMsg && <div className="proj-upload-msg">{uploadMsg}</div>}

        <hr className="project-divider" />

        <div className="meeting-list">
          {reports.length === 0 && (
            <p style={{ textAlign: 'center', color: '#888', padding: '40px' }}>No reports linked to this project yet.</p>
          )}
          {reports.map((report) => (
            <div key={report.id} className="meeting-card">
              <div className="meeting-card-header">
                <span className="meeting-id">Report ID: {report.id}</span>
              </div>
              <div className="meeting-card-body">
                <div className="meeting-details">
                  <h4 className="section-label">Linked Report</h4>
                  <p>This report is linked to the current project.</p>
                </div>
                <button className="view-report-btn" onClick={() => navigate(`/reports/${report.id}`)}>
                  View Report
                </button>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default Project
