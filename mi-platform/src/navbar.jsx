import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useLocation,
  useNavigate,
  Navigate,
} from 'react-router-dom'
import { useMemo, useState, useRef, useEffect } from 'react'
import './navbar.css'

import Layout from './Layout'
import LoginPage from './pages/loginPage'
import Dashboard from './pages/dashboard'
import Project from './pages/Project'
import Report from './pages/Report'
import CreateProject from './pages/CreateProject'
import CreateFaculty from './pages/CreateFaculty'
import EventLog from './pages/EventLog'
import { getCurrentUser, logout, isAuthenticated } from './services/authService'

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return children
}

function AdminOnlyRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  const user = getCurrentUser()
  const role = user?.role != null ? String(user.role) : ''
  if (role !== '0') {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function PublicOnlyRoute({ children }) {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const [sessionUser, setSessionUser] = useState(() => getCurrentUser())

  const isAuthRoute = useMemo(() => location.pathname.startsWith('/login'), [location.pathname])

  useEffect(() => {
    setSessionUser(getCurrentUser())
  }, [location.pathname])

  const displayName = sessionUser?.fullName ?? sessionUser?.name ?? 'User'
  const displayRole = sessionUser?.role ?? ''
  const isAdmin = String(sessionUser?.role ?? '') === '0'

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
    logout()
    setSessionUser(null)
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
              <NavLink
                to="/dashboard"
                end
                className={({ isActive }) => `app-navlink ${isActive ? 'is-active' : ''}`}
              >
                Dashboard
              </NavLink>
              {isAdmin && (
                <>
                  <NavLink
                    to="/faculty/new"
                    className={({ isActive }) => `app-navlink ${isActive ? 'is-active' : ''}`}
                  >
                    Add Faculty
                  </NavLink>
                  <NavLink
                    to="/events"
                    className={({ isActive }) => `app-navlink ${isActive ? 'is-active' : ''}`}
                  >
                    Event Log
                  </NavLink>
                </>
              )}
            </nav>
          )}
        </div>

        <div className="app-topbar-right" ref={menuRef}>
          {!isAuthRoute && (
            <>
              <button className="icon-btn" type="button" aria-label="Notifications">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M10 2a5 5 0 0 0-5 5v3l-1.5 2.5h13L15 10V7a5 5 0 0 0-5-5z" />
                  <path d="M8 16a2 2 0 1 0 4 0" />
                </svg>
              </button>
              <button className="user-btn" type="button" onClick={() => setMenuOpen((o) => !o)}>
                <span className="user-avatar">{displayName.charAt(0)}</span>
                <span className="user-meta">
                  <span className="user-name">{displayName}</span>
                  <span className="user-role">{displayRole}</span>
                </span>
              </button>
              {menuOpen && (
                <div className="menu" role="menu" aria-label="User menu">
                  <div className="menu-header">
                    <div className="menu-header-name">{displayName}</div>
                    <div className="menu-header-role">{displayRole}</div>
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
          <Layout>
            <Routes>
              <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
              <Route
                path="/"
                element={(
                  <ProtectedRoute>
                    <Navigate to="/dashboard" replace />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/dashboard"
                element={(
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/projects/new"
                element={(
                  <ProtectedRoute>
                    <CreateProject />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/faculty/new"
                element={(
                  <AdminOnlyRoute>
                    <CreateFaculty />
                  </AdminOnlyRoute>
                )}
              />
              <Route
                path="/events"
                element={(
                  <AdminOnlyRoute>
                    <EventLog />
                  </AdminOnlyRoute>
                )}
              />
              <Route
                path="/projects/:projectId"
                element={(
                  <ProtectedRoute>
                    <Project />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/reports/:reportId"
                element={(
                  <ProtectedRoute>
                    <Report />
                  </ProtectedRoute>
                )}
              />
            </Routes>
          </Layout>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default NavBar
