import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import './navbar.css'

import LoginPage from './pages/loginPage'
import Dashboard from './pages/dashboard'
import Project from './pages/Project'
import Report from './pages/Report'
import CreateProject from './pages/CreateProject'

function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const isAuthRoute = useMemo(() => location.pathname.startsWith('/login'), [location.pathname])
  const user = useMemo(() => ({ name: 'Username', role: 'Student' }), [])

  // For now, "logout" just routes to login. Replace with real auth later.
  const handleLogout = () => {
    setMenuOpen(false)
    navigate('/login')
  }

  return (
    <header className="app-topbar">
      <div className="app-topbar-left">
        <div className="app-brand" onClick={() => navigate('/')}>MI Platform</div>
        <nav className="app-navlinks" aria-label="Primary navigation">
          <NavLink to="/" className={({ isActive }) => `app-navlink ${isActive ? 'is-active' : ''}`}>
            Dashboard
          </NavLink>
          <NavLink to="/login" className={({ isActive }) => `app-navlink ${isActive ? 'is-active' : ''}`}>
            Login
          </NavLink>
        </nav>
      </div>

      <div className="app-topbar-right">
        {!isAuthRoute && (
          <>
            <button className="icon-btn" type="button" aria-label="Notifications">
              🔔
            </button>
            <button className="user-btn" type="button" onClick={() => setMenuOpen((o) => !o)}>
              <span className="user-meta">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
              </span>
              <span className="user-avatar">U</span>
            </button>
            {menuOpen && (
              <div className="menu" role="menu" aria-label="User menu">
                <div className="menu-header">
                  <div className="menu-header-title">Account</div>
                </div>
                <button className="menu-item" type="button" onClick={handleLogout}>
                  ⇠ Log Out
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  )
}

function NavBar() {
    return (
        <BrowserRouter>
            <div className="app-shell">
              <TopBar />
              <div className="app-content">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    {/* Handy alias for older code paths */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/projects/:projectId" element={<Project />} />
                    <Route path="/projects/new" element={<CreateProject />} />
                    <Route path="/reports/:reportId" element={<Report />} />
                </Routes>
              </div>
            </div>
        </BrowserRouter>
    )
}

export default NavBar;