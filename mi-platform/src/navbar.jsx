import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useMemo, useState, useRef, useEffect } from 'react'
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
  const menuRef = useRef(null)

  const isAuthRoute = useMemo(() => location.pathname.startsWith('/login'), [location.pathname])
  const user = useMemo(() => ({ name: 'Admin User', role: 'CCSE Administrator' }), [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const handleLogout = () => {
    setMenuOpen(false)
    navigate('/login')
  }

  return (
    <>
      <div className="ksu-accent-bar" />
      <header className="app-topbar">
        <div className="app-topbar-left">
          <div className="app-brand" onClick={() => navigate('/')}>
            <span className="app-brand-icon">&#9670;</span>
            <span className="app-brand-text">CCSE-MIP</span>
          </div>
          {!isAuthRoute && (
            <nav className="app-navlinks" aria-label="Primary navigation">
              <NavLink to="/" end className={({ isActive }) => `app-navlink ${isActive ? 'is-active' : ''}`}>
                Dashboard
              </NavLink>
            </nav>
          )}
        </div>

        <div className="app-topbar-right" ref={menuRef}>
          {!isAuthRoute && (
            <>
              <button className="icon-btn" type="button" aria-label="Notifications">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M10 2a5 5 0 0 0-5 5v3l-1.5 2.5h13L15 10V7a5 5 0 0 0-5-5z"/>
                  <path d="M8 16a2 2 0 1 0 4 0"/>
                </svg>
              </button>
              <button className="user-btn" type="button" onClick={() => setMenuOpen(o => !o)}>
                <span className="user-avatar">{user.name.charAt(0)}</span>
                <span className="user-meta">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role">{user.role}</span>
                </span>
              </button>
              {menuOpen && (
                <div className="menu" role="menu" aria-label="User menu">
                  <div className="menu-header">
                    <div className="menu-header-name">{user.name}</div>
                    <div className="menu-header-role">{user.role}</div>
                  </div>
                  <div className="menu-divider" />
                  <button className="menu-item" type="button" onClick={handleLogout}>
                    Sign out
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </header>
    </>
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

export default NavBar
