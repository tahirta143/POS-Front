import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { ActionButton, Card, Field, PageShell, SectionHeader, TableState } from '../../components/layout/PageShell.jsx';
import axiosInstance from '../../services/axiosInstance';

function ReturnIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
    </svg>
  );
}

export default function SalesReturnPage() {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [recentReturns, setRecentReturns] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchInvoices();
    fetchRecentReturns();
  }, []);

  async function fetchInvoices() {
    try {
      const response = await axiosInstance.get('/sale-invoices');
      const data = response.data;
      setInvoices(Array.isArray(data) ? data : (data?.data || []));
    } catch {
      toast.error('Failed to load invoices.');
    }
  }

  async function fetchRecentReturns() {
    setLoadingReturns(true);
    try {
      const response = await axiosInstance.get('/sale-returns');
      setRecentReturns(Array.isArray(response.data) ? response.data : (response.data?.data || []));
    } catch (error) {
      console.error('Failed to fetch returns:', error);
      toast.error('Failed to load recent returns.');
    } finally {
      setLoadingReturns(false);
    }
  }

  const handleInvoiceChange = (e) => {
    const inv = invoices.find(i => String(i.id) === String(e.target.value));
    setSelectedInvoice(inv);
    if (inv && inv.items) {
      // Use a stable unique identifier for each item
      const itemsWithUniqueId = inv.items.map((item, index) => ({
        ...item,
        uniqueId: `${item.item_id || item.id}_${index}_${Date.now()}`,
        returnQty: 0
      }));
      setReturnItems(itemsWithUniqueId);
    } else {
      setReturnItems([]);
    }
  };

  const handleQtyChange = (uniqueId, qty) => {
    setReturnItems(prev => prev.map(item => {
      if (item.uniqueId === uniqueId) {
        const parsedQty = qty === '' ? 0 : Number(qty);
        const safeQty = isNaN(parsedQty) ? 0 : parsedQty;
        const maxQty = Number(item.qty || item.quantity || 0);
        return { ...item, returnQty: Math.min(Math.max(0, safeQty), maxQty) };
      }
      return item;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const itemsToReturn = returnItems.filter(i => i.returnQty > 0);
    if (itemsToReturn.length === 0) {
      toast.error('Add at least one item to return.');
      return;
    }
    if (!selectedInvoice) {
      toast.error('Select an invoice first.');
      return;
    }

    setSubmitting(true);
    try {
      const normalizedItems = itemsToReturn.map((item) => {
        const qty = Number(item.returnQty || 0);
        const soldQty = Number(item.qty || item.quantity || 0);
        const lineTotal = Number(item.total || 0);
        const rate = soldQty > 0 ? lineTotal / soldQty : Number(item.price || item.rate || item.sale_price || 0);
        return {
          item_id: item.item_id || item.id,
          qty,
          price: rate,
          total: qty * rate,
        };
      });

      const totalReturnAmount = normalizedItems.reduce((sum, item) => sum + item.total, 0);

      const payload = {
        saleInvoiceId: selectedInvoice.id,
        customerId: selectedInvoice.customer_id,
        returnDate: new Date().toISOString().slice(0, 10),
        items: normalizedItems,
        reason: 'Sales return',
      };

      if (editId) {
        await axiosInstance.put(`/sale-returns/${editId}`, payload);
        toast.success('Sales return updated successfully.');
      } else {
        await axiosInstance.post('/sale-returns', payload);
        toast.success('Sales return recorded successfully.');
      }

      fetchRecentReturns();
      resetForm();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Failed to save sales return.');
    } finally {
      setSubmitting(false);
    }
  };

  function handleEdit(record) {
    const invoice = invoices.find((inv) => String(inv.id) === String(record.sale_invoice_id));
    if (!invoice) {
      toast.error('The original invoice for this return is no longer available.');
      return;
    }

    const returnQtyByItemId = new Map(
      (record.items || []).map((item) => [String(item.item_id), Number(item.qty || 0)]),
    );

    // Create items with uniqueId for editing
    const itemsWithUniqueId = (invoice.items || []).map((item, index) => ({
      ...item,
      uniqueId: `${item.item_id || item.id}_${index}_${Date.now()}_edit`,
      returnQty: returnQtyByItemId.get(String(item.item_id || item.id)) || 0,
    }));

    setEditId(record.id);
    setSelectedInvoice(invoice);
    setReturnItems(itemsWithUniqueId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(returnId) {
    if (!window.confirm('Delete this sales return?')) return;
    try {
      await axiosInstance.delete(`/sale-returns/${returnId}`);
      toast.success('Sales return deleted successfully.');
      fetchRecentReturns();
      if (editId === returnId) resetForm();
    } catch (error) {
      toast.error('Failed to delete sales return.');
    }
  }

  function resetForm() {
    setEditId(null);
    setSelectedInvoice(null);
    setReturnItems([]);
  }

  const totalReturn = useMemo(() => {
    return returnItems.reduce((sum, item) => {
      const soldQty = Number(item.qty || item.quantity || 0);
      const lineTotal = Number(item.total || 0);
      const rate = soldQty > 0 ? lineTotal / soldQty : Number(item.price || item.rate || item.sale_price || 0);
      return sum + Number(item.returnQty || 0) * rate;
    }, 0);
  }, [returnItems]);

  return (
    <PageShell title="Sales Return" description="Process returns for sold items." accent="from-teal-600 via-emerald-600 to-cyan-700">
      <div className="space-y-6 max-w-4xl mx-auto">
        <Card className="p-4 border-l-[6px] border-l-teal-500">
          <SectionHeader
            title={editId ? 'Edit Return' : 'Process Return'}
            description="Select invoice to return items from."
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
          <Field label="Invoice">
            <select 
              onChange={handleInvoiceChange} 
              value={selectedInvoice?.id || ''}
              className="h-9 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-teal-400 outline-none"
            >
              <option value="">Select Invoice</option>
              {invoices.map(inv => <option key={inv.id} value={inv.id}>{inv.receipt_no}</option>)}
            </select>
          </Field>
        </Card>

        {selectedInvoice && (
          <form onSubmit={handleSubmit}>
            <Card className="p-4 border-l-[6px] border-l-teal-500">
              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Customer</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedInvoice.customer_name || '-'}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Invoice</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedInvoice.receipt_no}</p>
                </div>
                <div className="rounded-xl border border-teal-100 bg-teal-50 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Return Value</p>
                  <p className="text-sm font-semibold text-teal-700">PKR {totalReturn.toFixed(2)}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-slate-500 text-[10px] uppercase font-bold">
                      <th className="p-2">Item</th>
                      <th className="p-2 text-right">Sold Qty</th>
                      <th className="p-2 text-right">Rate</th>
                      <th className="p-2 text-right">Return Qty</th>
                      <th className="p-2 text-right">Return Total</th>
                     </tr>
                  </thead>
                  <tbody>
                    {returnItems.map(item => {
                      const soldQty = Number(item.qty || item.quantity || 0);
                      const rate = soldQty > 0
                        ? Number(item.total || 0) / soldQty
                        : Number(item.price || item.rate || item.sale_price || 0);
                      const returnTotal = rate * Number(item.returnQty || 0);
                      const maxQty = soldQty;
                      
                      return (
                        <tr key={item.uniqueId || item.id} className="border-b">
                          <td className="p-2">{item.item_name}</td>
                          <td className="p-2 text-right">{soldQty}</td>
                          <td className="p-2 text-right">PKR {rate.toFixed(2)}</td>
                          <td className="p-2 text-right">
                            <input 
                              type="number" 
                              min="0" 
                              max={maxQty}
                              step="1"
                              value={item.returnQty === undefined || isNaN(item.returnQty) ? 0 : item.returnQty} 
                              onChange={(e) => handleQtyChange(item.uniqueId, e.target.value)} 
                              className="h-8 w-20 border rounded px-2 text-right focus:border-teal-400 focus:outline-none"
                            />
                          </td>
                          <td className="p-2 text-right font-semibold text-teal-700">PKR {returnTotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-right">
                <div className="flex justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={resetForm} 
                    className="rounded-lg border border-slate-200 px-4 py-2 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Clear
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting} 
                    className="bg-teal-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Processing...' : editId ? 'Update Return' : 'Confirm Return'}
                  </button>
                </div>
              </div>
            </Card>
          </form>
        )}

        <Card className="p-4">
          <SectionHeader
            title="Recent Sales Returns"
            description="History of sales returns processed in the system."
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
          {loadingReturns ? (
            <div className="text-center py-8 text-slate-500">Loading returns...</div>
          ) : recentReturns.length === 0 ? (
            <TableState message="No sales returns recorded yet." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <div className="overflow-x-auto w-full">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      <th className="px-3 py-2.5">Return ID</th>
                      <th className="px-3 py-2.5">Invoice</th>
                      <th className="px-3 py-2.5">Customer</th>
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5 text-right">Amount</th>
                      <th className="px-3 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {recentReturns.map((record) => (
                      <tr key={record.id} className="text-[12px] hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-mono text-slate-500">#{record.id}</td>
                        <td className="px-3 py-2 font-semibold text-slate-700">{record.invoice_ref || record.sale_invoice_id}</td>
                        <td className="px-3 py-2 text-slate-600">{record.customer_name || '-'}</td>
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
  );
}