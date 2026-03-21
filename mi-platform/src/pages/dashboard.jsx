import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './dashboard.css'

const TERM_ORDER = { spring: 1, summer: 2, fall: 3, winter: 4 }

const parseSemester = (label) => {
  const [termRaw = '', yearRaw = '0'] = label.split(' ')
  const year = Number.parseInt(yearRaw, 10)
  return { year: Number.isNaN(year) ? 0 : year, termOrder: TERM_ORDER[termRaw.toLowerCase()] ?? 0 }
}

const sortByMostRecentSemester = (a, b) => {
  const am = parseSemester(a.semester)
  const bm = parseSemester(b.semester)
  return am.year !== bm.year ? bm.year - am.year : bm.termOrder - am.termOrder
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

function semesterLabelFromPath(path) {
  const [yearRaw = '', termRaw = ''] = String(path ?? '').split('/')
  const year = Number.parseInt(yearRaw, 10)
  const term = String(termRaw).toLowerCase()
  const termTitle = term ? term.charAt(0).toUpperCase() + term.slice(1) : ''
  return `${termTitle} ${Number.isNaN(year) ? '' : year}`.trim()
}

function Dashboard() {
  const navigate = useNavigate()
  const [selectedSemester, setSelectedSemester] = useState('all')
  const [projects, setProjects] = useState([])
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoadError('')
        const res = await fetch(`${API_BASE_URL}/api/projects`)
        if (!res.ok) throw new Error(`Failed to load projects (${res.status})`)
        const data = await res.json()
        if (!cancelled) setProjects(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) {
          setProjects([])
          setLoadError(
            `Could not reach backend at ${API_BASE_URL}. Start the FastAPI server or set VITE_API_BASE_URL.`
          )
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const semesterProjects = useMemo(() => {
    const groups = new Map()
    for (const p of projects) {
      const semester = semesterLabelFromPath(p.path)
      const existing = groups.get(semester) ?? { semester, projects: [] }
      existing.projects.push({ id: p.id, name: p.name || `Project ${p.id}` })
      groups.set(semester, existing)
    }
    return Array.from(groups.values())
  }, [projects])

  const recentProjects = useMemo(
    () => projects.slice(0, 4).map((p) => ({ id: p.id, name: p.name || `Project ${p.id}` })),
    [projects]
  )

  const sortedSemesterProjects = useMemo(
    () => [...semesterProjects].sort(sortByMostRecentSemester),
    [semesterProjects]
  )

  const filteredSemesterProjects = useMemo(
    () =>
      selectedSemester === 'all'
        ? sortedSemesterProjects
        : sortedSemesterProjects.filter((g) => g.semester === selectedSemester),
    [selectedSemester, sortedSemesterProjects]
  )

  return (
    <div className="dash">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-subtitle">Capstone project oversight and risk monitoring</p>
        </div>
      </div>

      <section className="dash-quick">
        <h2 className="dash-section-label">Recent Projects</h2>
        <div className="dash-quick-grid">
          {recentProjects.map((p) => (
            <button
              key={p.id}
              type="button"
              className="dash-quick-card"
              onClick={() => navigate(`/projects/${p.id}`)}
            >
              <div className="dash-quick-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--ksu-gold)" strokeWidth="1.8">
                  <rect x="3" y="3" width="14" height="14" rx="2" />
                  <path d="M7 7h6M7 10h4" />
                </svg>
              </div>
              <span className="dash-quick-name">{p.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="new-project-section">
        <h2 className="section-heading">New Projects</h2>
        <button type="button" className="create-btn" onClick={() => navigate('/projects/new')}>
          Create
        </button>
      </section>

      <section className="projects-section">
        <div className="projects-header-row">
          <h2 className="section-heading">Projects</h2>
          <div className="semester-filter-wrap">
            <label htmlFor="semester-filter" className="semester-filter-label">
              Semester
            </label>
            <select
              id="semester-filter"
              className="semester-filter-select"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
            >
              <option value="all">All semesters</option>
              {sortedSemesterProjects.map((group) => (
                <option key={group.semester} value={group.semester}>
                  {group.semester}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadError && (
          <div
            style={{
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              color: '#9a3412',
              padding: '12px 14px',
              borderRadius: '12px',
              fontWeight: 700,
              marginBottom: '12px',
            }}
          >
            {loadError}
          </div>
        )}

        <div className="projects-scroll">
          {!loadError && filteredSemesterProjects.length === 0 && (
            <p style={{ color: '#6b7280', fontWeight: 700, margin: 0 }}>
              No projects returned from the backend yet.
            </p>
          )}
          {filteredSemesterProjects.map((group) => (
            <div key={group.semester} className="semester-group">
              <p className="semester-label">{group.semester}</p>
              <div className="semester-projects">
                {group.projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="project-btn"
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Dashboard
