import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { recentProjects, semesterProjects } from '../../data/projects.js'
import './dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')

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
          <button className="sidebar-see-all">See All</button>
        </aside>

        {/* Main content */}
        <main className="main-content">

          {/* New project creator */}
          <section className="new-project-section">
            <h2 className="section-heading">New Projects</h2>
            <input
              className="new-project-input"
              type="text"
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
            <button className="create-btn">Create</button>
          </section>

          {/* Projects list */}
          <section className="projects-section">
            <h2 className="section-heading">Projects</h2>
            <div className="projects-scroll">
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
          </section>

        </main>
      </div>
    </div>
  )
}

export default Dashboard
