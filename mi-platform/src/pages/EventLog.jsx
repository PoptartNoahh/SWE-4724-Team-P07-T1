import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEventLog } from '../services/projectService'
import './EventLog.css'

const TYPE_COLORS = {
  login:    { bg: 'var(--ms-blue)',    label: 'Login' },
  register: { bg: 'var(--success)',    label: 'Register' },
  create:   { bg: 'var(--ksu-gold)',   label: 'Create' },
  update:   { bg: 'var(--warning)',    label: 'Update' },
  flag:     { bg: 'var(--danger)',     label: 'Flag' },
  email:    { bg: '#8764b8',           label: 'Email' },
  default:  { bg: 'var(--text-tertiary)', label: 'Event' },
}

function getTypeMeta(type) {
  const key = (type || '').toLowerCase()
  for (const [k, v] of Object.entries(TYPE_COLORS)) {
    if (key.includes(k)) return v
  }
  return TYPE_COLORS.default
}

function fmtTimestamp(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function EventLog() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setError('')
        const data = await getEventLog()
        if (!cancelled) setEvents(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load event log.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="elog">
      <nav className="elog-breadcrumb">
        <button className="elog-breadcrumb-link" onClick={() => navigate('/dashboard')}>Dashboard</button>
        <span className="elog-breadcrumb-sep">/</span>
        <span className="elog-breadcrumb-current">Event Log</span>
      </nav>

      <div className="elog-header">
        <h1 className="elog-title">Event Log</h1>
        <p className="elog-subtitle">System-wide activity and audit trail</p>
      </div>

      {error && <div className="elog-error">{error}</div>}

      {loading ? (
        <p className="elog-loading">Loading events...</p>
      ) : events.length === 0 ? (
        <div className="elog-empty">No events recorded yet.</div>
      ) : (
        <div className="elog-table-wrap">
          <table className="elog-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Description</th>
                <th>User</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {events.map((evt, i) => {
                const meta = getTypeMeta(evt.event_type)
                return (
                  <tr key={evt.id ?? i}>
                    <td>
                      <span className="elog-type-badge" style={{ background: meta.bg }}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="elog-desc">{evt.description || evt.event_type || '—'}</td>
                    <td className="elog-user">{evt.user_name || evt.user_email || '—'}</td>
                    <td className="elog-time">{fmtTimestamp(evt.created_at || evt.timestamp)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default EventLog
