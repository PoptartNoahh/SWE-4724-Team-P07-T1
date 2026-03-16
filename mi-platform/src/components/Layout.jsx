import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Layout.css'

function Layout({ children }) {
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <div className="page-layout">
      <header className="topnav">
        <span className="topnav-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          MI Platform
        </span>
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
              <button className="dropdown-item" onClick={() => navigate('/login')}>⇠ Log Out</button>
            </div>
          )}
        </div>
      </header>
      <div className="page-body">
        {children}
      </div>
    </div>
  )
}

export default Layout
