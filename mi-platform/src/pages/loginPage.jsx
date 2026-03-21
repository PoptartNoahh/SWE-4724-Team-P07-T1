import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './loginPage.css'

function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Please fill in all fields.')
      return
    }
    navigate('/dashboard')
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-brand-mark">&#9670;</div>
          <h1 className="login-hero-title">Meeting Intelligence Platform</h1>
          <p className="login-hero-sub">
            CCSE Capstone Project Governance
          </p>
          <p className="login-hero-desc">
            AI-powered risk detection for capstone project meetings.
            Automated transcript analysis, risk flagging, and structured reporting.
          </p>
          <div className="login-hero-footer">Kennesaw State University</div>
        </div>
      </div>
      <div className="login-right">
        <div className="login-card">
          <h2 className="login-title">Sign in</h2>
          <p className="login-subtitle">Use your CCSE administrator account</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="admin@kennesaw.edu"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="login-btn">Sign in</button>
          </form>

          <p className="login-footer-text">
            Protected by Kennesaw State University IT policies
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
