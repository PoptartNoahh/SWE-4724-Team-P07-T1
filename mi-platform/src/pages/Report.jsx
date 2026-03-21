import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getReport, updateFlagStatus, emailReport } from '../services/projectService.js'
import './Report.css'

function Report() {
  const { reportId } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [emailing, setEmailing] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    getReport(reportId).then(setReport)
  }, [reportId])

  function handleConfirm(flagId) {
    updateFlagStatus(flagId, 'confirmed').then(() => {
      setReport((prev) => ({
        ...prev,
        risks: (prev.risks || []).map((r) =>
          r.id === flagId ? { ...r, status: 'confirmed' } : r
        ),
      }))
    })
  }

  function handleDismiss(flagId) {
    updateFlagStatus(flagId, 'dismissed').then(() => {
      setReport((prev) => ({
        ...prev,
        risks: (prev.risks || []).map((r) =>
          r.id === flagId ? { ...r, status: 'dismissed' } : r
        ),
      }))
    })
  }

  function handleEmail() {
    setEmailing(true)
    emailReport(reportId).then(() => {
      setEmailSent(true)
      setEmailing(false)
    })
  }

  if (!report) {
    return <div className="rpt-loading">Loading report&hellip;</div>
  }

  const risks = report.risks || []
  const references = report.references || []

  return (
    <div className="report-page">
      <div className="report-header">
        <span className="report-id">ID: {report.id}</span>
        <button
          type="button"
          className="email-btn"
          onClick={handleEmail}
          disabled={emailing || emailSent}
        >
          {emailSent ? '✓ Sent' : emailing ? 'Sending...' : '✉ Email Report'}
        </button>
      </div>

      <hr className="report-divider" />

      <div className="report-section">
        <h2 className="report-section-title">Identified Risks</h2>
        {risks.length === 0 ? (
          <p className="no-risks">None</p>
        ) : (
          <div className="risk-list">
            {risks.map((risk) => (
              <div key={risk.id} className={`risk-item ${risk.status}`}>
                <div className="risk-top">
                  <span className="risk-type">{risk.flagType}</span>
                  <span className={`status-tag ${risk.status}`}>
                    {risk.status === 'pending'
                      ? 'Pending Review'
                      : risk.status === 'confirmed'
                        ? 'Confirmed'
                        : 'Dismissed'}
                  </span>
                </div>
                <p className="risk-explanation">{risk.explanation}</p>
                {risk.status === 'pending' && (
                  <div className="risk-actions">
                    <button type="button" className="confirm-btn" onClick={() => handleConfirm(risk.id)}>
                      Confirm
                    </button>
                    <button type="button" className="dismiss-btn" onClick={() => handleDismiss(risk.id)}>
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="report-section">
        <h2 className="report-section-title">Details</h2>
        <div className="details-box">
          <p>{report.details}</p>
        </div>
      </div>

      <div className="report-section">
        <h2 className="report-section-title">Reference Points</h2>
        <div className="references-box">
          {references.length === 0 ? (
            <p className="no-risks">None</p>
          ) : (
            references.map((ref, i) => (
              <div key={ref.riskId ?? i} className="ref-row">
                <span className="ref-num">{String(i + 1).padStart(2, '0')}:</span>
                {ref.excerptId ? (
                  <span className="ref-excerpt-id" title="Excerpt ID">
                    ID: {ref.excerptId}
                  </span>
                ) : null}
                <span className="ref-time">{ref.timestamp ? `Time: ${ref.timestamp}` : 'Time: —'}</span>
                <span> – </span>
                <span className="ref-text">{ref.text}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button type="button" className="exit-btn" onClick={() => navigate(-1)}>
          Exit
        </button>
      </div>
    </div>
  )
}

export default Report
