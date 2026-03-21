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
      setReport(prev => ({
        ...prev,
        risks: prev.risks.map(r => r.id === flagId ? { ...r, status: 'confirmed' } : r)
      }))
    })
  }

  function handleDismiss(flagId) {
    updateFlagStatus(flagId, 'dismissed').then(() => {
      setReport(prev => ({
        ...prev,
        risks: prev.risks.map(r => r.id === flagId ? { ...r, status: 'dismissed' } : r)
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

  const pendingCount = report.risks.filter(r => r.status === 'pending').length
  const confirmedCount = report.risks.filter(r => r.status === 'confirmed').length

        <div className="report-section">
          <h2 className="report-section-title">Identified Risks</h2>
          {report.risks.length === 0 ? (
            <p className="no-risks">None</p>
          ) : (
            <div className="risk-list">
              {report.risks.map(risk => (
                <div key={risk.id} className={`risk-item ${risk.status}`}>
                  <div className="risk-top">
                    <span className="risk-type">{risk.flagType}</span>
                    <span className={`status-tag ${risk.status}`}>
                      {risk.status === 'pending' ? 'Pending Review' : risk.status === 'confirmed' ? 'Confirmed' : 'Dismissed'}
                    </span>
                  </div>
                  <p className="risk-explanation">{risk.explanation}</p>
                  {risk.status === 'pending' && (
                    <div className="risk-actions">
                      <button className="confirm-btn" onClick={() => handleConfirm(risk.id)}>Confirm</button>
                      <button className="dismiss-btn" onClick={() => handleDismiss(risk.id)}>Dismiss</button>
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
        <button
          className="rpt-email-btn"
          onClick={handleEmail}
          disabled={emailing || emailSent}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="3" width="14" height="10" rx="2"/>
            <path d="M1 5l7 4 7-4"/>
          </svg>
          {emailSent ? 'Sent' : emailing ? 'Sending...' : 'Email Report'}
        </button>
      </div>

        <div className="report-section">
          <h2 className="report-section-title">Reference Points</h2>
          <div className="references-box">
            {(report.references || []).length === 0 ? (
              <p className="no-risks">None</p>
            ) : (
              (report.references || []).map((ref, i) => (
                <div key={ref.riskId ?? i} className="ref-row">
                  <span className="ref-num">{String(i + 1).padStart(2, '0')}:</span>
                  {ref.excerptId ? (
                    <span className="ref-excerpt-id" title="Excerpt ID">ID: {ref.excerptId}</span>
                  ) : null}
                  <span className="ref-time">
                    {ref.timestamp ? `Time: ${ref.timestamp}` : 'Time: —'}
                  </span>
                  <span> – </span>
                  <span className="ref-text">{ref.text}</span>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* Details */}
      <section className="rpt-section">
        <h2 className="rpt-section-title">Meeting Summary</h2>
        <div className="rpt-details-box">
          {report.details}
        </div>
      </section>

      {/* References */}
      <section className="rpt-section">
        <h2 className="rpt-section-title">Transcript References</h2>
        <div className="rpt-ref-list">
          {report.references.map((ref, i) => (
            <div key={i} className="rpt-ref">
              <span className="rpt-ref-time">{ref.timestamp}</span>
              <span className="rpt-ref-text">{ref.text}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Report
