import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'
const TERM_ORDER = {
  spring: 1,
  summer: 2,
  fall: 3,
  winter: 4,
}

const parseSemester = (semesterLabel) => {
  const [termRaw = '', yearRaw = '0'] = semesterLabel.split(' ')
  const year = Number.parseInt(yearRaw, 10)
  const term = termRaw.toLowerCase()

  return {
    year: Number.isNaN(year) ? 0 : year,
    termOrder: TERM_ORDER[term] ?? 0,
  }
}

const sortByMostRecentSemester = (a, b) => {
  const aMeta = parseSemester(a.semester)
  const bMeta = parseSemester(b.semester)

  if (aMeta.year !== bMeta.year) {
    return bMeta.year - aMeta.year
  }

  return bMeta.termOrder - aMeta.termOrder
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

function semesterLabelFromPath(path) {
  // Expected: YYYY/term/name
  const [yearRaw = '', termRaw = ''] = String(path ?? '').split('/')
  const year = Number.parseInt(yearRaw, 10)
  const term = String(termRaw).toLowerCase()
  const termTitle = term ? term.charAt(0).toUpperCase() + term.slice(1) : ''
  return `${termTitle} ${Number.isNaN(year) ? '' : year}`.trim()
}

function Dashboard() {
  const navigate = useNavigate()
  //const [newProjectName, setNewProjectName] = useState('')
  const [showAll, setShowAll] = useState(false)
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
      } catch (e) {
        // If backend isn't running, keep the dashboard usable (empty list rather than crashing),
        // but show a clear message so it's obvious what's wrong.
        if (!cancelled) {
          setProjects([])
          setLoadError(
            `Could not load projects from backend at ${API_BASE_URL}. Start the FastAPI server (port 8000) or set VITE_API_BASE_URL.`
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
      existing.projects.push({ id: p.id, name: p.path || p.name || `Project ${p.id}` })
      groups.set(semester, existing)
    }
    return Array.from(groups.values())
  }, [projects])

  const recentProjects = useMemo(() => {
    // Most-recent heuristic: just take the first few returned by backend for now.
    // TODO: backend should return a dedicated "recent" list (or sort by updatedAt).
    return projects.slice(0, 3).map((p) => ({ id: p.id, name: p.path || p.name || `Project ${p.id}` }))
  }, [projects])

  const sortedSemesterProjects = useMemo(
    () => [...semesterProjects].sort(sortByMostRecentSemester),
    [semesterProjects]
  )

  const filteredSemesterProjects = useMemo(
    () =>
      selectedSemester === 'all'
        ? sortedSemesterProjects
        : sortedSemesterProjects.filter((group) => group.semester === selectedSemester),
    [selectedSemester, sortedSemesterProjects]
  )

  return (
    <div className="dashboard-layout">
      <div className="dashboard-body">
        {/* Left sidebar — recent projects */}
        <aside className="sidebar">
          <p className="sidebar-label">Recent</p>
          {recentProjects.map((p) => (
            <button
              key={p.id}
              className="sidebar-project-btn"
              onClick={() => navigate(`/projects/${p.id}`)}
            >
              {p.name}
            </button>
          ))}
        </aside>

        {/* Main content */}
        <main className="main-content">

          {/* New project creator */}
          <section className="new-project-section">
            <h2 className="section-heading">New Projects</h2>
           
            <button className="create-btn">Create</button>
          </section>

          {/* Projects list */}
          <section className="projects-section">
            <div className="projects-header-row">
              <h2 className="section-heading">Projects</h2>
              <div className="semester-filter-wrap">
                <label htmlFor="semester-filter" className="semester-filter-label">Semester</label>
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
              <div style={{
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                color: '#9a3412',
                padding: '12px 14px',
                borderRadius: '12px',
                fontWeight: 700,
                marginBottom: '12px'
              }}>
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

        </main>
      </div>

      {/* See All overlay */}
      {showAll && (
        <div className="overlay">
          <div className="overlay-header">
            <h2 className="overlay-title">All Projects</h2>
            <button className="overlay-close" onClick={() => setShowAll(false)}>✕</button>
          </div>
          <div className="overlay-body">
            {sortedSemesterProjects.map((group) => (
              <div key={group.semester} className="semester-group">
                <p className="semester-label">{group.semester}</p>
                <div className="semester-projects">
                  {group.projects.map((p) => (
                    <button
                      key={p.id}
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
        </div>
      )}
    </div>
  )
}

export default Dashboard