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

  return (
    <div className="rpt">
      {/* Breadcrumb */}
      <nav className="rpt-breadcrumb">
        <button className="rpt-breadcrumb-link" onClick={() => navigate(-1)}>Back</button>
        <span className="rpt-breadcrumb-sep">/</span>
        <span className="rpt-breadcrumb-current">Report {report.id}</span>
      </nav>

      {/* Header */}
      <div className="rpt-header">
        <div>
          <h1 className="rpt-title">Report {report.id}</h1>
          <div className="rpt-stats">
            {report.risks.length > 0 ? (
              <>
                <span className="rpt-stat">{report.risks.length} risk{report.risks.length !== 1 ? 's' : ''} identified</span>
                {pendingCount > 0 && <span className="rpt-stat rpt-stat--warning">{pendingCount} pending review</span>}
                {confirmedCount > 0 && <span className="rpt-stat rpt-stat--danger">{confirmedCount} confirmed</span>}
              </>
            ) : (
              <span className="rpt-stat rpt-stat--ok">No risks identified</span>
            )}
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

      {/* Risks */}
      <section className="rpt-section">
        <h2 className="rpt-section-title">Identified Risks</h2>
        {report.risks.length === 0 ? (
          <div className="rpt-no-risks">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--success)" strokeWidth="1.8">
              <circle cx="10" cy="10" r="8"/><path d="M6 10l3 3 5-5"/>
            </svg>
            No risks were flagged for this meeting.
          </div>
        ) : (
          <div className="rpt-risk-list">
            {report.risks.map(risk => (
              <div key={risk.id} className={`rpt-risk rpt-risk--${risk.status}`}>
                <div className="rpt-risk-header">
                  <span className="rpt-risk-type">{risk.flagType}</span>
                  <span className={`rpt-status rpt-status--${risk.status}`}>
                    {risk.status === 'pending' ? 'Pending Review' : risk.status === 'confirmed' ? 'Confirmed' : 'Dismissed'}
                  </span>
                </div>
                <p className="rpt-risk-text">{risk.explanation}</p>
                {risk.status === 'pending' && (
                  <div className="rpt-risk-actions">
                    <button className="rpt-btn-confirm" onClick={() => handleConfirm(risk.id)}>Confirm Risk</button>
                    <button className="rpt-btn-dismiss" onClick={() => handleDismiss(risk.id)}>Dismiss</button>
                  </div>
                )}
              </div>
            ))}
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
