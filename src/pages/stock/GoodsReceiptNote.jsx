import { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Card, Field, PageShell, SectionHeader, TableState } from '../../components/layout/PageShell.jsx';
import axiosInstance from '../../services/axiosInstance';

const sectionStyles = {
  teal: { accent: 'bg-teal-500', header: 'border-teal-100 bg-teal-50/80' },
};

function SectionCard({ title, children }) {
  const style = sectionStyles.teal;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm shadow-slate-100/50">
      <div className={`mb-2 flex items-center gap-2 rounded-md border px-2 py-1 ${style.header}`}>
        <span className={`h-3 w-1 rounded-full ${style.accent}`} />
        <h3 className="text-[12px] font-semibold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ReceiptIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

export default function GoodsReceiptNotePage() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [grnDate, setGrnDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPurchaseOrders();
    setGrnDate(new Date().toISOString().slice(0, 10));
  }, []);

  async function fetchPurchaseOrders() {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/purchases?status=pending_receipt'); // Assuming a status filter for pending GRN
      const data = response.data;
      setPurchaseOrders(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      toast.error('Failed to load purchase orders.');
    } finally {
      setLoading(false);
    }
  }

  const handlePOSelection = (e) => {
    const poId = e.target.value;
    const po = purchaseOrders.find((p) => p.id === poId);
    setSelectedPO(po);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPO) {
      toast.error('Please select a Purchase Order.');
      return;
    }

    setSubmitting(true);
    try {
      // This endpoint confirms receipt of items for the selected PO
      await axiosInstance.post(`/purchases/receipts`, {
        purchaseOrderId: selectedPO.id,
        grnDate,
        remarks,
      });
      toast.success('Goods Receipt Note recorded successfully!');
      setSelectedPO(null);
      setRemarks('');
      setGrnDate(new Date().toISOString().slice(0, 10));
      fetchPurchaseOrders(); // Refresh pending POs
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to record GRN.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      title="Goods Receipt Note"
      description="Acknowledge and confirm received goods from suppliers."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="space-y-4">
        <Card className="mx-auto max-w-5xl border-l-[6px] border-l-teal-500 p-3">
          <SectionHeader
            title="Create Goods Receipt Note"
            description="Record incoming inventory against a Purchase Order."
            icon={<ReceiptIcon className="h-5 w-5" />}
          />

          <form onSubmit={handleSubmit} className="space-y-3">
            <SectionCard title="Receipt Details">
              <div className="flex flex-wrap gap-3 items-end">
                <Field label="Purchase Order" required>
                  <select
                    value={selectedPO?.id || ''}
                    onChange={handlePOSelection}
                    className="h-7 w-56 rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                    disabled={loading}
                  >
                    <option value="">Select PO (GRN No)</option>
                    {purchaseOrders.map((po) => (
                      <option key={po.id} value={po.id}>
                        {po.grn_no} - {po.supplier_name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="GRN Date" required>
                  <input
                    type="date"
                    value={grnDate}
                    onChange={(e) => setGrnDate(e.target.value)}
                    className="h-7 w-32 rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                    required
                  />
                </Field>
                <Field label="Remarks">
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Optional remarks"
                    className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </Field>
              </div>
            </SectionCard>

            {selectedPO && (
              <SectionCard title="Purchase Order Items">
                <div className="overflow-hidden rounded-xl border border-slate-100">
                  <div className="overflow-x-auto w-full">
                    <table className="min-w-full divide-y divide-slate-100 text-left">
                      <thead className="bg-slate-50">
                        <tr className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                          <th className="px-3 py-2.5">Item Name</th>
                          <th className="px-3 py-2.5">Category</th>
                          <th className="px-3 py-2.5 text-right">Ordered Qty</th>
                          <th className="px-3 py-2.5 text-right">Price</th>
                          <th className="px-3 py-2.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {selectedPO.items.map((item, idx) => (
                          <tr key={idx} className="text-[12px] border-t border-slate-50 transition hover:bg-slate-50/50">
                            <td className="px-3 py-2 font-medium text-slate-900">{item.item_name}</td>
                            <td className="px-3 py-2 text-slate-600">{item.category_name}</td>
                            <td className="px-3 py-2 text-right text-slate-600">{item.quantity}</td>
                            <td className="px-3 py-2 text-right font-bold text-slate-800">PKR {Number(item.purchase_price).toFixed(2)}</td>
                            <td className="px-3 py-2 text-right font-bold text-slate-800">PKR {Number(item.total).toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50/50 font-semibold border-t border-slate-200">
                          <td colSpan="4" className="px-3 py-2 text-right text-[11px] uppercase text-slate-600">Total Payable</td>
                          <td className="px-3 py-2 text-right text-teal-600 font-bold text-[13px]">PKR {Number(selectedPO.payable).toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </SectionCard>
            )}

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={submitting || !selectedPO}
                className="inline-flex min-w-[150px] items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2 text-[12px] font-bold text-white shadow-lg shadow-teal-400 hover:bg-teal-700 transition disabled:opacity-50 disabled:shadow-none"
              >
                {submitting ? 'Confirming...' : 'Confirm Goods Receipt'}
              </button>
            </div>
          </form>
        </Card>

        {/* Recent GRNs Table (optional, can be similar to PurchasePage recent purchases) */}
        <Card className="mx-auto max-w-5xl p-3">
          <SectionHeader
            title="Recent Goods Receipts"
            description="Log of recent goods receipts."
            icon={<ReceiptIcon className="h-5 w-5" />}
            action={
              <button
                type="button"
                onClick={fetchPurchaseOrders} // Or a dedicated fetchGRNs function
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Refresh
              </button>
            }
          />
          <TableState message="No recent goods receipts found." />
        </Card>
      </div>
    </PageShell>
  );
}
