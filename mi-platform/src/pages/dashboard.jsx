import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { recentProjects, semesterProjects } from '../services/projects'
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

function Dashboard() {
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  //const [newProjectName, setNewProjectName] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [selectedSemester, setSelectedSemester] = useState('all')

  const sortedSemesterProjects = [...semesterProjects].sort(sortByMostRecentSemester)
  const filteredSemesterProjects =
    selectedSemester === 'all'
      ? sortedSemesterProjects
      : sortedSemesterProjects.filter((group) => group.semester === selectedSemester)

  const handleLogout = () => {
    navigate('/login')
  }

  return (
    <div className="dashboard-layout">

      {/* Top navbar */}
      <header className="topnav">
        <span className="topnav-brand">MI Platform</span>
        <div className="topnav-right">
          <span className="topnav-bell">🔔</span>
          <button
            className="topnav-user"
            onClick={() => setDropdownOpen((o) => !o)}
          >
            <span>Username</span>
            <span className="topnav-avatar">👤</span>
          </button>
          {dropdownOpen && (
            <div className="dropdown">
              <div className="dropdown-item dropdown-item--header">Notifications</div>
              <div className="dropdown-divider" />
              <div className="dropdown-item dropdown-item--header">Account Details</div>
              <button className="dropdown-item">⚙ Settings</button>
              <button className="dropdown-item" onClick={handleLogout}>⇠ Log Out</button>
            </div>
          )}
        </div>
      </header>

      <div className="dashboard-body">
        {/* Left sidebar — recent projects */}
        <aside className="sidebar">
          <p className="sidebar-label">Recent</p>
          {recentProjects.map((p) => (
            <button key={p.id} className="sidebar-project-btn">{p.name}</button>
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
            <div className="projects-scroll">
              {filteredSemesterProjects.map((group) => (
                <div key={group.semester} className="semester-group">
                  <p className="semester-label">{group.semester}</p>
                  <div className="semester-projects">
                    {group.projects.map((p) => (
                      <button key={p.id} className="project-btn">{p.name}</button>
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
            {semesterProjects.map((group) => (
              <div key={group.semester} className="semester-group">
                <p className="semester-label">{group.semester}</p>
                <div className="semester-projects">
                  {group.projects.map((p) => (
                    <button key={p.id} className="project-btn">{p.name}</button>
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