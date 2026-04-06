import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Card, Field, PageShell, SectionHeader } from '../../components/layout/PageShell.jsx';
import axiosInstance from '../../services/axiosInstance';

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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  async function fetchInvoices() {
    try {
      const response = await axiosInstance.get('/sales-invoices');
      setInvoices(response.data || []);
    } catch (err) {
      toast.error('Failed to load invoices.');
    }
  }

  const handleInvoiceChange = (e) => {
    const inv = invoices.find(i => i.id === e.target.value);
    setSelectedInvoice(inv);
    setReturnItems(inv ? inv.items.map(item => ({ ...item, returnQty: 0 })) : []);
  };

  const handleQtyChange = (itemId, qty) => {
    setReturnItems(prev => prev.map(item => item.id === itemId ? { ...item, returnQty: Math.min(Math.max(0, qty), item.quantity) } : item));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const itemsToReturn = returnItems.filter(i => i.returnQty > 0);
    if (itemsToReturn.length === 0) {
      toast.error('Add at least one item to return.');
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.post('/sales-returns', {
        invoiceId: selectedInvoice.id,
        items: itemsToReturn
      });
      toast.success('Sales return processed!');
      setSelectedInvoice(null);
      setReturnItems([]);
    } catch (err) {
      toast.error('Failed to process return.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell title="Sales Return" description="Process returns for sold items." accent="from-teal-600 via-emerald-600 to-cyan-700">
      <div className="space-y-6 max-w-4xl mx-auto">
        <Card className="p-4 border-l-[6px] border-l-teal-500">
          <SectionHeader title="Process Return" description="Select invoice to return items from." icon={<ReturnIcon className="h-5 w-5" />} />
          <Field label="Invoice">
            <select onChange={handleInvoiceChange} className="h-9 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-teal-400 outline-none">
              <option value="">Select Invoice</option>
              {invoices.map(inv => <option key={inv.id} value={inv.id}>{inv.invoice_number}</option>)}
            </select>
          </Field>
        </Card>

        {selectedInvoice && (
          <form onSubmit={handleSubmit}>
            <Card className="p-4 border-l-[6px] border-l-teal-500">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-slate-500 text-[10px] uppercase font-bold">
                      <th className="p-2">Item</th>
                      <th className="p-2 text-right">Sold Qty</th>
                      <th className="p-2 text-right">Return Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnItems.map(item => (
                      <tr key={item.id} className="border-b">
                        <td className="p-2">{item.item_name}</td>
                        <td className="p-2 text-right">{item.quantity}</td>
                        <td className="p-2 text-right">
                          <input type="number" min="0" max={item.quantity} value={item.returnQty} onChange={(e) => handleQtyChange(item.id, e.target.value)} className="h-8 w-20 border rounded px-2" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-right">
                <button type="submit" disabled={submitting} className="bg-teal-600 text-white px-6 py-2 rounded-lg font-bold">
                  {submitting ? 'Processing...' : 'Confirm Return'}
                </button>
              </div>
            </Card>
          </form>
        )}
      </div>
    </PageShell>
  );
}
