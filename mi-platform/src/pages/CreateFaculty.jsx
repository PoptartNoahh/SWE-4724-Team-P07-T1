import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerFaculty } from '../services/projectService'
import './CreateFaculty.css'

function CreateFaculty() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setSuccess('')

    if (!form.username.trim() || !form.email.trim() || !form.password) {
      setSubmitError('All fields are required.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setSubmitError('Passwords do not match.')
      return
    }

    if (form.password.length < 6) {
      setSubmitError('Password must be at least 6 characters.')
      return
    }

    try {
      setSubmitting(true)
      await registerFaculty({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role: 1,
      })
      setSuccess(`Account created for ${form.email.trim()}`)
      setForm({ username: '', email: '', password: '', confirmPassword: '' })
    } catch (err) {
      setSubmitError(err.message || 'Failed to create account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="cadmin">
      <nav className="cadmin-breadcrumb">
        <button className="cadmin-breadcrumb-link" onClick={() => navigate('/dashboard')}>Dashboard</button>
        <span className="cadmin-breadcrumb-sep">/</span>
        <span className="cadmin-breadcrumb-current">Create Faculty</span>
      </nav>

      <div className="cadmin-header">
        <h1 className="cadmin-title">Create Faculty Account</h1>
        <p className="cadmin-subtitle">Register a new faculty observer in the system.</p>
      </div>

      <div className="cadmin-card">
        <form onSubmit={onSubmit} className="cadmin-form">
          <div className="cadmin-row">
            <div className="cadmin-field">
              <label htmlFor="ca-username">Username</label>
              <input
                id="ca-username"
                name="username"
                value={form.username}
                onChange={onChange}
                placeholder="username"
                autoComplete="off"
                required
              />
            </div>
            <div className="cadmin-field">
              <label htmlFor="ca-email">Email</label>
              <input
                id="ca-email"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                placeholder="email@kennesaw.edu"
                autoComplete="off"
                required
              />
            </div>
          </div>

          <div className="cadmin-row">
            <div className="cadmin-field">
              <label htmlFor="ca-password">Password</label>
              <input
                id="ca-password"
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                placeholder="Min 6 characters"
                autoComplete="new-password"
                required
              />
            </div>
            <div className="cadmin-field">
              <label htmlFor="ca-confirm">Confirm Password</label>
              <input
                id="ca-confirm"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={onChange}
                placeholder="Re-enter password"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          {submitError && <div className="cadmin-error">{submitError}</div>}
          {success && <div className="cadmin-success">{success}</div>}

          <div className="cadmin-actions">
            <button type="button" className="cadmin-btn-secondary" onClick={() => navigate('/dashboard')}>
              Cancel
            </button>
            <button type="submit" className="cadmin-btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateFaculty
