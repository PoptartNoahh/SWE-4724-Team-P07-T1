import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createProject, getAdvisors } from '../services/projectService'
import './CreateProject.css'

const SEMESTER_OPTIONS = ['SPRING', 'FALL']

function CreateProject() {
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()

  const [advisors, setAdvisors] = useState([])
  const [loadingAdvisors, setLoadingAdvisors] = useState(true)
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    project_name: '',
    project_semester: 'FALL',
    project_sponsor: '',
    sponsor_number: '',
    project_advisor: '',
    project_description: '',
    project_year: String(currentYear),
  })

  useEffect(() => {
    let cancelled = false
    async function loadAdvisors() {
      try {
        setLoadingAdvisors(true)
        const data = await getAdvisors()
        if (!cancelled) {
          setAdvisors(Array.isArray(data) ? data : [])
        }
      } catch (e) {
        if (!cancelled) {
          setSubmitError('Could not load advisors from the database.')
          setAdvisors([])
        }
      } finally {
        if (!cancelled) setLoadingAdvisors(false)
      }
    }
    loadAdvisors()
    return () => {
      cancelled = true
    }
  }, [])

  const advisorOptions = useMemo(
    () =>
      advisors.map((a) => ({
        value: String(a.id),
        label: a.email ? `${a.name} (${a.email})` : a.name || `User ${a.id}`,
      })),
    [advisors]
  )

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    if (!form.project_name || !form.project_sponsor || !form.project_advisor || !form.project_description || !form.project_year) {
      setSubmitError('Please fill out all fields.')
      return
    }

    try {
      setSubmitting(true)
      const fullName = form.project_name.trim()
      const yearTwoDigits = String(form.project_year).replace(/\D/g, '').slice(-2)
      const semesterChar = form.project_semester === 'SPRING' ? 'S' : 'F'
      // Potentially fix semesterchar to have - after
      const storedProjectName = `${semesterChar}${yearTwoDigits}-${fullName}`

      await createProject({
        project_name: storedProjectName,
        project_semester: form.project_semester,
        project_sponsor: form.project_sponsor.trim(),
        sponsor_number: form.sponsor_number.trim() || null,
        project_advisor: Number.parseInt(form.project_advisor, 10),
        project_description: form.project_description.trim(),
        project_year: Number.parseInt(form.project_year, 10),
      })
      navigate('/')
    } catch (err) {
      setSubmitError(err.message || 'Failed to create project.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="create-project-wrap">
      <div className="create-project-card">
        <h1>Create Project</h1>
        <p className="create-project-subtitle">Insert a new project into the Azure SQL `Project` table.</p>

        <form onSubmit={onSubmit} className="create-project-form">
          <label>
            Project Name
            <input name="project_name" value={form.project_name} onChange={onChange} required />
          </label>
          <label>
            Year
            <input name="project_year" type="number" value={form.project_year} onChange={onChange} required />
          </label>
          <label>
            Semester
            <select name="project_semester" value={form.project_semester} onChange={onChange} required>
              {SEMESTER_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label>
            Sponsor
            <input name="project_sponsor" value={form.project_sponsor} onChange={onChange} required />
          </label>

          <label>
            Sponsor Number
            <input
              name="sponsor_number"
              value={form.sponsor_number}
              onChange={onChange}
              maxLength={25}
              placeholder="Optional"
            />
          </label>

          <label>
            Advisor
            <select
              name="project_advisor"
              value={form.project_advisor}
              onChange={onChange}
              required
              disabled={loadingAdvisors}
            >
              <option value="">{loadingAdvisors ? 'Loading advisors...' : 'Select an advisor'}</option>
              {advisorOptions.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Description
            <textarea
              name="project_description"
              value={form.project_description}
              onChange={onChange}
              rows={4}
              required
            />
          </label>

          

          {submitError && <div className="create-project-error">{submitError}</div>}

          <div className="create-project-actions">
            <button type="button" className="secondary-btn" onClick={() => navigate('/')}>
              Cancel
            </button>
            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateProject
