import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './dashboard.css'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: '▦', path: '/dashboard' },
  { label: 'Analytics', icon: '📈', path: '/analytics' },
  { label: 'Users', icon: '👥', path: '/users' },
  { label: 'Reports', icon: '📋', path: '/reports' },
  { label: 'Settings', icon: '⚙', path: '/settings' },
]

const STAT_CARDS = [
  { label: 'Total Users', value: '4,281', change: '+12%', positive: true },
  { label: 'Active Sessions', value: '318', change: '+5%', positive: true },
  { label: 'Revenue', value: '$24,530', change: '+8.3%', positive: true },
  { label: 'Bounce Rate', value: '24.7%', change: '-2.1%', positive: false },
]

const RECENT_ACTIVITY = [
  { user: 'Alice Martin', action: 'Created a new report', time: '2 min ago' },
  { user: 'Bob Chen', action: 'Updated user settings', time: '15 min ago' },
  { user: 'Sarah Kim', action: 'Exported analytics data', time: '1 hr ago' },
  { user: 'James Rivera', action: 'Added a new team member', time: '3 hr ago' },
  { user: 'Priya Patel', action: 'Reviewed monthly report', time: '5 hr ago' },
]

function Dashboard() {
  const navigate = useNavigate()
  const [activeNav, setActiveNav] = useState('Dashboard')

  const handleLogout = () => {
    navigate('/login')
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">CCSE MI Platform</div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${activeNav === item.label ? 'nav-item--active' : ''}`}
              onClick={() => setActiveNav(item.label)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          ⇠ Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {/* Top bar */}
        <header className="topbar">
          <div>
            <h1 className="topbar-title">Dashboard</h1>
            <p className="topbar-date">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="topbar-avatar">A</div>
        </header>

        {/* Stat cards */}
        <section className="stats-grid">
          {STAT_CARDS.map((card) => (
            <div key={card.label} className="stat-card">
              <p className="stat-label">{card.label}</p>
              <p className="stat-value">{card.value}</p>
              <span className={`stat-change ${card.positive ? 'stat-change--up' : 'stat-change--down'}`}>
                {card.change} vs last month
              </span>
            </div>
          ))}
        </section>

        {/* Recent activity */}
        <section className="activity-section">
          <h2 className="section-title">Recent Activity</h2>
          <div className="activity-table-wrapper">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Action</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_ACTIVITY.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <div className="user-cell">
                        <span className="user-avatar">{row.user[0]}</span>
                        {row.user}
                      </div>
                    </td>
                    <td>{row.action}</td>
                    <td className="time-cell">{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Dashboard
