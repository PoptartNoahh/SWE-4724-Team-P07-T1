import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAdvisors, getProjectSettings, updateProject } from '../services/projectService'
import './ProjectSettings.css'

const SEMESTER_OPTIONS = ['SPRING', 'FALL']

function stripPrefixBeforeFirstDash(name) {
  const raw = String(name ?? '')
  const idx = raw.indexOf('-')
  return idx >= 0 ? raw.slice(idx + 1) : raw
}

function buildStoredProjectName({ displayName, projectYear, projectSemester }) {
  const fullName = String(displayName ?? '').trim()
  const yearTwoDigits = String(projectYear ?? '').replace(/\D/g, '').slice(-2)
  const semesterChar = String(projectSemester ?? '').toUpperCase() === 'SPRING' ? 'S' : 'F'
  return `${semesterChar}${yearTwoDigits}-${fullName}`
}

function ProjectSettings() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  const [advisors, setAdvisors] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    project_name: '',
    project_year: String(new Date().getFullYear()),
    project_semester: 'FALL',
    project_sponsor_name: '',
    sponsor_number: '',
    project_description: '',
    project_advisor: '',
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      setError('')
      setSuccess('')
      setLoading(true)
      try {
        const [settings, advisorList] = await Promise.all([
          getProjectSettings(projectId),
          getAdvisors(),
        ])
        if (cancelled) return

        setAdvisors(Array.isArray(advisorList) ? advisorList : [])
        setForm({
          project_name: stripPrefixBeforeFirstDash(settings?.project_name ?? ''),
          project_year: String(settings?.project_year ?? new Date().getFullYear()),
          project_semester: String(settings?.project_semester ?? 'FALL').toUpperCase(),
          project_sponsor_name: settings?.project_sponsor_name ?? '',
          sponsor_number: settings?.sponsor_number ?? '',
          project_description: settings?.project_description ?? '',
          project_advisor: settings?.project_advisor != null ? String(settings.project_advisor) : '',
        })
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load project settings.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [projectId])

  const advisorOptions = useMemo(
    () =>
      advisors.map((a) => ({
        value: String(a.id),
        label: a.email ? `${a.name} (${a.email})` : a.name || `User ${a.id}`,
      })),
    [advisors],
  )

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    const name = form.project_name.trim()
    const desc = form.project_description.trim()
    const sponsorNumber = form.sponsor_number.trim()
    const year = Number.parseInt(form.project_year, 10)
    const semester = String(form.project_semester || '').toUpperCase()

    if (!name || !desc || !form.project_advisor) return 'Please fill out all required fields.'
    const storedName = buildStoredProjectName({
      displayName: name,
      projectYear: form.project_year,
      projectSemester: form.project_semester,
    })
    if (storedName.length > 500)
      return 'Project name must be 500 characters or less (including the semester/year prefix).'
    if (desc.length > 500) return 'Project description must be 500 characters or less.'
    if (!Number.isFinite(year) || year < 1900 || year > 3000) return 'Please enter a valid year.'
    if (!SEMESTER_OPTIONS.includes(semester)) return 'Please select a valid semester.'
    if (sponsorNumber.length > 25) return 'Sponsor phone number must be 25 characters or less.'
    return null
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const v = validate()
    if (v) {
      setError(v)
      return
    }

    try {
      setSaving(true)
      const storedProjectName = buildStoredProjectName({
        displayName: form.project_name,
        projectYear: form.project_year,
        projectSemester: form.project_semester,
      })
      await updateProject(projectId, {
        project_name: storedProjectName,
        project_year: Number.parseInt(form.project_year, 10),
        project_semester: String(form.project_semester).toUpperCase(),
        project_sponsor_name: form.project_sponsor_name.trim(),
        sponsor_number: form.sponsor_number.trim(),
        project_description: form.project_description.trim(),
        project_advisor: Number.parseInt(form.project_advisor, 10),
      })
      setSuccess('Saved.')
    } catch (e2) {
      setError(e2.message || 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="proj-settings-wrap">
      <div className="proj-settings-card">
        <div className="proj-settings-header">
          <div>
            <h1>Project Settings</h1>
          </div>
          <button type="button" className="proj-settings-back" onClick={() => navigate(`/projects/${projectId}`)}>
            Back to project
          </button>
        </div>

        {loading ? (
          <div className="proj-settings-loading">Loading settings…</div>
        ) : (
          <form onSubmit={onSubmit} className="proj-settings-form">
            <label>
              Project Name
              <input
                name="project_name"
                value={form.project_name}
                onChange={onChange}
                maxLength={496}
                required
              />
              <div className="proj-settings-help">{form.project_name.length}/500</div>
            </label>

            <div className="proj-settings-grid">
              <label>
                Year
                <input
                  name="project_year"
                  type="number"
                  value={form.project_year}
                  onChange={onChange}
                  required
                />
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
            </div>

            <div className="proj-settings-grid">
              <label>
                Sponsor Name
                <input
                  name="project_sponsor_name"
                  value={form.project_sponsor_name}
                  onChange={onChange}
                />
              </label>

              <label>
                Sponsor Phone Number
                <input
                  name="sponsor_number"
                  value={form.sponsor_number}
                  onChange={onChange}
                  maxLength={25}
                />
              </label>
            </div>

            <label>
              Advisor
              <select name="project_advisor" value={form.project_advisor} onChange={onChange} required>
                <option value="">Select an advisor</option>
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
                rows={5}
                maxLength={500}
                required
              />
              <div className="proj-settings-help">{form.project_description.length}/500</div>
            </label>

            {error && <div className="proj-settings-error">{error}</div>}
            {success && <div className="proj-settings-success">{success}</div>}

            <div className="proj-settings-actions">
              <button type="button" className="secondary-btn" onClick={() => navigate(`/projects/${projectId}`)}>
                Cancel
              </button>
              <button type="submit" className="primary-btn" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ProjectSettings

