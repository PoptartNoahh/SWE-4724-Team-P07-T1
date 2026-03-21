import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProject, getProjectReports, uploadProjectFile } from '../services/projectService.js'
import './Project.css'

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

  if (!project) {
    return <p style={{ padding: '60px', textAlign: 'center', color: '#999' }}>Loading...</p>
  }

  return (
    <div className="project-page">

        <div className="project-header">
          <h1 className="project-title">{project.title}</h1>
          <label className="upload-btn">
            {uploading ? 'Uploading...' : 'Upload File Contents'}
            <input type="file" hidden onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        {uploadMsg && <p className="upload-msg">{uploadMsg}</p>}

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
            </div>
          ))}
        </div>
      </div>
  )
}

export default Project
