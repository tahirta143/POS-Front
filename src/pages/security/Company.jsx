import { useEffect, useState, useRef } from 'react'
import { Card, Field, PageShell, SectionHeader, StatusAlert, TableState, ActionButton } from '../../components/layout/PageShell.jsx'
import axiosInstance from '../../services/axiosInstance'
import { MdArrowBack, MdBusiness, MdCloudUpload } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'

const sectionStyles = {
  teal:    { accent: 'bg-teal-500',    header: 'border-teal-100 bg-teal-50/80' },
  emerald: { accent: 'bg-emerald-500', header: 'border-emerald-100 bg-emerald-50/80' },
  cyan:    { accent: 'bg-cyan-500',    header: 'border-cyan-100 bg-cyan-50/80' },
}

function SectionCard({ color = 'teal', title, children }) {
  const style = sectionStyles[color] ?? sectionStyles.teal
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm shadow-slate-100/50">
      <div className={`mb-2 flex items-center gap-2.5 rounded-md border px-2.5 py-1.5 ${style.header}`}>
        <span className={`h-4 w-1 rounded-full ${style.accent}`} />
        <h3 className="text-[13px] font-semibold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function createEmptyForm() {
  return {
    companyName: '',
    email: '',
    address: '',
    phoneNumber: '',
    website: '',
    renewableLicense: false,
    expiryDate: '',
    companyLogo: null,
  }
}

