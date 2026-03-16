import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { getProject, getProjectMeetings, uploadProjectFile } from '../services/projectService.js'
import './Project.css'

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

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit'
    })
  }

  // risk level color mapping
  function getRiskColor(level) {
    if (level === 'red') return '#ef4444'
    if (level === 'yellow') return '#eab308'
    return '#22c55e'
  }

  function getRiskLabel(level) {
    if (level === 'red') return 'High'
    if (level === 'yellow') return 'Moderate'
    return 'None'
  }

  if (!project) {
    return <Layout><p style={{ padding: '60px', textAlign: 'center', color: '#999' }}>Loading...</p></Layout>
  }

  return (
    <Layout>
      <div className="project-page">

        <div className="project-header">
          <h1 className="project-title">{project.title}</h1>
          <label className="upload-btn">
            {uploading ? 'Uploading...' : 'Upload File Contents'}
            <input type="file" hidden onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        {uploadMsg && <p className="upload-msg">{uploadMsg}</p>}

        <div className="latest-meeting-info">
          <span className="latest-meeting-label">Latest Meeting Recorded</span>
          <span>Date: {formatDate(project.latestMeetingAt)}</span>
          <span>Time: {formatTime(project.latestMeetingAt)}</span>
        </div>

        <hr className="project-divider" />

        <div className="meeting-list">
          {meetings.length === 0 && (
            <p style={{ textAlign: 'center', color: '#888', padding: '40px' }}>No meetings recorded yet.</p>
          )}
          {meetings.map((mtg) => (
            <div key={mtg.id} className="meeting-card">
              <div className="meeting-card-header">
                <span className="meeting-id">ID: {mtg.id}</span>
                <span className="meeting-meta">{formatDate(mtg.meetingDate)}</span>
                <span className="meeting-meta">{mtg.duration}</span>
              </div>
              <div className="meeting-card-body">
                <div className="meeting-details">
                  <h4 className="section-label">Details</h4>
                  <p>{mtg.details}</p>
                </div>
                <div className="meeting-risk-col">
                  <h4 className="section-label">Risk Level</h4>
                  <span className="risk-badge" style={{ background: getRiskColor(mtg.riskLevel) }}>
                    {getRiskLabel(mtg.riskLevel)}
                  </span>
                </div>
                <button className="view-report-btn" onClick={() => navigate(`/reports/${mtg.reportId}`)}>
                  View Report
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default Project
