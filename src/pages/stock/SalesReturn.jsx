import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { ActionButton, Card, Field, PageShell, SectionHeader, TableState } from '../../components/layout/PageShell.jsx';
import FallbackNotice from '../../components/layout/FallbackNotice.jsx';
import axiosInstance from '../../services/axiosInstance';
import { deleteSalesReturn, getSalesReturns, saveSalesReturn, updateSalesReturn } from '../../utils/transactionStore.js';

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
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchInvoices();
    setRecentReturns(getSalesReturns());
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

  const handleInvoiceChange = (e) => {
    const inv = invoices.find(i => String(i.id) === String(e.target.value));
    setSelectedInvoice(inv);
    setReturnItems(inv ? (inv.items || []).map(item => ({ ...item, returnQty: 0 })) : []);
  };

  const handleQtyChange = (itemId, qty) => {
    setReturnItems(prev => prev.map(item => {
      if (item.id === itemId) {
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
          itemId: item.item_id || item.id,
          itemName: item.item_name,
          soldQty,
          returnQty: qty,
          rate,
          total: qty * rate,
        };
      });

      const totalReturn = normalizedItems.reduce((sum, item) => sum + item.total, 0);

      const payload = {
        invoiceId: selectedInvoice.id,
        receiptNo: selectedInvoice.receipt_no,
        customerId: selectedInvoice.customer_id,
        customerName: selectedInvoice.customer_name,
        date: new Date().toISOString().slice(0, 10),
        items: normalizedItems,
        totalReturn,
      };
      if (editId) {
        updateSalesReturn(editId, payload);
        toast.success('Sales return updated successfully.');
      } else {
        saveSalesReturn(payload);
        toast.success('Sales return recorded in frontend successfully.');
      }

      setRecentReturns(getSalesReturns());
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  function handleEdit(record) {
    const invoice = invoices.find((inv) => String(inv.id) === String(record.invoiceId));
    if (!invoice) {
      toast.error('The original invoice for this return is no longer available.');
      return;
    }

    const returnQtyByItemId = new Map(
      (record.items || []).map((item) => [String(item.itemId), Number(item.returnQty || 0)]),
    );

    setEditId(record.id);
    setSelectedInvoice(invoice);
    setReturnItems(
      (invoice.items || []).map((item) => ({
        ...item,
        returnQty: returnQtyByItemId.get(String(item.item_id || item.id)) || 0,
      })),
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDelete(returnId) {
    if (!window.confirm('Delete this sales return?')) return;
    setRecentReturns(deleteSalesReturn(returnId));
    if (editId === returnId) resetForm();
    toast.success('Sales return deleted successfully.');
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
          <div className="mt-4">
            <FallbackNotice message="Sales returns are currently being saved in frontend storage until the backend sales-return route is added." />
          </div>
          <Field label="Invoice">
            <select onChange={handleInvoiceChange} className="h-9 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-teal-400 outline-none">
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
                      const soldQty = Number(item.qty || item.quantity || 0)
                      const rate = soldQty > 0
                        ? Number(item.total || 0) / soldQty
                        : Number(item.price || item.rate || item.sale_price || 0)
                      return (
                      <tr key={item.id} className="border-b">
                        <td className="p-2">{item.item_name}</td>
                        <td className="p-2 text-right">{soldQty}</td>
                        <td className="p-2 text-right">PKR {rate.toFixed(2)}</td>
                        <td className="p-2 text-right">
                          <input type="number" min="0" max={item.qty || item.quantity || 0} value={isNaN(item.returnQty) ? '' : item.returnQty} onChange={(e) => handleQtyChange(item.id, e.target.value)} className="h-8 w-20 border rounded px-2" />
                        </td>
                        <td className="p-2 text-right font-semibold text-teal-700">PKR {(rate * Number(item.returnQty || 0)).toFixed(2)}</td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-right">
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={resetForm} className="rounded-lg border border-slate-200 px-4 py-2 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50">
                    Clear
                  </button>
                  <button type="submit" disabled={submitting} className="bg-teal-600 text-white px-6 py-2 rounded-lg font-bold">
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
            description="Frontend return history until backend posting is added."
            action={
              <button
                type="button"
                onClick={() => setRecentReturns(getSalesReturns())}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Refresh
              </button>
            }
          />
          {recentReturns.length === 0 ? (
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
                        <td className="px-3 py-2 font-mono text-slate-500">{record.id}</td>
                        <td className="px-3 py-2 font-semibold text-slate-700">{record.receiptNo}</td>
                        <td className="px-3 py-2 text-slate-600">{record.customerName || '-'}</td>
                        <td className="px-3 py-2 text-slate-600">{record.date}</td>
                        <td className="px-3 py-2 text-right font-bold text-teal-700">PKR {Number(record.totalReturn || 0).toFixed(2)}</td>
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
