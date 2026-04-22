import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProject, getProjectReports, uploadProjectFile } from '../services/projectService.js'
import './Project.css'

/** Risk score: 0 = none, 1 = low, 2 = moderate, 3 = high */
const RISK_SCORE_META = {
  0: { label: 'No risk', className: 'risk--none' },
  1: { label: 'Low risk', className: 'risk--low' },
  2: { label: 'Moderate risk', className: 'risk--moderate' },
  3: { label: 'High risk', className: 'risk--high' },
}

function clampRiskScore(raw) {
  const n = Number(raw)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(3, Math.round(n)))
}

function normalizeProjectReport(r) {
  const id = r.id
  const riskScore = clampRiskScore(
    r.riskScore ?? r.report_risk_score ?? r.risk_score,
  )
  const reportDate = r.reportDate ?? r.report_date ?? r.date ?? null
  const description = (r.description ?? r.report_description ?? '').trim()
  return { id, riskScore, reportDate, description }
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
    getProjectReports(projectId).then((list) => setReports((list || []).map(normalizeProjectReport)))
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
      <nav className="proj-breadcrumb">
        <button type="button" className="proj-breadcrumb-link" onClick={() => navigate('/')}>
          Dashboard
        </button>
        <span className="proj-breadcrumb-sep">/</span>
        <span className="proj-breadcrumb-current">{project.title}</span>
      </nav>

      <div className="proj-header">
        <div>
          <h1 className="proj-title">{project.title}</h1>
          {project.latestMeetingAt && (
            <p className="proj-meta">
              Latest meeting: {fmtDate(project.latestMeetingAt)} at {fmtTime(project.latestMeetingAt)}
            </p>
          )}
        </div>
        <div className="proj-header-actions">
          <button
            type="button"
            className="proj-settings-btn"
            onClick={() => navigate(`/projects/${projectId}/settings`)}
          >
            Settings
          </button>
        </div>
        {/* <label className="proj-upload-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M8 10V3m0 0L5 6m3-3l3 3M3 12h10" />
          </svg>
          {uploading ? 'Uploading...' : 'Upload File'}
          <input type="file" hidden onChange={handleUpload} disabled={uploading} />
        </label> */}
      </div>

      {uploadMsg && <div className="proj-upload-msg">{uploadMsg}</div>}

      <hr className="project-divider" />

      <section className="proj-meetings">
        <h2 className="proj-section-title">Reports</h2>
        {reports.length === 0 && <p className="proj-empty">No reports linked to this project yet.</p>}
        <div className="proj-meeting-list">
          {reports.map((report) => {
            const meta = RISK_SCORE_META[report.riskScore] ?? RISK_SCORE_META[0]
            const dateLabel = report.reportDate ? fmtDate(report.reportDate) : null
            return (
            <div key={report.id} className="mtg-card">
              <div className="mtg-card-top">
                <div className="mtg-card-meta">
                  {dateLabel && (
                    <>
                      <span className="mtg-date">{dateLabel}</span>
                      <span className="mtg-dot">&middot;</span>
                    </>
                  )}
                  <span className="mtg-duration">Report #{report.id}</span>
                </div>
                <span className={`mtg-risk-badge ${meta.className}`}>{meta.label}</span>
              </div>
              <div className="mtg-summary-block">
                <h3 className="mtg-summary-title">Summary</h3>
                <p className="mtg-details">
                  {report.description || 'No description available for this report.'}
                </p>
              </div>
              <div className="mtg-card-actions">
                <button type="button" className="mtg-view-btn" onClick={() => navigate(`/reports/${report.id}`)}>
                  View Report
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 3l4 4-4 4" />
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
