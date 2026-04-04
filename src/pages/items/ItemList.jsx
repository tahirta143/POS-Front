import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { Card, Field, PageShell, SectionHeader, StatusAlert } from '../../components/layout/PageShell.jsx'
import axiosInstance from '../../services/axiosInstance'

function createEmptyForm() {
  return {
    category_id: '',
    item_type_id: '',
    subcategory_id: '',
    item_name: '',
    manufacturer: '',
    supplier: '',
    purchase_price: '',
    sale_price: '',
    opening_stock: '',
    barcode: '',
    description: '',
    store_location: '',
    item_unit: '',
    per_unit: '',
    reorder_level: '',
    is_enable: true,
    image_name: '',
    image_file: null,
  }
}

const sectionStyles = {
  lime: {
    accent: 'bg-lime-500',
    header: 'border-lime-100 bg-lime-50/80',
  },
  sky: {
    accent: 'bg-sky-500',
    header: 'border-sky-100 bg-sky-50/80',
  },
  violet: {
    accent: 'bg-violet-500',
    header: 'border-violet-100 bg-violet-50/80',
  },
  emerald: {
    accent: 'bg-emerald-500',
    header: 'border-emerald-100 bg-emerald-50/80',
  },
  amber: {
    accent: 'bg-amber-500',
    header: 'border-amber-100 bg-amber-50/80',
  },
}

