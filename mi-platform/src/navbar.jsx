import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useState } from 'react'
import './navbar.css'

import LoginPage from './pages/loginPage'
import Dashboard from './pages/dashboard'
import Project from './pages/Project'
import Report from './pages/Report'
import { getCurrentUser, isAuthenticated, logout } from './services/authService'

function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const isAuthRoute = location.pathname.startsWith('/login')
  const currentUser = getCurrentUser()
  const displayName = currentUser?.fullName ?? 'Username'
  const displayRole = currentUser?.role ?? 'Student'
  const avatarText = String(displayName).charAt(0).toUpperCase() || 'U'

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
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
                <span className="user-name">{displayName}</span>
                <span className="user-role">{displayRole}</span>
              </span>
              <span className="user-avatar">{avatarText}</span>
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

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return children
}

function PublicOnlyRoute({ children }) {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function NavBar() {
    return (
        <BrowserRouter>
            <div className="app-shell">
              <TopBar />
              <div className="app-content">
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    {/* Handy alias for older code paths */}
                    <Route
                      path="/dashboard"
                      element={(
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      )}
                    />
                    <Route
                      path="/login"
                      element={(
                        <PublicOnlyRoute>
                          <LoginPage />
                        </PublicOnlyRoute>
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
              </div>
            </div>
        </BrowserRouter>
    )
}

export default NavBar;