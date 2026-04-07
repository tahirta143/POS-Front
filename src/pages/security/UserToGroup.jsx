import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { MdAppRegistration, MdArrowBack } from 'react-icons/md'
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
  return { groupId: '', userId: '' }
}

export default function UserToGroup() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [groups, setGroups] = useState([])
  const [users, setUsers] = useState([])
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
      const [groupsResponse, usersResponse] = await Promise.all([
        axiosInstance.get('/groups'),
        axiosInstance.get('/company-users'),
      ])
      setGroups(Array.isArray(groupsResponse.data) ? groupsResponse.data : [])
      setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : [])
    } catch (error) {
      setGroups([])
      setUsers([])
      setMessage(error?.response?.data?.message || 'Assignments could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  const assignments = useMemo(() => {
    return groups.flatMap((group) =>
      (group.users || []).map((user) => ({
        groupId: group.id,
        groupName: group.group_name,
        userId: user.id,
        userName: user.name || user.username || user.email,
        email: user.email,
      }))
    )
  }, [groups])

  async function handleSave(event) {
    event.preventDefault()
    if (!form.groupId || !form.userId) {
      toast.error('Group and user are required.')
      return
    }

    const selectedGroup = groups.find((group) => String(group.id) === String(form.groupId))
    if (!selectedGroup) {
      toast.error('Please select a valid group.')
      return
    }

    const currentUserIds = (selectedGroup.users || []).map((user) => Number(user.id))
    const nextUserId = Number(form.userId)

    if (currentUserIds.includes(nextUserId)) {
      toast.error('This user is already assigned to the selected group.')
      return
    }

    setSubmitting(true)
    setMessage('')
    try {
      await axiosInstance.put(`/groups/${selectedGroup.id}`, {
        groupName: selectedGroup.group_name,
        users: [...currentUserIds, nextUserId],
      })
      toast.success('User assigned to group successfully.')
      setForm(emptyForm())
      fetchPageData()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to assign user to group.')
    } finally {
      setSubmitting(false)
    }
  }

  async function removeAssignment(assignment) {
    const selectedGroup = groups.find((group) => group.id === assignment.groupId)
    if (!selectedGroup) return
    if (!window.confirm(`Remove ${assignment.userName} from ${assignment.groupName}?`)) return

    try {
      await axiosInstance.put(`/groups/${selectedGroup.id}`, {
        groupName: selectedGroup.group_name,
        users: (selectedGroup.users || [])
          .map((user) => Number(user.id))
          .filter((id) => id !== Number(assignment.userId)),
      })
      toast.success('User removed from group successfully.')
      fetchPageData()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to remove assignment.')
    }
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4">
      <button
        onClick={() => navigate('/security')}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-teal-300 bg-teal-50 px-3 py-1.5 text-[11px] font-semibold text-teal-700 hover:bg-teal-100 transition"
      >
        <MdArrowBack /> Back to Overview
      </button>

      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <SectionHeader
          title="Assign User to Group"
          description="Link users to specific software access groups."
          icon={<MdAppRegistration className="text-teal-600 text-3xl" />}
        />

        <StatusAlert type="error" message={message} />

        <form onSubmit={handleSave} className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <Field label="Assignment ID">
            <input
              type="text"
              className="h-8 w-full rounded-md border border-slate-100 bg-slate-50 px-2.5 text-[12px] font-mono"
              value="Auto generated"
              disabled
            />
          </Field>
          <Field label="Software Group" required>
            <select
              name="groupId"
              value={form.groupId}
              onChange={(event) => setForm((prev) => ({ ...prev, groupId: event.target.value }))}
              className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              required
            >
              <option value="">Select Software Group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>{group.group_name}</option>
              ))}
            </select>
          </Field>
          <Field label="User Selection" required>
            <select
              name="userId"
              value={form.userId}
              onChange={(event) => setForm((prev) => ({ ...prev, userId: event.target.value }))}
              className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              required
            >
              <option value="">Select User</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.username || user.email}
                </option>
              ))}
            </select>
          </Field>
          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-2 text-sm font-bold text-white shadow-lg hover:bg-teal-700 transition disabled:opacity-50"
            >
              {submitting ? 'Assigning...' : 'Assign User to Group'}
            </button>
          </div>
        </form>
      </Card>

      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4">User Group Assignments</h3>
        {loading ? (
          <TableState message="Loading assignments..." />
        ) : assignments.length === 0 ? (
          <TableState message="No assignments recorded yet." />
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Assignment ID</th>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Software Group</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {assignments.map((assignment) => (
                  <tr key={`${assignment.groupId}-${assignment.userId}`}>
                    <td className="px-6 py-3 font-mono text-xs text-slate-400">
                      #ASGN-{String(assignment.groupId).padStart(2, '0')}{String(assignment.userId).padStart(3, '0')}
                    </td>
                    <td className="px-6 py-3 font-semibold text-slate-700">{assignment.userName}</td>
                    <td className="px-6 py-3 text-slate-600">{assignment.groupName}</td>
                    <td className="px-6 py-3 text-slate-500">{assignment.email || '-'}</td>
                    <td className="px-6 py-3">
                      <div className="flex justify-end gap-2">
                        <ActionButton label="Remove" tone="rose" onClick={() => removeAssignment(assignment)} />
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