export default function ItemPage() {
  const [form, setForm] = useState(createEmptyForm)
  const [categories, setCategories] = useState([])
  const [itemTypes, setItemTypes] = useState([])
  const [manufacturers, setManufacturers] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [locations, setLocations] = useState([])
  const [units, setUnits] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchLookups()
  }, [])

  const enabledCategories = useMemo(
    () => categories.filter((category) => category.is_enable === 1 || category.is_enable === true),
    [categories],
  )
  const enabledItemTypes = useMemo(
    () => itemTypes.filter((itemType) => itemType.is_enable === 1 || itemType.is_enable === true),
    [itemTypes],
  )
  const enabledManufacturers = useMemo(
    () => manufacturers.filter((m) => m.status === 1 || m.status === true),
    [manufacturers],
  )
  const enabledSuppliers = useMemo(
    () => suppliers.filter((s) => s.status === 1 || s.status === true),
    [suppliers],
  )
  const enabledSubcategories = useMemo(
    () => {
      if (!form.category_id) return []
      return subcategories.filter((sc) => String(sc.category_id) === String(form.category_id))
    },
    [subcategories, form.category_id]
  )

  async function fetchLookups() {
    try {
      const [catRes, typeRes, mfgRes, supRes, locRes, unitRes, subcatRes] = await Promise.all([
        axiosInstance.get('/categories'),
        axiosInstance.get('/item-types'),
        axiosInstance.get('/manufacturers'),
        axiosInstance.get('/suppliers'),
        axiosInstance.get('/shelve-locations'),
        axiosInstance.get('/item-units'),
        axiosInstance.get('/sub-categories/list'),
      ])

      setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.data || [])
      setItemTypes(Array.isArray(typeRes.data) ? typeRes.data : typeRes.data?.data || [])
      setManufacturers(Array.isArray(mfgRes.data) ? mfgRes.data : mfgRes.data?.data || [])
      setSuppliers(Array.isArray(supRes.data) ? supRes.data : supRes.data?.data || [])
      setLocations(Array.isArray(locRes.data) ? locRes.data : locRes.data?.data || [])
      setUnits(Array.isArray(unitRes.data) ? unitRes.data : unitRes.data?.data || [])
      setSubcategories(Array.isArray(subcatRes.data) ? subcatRes.data : subcatRes.data?.data || [])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to load some dropdown options.')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.category_id || !form.item_name.trim()) {
      toast.error('Category and item name are required.')
      return
    }

    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('itemName', form.item_name.trim())
      formData.append('purchasePrice', parseFloat(form.purchase_price) || 0)
      formData.append('salePrice', parseFloat(form.sale_price) || 0)
      formData.append('stock', parseFloat(form.opening_stock) || 0)
      formData.append('itemCategoryId', form.category_id)
      
      if (form.item_type_id) formData.append('itemTypeId', form.item_type_id)
      if (form.subcategory_id) formData.append('itemSubcategoryId', form.subcategory_id)
      if (form.manufacturer) formData.append('manufacturerId', form.manufacturer)
      if (form.supplier) formData.append('supplierId', form.supplier)
      if (form.store_location) formData.append('shelveLocationId', form.store_location)
      if (form.item_unit) formData.append('itemUnitId', form.item_unit)
      
      formData.append('description', form.description.trim())
      formData.append('reorder', parseFloat(form.reorder_level) || 0)

      if (form.image_file) {
        formData.append('itemImage', form.image_file)
      }

      await axiosInstance.post('/item-details', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success('Item successfully added.')
      setForm(createEmptyForm())
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save the item details.')
    } finally {
      setSubmitting(false)
    }
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0]
    setForm((current) => ({
      ...current,
      image_name: file ? file.name : '',
      image_file: file || null
    }))
  }

  function resetForm() {
    setForm(createEmptyForm())
  }

  return (
    <PageShell
      title="Add new item"
      description="A compact item-entry page using the same soft card layout, grouped sections, and dropdown/input rhythm as your example screen."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <Card className="mx-auto max-w-6xl border-l-[6px] border-l-teal-500 p-3">
        <SectionHeader
          title="New item registration"
          description="Fill the core item information, pricing, details, image, and status."
          icon={<ItemFormIcon className="h-5 w-5" />}
        />

        <form onSubmit={handleSubmit} className="space-y-1.5">
          <SectionCard color="#CCFBF1" title="Basic information">
            <div className="grid gap-1.5 xl:grid-cols-[1fr_1fr_1.05fr]">
              <SelectField
                label="Item category"
                required
                value={form.category_id}
                onChange={(value) => updateField('category_id', value)}
                options={enabledCategories.map((category) => ({ value: category.id, label: category.category_name }))}
                placeholder="Select category"
              />
              <SelectField
                label="Item type"
                required
                value={form.item_type_id}
                onChange={(value) => updateField('item_type_id', value)}
                options={enabledItemTypes.map((itemType) => ({ value: itemType.id, label: itemType.type_name }))}
                placeholder="Select item type"
              />
              <SelectField
                label="Sub-category"
                value={form.subcategory_id}
                onChange={(value) => updateField('subcategory_id', value)}
                options={enabledSubcategories.map((item) => ({ value: item.id, label: item.sub_category_name }))}
                placeholder="Select sub-category"
              />
              <Field label="Item name" required className="xl:col-span-3">
                <input
                  type="text"
                  value={form.item_name}
                  onChange={(event) => updateField('item_name', event.target.value)}
                  placeholder="Enter item name"
                  className="h-8 w-full max-w-lg rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard color="sky" title="Supplier & pricing">
            <div className="space-y-1.5">
              <div className="grid gap-1.5 xl:grid-cols-[1fr_1fr_148px]">
                <SelectField
                  label="Manufacturer"
                  value={form.manufacturer}
                  onChange={(value) => updateField('manufacturer', value)}
                  options={enabledManufacturers.map((m) => ({ value: m.id, label: m.manufacturer_name }))}
                  placeholder="Select manufacturer"
                />
                <SelectField
                  label="Supplier"
                  value={form.supplier}
                  onChange={(value) => updateField('supplier', value)}
                  options={enabledSuppliers.map((s) => ({ value: s.id, label: s.supplier_name }))}
                  placeholder="Select supplier"
                />
                <Field label="Barcode">
                  <input
                    type="text"
                    value={form.barcode}
                    onChange={(event) => updateField('barcode', event.target.value)}
                    placeholder="Enter barcode"
                    className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </Field>
              </div>
              <div className="grid gap-1.5 sm:grid-cols-3 xl:max-w-[29rem]">
                <CompactInput
                  label="Purchase price"
                  value={form.purchase_price}
                  onChange={(value) => updateField('purchase_price', value)}
                  placeholder="0.00"
                  suffix="PKR"
                />
                <CompactInput
                  label="Sale price"
                  value={form.sale_price}
                  onChange={(value) => updateField('sale_price', value)}
                  placeholder="0.00"
                  suffix="PKR"
                />
                <CompactInput
                  label="Opening stock"
                  value={form.opening_stock}
                  onChange={(value) => updateField('opening_stock', value)}
                  placeholder="0"
                  suffix="units"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard color="violet" title="Description & details">
            <div className="space-y-1.5">
              <div className="grid gap-1.5 xl:grid-cols-[1.15fr_1fr_148px]">
                <Field label="Description" className="xl:col-span-2">
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(event) => updateField('description', event.target.value)}
                    placeholder="Enter item description..."
                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </Field>
                <SelectField
                  label="Store location"
                  value={form.store_location}
                  onChange={(value) => updateField('store_location', value)}
                  options={locations.map((loc) => ({ value: loc.id, label: loc.shelf_name_code }))}
                  placeholder="Select location"
                />
                <SelectField
                  label="Item unit"
                  value={form.item_unit}
                  onChange={(value) => updateField('item_unit', value)}
                  options={units.map((u) => ({ value: u.id, label: u.unit_name }))}
                  placeholder="Select unit"
                />
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2 xl:max-w-[19rem]">
                <CompactInput
                  label="Per unit"
                  value={form.per_unit}
                  onChange={(value) => updateField('per_unit', value)}
                  placeholder="0"
                  suffix="per pack"
                />
                <CompactInput
                  label="Reorder level"
                  value={form.reorder_level}
                  onChange={(value) => updateField('reorder_level', value)}
                  placeholder="0"
                  suffix="units"
                />
              </div>
            </div>
          </SectionCard>

          <div className="grid gap-1.5 xl:grid-cols-[minmax(0,1.1fr)_270px_205px]">
            <SectionCard color="emerald" title="Product image">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-2.5 py-1.5 transition hover:border-teal-300 hover:bg-teal-50/40">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-sky-500 shadow-sm">
                  <UploadIcon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-sky-600">Upload image</p>
                  <p className="mt-0.5 truncate text-[10px] text-slate-500">{form.image_name || 'PNG, JPG, SVG up to 10MB'}</p>
                </div>
              </label>
            </SectionCard>

            <SectionCard color="amber" title="Status">
              <ItemStatusToggle
                enabled={form.is_enable}
                onChange={(value) => updateField('is_enable', value)}
                label="Item status"
                description="Active items remain available across the frontend system."
              />
            </SectionCard>

            <SectionCard color="lime" title="Actions">
              <div className="flex h-full flex-col justify-start gap-1.5">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : 'Save item'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Clear form
                </button>
              </div>
            </SectionCard>
          </div>
        </form>
      </Card>
    </PageShell>
  )
}

