import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Card, Field, PageShell, SectionHeader } from '../../components/layout/PageShell.jsx';
import axiosInstance from '../../services/axiosInstance';

function PaymentIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

export default function SupplierPaymentPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({ supplierId: '', amount: '', date: new Date().toISOString().slice(0, 10), method: 'Cash', remarks: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  async function fetchSuppliers() {
    try {
      const response = await axiosInstance.get('/suppliers');
      const data = response.data;
      setSuppliers(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      toast.error('Failed to load suppliers.');
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplierId || !formData.amount) {
      toast.error('Supplier and Amount are required.');
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.post('/supplier-payments', formData);
      toast.success('Payment recorded successfully!');
      setFormData({ supplierId: '', amount: '', date: new Date().toISOString().slice(0, 10), method: 'Cash', remarks: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      title="Supplier Payment"
      description="Record payments made to suppliers."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-4">
        <Card className="mx-auto max-w-xl border-l-[6px] border-l-teal-500 p-3">
          <SectionHeader
            title="Record Supplier Payment"
            description="Process a new payment for a supplier."
            icon={<PaymentIcon className="h-5 w-5" />}
          />

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