function LicenceBadge({ renewable, expiryDate }) {
  if (!renewable) return <span className="text-xs text-slate-400 italic">N/A</span>
  const expired = expiryDate && new Date(expiryDate) < new Date()
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
      expired ? 'bg-red-100 text-red-600' : 'bg-teal-100 text-teal-700'
    }`}>
      {expired ? 'Expired' : 'Active'}
    </span>
  )
}

export default function CompanyPage() {
  const [form, setForm] = useState(createEmptyForm)
  const [logoPreview, setLogoPreview] = useState(null)
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => { fetchCompanies() }, [])

  async function fetchCompanies() {
    setLoading(true)
    setError('')
    try {
      const response = await axiosInstance.get('/companies')
      const data = response.data
      setCompanies(Array.isArray(data) ? data : data.data || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load companies.')
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.companyName.trim() || !form.email.trim() )
      return setError('Company Name, Email, and Expiry Date are required.')

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const fd = new FormData()
      fd.append('companyName',      form.companyName.trim())
      fd.append('email',            form.email.trim())
      fd.append('address',          form.address.trim())
      fd.append('phoneNumber',      form.phoneNumber.trim())
      fd.append('website',          form.website.trim())
      fd.append('renewableLicense', form.renewableLicense)
      fd.append('expiryDate',       form.expiryDate)
      if (form.companyLogo instanceof File) fd.append('companyLogo', form.companyLogo)

      if (editId) {
        await axiosInstance.put(`/companies/${editId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        await axiosInstance.post('/companies', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      setSuccess(editId ? 'Company updated successfully.' : 'Company created successfully.')
      resetForm()
      fetchCompanies()
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to save the company.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this company?')) return
    try {
      await axiosInstance.delete(`/companies/${id}`)
      setSuccess('Company deleted successfully.')
      if (editId === id) resetForm()
      fetchCompanies()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete company.')
    }
  }

  function handleEdit(company) {
    setEditId(company.id)
    setForm({
      companyName:      company.company_name     || '',
      email:            company.email            || '',
      address:          company.address          || '',
      phoneNumber:      company.phone_number     || '',
      website:          company.website          || '',
      renewableLicense: !!company.renewable_license,
      expiryDate:       company.expiry_date ? company.expiry_date.split('T')[0] : '',
      companyLogo:      null,
    })
    setLogoPreview(
      company.company_logo
        ? `${axiosInstance.defaults.baseURL?.replace('/api', '')}/${company.company_logo}`
        : null
    )
    setError('')
    setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditId(null)
    setForm(createEmptyForm())
    setLogoPreview(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function updateField(key, value) {
    setForm(prev => ({
      ...prev,
      [key]: value,
      ...(key === 'renewableLicense' && !value ? { expiryDate: '' } : {}),
    }))
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    updateField('companyLogo', file || null)
    setLogoPreview(file ? URL.createObjectURL(file) : null)
  }

  const inputCls = "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"

  return (
    <PageShell
      title="Company Management"
      description="Register and manage company profiles and licensing"
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-5">
            <button
                onClick={() => navigate('/security')}
                className="flex items-center gap-2 rounded-lg bg-white border px-4 py-2 text-sm font-bold text-teal-700 hover:bg-teal-50 transition"
              >
                <MdArrowBack /> Back to Overview
              </button>
        <Card className="mx-auto max-w-5xl border-l-[6px] border-l-teal-500 p-3.5">
          <SectionHeader
            title={editId ? 'Edit Company' : 'Add New Company'}
            description="Setup company profile and licensing information."
            icon={<MdBusiness className="h-6 w-6" />}
            action={editId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel Edit
              </button>
            )}
          />

          <StatusAlert type="error"   message={error}   />
          <StatusAlert type="success" message={success} />

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 lg:grid-cols-[1fr_minmax(0,1fr)]">

              {/* ── Left: Company Details ── */}
              <SectionCard color="teal" title="Company Details">
                <div className="grid gap-4">
                  <Field label="Company Name" required>
                    <input
                      type="text"
                      value={form.companyName}
                      onChange={e => updateField('companyName', e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Email Address" required>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => updateField('email', e.target.value)}
                      placeholder="contact@company.com"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Phone Number">
                    <input
                      type="text"
                      value={form.phoneNumber}
                      onChange={e => updateField('phoneNumber', e.target.value)}
                      placeholder="e.g. 0300-1234567"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Address">
                    <textarea
                      rows={2}
                      value={form.address}
                      onChange={e => updateField('address', e.target.value)}
                      placeholder="Company address"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-[13px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                    />
                  </Field>
                </div>
              </SectionCard>

              {/* ── Right: Licensing, Online & Actions ── */}
              <div className="flex flex-col gap-3">
                <SectionCard color="emerald" title="Licensing & Online">
                  <div className="grid gap-4">
                    <Field label="Website">
                      <input
                        type="text"
                        value={form.website}
                        onChange={e => updateField('website', e.target.value)}
                        placeholder="https://www.company.com"
                        className={inputCls}
                      />
                    </Field>

                    <Field label="Renewable Licence">
                      <div className="flex items-center gap-3 h-10">
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={form.renewableLicense}
                            onChange={e => updateField('renewableLicense', e.target.checked)}
                          />
                          <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-teal-600 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                        </label>
                        <span className={`text-xs font-medium ${form.renewableLicense ? 'text-teal-600' : 'text-slate-400'}`}>
                          {form.renewableLicense ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </Field>

                    <Field label="Expiry Date" required={form.renewableLicense}>
                      <input
                        type="date"
                        value={form.expiryDate}
                        onChange={e => updateField('expiryDate', e.target.value)}
                        disabled={!form.renewableLicense}
                        className={`${inputCls} ${
                          !form.renewableLicense
                            ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'cursor-pointer'
                        }`}
                      />
                    </Field>

                    <Field label="Company Logo">
                      <label className="flex items-center justify-center w-full h-10 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition overflow-hidden">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo preview" className="h-full object-contain p-1" />
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <MdCloudUpload className="text-teal-600 text-base" />
                            {editId ? 'Replace Logo' : 'Upload Logo'}
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                          onChange={handleFileChange}
                        />
                      </label>
                    </Field>
                  </div>
                </SectionCard>

                <SectionCard color="cyan" title="Actions">
                  <div className="flex justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex min-w-[120px] items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex min-w-[140px] items-center justify-center rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? 'Saving...' : editId ? 'Update Company' : 'Save Company'}
                    </button>
                  </div>
                </SectionCard>
              </div>
            </div>
          </form>
        </Card>

        {/* ── Table Card ── */}
        <Card className="mx-auto max-w-5xl">
          <SectionHeader
            title="Company Registry"
            description={`${companies.length} registered companies`}
            icon={<MdBusiness className="h-6 w-6" />}
            action={
              <button
                type="button"
                onClick={fetchCompanies}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Refresh
              </button>
            }
          />

          {loading ? (
            <TableState message="Loading companies..." />
          ) : companies.length === 0 ? (
            <TableState message="No companies found yet." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <div className="overflow-x-auto lg:max-h-[500px] lg:overflow-y-auto w-full">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      <th className="px-4 py-4">Logo</th>
                      <th className="px-4 py-4">Company</th>
                      <th className="px-4 py-4">Email</th>
                      <th className="px-4 py-4">Phone</th>
                      <th className="px-4 py-4">Licence</th>
                      <th className="px-4 py-4">Expiry</th>
                      <th className="px-4 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {companies.map(c => (
                      <tr
                        key={c.id}
                        className={`text-sm transition hover:bg-slate-50/50 ${editId === c.id ? 'bg-teal-50/40' : ''}`}
                      >
                        <td className="px-4 py-3.5">
                          {c.company_logo ? (
                            <img
                              src={`${axiosInstance.defaults.baseURL?.replace('/api', '')}/${c.company_logo}`}
                              alt={c.company_name}
                              className="h-8 w-8 rounded-md object-contain border bg-white"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-400">
                              <MdBusiness className="text-base" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-900">{c.company_name}</td>
                        <td className="px-4 py-3.5 text-slate-600">{c.email}</td>
                        <td className="px-4 py-3.5 text-slate-600">{c.phone_number || '—'}</td>
                        <td className="px-4 py-3.5">
                          <LicenceBadge renewable={c.renewable_license} expiryDate={c.expiry_date} />
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex justify-end gap-2">
                            <ActionButton label="Edit"   tone="teal" onClick={() => handleEdit(c)}      />
                            <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(c.id)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  )
}