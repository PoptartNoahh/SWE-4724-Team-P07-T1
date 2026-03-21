import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProject, getProjectMeetings, uploadProjectFile } from '../services/projectService.js'
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
  const [meetings, setMeetings] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')

  useEffect(() => {
    getProject(projectId).then(setProject)
    getProjectMeetings(projectId).then(setMeetings)
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

      {/* Meeting list */}
      <section className="proj-meetings">
        <h2 className="proj-section-title">Meetings</h2>
        {meetings.length === 0 && (
          <p className="proj-empty">No meetings recorded yet.</p>
        )}
        <div className="proj-meeting-list">
          {meetings.map(mtg => {
            const risk = RISK_META[mtg.riskLevel] || RISK_META.green
            return (
              <div key={mtg.id} className="mtg-card">
                <div className="mtg-card-top">
                  <div className="mtg-card-meta">
                    <span className="mtg-date">{fmtDate(mtg.meetingDate)}</span>
                    <span className="mtg-dot">&middot;</span>
                    <span className="mtg-duration">{mtg.duration}</span>
                  </div>
                  <span className={`mtg-risk-badge ${risk.className}`}>{risk.label}</span>
                </div>
                <p className="mtg-details">{mtg.details}</p>
                <div className="mtg-card-actions">
                  <button className="mtg-view-btn" onClick={() => navigate(`/reports/${mtg.reportId}`)}>
                    View Report
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M5 3l4 4-4 4"/>
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default Project
