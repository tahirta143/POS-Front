import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, Field, PageShell, SectionHeader, Toggle, TableState, ActionButton, StatusChip } from '../../components/layout/PageShell.jsx'
import axiosInstance from '../../services/axiosInstance'
import { confirmAction } from '../../components/ui/ConfirmDialog.jsx'
import { usePermissions } from '../../hooks/usePermissions'
import { MdLock, MdRefresh } from 'react-icons/md'

function createEmptyForm() {
  return {
    category_name: '',
    is_enable: true,
  }
}

export default function CategoryPage() {
  const { canCreate, canRead, canUpdate, canDelete, isAdmin } = usePermissions()
  const MODULE_NAME = "Item Category"

  const [form, setForm] = useState(createEmptyForm)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Permission checks
  const canCreateCategory = isAdmin || canCreate(MODULE_NAME)
  const canReadCategory = isAdmin || canRead(MODULE_NAME)
  const canUpdateCategory = isAdmin || canUpdate(MODULE_NAME)
  const canDeleteCategory = isAdmin || canDelete(MODULE_NAME)

  useEffect(() => {
    if (canReadCategory) {
      fetchCategories()
    }
  }, [canReadCategory])

  async function fetchCategories() {
    setLoading(true)
    try {
      const response = await axiosInstance.get('/categories')
      const data = response.data
      setCategories(Array.isArray(data) ? data : data.data || [])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load categories.')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!canCreateCategory && !canUpdateCategory) {
      toast.error("You don't have permission to save categories.")
      return
    }

    if (!form.category_name.trim()) {
      toast.error('Category name is required.')
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        category_name: form.category_name.trim(),
        is_enable: form.is_enable ? 1 : 0,
      }
      if (editId) {
        if (!canUpdateCategory) {
          toast.error("You don't have permission to update categories.")
          return
        }
        await axiosInstance.put(`/categories/${editId}`, payload)
        toast.success('Category updated successfully.')
      } else {
        if (!canCreateCategory) {
          toast.error("You don't have permission to create categories.")
          return
        }
        await axiosInstance.post('/categories', payload)
        toast.success('Category created successfully.')
      }
      resetForm()
      setIsFormOpen(false)
      fetchCategories()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save category.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!canDeleteCategory) {
      toast.error("You don't have permission to delete categories.")
      return
    }
    const confirmed = await confirmAction({
      title: 'Delete category',
      message: 'This category will be removed from the system. This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      type: 'danger',
    })
    if (!confirmed) return

    try {
      await axiosInstance.delete(`/categories/${id}`)
      toast.success('Category deleted successfully.')
      fetchCategories()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete category.')
    }
  }

  function handleEdit(category) {
    if (!canUpdateCategory) {
      toast.error("You don't have permission to edit categories.")
      return
    }
    setEditId(category.id)
    setForm({
      category_name: category.category_name || '',
      is_enable: category.is_enable === 1 || category.is_enable === true,
    })
    setIsFormOpen(true)
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditId(null)
    setForm(createEmptyForm())
  }

  // Access Denied
  if (!canReadCategory) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg border border-red-100">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdLock className="text-5xl text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
            <p className="text-slate-500 mb-4">
              You don't have permission to view Categories.
            </p>
            <div className="bg-slate-50 rounded-lg p-3 text-left">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Required Permission:</p>
              <p className="text-[12px] font-mono text-slate-700">Read Item Category</p>
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
            <h1 className="text-xl font-bold text-slate-900">Category Setup</h1>
            <p className="text-sm text-slate-500">Organize and manage your primary item classifications.</p>
          </div>
          {canCreateCategory && (
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
                  Add New Category
                </>
              )}
            </button>
          )}
        </div>

        {/* Collapsible Form - Only show if user can create */}
        <AnimatePresence>
          {isFormOpen && canCreateCategory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <Card className="border-l-[6px] border-l-teal-500 p-3 mb-6">
                <SectionHeader
                  title={editId ? 'Edit category' : 'New category'}
                  description="Create or update a primary item classification."
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.53 0 1.04.21 1.41.59l7 7a2 2 0 010 2.82l-7 7a2 2 0 01-2.82 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  }
                />

                <form onSubmit={handleSubmit} className="space-y-3">
                  <Field label="Category name" required hint="Example: Beverages, Snacks, Dairy">
                    <input
                      type="text"
                      value={form.category_name}
                      onChange={(e) => setForm((current) => ({ ...current, category_name: e.target.value }))}
                      placeholder="Enter category name"
                      className="h-8 w-full max-w-sm rounded-md border border-slate-300 bg-white px-2.5 text-[12px] text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                    />
                  </Field>

                  <Toggle
                    enabled={form.is_enable}
                    onChange={(value) => setForm((current) => ({ ...current, is_enable: value }))}
                    label="Enable category"
                    description="Enabled categories are visible in POS and inventory forms."
                  />

                  <div className="flex flex-wrap justify-end gap-2 pt-1">
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
            title="Category list"
            description={`${categories.length} categories configured`}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            }
            action={
              <div className="p-4">
                <button
                  type="button"
                  onClick={fetchCategories}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <MdRefresh className="inline mr-1" /> Refresh
                </button>
              </div>
            }
          />

          {loading ? (
            <TableState message="Loading categories..." />
          ) : categories.length === 0 ? (
            <TableState message="No categories found yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3 w-12">#</th>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {categories.map((category, index) => (
                    <motion.tr 
                      key={category.id ?? index} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group transition-colors hover:bg-teal-50/30"
                    >
                      <td className="px-5 py-4 text-[11px] text-slate-400 font-mono">{index + 1}</td>
                      <td className="px-5 py-4 font-medium text-slate-800">{category.category_name}</td>
                      <td className="px-5 py-4">
                        <StatusChip enabled={category.is_enable === 1 || category.is_enable === true} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {canUpdateCategory && (
                            <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(category)} />
                          )}
                          {canDeleteCategory && (
                            <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(category.id)} />
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