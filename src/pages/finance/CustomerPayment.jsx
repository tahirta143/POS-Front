import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Card, Field, PageShell, SectionHeader } from '../../components/layout/PageShell.jsx';
import axiosInstance from '../../services/axiosInstance';

function PaymentIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function CustomerPaymentPage() {
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({ customerId: '', amount: '', date: new Date().toISOString().slice(0, 10), method: 'Cash', remarks: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      const response = await axiosInstance.get('/customers');
      setCustomers(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (err) {
      toast.error('Failed to load customers.');
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId || !formData.amount) {
      toast.error('Customer and Amount are required.');
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.post('/customer-payments', formData);
      toast.success('Payment recorded successfully!');
      setFormData({ customerId: '', amount: '', date: new Date().toISOString().slice(0, 10), method: 'Cash', remarks: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      title="Customer Payment"
      description="Record payments received from customers."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-4">
        <Card className="mx-auto max-w-xl border-l-[6px] border-l-teal-500 p-3">
          <SectionHeader
            title="Record Customer Payment"
            description="Process a new payment received."
            icon={<PaymentIcon className="h-5 w-5" />}
          />

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

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-w-[120px] items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2 text-[12px] font-bold text-white shadow-lg shadow-teal-400 hover:bg-teal-700 transition disabled:opacity-50"
              >
                {submitting ? 'Processing...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </PageShell>
  );
}
