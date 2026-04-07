import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { ActionButton, Card, Field, PageShell, SectionHeader, TableState } from '../../components/layout/PageShell.jsx'
import axiosInstance from '../../services/axiosInstance'

function ReturnIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export default function PurchaseReturnPage() {
  const [purchases, setPurchases] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [selectedPurchase, setSelectedPurchase] = useState(null)
  const [returnItems, setReturnItems] = useState([])
  const [recentReturns, setRecentReturns] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [loadingReturns, setLoadingReturns] = useState(false)
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    fetchPurchases()
    fetchRecentReturns()
  }, [])

  async function fetchPurchases() {
    try {
      const [purchasesResponse, suppliersResponse] = await Promise.all([
        axiosInstance.get('/purchases'),
        axiosInstance.get('/suppliers').catch(() => ({ data: [] })),
      ])
      const purchasesData = purchasesResponse.data
      const suppliersData = suppliersResponse.data
      setPurchases(Array.isArray(purchasesData) ? purchasesData : purchasesData?.data || [])
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : suppliersData?.data || [])
    } catch {
      toast.error('Failed to load purchases.')
    }
  }

  async function fetchRecentReturns() {
    setLoadingReturns(true)
    try {
      const response = await axiosInstance.get('/purchase-returns')
      setRecentReturns(Array.isArray(response.data) ? response.data : response.data?.data || [])
    } catch (error) {
      console.error('Failed to fetch returns:', error)
      toast.error('Failed to load recent returns.')
    } finally {
      setLoadingReturns(false)
    }
  }

  const handlePurchaseChange = (event) => {
    const purchase = purchases.find((row) => String(row.id) === String(event.target.value))
    setSelectedPurchase(purchase || null)
    setReturnItems((purchase?.items || []).map((item) => ({ ...item, returnQty: 0 })))
  }

  const handleQtyChange = (itemId, qty) => {
    setReturnItems((prev) => prev.map((item) => {
      const currentId = item.item_id || item.id
      if (String(currentId) === String(itemId)) {
        const parsedQty = qty === '' ? 0 : Number(qty)
        const safeQty = Number.isNaN(parsedQty) ? 0 : parsedQty
        const maxQty = Number(item.qty || item.quantity || 0)
        return { ...item, returnQty: Math.min(Math.max(0, safeQty), maxQty) }
      }
      return item
    }))
  }

  const totalReturn = useMemo(() => {
    return returnItems.reduce((sum, item) => {
      const qty = Number(item.returnQty || 0)
      const rate = Number(item.purchase_price || item.price || 0)
      return sum + (qty * rate)
    }, 0)
  }, [returnItems])

  const selectedSupplierName = useMemo(() => {
    if (!selectedPurchase) return '-'
    return (
      selectedPurchase.supplier_name ||
      suppliers.find((supplier) => String(supplier.id) === String(selectedPurchase.supplier_id))?.supplier_name ||
      '-'
    )
  }, [selectedPurchase, suppliers])

  function resetForm() {
    setEditId(null)
    setSelectedPurchase(null)
    setReturnItems([])
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const itemsToReturn = returnItems.filter((item) => Number(item.returnQty || 0) > 0)
    if (!selectedPurchase) {
      toast.error('Select a purchase first.')
      return
    }
    if (itemsToReturn.length === 0) {
      toast.error('Add at least one item to return.')
      return
    }

    setSubmitting(true)
    try {
      const normalizedItems = itemsToReturn.map((item) => {
        const qty = Number(item.returnQty || 0)
        const rate = Number(item.purchase_price || item.price || 0)
        return {
          item_id: item.item_id || item.id,
          qty,
          purchase_price: rate,
          total: qty * rate,
        }
      })

      const payload = {
        purchaseId: selectedPurchase.id,
        supplierId: selectedPurchase.supplier_id,
        returnDate: new Date().toISOString().slice(0, 10),
        items: normalizedItems,
        reason: 'Purchase return', // Optional: could add a field for this
      }

      if (editId) {
        await axiosInstance.put(`/purchase-returns/${editId}`, payload)
        toast.success('Purchase return updated successfully.')
      } else {
        await axiosInstance.post('/purchase-returns', payload)
        toast.success('Purchase return recorded successfully.')
      }

      fetchRecentReturns()
      resetForm()
    } catch (error) {
      console.error('Submit error:', error)
      toast.error(error.response?.data?.message || 'Failed to save purchase return.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleEdit(record) {
    const purchase = purchases.find((row) => String(row.id) === String(record.purchase_id))
    if (!purchase) {
      toast.error('The original purchase for this return is no longer available.')
      return
    }

    const returnQtyByItemId = new Map(
      (record.items || []).map((item) => [String(item.item_id), Number(item.qty || 0)]),
    )

    setEditId(record.id)
    setSelectedPurchase(purchase)
    setReturnItems(
      (purchase.items || []).map((item) => ({
        ...item,
        returnQty: returnQtyByItemId.get(String(item.item_id || item.id)) || 0,
      })),
    )
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(returnId) {
    if (!window.confirm('Delete this purchase return?')) return
    try {
      await axiosInstance.delete(`/purchase-returns/${returnId}`)
      toast.success('Purchase return deleted successfully.')
      fetchRecentReturns()
      if (editId === returnId) resetForm()
    } catch (error) {
      toast.error('Failed to delete purchase return.')
    }
  }

  return (
    <PageShell title="Purchase Return" description="Process returns for purchased items." accent="from-teal-600 via-emerald-600 to-cyan-700">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="border-l-[6px] border-l-teal-500 p-4">
          <SectionHeader
            title={editId ? 'Edit Purchase Return' : 'Process Purchase Return'}
            description="Select a purchase to return items back to the supplier."
            icon={<ReturnIcon className="h-5 w-5" />}
            action={editId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel Edit
              </button>
            ) : null}
          />
          <Field label="Purchase">
            <select
              onChange={handlePurchaseChange}
              value={selectedPurchase?.id || ''}
              className="h-9 w-full rounded-md border border-slate-300 p-2 text-sm outline-none focus:border-teal-400"
            >
              <option value="">Select Purchase</option>
              {purchases.map((purchase) => (
                <option key={purchase.id} value={purchase.id}>
                  {purchase.grn_no || purchase.invoice_no || `PUR-${purchase.id}`}
                </option>
              ))}
            </select>
          </Field>
        </Card>

        {selectedPurchase && (
          <form onSubmit={handleSubmit}>
            <Card className="border-l-[6px] border-l-teal-500 p-4">
              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Supplier</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedSupplierName}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Purchase</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedPurchase.grn_no || selectedPurchase.invoice_no || `PUR-${selectedPurchase.id}`}</p>
                </div>
                <div className="rounded-xl border border-teal-100 bg-teal-50 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Return Value</p>
                  <p className="text-sm font-semibold text-teal-700">PKR {totalReturn.toFixed(2)}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-[10px] font-bold uppercase text-slate-500">
                      <th className="p-2">Item</th>
                      <th className="p-2 text-right">Purchased Qty</th>
                      <th className="p-2 text-right">Rate</th>
                      <th className="p-2 text-right">Return Qty</th>
                      <th className="p-2 text-right">Return Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnItems.map((item) => {
                      const itemId = item.item_id || item.id
                      const purchasedQty = Number(item.qty || item.quantity || 0)
                      const rate = Number(item.purchase_price || item.price || 0)
                      return (
                        <tr key={itemId} className="border-b">
                          <td className="p-2">{item.item_name}</td>
                          <td className="p-2 text-right">{purchasedQty}</td>
                          <td className="p-2 text-right">PKR {rate.toFixed(2)}</td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              min="0"
                              max={purchasedQty}
                              value={Number.isNaN(item.returnQty) ? '' : item.returnQty}
                              onChange={(e) => handleQtyChange(itemId, e.target.value)}
                              className="h-8 w-20 rounded border px-2"
                            />
                          </td>
                          <td className="p-2 text-right font-semibold text-teal-700">PKR {(rate * Number(item.returnQty || 0)).toFixed(2)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-right">
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={resetForm} className="rounded-lg border border-slate-200 px-4 py-2 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50">
                    Clear
                  </button>
                  <button type="submit" disabled={submitting} className="rounded-lg bg-teal-600 px-6 py-2 font-bold text-white">
                    {submitting ? 'Processing...' : editId ? 'Update Return' : 'Confirm Return'}
                  </button>
                </div>
              </div>
            </Card>
          </form>
        )}

        <Card className="p-4">
          <SectionHeader
            title="Recent Purchase Returns"
            description="History of purchase returns processed in the system."
            action={
              <button
                type="button"
                onClick={fetchRecentReturns}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Refresh
              </button>
            }
          />
          {recentReturns.length === 0 ? (
            <TableState message="No purchase returns recorded yet." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <div className="w-full overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      <th className="px-3 py-2.5">Return ID</th>
                      <th className="px-3 py-2.5">Purchase</th>
                      <th className="px-3 py-2.5">Supplier</th>
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5 text-right">Amount</th>
                      <th className="px-3 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {recentReturns.map((record) => (
                      <tr key={record.id} className="text-[12px] hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-mono text-slate-500">#{record.id}</td>
                        <td className="px-3 py-2 font-semibold text-slate-700">{record.purchase_id}</td>
                        <td className="px-3 py-2 text-slate-600">{record.supplier_name || '-'}</td>
                        <td className="px-3 py-2 text-slate-600">{new Date(record.return_date).toLocaleDateString()}</td>
                        <td className="px-3 py-2 text-right font-bold text-teal-700">PKR {Number(record.total_amount || 0).toFixed(2)}</td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-2">
                            <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(record)} />
                            <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(record.id)} />
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
