import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { Card, Field, PageShell, SectionHeader, Toggle, TableState, ActionButton, StatusChip } from '../../components/layout/PageShell.jsx'
import axiosInstance from '../../services/axiosInstance'

export default function SubCategory() {
    const [form, setForm] = useState({
        category_id: '',
        subcategory_name: '',
        is_enable: true,
    })
    const [categories, setCategories] = useState([])
    const [subcategories, setSubcategories] = useState([])
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [editId, setEditId] = useState(null)

    useEffect(() => {
        fetchCategories()
        fetchSubcategories()
    }, [])

    const enabledCategories = useMemo(
        () => categories.filter((category) => category.is_enable === 1 || category.is_enable === true),
        [categories],
    )

    async function fetchCategories() {
        try {
            const response = await axiosInstance.get('/categories')
            const data = response.data
            setCategories(Array.isArray(data) ? data : data.data || [])
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to load category options.')
        }
    }

    async function fetchSubcategories() {
        setLoading(true)
        try {
            const response = await axiosInstance.get('/sub-categories')
            const data = response.data
            setSubcategories(Array.isArray(data) ? data : data.data || [])
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to load subcategories.')
            setSubcategories([])
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(event) {
        event.preventDefault()

        if (!form.category_id) {
            toast.error('Please select a category first.')
            return
        }

        if (!form.subcategory_name.trim()) {
            toast.error('Subcategory name is required.')
            return
        }

        setSubmitting(true)

        try {
            const payload = {
                category_id: form.category_id,
                sub_category_name: form.subcategory_name.trim(),
                is_enable: form.is_enable ? 1 : 0,
            }
            if (editId) {
                await axiosInstance.put(`/sub-categories/${editId}`, payload)
                toast.success('Subcategory updated successfully.')
            } else {
                await axiosInstance.post('/sub-categories', payload)
                toast.success('Subcategory created successfully.')
            }

            resetForm()
            fetchSubcategories()
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to save subcategory.')
        } finally {
            setSubmitting(false)
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Delete this subcategory?')) return

        try {
            await axiosInstance.delete(`/sub-categories/${id}`)
            toast.success('Subcategory deleted successfully.')
            fetchSubcategories()
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to delete subcategory.')
        }
    }

    function handleEdit(subcategory) {
        setEditId(subcategory.id)
        setForm({
            category_id: `${subcategory.category_id ?? ''}`,
            subcategory_name: subcategory.sub_category_name || '',
            is_enable: subcategory.is_enable === 1 || subcategory.is_enable === true,
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function resetForm() {
        setEditId(null)
        setForm({
            category_id: '',
            subcategory_name: '',
            is_enable: true,
        })
    }

    function getCategoryName(id) {
        return categories.find((category) => `${category.id}` === `${id}`)?.category_name || 'Unknown category'
    }

    return (
        <PageShell
            title="Subcategory setup"
            description="Link each subcategory to a parent category so inventory stays organized and counter staff can find products quickly."
            accent="from-sky-700 via-cyan-700 to-teal-600"
        >
            <div className="space-y-4">
                <Card className="border-l-[6px] border-l-teal-500 p-3">
                    <SectionHeader
                        title={editId ? 'Edit subcategory' : 'New subcategory'}
                        description="Choose a category, then enter the subcategory name."
                        icon={<SubCategoryIcon className="h-5 w-5" />}
                    />

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="grid gap-2 md:grid-cols-[200px_minmax(0,300px)]">
                            <Field label="Parent category" required hint="Only enabled categories are shown in this list.">
                                <div className="relative">
                                    <select
                                        value={form.category_id}
                                        onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))}
                                        className="h-7 w-full appearance-none rounded-md border border-slate-300 bg-white px-2 pr-7 text-[11px] text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                                    >
                                        <option value="">Select a category</option>
                                        {enabledCategories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.category_name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400">
                                        <ChevronDownIcon className="h-3.5 w-3.5" />
                                    </div>
                                </div>
                            </Field>

                            <Field label="Subcategory name" required hint={form.category_id ? `Selected: ${getCategoryName(form.category_id)}` : 'Select a category to continue.'}>
                                <input
                                    type="text"
                                    value={form.subcategory_name}
                                    onChange={(event) => setForm((current) => ({ ...current, subcategory_name: event.target.value }))}
                                    disabled={!form.category_id}
                                    placeholder="Enter subcategory name"
                                    className="h-7 w-full max-w-sm rounded-md border border-slate-300 bg-white px-2 text-[11px] text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                                />
                            </Field>
                        </div>

                        <Toggle
                            enabled={form.is_enable}
                            onChange={(value) => setForm((current) => ({ ...current, is_enable: value }))}
                            label="Enable subcategory"
                            description="Use the toggle when the subcategory should appear in active POS selection lists."
                        />

                        <div className="flex flex-wrap justify-end gap-2 pt-1">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex min-w-[120px] items-center justify-center rounded-xl bg-teal-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submitting ? 'Saving...' : editId ? 'Update' : 'Add'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                            >
                                Clear
                            </button>
                        </div>
                    </form>
                </Card>

                <Card className="p-3">
                    <SectionHeader
                        title="Subcategory list"
                        description={`${subcategories.length} subcategories linked to categories`}
                        icon={<ListIcon className="h-5 w-5" />}
                        action={
                            <button
                                type="button"
                                onClick={fetchSubcategories}
                                className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                            >
                                Refresh
                            </button>
                        }
                    />

                    {loading ? (
                        <TableState message="Loading subcategories..." />
                    ) : subcategories.length === 0 ? (
                        <TableState message="No subcategories found yet." />
                    ) : (
                        <div className="overflow-hidden rounded-2xl border border-slate-100">
                            <div className="overflow-x-auto lg:max-h-[500px] lg:overflow-y-auto">
                                <table className="min-w-full divide-y divide-slate-100">
                                    <thead className="bg-slate-50">
                                        <tr className="text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                                            <th className="px-3 py-2 w-12">#</th>
                                            <th className="px-3 py-2">Subcategory</th>
                                            <th className="px-3 py-2">Category</th>
                                            <th className="px-3 py-2">Status</th>
                                            <th className="px-3 py-2 text-right w-32">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {subcategories.map((subcategory, index) => (
                                            <tr key={subcategory.id ?? index} className="text-[11px] text-slate-700">
                                                <td className="px-3 py-2 text-slate-400">{index + 1}</td>
                                                <td className="px-3 py-2 font-medium text-slate-900">{subcategory.sub_category_name}</td>
                                                <td className="px-3 py-2">
                                                    <span className="inline-flex rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                                                        {getCategoryName(subcategory.category_id)}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <StatusChip enabled={subcategory.is_enable === 1 || subcategory.is_enable === true} />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <div className="flex justify-end gap-1.5">
                                                        <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(subcategory)} />
                                                        <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(subcategory.id)} />
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

function SubCategoryIcon({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a3 3 0 006 0M9 5a3 3 0 016 0" /></svg>
}

function ListIcon({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
}

function ChevronDownIcon({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
}