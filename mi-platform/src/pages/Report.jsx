import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getReport, updateFlagStatus, emailReport } from '../services/projectService.js'
import './Report.css'
import { getCurrentUser } from '../services/authService'

function normalizeReportPayload(data) {
  if (!data) return null
  return {
    ...data,
    risks: data.risks || [],
    references: (data.references || []).map((ref) => ({
      ...ref,
      riskId: ref.riskId ?? ref.risk_id ?? null,
    })),
    details: data.details ?? '',
    description: data.description ?? '',
  }
}

function referencesForRisk(riskId, references) {
  const id = String(riskId)
  return references.filter((ref) => ref.riskId != null && String(ref.riskId) === id)
}

function Report() {
  const { reportId } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [emailing, setEmailing] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const isFaculty = String(getCurrentUser()?.role ?? '') === '1'

  useEffect(() => {
    getReport(reportId).then((data) => setReport(normalizeReportPayload(data)))
  }, [reportId])

  function handleConfirm(flagId) {
    updateFlagStatus(flagId, 'confirmed').then(() => {
      setReport((prev) => ({
        ...prev,
        risks: (prev.risks || []).map((r) => (r.id === flagId ? { ...r, status: 'confirmed' } : r)),
      }))
    })
  }

  function handleDismiss(flagId) {
    updateFlagStatus(flagId, 'dismissed').then(() => {
      setReport((prev) => ({
        ...prev,
        risks: (prev.risks || []).map((r) => (r.id === flagId ? { ...r, status: 'dismissed' } : r)),
      }))
    })
  }

  function handleEmail() {
    setEmailing(true)
    emailReport(reportId)
      .then(() => {
        setEmailSent(true)
      })
      .finally(() => setEmailing(false))
  }

  const references = report?.references || []
  const unlinkedReferences = useMemo(
    () => references.filter((ref) => ref.riskId == null || String(ref.riskId).trim() === ''),
    [references],
  )

  if (!report) {
    return <div className="rpt-loading">Loading report&hellip;</div>
  }

  const risks = report.risks || []
  const pendingCount = risks.filter((r) => r.status === 'pending').length
  const confirmedCount = risks.filter((r) => r.status === 'confirmed').length

  return (
    <div className="rpt">
      <nav className="rpt-breadcrumb">
        <button type="button" className="rpt-breadcrumb-link" onClick={() => navigate(-1)}>
          Back
        </button>
        <span className="rpt-breadcrumb-sep">/</span>
        <span className="rpt-breadcrumb-current">Report {report.id}</span>
      </nav>

      <div className="rpt-header">
        <div>
          <h1 className="rpt-title">Report {report.id}</h1>
          <div className="rpt-stats">
            {risks.length > 0 ? (
              <>
                <span className="rpt-stat">
                  {risks.length} risk{risks.length !== 1 ? 's' : ''} identified
                </span>
                {pendingCount > 0 && (
                  <span className="rpt-stat rpt-stat--warning">{pendingCount} pending review</span>
                )}
                {confirmedCount > 0 && (
                  <span className="rpt-stat rpt-stat--danger">{confirmedCount} confirmed</span>
                )}
              </>
            ) : (
              <span className="rpt-stat rpt-stat--ok">No risks identified</span>
            )}
          </div>
        </div>
        {/* <button
          type="button"
          className="rpt-email-btn"
          onClick={handleEmail}
          disabled={emailing || emailSent}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="3" width="14" height="10" rx="2" />
            <path d="M1 5l7 4 7-4" />
          </svg>
          {emailSent ? 'Sent' : emailing ? 'Sending...' : 'Email Report'}
        </button> */}
      </div>
      <section className="rpt-section">
        <h2 className="rpt-section-title">Summary</h2>
        <div className="rpt-details-box">{report.details}</div>
      </section>
      <section className="rpt-section">
        <h2 className="rpt-section-title">Identified Risks</h2>
        {risks.length === 0 ? (
          <div className="rpt-no-risks">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--success)" strokeWidth="1.8">
              <circle cx="10" cy="10" r="8" />
              <path d="M6 10l3 3 5-5" />
            </svg>
            No risks were flagged for this meeting.
          </div>
        ) : (
          <div className="rpt-risk-list">
            {risks.map((risk) => {
              const riskRefs = referencesForRisk(risk.id, references)
              const riskDescription =
                risk.risk_description ??
                risk.riskDescription ??
                risk.description ??
                risk.risk_desc ??
                ''
              return (
                <div key={risk.id} className={`rpt-risk rpt-risk--${risk.status}`}>
                  <div className="rpt-risk-header">
                    <span className="rpt-risk-type">{risk.flagType}</span>
                    <span className={`rpt-status rpt-status--${risk.status}`}>
                      {risk.status === 'pending'
                        ? 'Pending Review'
                        : risk.status === 'confirmed'
                          ? 'Confirmed'
                          : 'Dismissed'}
                    </span>
                  </div>
                  <p className="rpt-risk-id">
                    <span className="rpt-risk-id-label">Risk ID</span>{' '}
                    <code className="rpt-risk-id-code">{risk.id}</code>
                  </p>
                  <p className="rpt-risk-text">{riskDescription || risk.explanation}</p>
                  {riskRefs.length > 0 && (
                    <div className="rpt-risk-refs">
                      <div className="rpt-risk-refs-title">Transcript references (this risk)</div>
                      <ul className="rpt-risk-refs-list">
                        {riskRefs.map((ref, idx) => (
                          <li key={`${risk.id}-${ref.timestamp}-${idx}`} className="rpt-risk-ref-item">
                            <span className="rpt-risk-ref-time">{ref.timestamp ?? '—'}</span>
                            <span className="rpt-risk-ref-text">{ref.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {risk.status === 'pending' && !isFaculty && (
                    <div className="rpt-risk-actions">
                      <button type="button" className="rpt-btn-confirm" onClick={() => handleConfirm(risk.id)}>
                        Confirm Risk
                      </button>
                      <button type="button" className="rpt-btn-dismiss" onClick={() => handleDismiss(risk.id)}>
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      

      {unlinkedReferences.length > 0 && (
        <section className="rpt-section">
          <h2 className="rpt-section-title">Other transcript references</h2>
          <p className="rpt-ref-section-note">These excerpts are not tied to a specific risk flag.</p>
          <div className="rpt-ref-list">
            {unlinkedReferences.map((ref, i) => (
              <div key={`unlinked-${ref.timestamp ?? 'ref'}-${i}`} className="rpt-ref">
                <span className="rpt-ref-time">{ref.timestamp ?? '—'}</span>
                <span className="rpt-ref-text">{ref.text}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default Report
