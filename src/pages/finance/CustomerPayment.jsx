import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { ActionButton, Card, Field, PageShell, SectionHeader, TableState } from '../../components/layout/PageShell.jsx';
import FallbackNotice from '../../components/layout/FallbackNotice.jsx';
import axiosInstance from '../../services/axiosInstance';
import { deleteCustomerPayment, getCustomerPayments, saveCustomerPayment, getSalesReturns, updateCustomerPayment } from '../../utils/transactionStore.js';
import { MdAdd, MdRemove, MdPayment, MdRefresh, MdAccountBalanceWallet, MdEvent, MdDescription } from 'react-icons/md';

export default function CustomerPaymentPage() {
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [formData, setFormData] = useState({ customerId: '', amount: '', date: new Date().toISOString().slice(0, 10), method: 'Cash', remarks: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

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
      toast.error('Failed to load dependency data.');
    }
  }

  const customerSummaries = useMemo(() => {
    const salesReturns = getSalesReturns();
    return customers.map((customer) => {
      const opening = Number(customer.previous_balance || 0);
      
      // UPDATED: Use to_be_paid instead of calculating from payable - given_amount
      const invoicesDue = sales
        .filter((sale) => String(sale.customer_id) === String(customer.id))
        .reduce((sum, sale) => sum + Number(sale.to_be_paid || 0), 0); // Directly use to_be_paid
      
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
  const recentPayments = useMemo(() => paymentHistory.slice(0, 15), [paymentHistory]);

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
      toast.error('Payment amount cannot exceed the outstanding balance.');
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
        toast.success('Payment recorded successfully.');
      }
      setPaymentHistory(getCustomerPayments());
      resetForm();
      setIsFormOpen(false);
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
    setIsFormOpen(true);
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
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
    <PageShell>
      <div className="space-y-4">
        {/* Top Header - Keeping your original design */}
        <div className="flex items-center justify-between">
           <div>
            <h1 className="text-xl font-bold text-slate-900">Customer Payments</h1>
            <p className="text-sm text-slate-500">Log payments received for outstanding credit invoices.</p>
          </div>
          <button
            onClick={() => {
              if (isFormOpen && editId) {
                resetForm()
                document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
              } else {
                const opening = !isFormOpen
                setIsFormOpen(opening)
                if (opening) {
                  resetForm()
                  document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
                }
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
                <MdAdd className="h-5 w-5" /> Collect Payment
              </>
            )}
          </button>
        </div>

        {/* Collapsible Form - Keeping your original design */}
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
                  title={editId ? 'Edit Collection' : 'New Collection Voucher'}
                  description="Record a cash or digital receipt from a customer."
                  icon={<MdPayment className="h-6 w-6 text-teal-600" />}
                />
                
                <div className="mt-2">
                  <FallbackNotice message="Note: Customer payments are tracked locally until backend API endpoints are deployed." />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Target Customer" required>
                      <select
                        value={formData.customerId}
                        onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                        className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[12px] font-semibold outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-50"
                      >
                        <option value="">Choose Customer...</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>{c.customer_name}</option>
                        ))}
                      </select>
                    </Field>

                    {selectedSummary && (
                      <div className="flex flex-col justify-center rounded-xl border border-teal-100 bg-teal-50/40 px-4 py-2">
                        <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Outstanding Credit</p>
                        <p className="text-lg font-black text-teal-700 font-mono">PKR {selectedSummary.outstanding.toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                    <Field label="Amount Received" required>
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
                    <Field label="Receipt Date" required>
                      <div className="relative">
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[12px] outline-none transition focus:border-teal-400"
                        />
                      </div>
                    </Field>
                    <Field label="Collection Method">
                      <select
                        value={formData.method}
                        onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                        className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[12px] outline-none transition focus:border-teal-400"
                      >
                        <option value="Cash">Physical Cash</option>
                        <option value="Card">Terminal Card</option>
                        <option value="Online">Online / Wallet</option>
                        <option value="Cheque">Physical Cheque</option>
                      </select>
                    </Field>
                  </div>

                  <Field label="Collection Remarks">
                    <div className="relative">
                      <textarea
                        value={formData.remarks}
                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                        className="h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 pl-9 text-[12px] outline-none transition focus:border-teal-400"
                        placeholder="Invoiced settled, bank reference, or other notes..."
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
                      disabled={submitting || customers.length === 0}
                      className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-xl bg-teal-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-100 hover:bg-teal-700 transition disabled:opacity-50"
                    >
                      <MdPayment /> {submitting ? 'Processing...' : editId ? 'Update Receipt' : 'Record Receipt'}
                    </button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Table - Keeping your original design */}
        <Card className="mx-auto max-w-5xl p-0 overflow-hidden">
          <SectionHeader
            title="Collection Registry"
            description="Log of recent incoming payments from customers."
            icon={<MdRefresh className="h-6 w-6 text-teal-600" />}
            action={
              <div className="p-4">
                <button
                  type="button"
                  onClick={fetchPageData}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  <MdRefresh className="inline mr-1" /> Refresh Registry
                </button>
              </div>
            }
          />
          {recentPayments.length === 0 ? (
            <TableState message="No collection records found in history." />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4">Receipt ID</th>
                    <th className="px-5 py-4">Customer Account</th>
                    <th className="px-5 py-4">Date & Method</th>
                    <th className="px-5 py-4 text-right">Collected Amount</th>
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
                      <td className="px-5 py-4 font-mono text-[11px] text-slate-400">#REC-{payment.id.toUpperCase().slice(0, 8)}</td>
                      <td className="px-5 py-4 font-bold text-slate-800 text-[13px]">{payment.customerName}</td>
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