function SectionCard({ color, title, children }) {
  const style = sectionStyles[color] ?? sectionStyles.lime

  return (
    <div className="bg-white p-2">
      <div className={`mb-1.5 flex items-center gap-2 rounded-md border px-2 py-1 ${style.header}`}>
        <span className={`h-3 w-1 rounded-full ${style.accent}`} />
        <h3 className="text-[12px] font-semibold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function SelectField({ label, required = false, value, onChange, options, placeholder }) {
  return (
    <Field label={label} required={required}>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-full appearance-none rounded-md border border-slate-300 bg-white px-2 pr-7 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400">
          <ChevronDownIcon className="h-3.5 w-3.5" />
        </div>
      </div>
    </Field>
  )
}

function CompactInput({ label, value, onChange, placeholder, suffix }) {
  return (
    <Field label={label} className="max-w-[9.25rem]">
      <div className="relative w-full">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 pr-8 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
        />
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[9px] font-medium uppercase tracking-[0.1em] text-slate-400">
          {suffix}
        </span>
      </div>
    </Field>
  )
}

function ItemStatusToggle({ enabled, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
      <div>
        <p className="text-[12px] font-semibold text-slate-800">{label}</p>
        <p className="mt-0.5 text-[10px] text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        aria-pressed={enabled}
        onClick={() => onChange(!enabled)}
        className={`inline-flex items-center gap-2 rounded-full border px-1.5 py-0.5 transition ${enabled
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 bg-white text-slate-500'
          }`}
      >
        <span className="min-w-8 text-[10px] font-semibold uppercase tracking-[0.12em]">
          {enabled ? 'On' : 'Off'}
        </span>
        <span
          className={`relative inline-flex h-5 w-10 items-center rounded-full transition ${enabled ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition ${enabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
          />
        </span>
      </button>
    </div>
  )
}

function ItemFormIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5M9 13h6M9 17h6M9 9h1" /></svg>
}

function UploadIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 014-4 5 5 0 019.7-1.5A3.5 3.5 0 1120.5 15H15" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 12v7m0-7l-3 3m3-3l3 3" /></svg>
}

function ChevronDownIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
}