import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { ActionButton, Card, Field, PageShell, SectionHeader, TableState } from '../../components/layout/PageShell.jsx';
import axiosInstance from '../../services/axiosInstance';
import { MdAdd, MdRemove, MdPayment, MdRefresh, MdAccountBalanceWallet, MdDescription } from 'react-icons/md';

function createEmptyForm() {
  return {
    customerId:    '',
    invoiceId:     '',
    bookingId:     '', // NEW
    linkType:      'invoice', // 'invoice' or 'booking'
    amount:        '',
    paymentMethod: 'Cash',
    paymentDate:   new Date().toISOString().slice(0, 10),
    remarks:       '',
  };
}

export default function CustomerPaymentPage() {
  const [customers, setCustomers]       = useState([]);
  const [invoices, setInvoices]         = useState([]);
  const [bookings, setBookings]         = useState([]);
  const [payments, setPayments]         = useState([]);
  const [bookingPayments, setBookingPayments] = useState([]); // NEW
  const [historyTab, setHistoryTab]     = useState('sales'); // 'sales' or 'bookings'
  const [form, setForm]                 = useState(createEmptyForm());
  const [submitting, setSubmitting]     = useState(false);
  const [loading, setLoading]           = useState(false);
  const [editId, setEditId]             = useState(null);
  const [isFormOpen, setIsFormOpen]     = useState(false);

  useEffect(() => { fetchPageData(); }, []);

  async function fetchPageData() {
    setLoading(true);
    try {
      const [custRes, invRes, payRes, bookRes, bPayRes] = await Promise.all([
        axiosInstance.get('/customers'),
        axiosInstance.get('/sale-invoices').catch(() => ({ data: [] })),
        axiosInstance.get('/customer-payments'),
        axiosInstance.get('/bookings').catch(() => ({ data: [] })),
        axiosInstance.get('/bookings/all-payments').catch(() => ({ data: [] })),
      ]);
      setCustomers(Array.isArray(custRes.data) ? custRes.data : custRes.data?.data || []);
      setInvoices( Array.isArray(invRes.data)  ? invRes.data  : invRes.data?.data  || []);
      setPayments( Array.isArray(payRes.data)  ? payRes.data  : payRes.data?.data  || []);
      setBookings( Array.isArray(bookRes.data) ? bookRes.data : bookRes.data?.data || []);
      setBookingPayments(Array.isArray(bPayRes.data) ? bPayRes.data : bPayRes.data?.data || []);
    } catch {
      toast.error('Failed to load page data.');
    } finally {
      setLoading(false);
    }
  }

  // Unpaid invoices for selected customer
  const customerInvoices = useMemo(() => {
    if (!form.customerId) return [];
    return invoices.filter(
      inv => String(inv.customer_id) === String(form.customerId) &&
             parseFloat(inv.to_be_paid || 0) > 0
    );
  }, [invoices, form.customerId]);

  // Unpaid bookings for selected customer
  const customerBookings = useMemo(() => {
    if (!form.customerId) return [];
    return bookings.filter(
      bk => String(bk.customer_id) === String(form.customerId) &&
            parseFloat(bk.to_be_paid || 0) > 0
    );
  }, [bookings, form.customerId]);

  // Total outstanding (Invoices + Bookings)
  const outstandingBalance = useMemo(() => {
    if (!form.customerId) return 0;
    const invDue = invoices
      .filter(inv => String(inv.customer_id) === String(form.customerId))
      .reduce((sum, inv) => sum + parseFloat(inv.to_be_paid || 0), 0);
    const bookDue = bookings
      .filter(bk => String(bk.customer_id) === String(form.customerId))
      .reduce((sum, bk) => sum + parseFloat(bk.to_be_paid || 0), 0);
    return invDue + bookDue;
  }, [invoices, bookings, form.customerId]);

  // Due on selected specifically (either invoice or booking)
  const selectedDue = useMemo(() => {
    if (form.linkType === 'invoice' && form.invoiceId) {
      const inv = invoices.find(i => String(i.id) === String(form.invoiceId));
      return inv ? parseFloat(inv.to_be_paid || 0) : null;
    }
    if (form.linkType === 'booking' && form.bookingId) {
      const bk = bookings.find(b => String(b.id) === String(form.bookingId));
      return bk ? parseFloat(bk.to_be_paid || 0) : null;
    }
    return null;
  }, [invoices, bookings, form.linkType, form.invoiceId, form.bookingId]);

  function updateField(key, value) {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'customerId') {
        next.invoiceId = '';
        next.bookingId = '';
      }
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.customerId)        { toast.error('Please select a customer.'); return; }
    if (!amount || amount <= 0)  { toast.error('Enter a valid payment amount.'); return; }
    
    if (selectedDue !== null && amount > selectedDue) {
      toast.error(`Amount exceeds due (PKR ${selectedDue.toLocaleString()}).`);
      return;
    }

    setSubmitting(true);

    try {
      if (form.linkType === 'booking' && form.bookingId) {
        // Record booking payment
        await axiosInstance.post(`/bookings/${form.bookingId}/payments`, {
          amount,
          paymentMethod: form.paymentMethod,
          paymentDate:   form.paymentDate,
          remarks:       form.remarks,
        });
        toast.success('Booking payment recorded successfully.');
      } else {
        // Record regular customer/invoice payment
        const payload = {
          customerId:    form.customerId,
          invoiceId:     form.invoiceId || null,
          amount,
          paymentMethod: form.paymentMethod,
          paymentDate:   form.paymentDate,
          remarks:       form.remarks,
        };
        if (editId) {
          await axiosInstance.put(`/customer-payments/${editId}`, payload);
          toast.success('Payment updated successfully.');
        } else {
          await axiosInstance.post('/customer-payments', payload);
          toast.success('Payment recorded successfully.');
        }
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
      customerId:    String(payment.customer_id || ''),
      invoiceId:     String(payment.invoice_id  || ''),
      amount:        String(payment.amount       || ''),
      paymentMethod: payment.payment_method      || 'Cash',
      paymentDate:   payment.payment_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      remarks:       payment.remarks             || '',
    });
    setIsFormOpen(true);
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id, type = 'sale') {
    const msg = type === 'booking' ? 'Delete this booking payment?' : 'Delete this payment? Invoice status will be recalculated.';
    if (!window.confirm(msg)) return;
    try {
      if (type === 'booking') {
        await axiosInstance.delete(`/bookings/payments/${id}`);
      } else {
        await axiosInstance.delete(`/customer-payments/${id}`);
      }
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

  const totalCollected = useMemo(
    () => payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0),
    [payments]
  );

  return (
    <PageShell>
      <div className="space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Customer Payments</h1>
            <p className="text-sm text-slate-500">Log payments received for outstanding credit invoices.</p>
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
              : <><MdAdd   className="h-5 w-5" /> Collect Payment</>
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
                  title={editId ? 'Edit Collection' : 'New Collection Voucher'}
                  description="Record a cash or digital receipt from a customer."
                  icon={<MdPayment className="h-6 w-6 text-teal-600" />}
                />

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">

                  {/* Customer + Outstanding */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Customer" required>
                      <select
                        value={form.customerId}
                        onChange={e => updateField('customerId', e.target.value)}
                        className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[12px] font-semibold outline-none transition focus:border-teal-400"
                      >
                        <option value="">Choose Customer...</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>{c.customer_name}</option>
                        ))}
                      </select>
                    </Field>

                    {form.customerId && (
                      <div className="flex flex-col justify-center rounded-xl border border-teal-100 bg-teal-50/40 px-4 py-2">
                        <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Total Outstanding</p>
                        <p className="text-lg font-black text-teal-700 font-mono">
                          PKR {outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Link to a specific invoice/booking */}
                  <div className="space-y-4">
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
                      <button type="button" onClick={() => updateField('linkType', 'invoice')} className={`px-4 py-1.5 text-[11px] font-bold rounded-md transition ${form.linkType === 'invoice' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'}`}>Invoice Link</button>
                      <button type="button" onClick={() => updateField('linkType', 'booking')} className={`px-4 py-1.5 text-[11px] font-bold rounded-md transition ${form.linkType === 'booking' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'}`}>Booking Link</button>
                    </div>

                    {form.linkType === 'invoice' ? (
                       customerInvoices.length > 0 && (
                        <Field label="Link to Sale Invoice">
                          <select
                            value={form.invoiceId}
                            onChange={e => updateField('invoiceId', e.target.value)}
                            className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[12px] outline-none transition focus:border-teal-400"
                          >
                            <option value="">— General Payment (No Invoice Link) —</option>
                            {customerInvoices.map(inv => (
                              <option key={inv.id} value={inv.id}>
                                {inv.receipt_no || `INV-${inv.id}`} — Due: PKR {Number(inv.to_be_paid).toLocaleString()}
                              </option>
                            ))}
                          </select>
                        </Field>
                      )
                    ) : (
                      customerBookings.length > 0 && (
                        <Field label="Link to Booking">
                          <select
                            value={form.bookingId}
                            onChange={e => updateField('bookingId', e.target.value)}
                            className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[12px] outline-none transition focus:border-teal-400"
                          >
                            <option value="">— Select Booking —</option>
                            {customerBookings.map(bk => (
                              <option key={bk.id} value={bk.id}>
                                #BK-{bk.id} ({bk.booking_date}) — Due: PKR {Number(bk.to_be_paid).toLocaleString()}
                              </option>
                            ))}
                          </select>
                        </Field>
                      )
                    )}

                    {selectedDue !== null && (
                      <p className="text-[11px] text-amber-600 font-semibold">
                        Due on selected item: PKR {selectedDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>

                  {/* Amount, Date, Method */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                    <Field label="Amount Received" required>
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
                    <Field label="Receipt Date" required>
                      <input
                        type="date"
                        value={form.paymentDate}
                        onChange={e => updateField('paymentDate', e.target.value)}
                        className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[12px] outline-none transition focus:border-teal-400"
                      />
                    </Field>
                    <Field label="Collection Method">
                      <select
                        value={form.paymentMethod}
                        onChange={e => updateField('paymentMethod', e.target.value)}
                        className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[12px] outline-none transition focus:border-teal-400"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="Online">Online / Wallet</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </Field>
                  </div>

                  {/* Remarks */}
                  <Field label="Remarks / Notes">
                    <div className="relative">
                      <textarea
                        value={form.remarks}
                        onChange={e => updateField('remarks', e.target.value)}
                        rows={2}
                        placeholder="Invoice settled, bank reference, or other notes..."
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
                      {submitting ? 'Processing...' : editId ? 'Update Receipt' : 'Record Receipt'}
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
            title="Collection Registry"
            description="Log of incoming payments from customers."
            icon={<MdRefresh className="h-6 w-6 text-teal-600" />}
            action={
              <div className="flex items-center gap-4 p-4">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button onClick={() => setHistoryTab('sales')} className={`px-4 py-1.5 text-[11px] font-bold rounded-md transition ${historyTab === 'sales' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'}`}>Sales Payments</button>
                  <button onClick={() => setHistoryTab('bookings')} className={`px-4 py-1.5 text-[11px] font-bold rounded-md transition ${historyTab === 'bookings' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'}`}>Booking Payments</button>
                </div>
                <button type="button" onClick={fetchPageData} className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition">Refresh</button>
              </div>
            }
          />

          {loading ? (
            <TableState message="Loading payment history..." />
          ) : (historyTab === 'sales' ? payments : bookingPayments).length === 0 ? (
            <TableState message={`No ${historyTab} records found.`} />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4">#</th>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">{historyTab === 'sales' ? 'Invoice' : 'Booking'}</th>
                    <th className="px-5 py-4">Date & Method</th>
                    <th className="px-5 py-4">Remarks</th>
                    <th className="px-5 py-4 text-right">Amount</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {(historyTab === 'sales' ? payments : bookingPayments).map((p, idx) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`group transition-colors hover:bg-teal-50/30 ${editId === p.id ? 'bg-teal-50/50' : ''}`}
                    >
                      <td className="px-5 py-4 text-[11px] text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-5 py-4 font-bold text-slate-800 text-[13px]">{p.customer_name}</td>
                      <td className="px-5 py-4">
                        {historyTab === 'sales' ? (
                           p.invoice_id ? (
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-600">
                              {p.receipt_no || `INV-${p.invoice_id}`}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">—</span>
                          )
                        ) : (
                          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-mono text-indigo-600 font-bold">
                            #BK-{p.booking_id}
                          </span>
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
                        {p.remarks || '—'}
                      </td>
                      <td className="px-5 py-4 text-right font-black text-teal-700 font-mono">
                        PKR {Number(p.amount).toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {historyTab === 'sales' && <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(p)} />}
                          <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(p.id, historyTab === 'sales' ? 'sale' : 'booking')} />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                  <tr>
                    <td colSpan="5" className="px-5 py-3 text-[11px] font-bold uppercase text-slate-500 text-right">
                      Total Collected ({historyTab === 'sales' ? 'Invoices' : 'Bookings'})
                    </td>
                    <td className="px-5 py-3 text-right font-black text-teal-700 font-mono">
                      PKR {(historyTab === 'sales' ? payments : bookingPayments).reduce((s, p) => s + parseFloat(p.amount || 0), 0).toLocaleString()}
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