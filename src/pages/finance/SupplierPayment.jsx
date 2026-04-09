import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { ActionButton, Card, Field, PageShell, SectionHeader, TableState } from '../../components/layout/PageShell.jsx';
import FallbackNotice from '../../components/layout/FallbackNotice.jsx';
import axiosInstance from '../../services/axiosInstance';
import { deleteSupplierPayment, getSupplierPayments, saveSupplierPayment, updateSupplierPayment } from '../../utils/transactionStore.js';
import { MdAdd, MdRemove, MdPayment, MdRefresh, MdAccountBalanceWallet, MdEvent, MdDescription } from 'react-icons/md';

export default function SupplierPaymentPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [formData, setFormData] = useState({ supplierId: '', amount: '', date: new Date().toISOString().slice(0, 10), method: 'Cash', remarks: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchPageData();
  }, []);

  async function fetchPageData() {
    try {
      const [suppliersResponse, purchasesResponse] = await Promise.all([
        axiosInstance.get('/suppliers'),
        axiosInstance.get('/purchases').catch(() => ({ data: [] })),
      ]);
      const suppliersData = suppliersResponse.data;
      const purchasesData = purchasesResponse.data;
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : suppliersData.data || []);
      setPurchases(Array.isArray(purchasesData) ? purchasesData : purchasesData.data || []);
      setPaymentHistory(getSupplierPayments());
    } catch {
      toast.error('Failed to load dependency data.');
    }
  }

  const supplierSummaries = useMemo(() => {
    return suppliers.map((supplier) => {
      const opening = Number(supplier.previous_balance || 0);
      const purchasesDue = purchases
        .filter((purchase) => String(purchase.supplier_id) === String(supplier.id))
        .reduce((sum, purchase) => sum + Math.max(0, Number(purchase.payable || 0) - Number(purchase.paid_amount || 0)), 0);
      const localPayments = paymentHistory
        .filter((payment) => String(payment.supplierId) === String(supplier.id))
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

      return {
        ...supplier,
        outstanding: Math.max(0, opening + purchasesDue - localPayments),
      };
    });
  }, [paymentHistory, purchases, suppliers]);

  const selectedSummary = supplierSummaries.find((supplier) => String(supplier.id) === String(formData.supplierId));
  const recentPayments = useMemo(() => paymentHistory.slice(0, 15), [paymentHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(formData.amount);
    if (!formData.supplierId || !formData.amount) {
      toast.error('Supplier and Amount are required.');
      return;
    }
    if (!amount || amount <= 0) {
      toast.error('Enter a valid payment amount.');
      return;
    }
    if (selectedSummary && amount > selectedSummary.outstanding) {
      toast.error('Payment amount cannot exceed the outstanding balance.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        supplierName: selectedSummary?.supplier_name || '',
        amount,
      };
      if (editId) {
        updateSupplierPayment(editId, payload);
        toast.success('Payment updated successfully.');
      } else {
        saveSupplierPayment(payload);
        toast.success('Payment recorded successfully.');
      }
      setPaymentHistory(getSupplierPayments());
      resetForm();
      setIsFormOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  function handleEdit(payment) {
    setEditId(payment.id);
    setFormData({
      supplierId: String(payment.supplierId || ''),
      amount: String(payment.amount || ''),
      date: payment.date || new Date().toISOString().slice(0, 10),
      method: payment.method || 'Cash',
      remarks: payment.remarks || '',
    });
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDelete(paymentId) {
    if (!window.confirm('Delete this supplier payment?')) return;
    setPaymentHistory(deleteSupplierPayment(paymentId));
    if (editId === paymentId) resetForm();
    toast.success('Payment deleted successfully.');
  }

  function resetForm() {
    setEditId(null);
    setFormData({ supplierId: '', amount: '', date: new Date().toISOString().slice(0, 10), method: 'Cash', remarks: '' });
  }

  return (
    <PageShell>
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between">
           <div>
            <h1 className="text-xl font-bold text-slate-900">Supplier Payments</h1>
            <p className="text-sm text-slate-500">Settle outstanding balances with your inventory providers.</p>
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
                <MdAdd className="h-5 w-5" /> Record Payment
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
                  title={editId ? 'Edit Payment Entry' : 'New Payment Receipt'}
                  description="Process a financial settlement for selected supplier."
                  icon={<MdPayment className="h-6 w-6 text-teal-600" />}
                />
                
                <div className="mt-2">
                  <FallbackNotice message="Note: Supplier payments are recorded in local history until backend sync is enabled." />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Target Supplier" required>
                      <select
                        value={formData.supplierId}
                        onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                        className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[12px] font-semibold outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-50"
                      >
                        <option value="">Choose Supplier...</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>{s.supplier_name}</option>
                        ))}
                      </select>
                    </Field>

                    {selectedSummary && (
                      <div className="flex flex-col justify-center rounded-xl border border-teal-100 bg-teal-50/40 px-4 py-2">
                        <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Pending Balance</p>
                        <p className="text-lg font-black text-teal-700 font-mono">PKR {selectedSummary.outstanding.toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                    <Field label="Amount to Pay" required>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          className="h-9 w-full rounded-md border border-slate-300 bg-white pl-3 pr-8 text-[12px] font-bold outline-none transition focus:border-teal-400"
                          placeholder="0.00"
                        />
                        <MdAccountBalanceWallet className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </Field>
                    <Field label="Transaction Date" required>
                      <div className="relative">
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[12px] outline-none transition focus:border-teal-400"
                        />
                      </div>
                    </Field>
                    <Field label="Payment Method">
                      <select
                        value={formData.method}
                        onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                        className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[12px] outline-none transition focus:border-teal-400"
                      >
                        <option value="Cash">Cash Currency</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cheque">Physical Cheque</option>
                        <option value="Online">Online Wallet</option>
                      </select>
                    </Field>
                  </div>

                  <Field label="Remarks / Notes">
                    <div className="relative">
                      <textarea
                        value={formData.remarks}
                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                        className="h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 pl-9 text-[12px] outline-none transition focus:border-teal-400"
                        placeholder="Reference no, bank name, or reason for payment..."
                      />
                      <MdDescription className="absolute left-3 top-2.5 text-slate-400" />
                    </div>
                  </Field>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetForm()
                        setIsFormOpen(false)
                      }}
                      className="inline-flex min-w-[110px] items-center justify-center rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || suppliers.length === 0}
                      className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-xl bg-teal-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-100 hover:bg-teal-700 transition disabled:opacity-50"
                    >
                      <MdPayment /> {submitting ? 'Processing...' : editId ? 'Update Payment' : 'Confirm Payment'}
                    </button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Table */}
        <Card className="mx-auto max-w-5xl p-0 overflow-hidden">
          <SectionHeader
            title="Payment History"
            description="Log of recent outgoing payments to suppliers."
            icon={<MdRefresh className="h-6 w-6 text-teal-600" />}
            action={
              <div className="p-4">
                <button
                  type="button"
                  onClick={fetchPageData}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Refresh Log
                </button>
              </div>
            }
          />
          {recentPayments.length === 0 ? (
            <TableState message="No payment records found in history." />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4">Voucher No</th>
                    <th className="px-5 py-4">Supplier Entity</th>
                    <th className="px-5 py-4">Date & Method</th>
                    <th className="px-5 py-4 text-right">Amount Paid</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {recentPayments.map((payment) => (
                    <motion.tr 
                      key={payment.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`group transition-colors hover:bg-teal-50/30 ${editId === payment.id ? 'bg-teal-50/50' : ''}`}
                    >
                      <td className="px-5 py-4 font-mono text-[11px] text-slate-400">#VRC-{payment.id.toUpperCase().slice(0, 8)}</td>
                      <td className="px-5 py-4 font-bold text-slate-800 text-[13px]">{payment.supplierName}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                           <span className="text-[12px] font-medium text-slate-600">{payment.date}</span>
                           <span className="text-[10px] text-teal-600 font-bold uppercase tracking-tighter">{payment.method}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-black text-teal-700">PKR {Number(payment.amount).toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2 text-right">
                          <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(payment)} />
                          <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(payment.id)} />
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
