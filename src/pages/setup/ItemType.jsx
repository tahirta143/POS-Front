import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, Field, PageShell, SectionHeader, Toggle, ActionButton, StatusChip, TableState } from '../../components/layout/PageShell.jsx'
import axiosInstance from '../../services/axiosInstance'
import { usePermissions } from '../../hooks/usePermissions'
import { MdLock, MdRefresh } from 'react-icons/md'
import { confirmAction } from '../../components/ui/ConfirmDialog.jsx'

function createEmptyForm() {
  return {
    type_name: '',
    description: '',
    is_enable: true,
  }
}

export default function ItemTypePage() {
  const { canCreate, canRead, canUpdate, canDelete, isAdmin } = usePermissions()
  const MODULE_NAME = "Item Type"

  const [form, setForm] = useState(createEmptyForm)
  const [itemTypes, setItemTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Permission checks
  const canCreateType = isAdmin || canCreate(MODULE_NAME)
  const canReadType = isAdmin || canRead(MODULE_NAME)
  const canUpdateType = isAdmin || canUpdate(MODULE_NAME)
  const canDeleteType = isAdmin || canDelete(MODULE_NAME)

  useEffect(() => {
    if (canReadType) {
      fetchItemTypes()
    }
  }, [canReadType])

  async function fetchItemTypes() {
    setLoading(true)
    try {
      const response = await axiosInstance.get('/item-types')
      const data = response.data
      setItemTypes(Array.isArray(data) ? data : data.data || [])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load item types.')
      setItemTypes([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!canCreateType && !canUpdateType) {
      toast.error("You don't have permission to save item types.")
      return
    }

    if (!form.type_name.trim()) {
      toast.error('Item type name is required.')
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        type_name: form.type_name.trim(),
        description: form.description.trim(),
        is_enable: form.is_enable ? 1 : 0,
      }
      if (editId) {
        if (!canUpdateType) {
          toast.error("You don't have permission to update item types.")
          return
        }
        await axiosInstance.put(`/item-types/${editId}`, payload)
        toast.success('Item type updated successfully.')
      } else {
        if (!canCreateType) {
          toast.error("You don't have permission to create item types.")
          return
        }
        await axiosInstance.post('/item-types', payload)
        toast.success('Item type created successfully.')
      }

      resetForm()
      setIsFormOpen(false)
      fetchItemTypes()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save item type.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!canDeleteType) {
      toast.error("You don't have permission to delete item types.")
      return
    }
    const confirmed = await confirmAction({
      title: 'Delete item type',
      message: 'This item type will be removed from the system. This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      type: 'danger',
    })
    if (!confirmed) return

    try {
      await axiosInstance.delete(`/item-types/${id}`)
      toast.success('Item type deleted successfully.')
      fetchItemTypes()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete item type.')
    }
  }

  function handleEdit(itemType) {
    if (!canUpdateType) {
      toast.error("You don't have permission to edit item types.")
      return
    }
    setEditId(itemType.id)
    setForm({
      type_name: itemType.type_name ?? '',
      description: itemType.description ?? '',
      is_enable: itemType.is_enable === 1 || itemType.is_enable === true,
    })
    setIsFormOpen(true)
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditId(null)
    setForm(createEmptyForm())
  }

  // Access Denied
  if (!canReadType) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg border border-red-100">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdLock className="text-5xl text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
            <p className="text-slate-500 mb-4">
              You don't have permission to view Item Types.
            </p>
            <div className="bg-slate-50 rounded-lg p-3 text-left">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Required Permission:</p>
              <p className="text-[12px] font-mono text-slate-700">Read Item Type</p>
            </div>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="space-y-4">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Item Type Setup</h1>
            <p className="text-sm text-slate-500">Define and manage different types of items in your inventory.</p>
          </div>
          {canCreateType && (
            <button
              onClick={() => {
                if (isFormOpen && editId) {
                  resetForm()
                } else {
                  setIsFormOpen(!isFormOpen)
                  if (!isFormOpen) resetForm()
                }
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition duration-300 shadow-sm ${
                isFormOpen 
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                  : 'bg-teal-600 text-white hover:bg-teal-700 hover:shadow-teal-100'
              }`}
            >
              {isFormOpen ? (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  Close Form
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                  Add New Type
                </>
              )}
            </button>
          )}
        </div>

        {/* Collapsible Form - Only show if user can create */}
        <AnimatePresence>
          {isFormOpen && canCreateType && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <Card className="border-l-[6px] border-l-teal-500 p-3 mb-6">
                <SectionHeader
                  title={editId ? 'Edit Item Type' : 'New Item Type'}
                  description="Item type stays separate from category and subcategory classification."
                  icon={<ItemTypeIcon className="h-5 w-5" />}
                />

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid gap-2 md:grid-cols-[280px_minmax(0,420px)]">
                    <Field label="Item type name" required hint="Example: Product, Service, Bundle">
                      <input
                        type="text"
                        value={form.type_name ?? ''}
                        onChange={(event) => setForm((current) => ({ ...current, type_name: event.target.value }))}
                        placeholder="Enter item type name"
                        className="h-8 w-full max-w-xs rounded-md border border-slate-300 bg-white px-2.5 text-[12px] text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                      />
                    </Field>

                    <Field label="Description" hint="Optional short note for internal reference.">
                      <textarea
                        rows={2}
                        value={form.description ?? ''}
                        onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                        placeholder="Short description"
                        className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[12px] text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                      />
                    </Field>
                  </div>

                  <Toggle
                    enabled={form.is_enable}
                    onChange={(value) => setForm((current) => ({ ...current, is_enable: value }))}
                    label="Enable item type"
                    description="Enabled item types can be used by frontend POS setup forms."
                  />

                  <div className="flex flex-wrap justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex min-w-[120px] items-center justify-center rounded-xl bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? 'Saving...' : editId ? 'Update' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetForm()
                        setIsFormOpen(false)
                      }}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List card */}
        <Card className="p-0 overflow-hidden">
          <SectionHeader
            title="Item type list"
            description={`${itemTypes.length} item types configured`}
            icon={<ListIcon className="h-5 w-5" />}
            action={
              <div className="p-4">
                <button
                  type="button"
                  onClick={fetchItemTypes}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <MdRefresh className="inline mr-1" /> Refresh
                </button>
              </div>
            }
          />

          {loading ? (
            <TableState message="Loading item types..." />
          ) : itemTypes.length === 0 ? (
            <TableState message="No item types found yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3 w-12">#</th>
                    <th className="px-5 py-3">Type Details</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {itemTypes.map((itemType, index) => (
                    <motion.tr 
                      key={itemType.id ?? index} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group transition-colors hover:bg-teal-50/30"
                    >
                      <td className="px-5 py-4 text-[11px] text-slate-400 font-mono">{index + 1}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-slate-800">{itemType.type_name}</span>
                          {itemType.description && <span className="mt-0.5 text-[10px] text-slate-500">{itemType.description}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusChip enabled={itemType.is_enable === 1 || itemType.is_enable === true} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {canUpdateType && (
                            <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(itemType)} />
                          )}
                          {canDeleteType && (
                            <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(itemType.id)} />
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  )
}

function ItemTypeIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" /></svg>
}

function ListIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
}