import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { MdArrowBack, MdSecurity } from 'react-icons/md'
import axiosInstance from '../../services/axiosInstance'
import {
  ActionButton,
  Card,
  Field,
  SectionHeader,
  StatusAlert,
  TableState,
} from '../../components/layout/PageShell.jsx'

function emptyForm() {
  return { groupId: '', moduleId: '', functionalityIds: [] }
}

export default function GroupRights() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [groups, setGroups] = useState([])
  const [modules, setModules] = useState([])
  const [functionalities, setFunctionalities] = useState([])
  const [rights, setRights] = useState([])
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchPageData()
  }, [])

  async function fetchPageData() {
    setLoading(true)
    setMessage('')
    try {
      const [groupsResponse, modulesResponse, functionsResponse, rightsResponse] = await Promise.all([
        axiosInstance.get('/groups'),
        axiosInstance.get('/modules'),
        axiosInstance.get('/functionalities'),
        axiosInstance.get('/add-rights'),
      ])
      setGroups(Array.isArray(groupsResponse.data) ? groupsResponse.data : [])
      setModules(Array.isArray(modulesResponse.data) ? modulesResponse.data : [])
      setFunctionalities(Array.isArray(functionsResponse.data) ? functionsResponse.data : [])
      setRights(Array.isArray(rightsResponse.data) ? rightsResponse.data : [])
    } catch (error) {
      setGroups([])
      setModules([])
      setFunctionalities([])
      setRights([])
      setMessage(error?.response?.data?.message || 'Group rights could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  const visibleFunctions = useMemo(() => {
    if (!form.moduleId) return []
    return functionalities.filter((row) => String(row.module_id) === String(form.moduleId))
  }, [form.moduleId, functionalities])

  async function handleSave(event) {
    event.preventDefault()
    if (!form.groupId || !form.moduleId) {
      toast.error('Group and module are required.')
      return
    }

    setSubmitting(true)
    setMessage('')
    try {
      const payload = {
        group: Number(form.groupId),
        module: Number(form.moduleId),
        functionalities: form.functionalityIds.map(Number),
      }

      if (editId) {
        await axiosInstance.put(`/add-rights/${editId}`, payload)
        toast.success('Group rights updated successfully.')
      } else {
        await axiosInstance.post('/add-rights', payload)
        toast.success('Group rights assigned successfully.')
      }

      resetForm()
      fetchPageData()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to save group rights.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleEdit(row) {
    setEditId(row.id)
    setForm({
      groupId: String(row.group?.id || row.group_id || ''),
      moduleId: String(row.module?.id || row.module_id || ''),
      functionalityIds: (row.functionalities || []).map((item) => String(item.id)),
    })
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(row) {
    if (!window.confirm('Delete this rights assignment?')) return
    try {
      await axiosInstance.delete(`/add-rights/${row.id}`)
      toast.success('Group rights removed successfully.')
      if (editId === row.id) resetForm()
      fetchPageData()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to delete group rights.')
    }
  }

  function resetForm() {
    setEditId(null)
    setForm(emptyForm())
    setMessage('')
  }

  function toggleFunctionality(functionalityId) {
    setForm((prev) => {
      const exists = prev.functionalityIds.includes(functionalityId)
      return {
        ...prev,
        functionalityIds: exists
          ? prev.functionalityIds.filter((id) => id !== functionalityId)
          : [...prev.functionalityIds, functionalityId],
      }
    })
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <button
        onClick={() => navigate('/security')}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-teal-300 bg-teal-50 px-3 py-1.5 text-[11px] font-semibold text-teal-700 hover:bg-teal-100 transition"
      >
        <MdArrowBack /> Back to Overview
      </button>

      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <SectionHeader
          title={editId ? 'Edit Group Rights' : 'Group Rights'}
          description="Assign modules and functionalities to specific user groups."
          icon={<MdSecurity className="text-teal-600 text-3xl" />}
          action={
            editId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel Edit
              </button>
            ) : null
          }
        />

        <StatusAlert type="error" message={message} />

        <form onSubmit={handleSave} className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Field label="Right ID">
              <input
                type="text"
                className="h-8 w-full rounded-md border border-slate-100 bg-slate-50 px-2.5 text-[12px] font-mono text-slate-500"
                value={editId ? `RGT-${String(editId).padStart(4, '0')}` : 'Auto generated'}
                disabled
              />
            </Field>
            <Field label="Group Selection" required>
              <select
                value={form.groupId}
                onChange={(event) => setForm((prev) => ({ ...prev, groupId: event.target.value }))}
                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                required
              >
                <option value="">Select Group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>{group.group_name}</option>
                ))}
              </select>
            </Field>
            <Field label="Module Selection" required>
              <select
                value={form.moduleId}
                onChange={(event) => setForm({ groupId: form.groupId, moduleId: event.target.value, functionalityIds: [] })}
                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                required
              >
                <option value="">Select Module</option>
                {modules.map((moduleRow) => (
                  <option key={moduleRow.id} value={moduleRow.id}>{moduleRow.module_name}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Allowed Functionalities">
            {form.moduleId ? (
              visibleFunctions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {visibleFunctions.map((row) => (
                    <label key={row.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={form.functionalityIds.includes(String(row.id))}
                        onChange={() => toggleFunctionality(String(row.id))}
                        className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span>{row.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  No functions are registered for the selected module yet.
                </div>
              )
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Select a module to choose functionalities.
              </div>
            )}
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-2 text-sm font-bold text-white shadow-lg hover:bg-teal-700 transition disabled:opacity-50"
            >
              <MdSecurity /> {submitting ? 'Saving...' : editId ? 'Update Rights' : 'Assign Rights'}
            </button>
          </div>
        </form>
      </Card>

      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Assigned Group Rights</h3>
        {loading ? (
          <TableState message="Loading group rights..." />
        ) : rights.length === 0 ? (
          <TableState message="No group rights assigned yet." />
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Right ID</th>
                  <th className="px-6 py-3">Group</th>
                  <th className="px-6 py-3">Module</th>
                  <th className="px-6 py-3">Functionalities</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rights.map((row) => (
                  <tr key={row.id}>
                    <td className="px-6 py-3 font-mono text-xs text-slate-400">#RGT-{String(row.id).padStart(3, '0')}</td>
                    <td className="px-6 py-3 font-semibold text-slate-700">{row.group?.groupName || row.group_name}</td>
                    <td className="px-6 py-3 text-slate-600">{row.module?.moduleName || row.module_name}</td>
                    <td className="px-6 py-3 text-slate-500">
                      {(row.functionalities || []).length > 0
                        ? row.functionalities.map((item) => item.name).join(', ')
                        : 'Module only'}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex justify-end gap-2">
                        <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(row)} />
                        <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(row)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
