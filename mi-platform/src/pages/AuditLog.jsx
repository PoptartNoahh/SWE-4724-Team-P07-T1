import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAuditLogEntries } from '../services/auditLogService'
import './AuditLog.css'

function toPrettyApiError(err) {
  const raw = err?.message ? String(err.message) : ''
  const match = raw.match(/Request failed \(\d+\):\s*(\{[\s\S]*\})\s*$/)
  if (match) {
    try {
      const parsed = JSON.parse(match[1])
      if (typeof parsed?.detail === 'string' && parsed.detail.trim()) return parsed.detail.trim()
    } catch {
      // ignore
    }
  }
  return raw || 'Failed to load audit log.'
}

function fmtDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString()
}

function normalizeRow(r) {
  if (!r || typeof r !== 'object') return null
  return {
    log_id: r.log_id ?? r.logId ?? r.id ?? null,
    action_type: r.action_type ?? r.actionType ?? '',
    entity_id: r.entity_id ?? r.entityId ?? null,
    entity_name: r.entity_name ?? r.entityName ?? '',
    entity_type: r.entity_type ?? r.entityType ?? '',
    entity_before: r.entity_before ?? r.entityBefore ?? '',
    entity_after: r.entity_after ?? r.entityAfter ?? '',
    created_at: r.created_at ?? r.createdAt ?? null,
    user_id: r.user_id ?? r.userId ?? null,
  }
}

export default function AuditLog() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [selectedAction, setSelectedAction] = useState('all')
  const [selectedTableName, setSelectedTableName] = useState('all')

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError('')
      try {
        const data = await getAuditLogEntries()
        if (cancelled) return
        setRows((Array.isArray(data) ? data : []).map(normalizeRow).filter(Boolean))
      } catch (err) {
        if (cancelled) return
        setError(toPrettyApiError(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  const tableNames = useMemo(() => {
    const set = new Set()
    for (const r of rows) {
      const name = String(r?.entity_name ?? '').trim()
      if (name) set.add(name)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [rows])

  const filtered = useMemo(() => {
    const action = String(selectedAction ?? 'all').toLowerCase()
    const tableName = String(selectedTableName ?? 'all')
    return rows.filter((r) => {
      if (action !== 'all' && String(r.action_type ?? '').toLowerCase() !== action) return false
      if (tableName !== 'all' && String(r.entity_name ?? '') !== tableName) return false
      return true
    })
  }, [rows, selectedAction, selectedTableName])

  return (
    <div className="alog">
      <div className="alog-container">
        <nav className="alog-breadcrumb">
          <button className="alog-breadcrumb-link" onClick={() => navigate('/dashboard')}>Dashboard</button>
          <span className="alog-breadcrumb-sep">/</span>
          <span className="alog-breadcrumb-current">Audit Log</span>
        </nav>

        <div className="alog-header">
          <div>
            <h1 className="alog-title">Audit Log</h1>
          </div>
        </div>

        <div className="alog-actions" aria-label="Audit log filters">
          <div className="alog-filter">
            <label className="alog-filter-label" htmlFor="alog-tableName">
              Table Name
            </label>
            <select
              id="alog-tableName"
              className="alog-select"
              value={selectedTableName}
              onChange={(e) => setSelectedTableName(e.target.value)}
              aria-label="Filter by table name"
            >
              <option value="all">All</option>
              {tableNames.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="alog-filter">
            <label className="alog-filter-label" htmlFor="alog-actionType">
              Action
            </label>
            <select
              id="alog-actionType"
              className="alog-select"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              aria-label="Filter by action type"
            >
              <option value="all">All</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
            </select>
          </div>
          <button
            className="alog-btn"
            type="button"
            onClick={async () => {
              setLoading(true)
              setError('')
              try {
                const data = await getAuditLogEntries()
                setRows((Array.isArray(data) ? data : []).map(normalizeRow).filter(Boolean))
              } catch (err) {
                setError(toPrettyApiError(err))
              } finally {
                setLoading(false)
              }
            }}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {error && <div className="alog-error">{error}</div>}

        <div className="alog-card">
          <div className="alog-tableWrap" role="region" aria-label="Audit log table">
            <table className="alog-table">
              <thead>
                <tr>
                  <th className="alog-col-date">Date</th>
                  <th className="alog-col-user">User</th>
                  <th className="alog-col-action">Action</th>
                  <th className="alog-col-entityType">Entity Type</th>
                  <th className="alog-col-entityName">Entity Name</th>
                  <th>Entity Id</th>
                  <th>Before</th>
                  <th>After</th>
                </tr>
              </thead>
              <tbody>
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="alog-empty">
                      No audit log entries found.
                    </td>
                  </tr>
                )}
                {filtered.map((r) => (
                  <tr key={String(r.log_id ?? `${r.created_at}-${r.user_id}-${r.action_type}`)}>
                    <td className="alog-mono alog-col-date">{fmtDate(r.created_at)}</td>
                    <td className="alog-mono alog-col-user">{r.user_id ?? ''}</td>
                    <td className="alog-col-action">{r.action_type}</td>
                    <td className="alog-col-entityType">{r.entity_type}</td>
                    <td className="alog-col-entityName">{r.entity_name}</td>
                    <td className="alog-mono">{r.entity_id ?? ''}</td>
                    <td className="alog-trunc" title={r.entity_before}>{r.entity_before}</td>
                    <td className="alog-trunc" title={r.entity_after}>{r.entity_after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

