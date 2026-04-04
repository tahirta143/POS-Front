// pages/Profile.jsx
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { PageShell, StatusAlert } from '../components/layout/PageShell.jsx'
import axiosInstance from '../services/axiosInstance'
import {
  MdPerson, MdLock, MdEdit, MdSave, MdClose,
  MdEmail, MdBadge, MdCalendarToday, MdShield
} from 'react-icons/md'

// SectionCard Component
function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
          <Icon className="text-base" />
        </div>
        <h3 className="text-[14px] font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// InputField Component
function InputField({ label, type = 'text', value, onChange, disabled, placeholder, required }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full h-10 rounded-xl border px-3 text-[13px] outline-none transition-all duration-150 ${
          disabled
            ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-white border-slate-200 text-slate-800 focus:border-teal-400 focus:ring-2 focus:ring-teal-100'
        }`}
      />
    </div>
  )
}

export default function Profile() {
  const { user } = useSelector(state => state.auth)

  const [editingInfo, setEditingInfo] = useState(false)
  const [editingPass, setEditingPass] = useState(false)
  const [submittingInfo, setSubmittingInfo] = useState(false)
  const [submittingPass, setSubmittingPass] = useState(false)
  const [infoError, setInfoError] = useState('')
  const [infoSuccess, setInfoSuccess] = useState('')
  const [passError, setPassError] = useState('')
  const [passSuccess, setPassSuccess] = useState('')
  const [profileData, setProfileData] = useState(null)

  const [infoForm, setInfoForm] = useState({
    name: '',
    email: '',
  })

  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await axiosInstance.get('/auth/profile')
      if (response.data.success) {
        setProfileData(response.data.data)
        setInfoForm({
          name: response.data.data.name || '',
          email: response.data.data.email || '',
        })
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
      setInfoError('Failed to load profile data')
    }
  }

  // Auto-clear alerts
  useEffect(() => {
    if (infoSuccess || infoError) {
      const t = setTimeout(() => { setInfoSuccess(''); setInfoError('') }, 4000)
      return () => clearTimeout(t)
    }
  }, [infoSuccess, infoError])

  useEffect(() => {
    if (passSuccess || passError) {
      const t = setTimeout(() => { setPassSuccess(''); setPassError('') }, 4000)
      return () => clearTimeout(t)
    }
  }, [passSuccess, passError])

  const initials = (profileData?.name || user?.name || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  async function handleInfoSubmit(e) {
    e.preventDefault()
    if (!infoForm.name.trim() || !infoForm.email.trim())
      return setInfoError('Name and Email are required.')

    setSubmittingInfo(true)
    setInfoError('')
    setInfoSuccess('')
    try {
      const response = await axiosInstance.put('/auth/profile', {
        name: infoForm.name.trim(),
        email: infoForm.email.trim(),
      })
      
      if (response.data.success) {
        setInfoSuccess('Profile updated successfully.')
        setProfileData(response.data.data)
        setEditingInfo(false)
        
        // Optionally update Redux store here if needed
        // dispatch(updateUser(response.data.data))
      }
    } catch (err) {
      setInfoError(err?.response?.data?.message || 'Failed to update profile.')
    } finally {
      setSubmittingInfo(false)
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    if (!passForm.currentPassword || !passForm.newPassword || !passForm.confirmPassword)
      return setPassError('All password fields are required.')
    if (passForm.newPassword !== passForm.confirmPassword)
      return setPassError('New passwords do not match.')
    if (passForm.newPassword.length < 6)
      return setPassError('New password must be at least 6 characters.')

    setSubmittingPass(true)
    setPassError('')
    setPassSuccess('')
    try {
      await axiosInstance.put('/auth/change-password', {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      })
      setPassSuccess('Password changed successfully.')
      setEditingPass(false)
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPassError(err?.response?.data?.message || 'Failed to change password.')
    } finally {
      setSubmittingPass(false)
    }
  }

  function cancelInfo() {
    setEditingInfo(false)
    setInfoForm({ 
      name: profileData?.name || '', 
      email: profileData?.email || '' 
    })
    setInfoError('')
  }

  function cancelPass() {
    setEditingPass(false)
    setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setPassError('')
  }

  return (
    <PageShell
      title="My Profile"
      description="Manage your account information and security"
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="max-w-3xl mx-auto space-y-5 z-2">

        {/* Avatar Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Gradient banner */}
          <div className="h-24 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 relative">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}
            />
          </div>

          <div className="px-6 pb-5 relative z-2">
            {/* Avatar overlapping banner */}
            <div className="flex items-end gap-4 -mt-10 mb-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg border-4 border-white">
                <span className="text-white text-2xl font-bold">{initials}</span>
              </div>
              <div className="pb-1">
                <h2 className="text-lg font-bold text-slate-800">{profileData?.name || user?.name || 'User'}</h2>
                <p className="text-[12px] text-slate-400 capitalize">{profileData?.role || user?.role || 'User'}</p>
              </div>
            </div>

            {/* Info pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { icon: MdEmail, label: profileData?.email || user?.email || '—' },
                { icon: MdBadge, label: profileData?.role || user?.role || 'User', capitalize: true },
                { icon: MdCalendarToday, label: profileData?.created_at ? `Joined ${new Date(profileData.created_at).toLocaleDateString('en-PK', { month: 'short', year: 'numeric' })}` : 'Active Member' },
              ].map((pill, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-full px-3 py-1">
                  <pill.icon className="text-teal-500 text-sm" />
                  <span className={`text-[11px] text-slate-600 font-medium ${pill.capitalize ? 'capitalize' : ''}`}>
                    {pill.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Personal Info Section */}
        <SectionCard title="Personal Information" icon={MdPerson}>
          <StatusAlert type="error" message={infoError} />
          <StatusAlert type="success" message={infoSuccess} />

          <form onSubmit={handleInfoSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Full Name" required
                value={infoForm.name}
                onChange={e => setInfoForm(p => ({ ...p, name: e.target.value }))}
                disabled={!editingInfo}
                placeholder="Your full name"
              />
              <InputField
                label="Email Address" type="email" required
                value={infoForm.email}
                onChange={e => setInfoForm(p => ({ ...p, email: e.target.value }))}
                disabled={!editingInfo}
                placeholder="your@email.com"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              {editingInfo ? (
                <>
                  <button type="button" onClick={cancelInfo}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    <MdClose className="text-base" /> Cancel
                  </button>
                  <button type="submit" disabled={submittingInfo}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-[13px] font-semibold text-white hover:bg-teal-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                    <MdSave className="text-base" />
                    {submittingInfo ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setEditingInfo(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-teal-200 text-[13px] font-semibold text-teal-600 hover:bg-teal-50 transition-colors">
                  <MdEdit className="text-base" /> Edit Profile
                </button>
              )}
            </div>
          </form>
        </SectionCard>

        {/* Change Password Section */}
        <SectionCard title="Change Password" icon={MdLock}>
          <StatusAlert type="error" message={passError} />
          <StatusAlert type="success" message={passSuccess} />

          {!editingPass ? (
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-slate-300" />
                  ))}
                </div>
                <span className="text-[12px] text-slate-400">Update your password regularly</span>
              </div>
              <button onClick={() => setEditingPass(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 text-[13px] font-semibold text-rose-600 hover:bg-rose-50 transition-colors">
                <MdShield className="text-base" /> Change Password
              </button>
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <InputField
                label="Current Password" type="password" required
                value={passForm.currentPassword}
                onChange={e => setPassForm(p => ({ ...p, currentPassword: e.target.value }))}
                placeholder="Enter current password"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="New Password" type="password" required
                  value={passForm.newPassword}
                  onChange={e => setPassForm(p => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Min. 6 characters"
                />
                <InputField
                  label="Confirm New Password" type="password" required
                  value={passForm.confirmPassword}
                  onChange={e => setPassForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Repeat new password"
                />
              </div>

              {/* Password strength indicator */}
              {passForm.newPassword && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[
                      passForm.newPassword.length >= 6,
                      /[A-Z]/.test(passForm.newPassword),
                      /[0-9]/.test(passForm.newPassword),
                      /[^A-Za-z0-9]/.test(passForm.newPassword),
                    ].map((met, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${met ? 'bg-teal-500' : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Strength: length ≥ 6 · uppercase · number · special character
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={cancelPass}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  <MdClose className="text-base" /> Cancel
                </button>
                <button type="submit" disabled={submittingPass}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-[13px] font-semibold text-white hover:bg-rose-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                  <MdShield className="text-base" />
                  {submittingPass ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </SectionCard>

      </div>
    </PageShell>
  )
}