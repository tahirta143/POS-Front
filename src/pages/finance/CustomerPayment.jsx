import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { ActionButton, Card, Field, PageShell, SectionHeader, TableState } from '../../components/layout/PageShell.jsx';
import FallbackNotice from '../../components/layout/FallbackNotice.jsx';
import axiosInstance from '../../services/axiosInstance';
import { deleteCustomerPayment, getCustomerPayments, saveCustomerPayment, getSalesReturns, updateCustomerPayment } from '../../utils/transactionStore.js';

function PaymentIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function CustomerPaymentPage() {
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [formData, setFormData] = useState({ customerId: '', amount: '', date: new Date().toISOString().slice(0, 10), method: 'Cash', remarks: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchPageData();
  }, []);

  async function fetchPageData() {
    try {
      const [customersResponse, salesResponse] = await Promise.all([
        axiosInstance.get('/customers'),
        axiosInstance.get('/sale-invoices').catch(() => ({ data: [] })),
      ]);
      const customersData = customersResponse.data;
      const salesData = salesResponse.data;
      setCustomers(Array.isArray(customersData) ? customersData : customersData.data || []);
      setSales(Array.isArray(salesData) ? salesData : salesData.data || []);
      setPaymentHistory(getCustomerPayments());
    } catch {
      toast.error('Failed to load customers.');
    }
  }

  const customerSummaries = useMemo(() => {
    const salesReturns = getSalesReturns();
    return customers.map((customer) => {
      const opening = Number(customer.previous_balance || 0);
      const invoicesDue = sales
        .filter((sale) => String(sale.customer_id) === String(customer.id))
        .reduce((sum, sale) => sum + Math.max(0, Number(sale.payable || 0) - Number(sale.given_amount || 0)), 0);
      const collected = paymentHistory
        .filter((payment) => String(payment.customerId) === String(customer.id))
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      const returned = salesReturns
        .filter((record) => String(record.customerId) === String(customer.id))
        .reduce((sum, record) => sum + Number(record.totalReturn || 0), 0);

      return {
        ...customer,
        outstanding: Math.max(0, opening + invoicesDue - collected - returned),
      };
    });
  }, [customers, paymentHistory, sales]);

  const selectedSummary = customerSummaries.find((customer) => String(customer.id) === String(formData.customerId));
  const recentPayments = useMemo(() => paymentHistory.slice(0, 8), [paymentHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(formData.amount);
    if (!formData.customerId || !formData.amount) {
      toast.error('Customer and Amount are required.');
      return;
    }
    if (!amount || amount <= 0) {
      toast.error('Enter a valid payment amount.');
      return;
    }
    if (selectedSummary && amount > selectedSummary.outstanding) {
      toast.error('Payment amount cannot exceed the outstanding amount.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        customerName: selectedSummary?.customer_name || '',
        amount,
      };
      if (editId) {
        updateCustomerPayment(editId, payload);
        toast.success('Payment updated successfully.');
      } else {
        saveCustomerPayment(payload);
        toast.success('Payment recorded in frontend successfully.');
      }
      setPaymentHistory(getCustomerPayments());
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  function handleEdit(payment) {
    setEditId(payment.id);
    setFormData({
      customerId: String(payment.customerId || ''),
      amount: String(payment.amount || ''),
      date: payment.date || new Date().toISOString().slice(0, 10),
      method: payment.method || 'Cash',
      remarks: payment.remarks || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDelete(paymentId) {
    if (!window.confirm('Delete this customer payment?')) return;
    setPaymentHistory(deleteCustomerPayment(paymentId));
    if (editId === paymentId) resetForm();
    toast.success('Payment deleted successfully.');
  }

  function resetForm() {
    setEditId(null);
    setFormData({ customerId: '', amount: '', date: new Date().toISOString().slice(0, 10), method: 'Cash', remarks: '' });
  }

  return (
    <PageShell
      title="Customer Payment"
      description="Record payments received from customers."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-4">
        <Card className="mx-auto max-w-4xl border-l-[6px] border-l-teal-500 p-3">
          <SectionHeader
            title={editId ? 'Edit Customer Payment' : 'Record Customer Payment'}
            description="Process a new payment received."
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
            <FallbackNotice message="Customer payments are being stored in frontend history until the backend customer-payments route is available." />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <Field label="Customer" required>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[12px] outline-none transition focus:border-teal-400"
              >
                <option value="">Select Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.customer_name}</option>
                ))}
              </select>
            </Field>

            {selectedSummary && (
              <div className="rounded-xl border border-teal-100 bg-teal-50/60 px-3 py-2 text-[12px] text-slate-700">
                Outstanding amount: <span className="font-bold text-teal-700">PKR {selectedSummary.outstanding.toFixed(2)}</span>
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
                <option value="Card">Card</option>
                <option value="Online">Online Transfer</option>
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
                disabled={submitting || customers.length === 0}
                className="inline-flex min-w-[120px] items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2 text-[12px] font-bold text-white shadow-lg shadow-teal-400 hover:bg-teal-700 transition disabled:opacity-50"
              >
                {submitting ? 'Processing...' : editId ? 'Update Payment' : 'Record Payment'}
              </button>
            </div>
          </form>
        </Card>

        <Card className="mx-auto max-w-4xl p-3">
          <SectionHeader
            title="Recent Customer Payments"
            description="Frontend payment history until backend posting is added."
            action={
              <button
                type="button"
                onClick={() => setPaymentHistory(getCustomerPayments())}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Refresh
              </button>
            }
          />
          {recentPayments.length === 0 ? (
            <TableState message="No customer payments recorded yet." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <div className="overflow-x-auto w-full">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      <th className="px-3 py-2.5">Voucher</th>
                      <th className="px-3 py-2.5">Customer</th>
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
                        <td className="px-3 py-2 font-semibold text-slate-700">{payment.customerName}</td>
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
