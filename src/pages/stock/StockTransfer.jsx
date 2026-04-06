import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Card, Field, PageShell, SectionHeader } from '../../components/layout/PageShell.jsx';
import axiosInstance from '../../services/axiosInstance';

function TransferIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  );
}

export default function StockTransferPage() {
  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]); // Warehouse/Units
  const [formData, setFormData] = useState({ itemId: '', fromUnitId: '', toUnitId: '', quantity: '', date: new Date().toISOString().slice(0, 10) });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      const [itmRes, untRes] = await Promise.all([
        axiosInstance.get('/item-details'),
        axiosInstance.get('/units') // Assuming an endpoint for store units/locations
      ]);
      setItems(Array.isArray(itmRes.data) ? itmRes.data : itmRes.data.data || []);
      setUnits(Array.isArray(untRes.data) ? untRes.data : untRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load transfer data.');
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.itemId || !formData.fromUnitId || !formData.toUnitId || !formData.quantity) {
      toast.error('All fields are required.');
      return;
    }
    if (formData.fromUnitId === formData.toUnitId) {
      toast.error('Source and Destination units must be different.');
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.post('/stock-transfers', formData);
      toast.success('Stock transfer recorded successfully!');
      setFormData({ itemId: '', fromUnitId: '', toUnitId: '', quantity: '', date: new Date().toISOString().slice(0, 10) });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to transfer stock.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      title="Stock Transfer"
      description="Transfer items between different business units or warehouses."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-4 max-w-2xl mx-auto">
        <Card className="border-l-[6px] border-l-teal-500 p-4">
          <SectionHeader
            title="Internal Stock Transfer"
            description="Move inventory items between units."
            icon={<TransferIcon className="h-5 w-5" />}
          />

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <Field label="Item to Transfer" required>
              <select
                value={formData.itemId}
                onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-400"
              >
                <option value="">Select Item</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>{i.item_name} (Current: {i.stock})</option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="From Unit" required>
                <select
                  value={formData.fromUnitId}
                  onChange={(e) => setFormData({ ...formData, fromUnitId: e.target.value })}
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-400"
                >
                  <option value="">Select Source</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{u.unit_name}</option>
                  ))}
                </select>
              </Field>
              <Field label="To Unit" required>
                <select
                  value={formData.toUnitId}
                  onChange={(e) => setFormData({ ...formData, toUnitId: e.target.value })}
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-400"
                >
                  <option value="">Select Destination</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{u.unit_name}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Quantity" required>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-400"
                  placeholder="0"
                />
              </Field>
              <Field label="Transfer Date" required>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-400"
                />
              </Field>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-w-[140px] items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-400 hover:bg-teal-700 transition disabled:opacity-50"
              >
                {submitting ? 'Transferring...' : 'Execute Transfer'}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </PageShell>
  );
}
