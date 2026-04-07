import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { ActionButton, Card, Field, PageShell, SectionHeader, TableState } from '../../components/layout/PageShell.jsx';
import FallbackNotice from '../../components/layout/FallbackNotice.jsx';
import axiosInstance from '../../services/axiosInstance';
import { deleteSupplierPayment, getSupplierPayments, saveSupplierPayment, updateSupplierPayment } from '../../utils/transactionStore.js';

function PaymentIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

export default function SupplierPaymentPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [formData, setFormData] = useState({ supplierId: '', amount: '', date: new Date().toISOString().slice(0, 10), method: 'Cash', remarks: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);

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
      toast.error('Failed to load suppliers.');
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
  const recentPayments = useMemo(() => paymentHistory.slice(0, 8), [paymentHistory]);

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
        toast.success('Payment recorded in frontend successfully.');
      }
      setPaymentHistory(getSupplierPayments());
      resetForm();
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
    <PageShell
      title="Supplier Payment"
      description="Record payments made to suppliers."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-4">
        <Card className="mx-auto max-w-4xl border-l-[6px] border-l-teal-500 p-3">
          <SectionHeader
            title={editId ? 'Edit Supplier Payment' : 'Record Supplier Payment'}
            description="Process a new payment for a supplier."
            icon={<PaymentIcon className="h-5 w-5" />}
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
            <FallbackNotice message="Supplier payments are being stored in frontend history until the backend supplier-payments route is available." />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <Field label="Supplier" required>
              <select
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[12px] outline-none transition focus:border-teal-400"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.supplier_name}</option>
                ))}
              </select>
            </Field>

            {selectedSummary && (
              <div className="rounded-xl border border-teal-100 bg-teal-50/60 px-3 py-2 text-[12px] text-slate-700">
                Outstanding balance: <span className="font-bold text-teal-700">PKR {selectedSummary.outstanding.toFixed(2)}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Amount" required>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[12px] outline-none transition focus:border-teal-400"
                  placeholder="0.00"
                />
              </Field>
              <Field label="Payment Date" required>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[12px] outline-none transition focus:border-teal-400"
                />
              </Field>
            </div>

            <Field label="Method">
              <select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[12px] outline-none transition focus:border-teal-400"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </Field>

            <Field label="Remarks">
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="h-16 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-[12px] outline-none transition focus:border-teal-400"
                placeholder="Optional remarks"
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex min-w-[110px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={submitting || suppliers.length === 0}
                className="inline-flex min-w-[120px] items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2 text-[12px] font-bold text-white shadow-lg shadow-teal-400 hover:bg-teal-700 transition disabled:opacity-50"
              >
                {submitting ? 'Processing...' : editId ? 'Update Payment' : 'Record Payment'}
              </button>
            </div>
          </form>
        </Card>

        <Card className="mx-auto max-w-4xl p-3">
          <SectionHeader
            title="Recent Supplier Payments"
            description="Frontend payment history until backend posting is added."
            action={
              <button
                type="button"
                onClick={() => setPaymentHistory(getSupplierPayments())}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Refresh
              </button>
            }
          />
          {recentPayments.length === 0 ? (
            <TableState message="No supplier payments recorded yet." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <div className="overflow-x-auto w-full">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      <th className="px-3 py-2.5">Voucher</th>
                      <th className="px-3 py-2.5">Supplier</th>
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5">Method</th>
                      <th className="px-3 py-2.5 text-right">Amount</th>
                      <th className="px-3 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {recentPayments.map((payment) => (
                      <tr key={payment.id} className="text-[12px] hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-mono text-slate-500">{payment.id}</td>
                        <td className="px-3 py-2 font-semibold text-slate-700">{payment.supplierName}</td>
                        <td className="px-3 py-2 text-slate-600">{payment.date}</td>
                        <td className="px-3 py-2 text-slate-600">{payment.method}</td>
                        <td className="px-3 py-2 text-right font-bold text-teal-700">PKR {Number(payment.amount).toFixed(2)}</td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-2">
                            <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(payment)} />
                            <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(payment.id)} />
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
