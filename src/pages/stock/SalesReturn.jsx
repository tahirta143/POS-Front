import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { ActionButton, Card, Field, PageShell, SectionHeader, TableState } from '../../components/layout/PageShell.jsx';
import axiosInstance from '../../services/axiosInstance';
import { MdAdd, MdRemove, MdHistory, MdKeyboardReturn, MdRefresh, MdReceipt, MdPerson, MdPriceCheck } from 'react-icons/md';

export default function SalesReturnPage() {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [recentReturns, setRecentReturns] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

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
      setRecentReturns([]);
    } finally {
      setLoadingReturns(false);
    }
  }

  const handleInvoiceChange = (e) => {
    const inv = invoices.find(i => String(i.id) === String(e.target.value));
    setSelectedInvoice(inv);
    if (inv && inv.items) {
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

      const payload = {
        saleInvoiceId: selectedInvoice.id,
        customerId: selectedInvoice.customer_id,
        returnDate: new Date().toISOString().slice(0, 10),
        items: normalizedItems,
        reason: 'Sales return',
      };

      if (editId) {
        await axiosInstance.put(`/sale-returns/${editId}`, payload);
        toast.success('Return updated successfully.');
      } else {
        await axiosInstance.post('/sale-returns', payload);
        toast.success('Return recorded successfully.');
      }

      fetchRecentReturns();
      resetForm();
      setIsFormOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save return.');
    } finally {
      setSubmitting(false);
    }
  };

  function handleEdit(record) {
    const invoice = invoices.find((inv) => String(inv.id) === String(record.sale_invoice_id));
    if (!invoice) {
      toast.error('Original invoice data unavailable.');
      return;
    }

    const returnQtyByItemId = new Map(
      (record.items || []).map((item) => [String(item.item_id), Number(item.qty || 0)]),
    );

    const itemsWithUniqueId = (invoice.items || []).map((item, index) => ({
      ...item,
      uniqueId: `${item.item_id || item.id}_${index}_${Date.now()}_edit`,
      returnQty: returnQtyByItemId.get(String(item.item_id || item.id)) || 0,
    }));

    setEditId(record.id);
    setSelectedInvoice(invoice);
    setReturnItems(itemsWithUniqueId);
    setIsFormOpen(true);
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(returnId) {
    if (!window.confirm('Delete this sales return?')) return;
    try {
      await axiosInstance.delete(`/sale-returns/${returnId}`);
      toast.success('Return deleted successfully.');
      fetchRecentReturns();
      if (editId === returnId) resetForm();
    } catch (error) {
      toast.error('Failed to delete return.');
    }
  }

  function resetForm() {
    setEditId(null);
    setSelectedInvoice(null);
    setReturnItems([]);
  }

  const totalReturnValue = useMemo(() => {
    return returnItems.reduce((sum, item) => {
      const soldQty = Number(item.qty || item.quantity || 0);
      const lineTotal = Number(item.total || 0);
      const rate = soldQty > 0 ? lineTotal / soldQty : Number(item.price || item.rate || item.sale_price || 0);
      return sum + Number(item.returnQty || 0) * rate;
    }, 0);
  }, [returnItems]);

  return (
    <PageShell>
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between">
           <div>
            <h1 className="text-xl font-bold text-slate-900">Sales Return (Credit Note)</h1>
            <p className="text-sm text-slate-500">Process merchandise returns and adjust customer accounts.</p>
          </div>
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
                <MdRemove className="h-5 w-5" /> Close Form
              </>
            ) : (
              <>
                <MdAdd className="h-5 w-5" /> New Return
              </>
            )}
          </button>
        </div>

        {/* Collapsible Form */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <Card className="mx-auto max-w-5xl border-l-[6px] border-l-teal-500 p-6 mb-6">
                <SectionHeader
                  title={editId ? 'Modify Return Entry' : 'Process New Return'}
                  description="Select the source invoice to authorize item returns."
                  icon={<MdKeyboardReturn className="h-6 w-6 text-teal-600" />}
                />

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <Field label="Source Invoice" required className="lg:col-span-2">
                    <div className="relative">
                      <select 
                        onChange={handleInvoiceChange} 
                        value={selectedInvoice?.id || ''}
                        className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 font-semibold text-slate-700 focus:border-teal-400 focus:ring-4 focus:ring-teal-50 outline-none transition"
                      >
                        <option value="">Search Receipt / Invoice ID...</option>
                        {invoices.map(inv => <option key={inv.id} value={inv.id}>{inv.receipt_no} - {inv.customer_name}</option>)}
                      </select>
                      <MdReceipt className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </Field>
                  
                  {selectedInvoice && (
                    <div className="flex flex-col justify-center rounded-xl bg-teal-50 px-4 py-2 border border-teal-100">
                      <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Total Credit</p>
                      <p className="text-lg font-black text-teal-700 truncate font-mono">PKR {totalReturnValue.toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {selectedInvoice && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                         <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 border border-slate-100"><MdPerson className="h-5 w-5" /></div>
                         <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Customer Account</p>
                            <p className="text-[13px] font-bold text-slate-700">{selectedInvoice.customer_name || 'Walking Customer'}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                         <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 border border-slate-100"><MdPriceCheck className="h-5 w-5" /></div>
                         <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Invoice Reference</p>
                            <p className="text-[13px] font-bold text-slate-700">{selectedInvoice.receipt_no}</p>
                         </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 overflow-hidden">
                      <table className="w-full text-left text-[12px]">
                        <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Product Item</th>
                            <th className="px-4 py-3 text-right">Sold</th>
                            <th className="px-4 py-3 text-right">Rate</th>
                            <th className="px-4 py-3 text-center">Return Qty</th>
                            <th className="px-4 py-3 text-right">Credit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                          {returnItems.map(item => {
                            const soldQty = Number(item.qty || item.quantity || 0);
                            const rate = soldQty > 0 ? Number(item.total || 0) / soldQty : Number(item.price || item.rate || item.sale_price || 0);
                            const returnTotal = rate * Number(item.returnQty || 0);
                            return (
                              <tr key={item.uniqueId} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3 font-semibold text-slate-700">{item.item_name}</td>
                                <td className="px-4 py-3 text-right text-slate-500">{soldQty}</td>
                                <td className="px-4 py-3 text-right font-mono">PKR {rate.toLocaleString()}</td>
                                <td className="px-4 py-3 text-center">
                                  <input 
                                    type="number" min="0" max={soldQty} value={item.returnQty} 
                                    onChange={(e) => handleQtyChange(item.uniqueId, e.target.value)} 
                                    className="h-8 w-20 rounded-lg border border-slate-200 bg-white px-2 text-center font-bold text-teal-700 focus:border-teal-400 outline-none"
                                  />
                                </td>
                                <td className="px-4 py-3 text-right font-black text-teal-700">PKR {returnTotal.toLocaleString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                      <button type="button" onClick={resetForm} className="rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 transition">Discard Changes</button>
                      <button type="submit" disabled={submitting} className="inline-flex min-w-[200px] items-center justify-center gap-2 rounded-xl bg-teal-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-100 hover:bg-teal-700 transition disabled:opacity-50">
                        {submitting ? 'Recording...' : editId ? 'Update Credit Note' : 'Authorize Sales Return'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Registry Table */}
        <Card className="mx-auto max-w-5xl p-0 overflow-hidden">
          <SectionHeader
            title="Return Registry"
            description="Archive of all processed merchandise returns."
            icon={<MdHistory className="h-6 w-6 text-teal-600" />}
            action={
              <div className="p-4">
                <button type="button" onClick={fetchRecentReturns} className="rounded-xl border border-slate-200 px-4 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition"><MdRefresh className="inline mr-1" /> Refresh Records</button>
              </div>
            }
          />
          {loadingReturns ? (
            <TableState message="Searching registry archive..." />
          ) : recentReturns.length === 0 ? (
            <TableState message="No sales returns recorded in system." />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4">Return ID</th>
                    <th className="px-5 py-4">Customer Account</th>
                    <th className="px-5 py-4">Original Invoice</th>
                    <th className="px-5 py-4">Total Return</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {recentReturns.map((record) => (
                    <motion.tr key={record.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`group transition-colors hover:bg-teal-50/30 ${editId === record.id ? 'bg-teal-50/50' : ''}`}>
                      <td className="px-5 py-4 font-mono text-[11px] text-slate-400">#RTN-{String(record.id).slice(-4)}</td>
                      <td className="px-5 py-4 font-bold text-slate-800 text-[13px]">{record.customer_name || 'Walking Customer'}</td>
                      <td className="px-5 py-4">
                         <div className="flex flex-col">
                            <span className="text-[12px] font-semibold text-slate-600">{record.invoice_ref || record.sale_invoice_id}</span>
                            <span className="text-[10px] text-slate-400">{new Date(record.return_date).toLocaleDateString()}</span>
                         </div>
                      </td>
                      <td className="px-5 py-4 font-black text-teal-700 font-mono text-sm">PKR {Number(record.total_amount || 0).toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2 text-right">
                          <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(record)} />
                          <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(record.id)} />
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
  );
}