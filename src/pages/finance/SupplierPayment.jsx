import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { ActionButton, Card, Field, PageShell, SectionHeader, StatusChip, TableState } from '../../components/layout/PageShell.jsx';
import axiosInstance from '../../services/axiosInstance';
import { MdAdd, MdRemove, MdPayment, MdRefresh, MdAccountBalanceWallet, MdDescription } from 'react-icons/md';

function createEmptyForm() {
  return {
    supplierId:    '',
    purchaseId:    '',
    amount:        '',
    paymentMethod: 'Cash',
    paymentDate:   new Date().toISOString().slice(0, 10),
    note:          '',
  };
}

export default function SupplierPaymentPage() {
  const [suppliers, setSuppliers]       = useState([]);
  const [purchases, setPurchases]       = useState([]);
  const [payments, setPayments]         = useState([]);
  const [form, setForm]                 = useState(createEmptyForm());
  const [submitting, setSubmitting]     = useState(false);
  const [loading, setLoading]           = useState(false);
  const [editId, setEditId]             = useState(null);
  const [isFormOpen, setIsFormOpen]     = useState(false);

  useEffect(() => { fetchPageData(); }, []);

  async function fetchPageData() {
    setLoading(true);
    try {
      const [suppRes, purRes, payRes] = await Promise.all([
        axiosInstance.get('/suppliers'),
        axiosInstance.get('/purchases').catch(() => ({ data: [] })),
        axiosInstance.get('/supplier-payments'),
      ]);
      setSuppliers(Array.isArray(suppRes.data) ? suppRes.data : suppRes.data?.data || []);
      setPurchases(Array.isArray(purRes.data)  ? purRes.data  : purRes.data?.data  || []);
      setPayments( Array.isArray(payRes.data)  ? payRes.data  : payRes.data?.data  || []);
    } catch {
      toast.error('Failed to load page data.');
    } finally {
      setLoading(false);
    }
  }

  // Filter purchases to only those belonging to selected supplier and still have a due amount
  const supplierPurchases = useMemo(() => {
    if (!form.supplierId) return [];
    return purchases.filter(
      p => String(p.supplier_id) === String(form.supplierId) && parseFloat(p.to_be_paid || 0) > 0
    );
  }, [purchases, form.supplierId]);

  // Total outstanding for selected supplier (sum of to_be_paid across all their purchases)
  const outstandingBalance = useMemo(() => {
    if (!form.supplierId) return 0;
    return purchases
      .filter(p => String(p.supplier_id) === String(form.supplierId))
      .reduce((sum, p) => sum + parseFloat(p.to_be_paid || 0), 0);
  }, [purchases, form.supplierId]);

  // Due on selected purchase specifically
  const selectedPurchaseDue = useMemo(() => {
    if (!form.purchaseId) return null;
    const p = purchases.find(p => String(p.id) === String(form.purchaseId));
    return p ? parseFloat(p.to_be_paid || 0) : null;
  }, [purchases, form.purchaseId]);

  function updateField(key, value) {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      // Reset purchaseId when supplier changes
      if (key === 'supplierId') next.purchaseId = '';
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.supplierId) { toast.error('Please select a supplier.'); return; }
    if (!amount || amount <= 0) { toast.error('Enter a valid payment amount.'); return; }
    if (selectedPurchaseDue !== null && amount > selectedPurchaseDue) {
      toast.error(`Amount exceeds the due on this purchase (PKR ${selectedPurchaseDue.toLocaleString()}).`);
      return;
    }

    setSubmitting(true);
    const payload = {
      supplierId:    form.supplierId,
      purchaseId:    form.purchaseId || null,
      amount,
      paymentMethod: form.paymentMethod,
      paymentDate:   form.paymentDate,
      note:          form.note,
    };

    try {
      if (editId) {
        await axiosInstance.put(`/supplier-payments/${editId}`, payload);
        toast.success('Payment updated successfully.');
      } else {
        await axiosInstance.post('/supplier-payments', payload);
        toast.success('Payment recorded successfully.');
      }
      resetForm();
      setIsFormOpen(false);
      fetchPageData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save payment.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(payment) {
    setEditId(payment.id);
    setForm({
      supplierId:    String(payment.supplier_id || ''),
      purchaseId:    String(payment.purchase_id || ''),
      amount:        String(payment.amount || ''),
      paymentMethod: payment.payment_method || 'Cash',
      paymentDate:   payment.payment_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      note:          payment.note || '',
    });
    setIsFormOpen(true);
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this payment? Purchase status will be recalculated.')) return;
    try {
      await axiosInstance.delete(`/supplier-payments/${id}`);
      toast.success('Payment deleted.');
      if (editId === id) resetForm();
      fetchPageData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete payment.');
    }
  }

  function resetForm() {
    setEditId(null);
    setForm(createEmptyForm());
  }

  return (
    <PageShell>
      <div className="space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Supplier Payments</h1>
            <p className="text-sm text-slate-500">Settle outstanding balances with your inventory providers.</p>
          </div>
          <button
            onClick={() => {
              if (isFormOpen && editId) {
                resetForm();
                document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                const opening = !isFormOpen;
                setIsFormOpen(opening);
                if (opening) {
                  resetForm();
                  document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition duration-300 shadow-sm ${
              isFormOpen
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-teal-600 text-white hover:bg-teal-700 hover:shadow-teal-100'
            }`}
          >
            {isFormOpen
              ? <><MdRemove className="h-5 w-5" /> Close Form</>
              : <><MdAdd   className="h-5 w-5" /> Record Payment</>
            }
          </button>
        </div>

        {/* Form */}
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
                  title={editId ? 'Edit Payment Entry' : 'New Payment Receipt'}
                  description="Process a financial settlement for selected supplier."
                  icon={<MdPayment className="h-6 w-6 text-teal-600" />}
                />

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">

                  {/* Supplier + Outstanding */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Supplier" required>
                      <select
                        value={form.supplierId}
                        onChange={e => updateField('supplierId', e.target.value)}
                        className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[12px] font-semibold outline-none transition focus:border-teal-400"
                      >
                        <option value="">Choose Supplier...</option>
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.supplier_name}</option>
                        ))}
                      </select>
                    </Field>

                    {form.supplierId && (
                      <div className="flex flex-col justify-center rounded-xl border border-teal-100 bg-teal-50/40 px-4 py-2">
                        <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Total Outstanding</p>
                        <p className="text-lg font-black text-teal-700 font-mono">
                          PKR {outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Link to a specific purchase (optional) */}
                  {supplierPurchases.length > 0 && (
                    <Field label="Link to Purchase Order (optional)">
                      <select
                        value={form.purchaseId}
                        onChange={e => updateField('purchaseId', e.target.value)}
                        className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[12px] outline-none transition focus:border-teal-400"
                      >
                        <option value="">— Not linked to a specific order —</option>
                        {supplierPurchases.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.invoice_no ? `INV-${p.invoice_no}` : `PO-${p.id}`} — Due: PKR {Number(p.to_be_paid).toLocaleString()}
                          </option>
                        ))}
                      </select>
                      {selectedPurchaseDue !== null && (
                        <p className="mt-1 text-[11px] text-amber-600 font-semibold">
                          Due on this order: PKR {selectedPurchaseDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </Field>
                  )}

                  {/* Amount, Date, Method */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                    <Field label="Amount to Pay" required>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={form.amount}
                          onChange={e => updateField('amount', e.target.value)}
                          placeholder="0.00"
                          className="h-9 w-full rounded-md border border-slate-300 bg-white pl-3 pr-8 text-[12px] font-bold outline-none transition focus:border-teal-400"
                        />
                        <MdAccountBalanceWallet className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </Field>
                    <Field label="Payment Date" required>
                      <input
                        type="date"
                        value={form.paymentDate}
                        onChange={e => updateField('paymentDate', e.target.value)}
                        className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[12px] outline-none transition focus:border-teal-400"
                      />
                    </Field>
                    <Field label="Payment Method">
                      <select
                        value={form.paymentMethod}
                        onChange={e => updateField('paymentMethod', e.target.value)}
                        className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[12px] outline-none transition focus:border-teal-400"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Online">Online</option>
                      </select>
                    </Field>
                  </div>

                  {/* Notes */}
                  <Field label="Remarks / Notes">
                    <div className="relative">
                      <textarea
                        value={form.note}
                        onChange={e => updateField('note', e.target.value)}
                        rows={2}
                        placeholder="Reference no, bank name, or reason..."
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 pl-9 text-[12px] outline-none transition focus:border-teal-400"
                      />
                      <MdDescription className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                    </div>
                  </Field>

                  <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => { resetForm(); setIsFormOpen(false); }}
                      className="rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-xl bg-teal-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-100 hover:bg-teal-700 transition disabled:opacity-50"
                    >
                      <MdPayment />
                      {submitting ? 'Processing...' : editId ? 'Update Payment' : 'Confirm Payment'}
                    </button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Payment History Table */}
        <Card className="mx-auto max-w-5xl p-0 overflow-hidden">
          <SectionHeader
            title="Payment History"
            description="All recorded outgoing payments to suppliers."
            icon={<MdRefresh className="h-6 w-6 text-teal-600" />}
            action={
              <div className="p-4">
                <button
                  type="button"
                  onClick={fetchPageData}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <MdRefresh className="inline mr-1" /> Refresh
                </button>
              </div>
            }
          />

          {loading ? (
            <TableState message="Loading payment history..." />
          ) : payments.length === 0 ? (
            <TableState message="No payment records found." />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4">#</th>
                    <th className="px-5 py-4">Supplier</th>
                    <th className="px-5 py-4">Purchase / Invoice</th>
                    <th className="px-5 py-4">Date & Method</th>
                    <th className="px-5 py-4">Note</th>
                    <th className="px-5 py-4 text-right">Amount Paid</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {payments.map((p, idx) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`group transition-colors hover:bg-teal-50/30 ${editId === p.id ? 'bg-teal-50/50' : ''}`}
                    >
                      <td className="px-5 py-4 text-[11px] text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-5 py-4 font-bold text-slate-800 text-[13px]">{p.supplier_name}</td>
                      <td className="px-5 py-4">
                        {p.purchase_id ? (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-600">
                            {p.invoice_no ? `INV-${p.invoice_no}` : `PO-${p.purchase_id}`}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-[12px] font-medium text-slate-600">
                            {p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '—'}
                          </span>
                          <span className="text-[10px] text-teal-600 font-bold uppercase tracking-tight">
                            {p.payment_method}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[11px] text-slate-400 max-w-[140px] truncate">
                        {p.note || '—'}
                      </td>
                      <td className="px-5 py-4 text-right font-black text-teal-700 font-mono">
                        PKR {Number(p.amount).toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <ActionButton label="Edit"   tone="teal" onClick={() => handleEdit(p)} />
                          <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(p.id)} />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                  <tr>
                    <td colSpan="5" className="px-5 py-3 text-[11px] font-bold uppercase text-slate-500 text-right">
                      Total Paid
                    </td>
                    <td className="px-5 py-3 text-right font-black text-teal-700 font-mono">
                      PKR {payments.reduce((s, p) => s + Number(p.amount || 0), 0).toLocaleString()}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}