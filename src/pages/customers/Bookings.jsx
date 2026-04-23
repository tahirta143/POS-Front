import { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  Field,
  PageShell,
  SectionHeader,
  TableState,
  ActionButton,
  StatusChip,
} from "../../components/layout/PageShell.jsx";
import axiosInstance from "../../services/axiosInstance";
import {
  MdAdd,
  MdRemove,
  MdRefresh,
  MdEventAvailable,
  MdHistory,
  MdPayment,
  MdSearch,
  MdLock,
} from "react-icons/md";
import { usePermissions } from "../../hooks/usePermissions";

const sectionStyles = {
  teal: { accent: "bg-teal-500", header: "border-teal-100 bg-teal-50/80" },
};

function SectionCard({ title, children }) {
  const style = sectionStyles.teal;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition-colors">
      <div className={`mb-2 flex items-center gap-2 rounded-md border px-2 py-1 ${style.header}`}>
        <span className={`h-3 w-1 rounded-full ${style.accent}`} />
        <h3 className="text-[12px] font-bold text-slate-800 uppercase tracking-tight">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function createEmptyRow() {
  return { id: Date.now() + Math.random(), category_id: "", item_id: "", price: "", quantity: 1, total: 0 };
}

export default function Bookings() {
  const { canCreate, canRead, canUpdate, canDelete, isAdmin } = usePermissions();
  const MODULE_NAME = "Booking";

  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [bookingsRecord, setBookingsRecord] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  // Payment modal
  const [payBooking, setPayBooking] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [payRemarks, setPayRemarks] = useState("");

  // Form state
  const [mobileNumber, setMobileNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState(null);
  const [address, setAddress] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [invoiceItems, setInvoiceItems] = useState([createEmptyRow()]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [discount, setDiscount] = useState("");
  const [givenAmount, setGivenAmount] = useState("");

  // Permission checks
  const canCreateBooking = isAdmin || canCreate(MODULE_NAME);
  const canReadBooking = isAdmin || canRead(MODULE_NAME);
  const canUpdateBooking = isAdmin || canUpdate(MODULE_NAME);
  const canDeleteBooking = isAdmin || canDelete(MODULE_NAME);
  // For recording payments, we use canCreate since it's a create operation
  const canRecordPayment = isAdmin || canCreate(MODULE_NAME);

  useEffect(() => {
    if (canReadBooking) {
      fetchInitialData();
      fetchBookings();
    }
  }, [canReadBooking]);

  async function fetchInitialData() {
    try {
      const [cusRes, catRes, itmRes] = await Promise.all([
        axiosInstance.get("/customers").catch(() => ({ data: [] })),
        axiosInstance.get("/categories").catch(() => ({ data: [] })),
        axiosInstance.get("/item-details").catch(() => ({ data: [] })),
      ]);
      const toArr = (d) => Array.isArray(d) ? d : d?.data || [];
      setCustomers(toArr(cusRes.data));
      setCategories(toArr(catRes.data));
      setItems(toArr(itmRes.data));
    } catch {
      toast.error("Failed to load dependency data");
    }
  }

  async function fetchBookings() {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/bookings");
      const data = res.data;
      setBookingsRecord(Array.isArray(data) ? data : data?.data || []);
    } catch {
      setBookingsRecord([]);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id) => {
    if (!canDeleteBooking) {
      toast.error("You don't have permission to delete bookings.");
      return;
    }
    if (!window.confirm("Delete this booking?")) return;
    try {
      await axiosInstance.delete(`/bookings/${id}`);
      toast.success("Booking deleted successfully");
      if (editId === id) resetForm();
      fetchBookings();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete booking");
    }
  };

  const handleEdit = (rec) => {
    if (!canUpdateBooking) {
      toast.error("You don't have permission to edit bookings.");
      return;
    }
    
    setEditId(rec.id);
    setMobileNumber(rec.mobile_number || "");
    setCustomerName(rec.customer_name || "");
    setCustomerId(rec.customer_id);
    setAddress(rec.address || "");
    setBookingDate(rec.booking_date ? String(rec.booking_date).slice(0, 10) : "");
    setBookingTime(rec.booking_time || "");
    setDiscount(rec.discount || "");
    setGivenAmount(rec.paid || "");
    setPaymentMethod(rec.payment_method || "Cash");

    if (rec.items && rec.items.length > 0) {
      setInvoiceItems(
        rec.items.map((item) => ({
          id: Date.now() + Math.random(),
          category_id: String(item.category_id || ""),
          item_id: item.item_id,
          price: parseFloat(item.price || 0),
          quantity: item.qty || 1,
          total: parseFloat(item.price || 0) * (item.qty || 1),
        }))
      );
    } else {
      setInvoiceItems([createEmptyRow()]);
    }
    setIsFormOpen(true);
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const matchingCustomers = useMemo(() => {
    if (mobileNumber.length < 4) return [];
    const q = mobileNumber.toLowerCase();
    return customers.filter(
      (c) => c.mobile_number?.toLowerCase().includes(q) || c.customer_name?.toLowerCase().includes(q)
    );
  }, [mobileNumber, customers]);

  const handleMobileChange = (e) => {
    const val = e.target.value;
    setMobileNumber(val);
    setShowCustomerDropdown(val.length >= 4);
    if (customerId) setCustomerId(null);
  };

  const handleSelectCustomer = (customer) => {
    setMobileNumber(customer.mobile_number);
    setCustomerName(customer.customer_name);
    setCustomerId(customer.id);
    if (customer.address) setAddress(customer.address);
    setShowCustomerDropdown(false);
  };

  const subTotal = useMemo(
    () => invoiceItems.reduce((sum, row) => sum + (Number(row.total) || 0), 0),
    [invoiceItems]
  );

  const payable = useMemo(
    () => Math.max(0, subTotal - (Number(discount) || 0)),
    [subTotal, discount]
  );

  const remaining = useMemo(
    () => Math.max(0, payable - (Number(givenAmount) || 0)),
    [payable, givenAmount]
  );

  const isAllPaid = payable > 0 && Number(givenAmount) >= payable;

  const addRow = () => setInvoiceItems(prev => [...prev, createEmptyRow()]);
  const removeRow = (id) => {
    if (invoiceItems.length > 1) setInvoiceItems(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id, field, value) => {
    setInvoiceItems(prev => prev.map(row => {
      if (row.id !== id) return row;
      const newRow = { ...row, [field]: value };
      if (field === "item_id" && value) {
        const found = items.find(i => String(i.id) === String(value));
        if (found) newRow.price = found.sale_price || 0;
      }
      if (field === "category_id") { newRow.item_id = ""; newRow.price = ""; }
      newRow.total = (Number(newRow.price) || 0) * (Number(newRow.quantity) || 0);
      return newRow;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canCreateBooking && !canUpdateBooking) {
      toast.error("You don't have permission to save bookings.");
      return;
    }
    
    if (!mobileNumber || !customerName) { toast.error("Customer Mobile & Name required."); return; }
    const validItems = invoiceItems.filter(r => r.item_id && r.quantity > 0);
    if (validItems.length === 0) { toast.error("Add at least one item."); return; }

    setSubmitting(true);
    const payload = {
      customer_id: customerId,
      items: validItems.map(r => ({ item_id: r.item_id, qty: r.quantity })),
      sub_total: subTotal,
      discount: Number(discount) || 0,
      payable,
      paid: Number(givenAmount) || 0,
      to_be_paid: remaining,
      payment_method: paymentMethod,
      booking_date: bookingDate,
      booking_time: bookingTime,
    };

    try {
      if (editId) {
        await axiosInstance.put(`/bookings/${editId}`, payload);
        toast.success("Booking updated successfully!");
      } else {
        await axiosInstance.post("/bookings", payload);
        toast.success("Booking saved successfully!");
      }
      resetForm();
      setIsFormOpen(false);
      fetchBookings();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save booking.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!canRecordPayment) {
      toast.error("You don't have permission to record payments.");
      return;
    }
    if (!payBooking || !payAmount || parseFloat(payAmount) <= 0) return;
    setSubmitting(true);
    try {
      await axiosInstance.post(`/bookings/${payBooking.id}/payments`, {
        amount: parseFloat(payAmount),
        paymentMethod: payMethod,
        remarks: payRemarks,
        paymentDate: new Date().toISOString().slice(0, 10),
      });
      toast.success("Payment recorded successfully");
      setPayBooking(null);
      setPayAmount("");
      setPayRemarks("");
      fetchBookings();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditId(null);
    setMobileNumber(""); setCustomerName(""); setCustomerId(null);
    setAddress(""); setBookingDate(""); setBookingTime("");
    setInvoiceItems([createEmptyRow()]);
    setDiscount(""); setGivenAmount("");
    setPaymentMethod("Cash");
  };

  // Access Denied
  if (!canReadBooking) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg border border-red-100">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdLock className="text-5xl text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
            <p className="text-slate-500 mb-4">
              You don't have permission to view Bookings.
            </p>
            <div className="bg-slate-50 rounded-lg p-3 text-left">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Required Permission:</p>
              <p className="text-[12px] font-mono text-slate-700">Read Booking</p>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Customer Bookings</h1>
            <p className="text-sm text-slate-500">Record advance orders and booking deposits.</p>
          </div>
          {canCreateBooking && (
            <button
              onClick={() => {
                if (isFormOpen && editId) {
                  resetForm();
                  document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  const opening = !isFormOpen;
                  setIsFormOpen(opening);
                  if (opening) { resetForm(); document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" }); }
                }
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition duration-300 shadow-sm ${
                isFormOpen
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  : "bg-teal-600 text-white hover:bg-teal-700 hover:shadow-teal-100"
              }`}
            >
              {isFormOpen ? <><MdRemove className="h-5 w-5" /> Close Form</> : <><MdAdd className="h-5 w-5" /> New Booking</>}
            </button>
          )}
        </div>

        {/* Form - Only show if user can create */}
        <AnimatePresence>
          {isFormOpen && canCreateBooking && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <Card className="mx-auto max-w-6xl border-l-[6px] border-l-teal-500 p-6 mb-6">
                <SectionHeader
                  title={editId ? "Edit Booking" : "New Advance Booking"}
                  description="Register a new customer appointment or order."
                  icon={<MdEventAvailable className="h-6 w-6 text-teal-600" />}
                />

                <form onSubmit={handleSubmit} className="space-y-3 mt-2">
                  {/* Customer Info */}
                  <SectionCard title="Customer & Appointment">
                    <div className="flex flex-wrap gap-4 items-end py-1">
                      <Field label="Mobile Number" required>
                        <div className="relative">
                          <input
                            type="tel"
                            value={mobileNumber}
                            onChange={handleMobileChange}
                            onFocus={() => { if (mobileNumber.length >= 4) setShowCustomerDropdown(true); }}
                            onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                            placeholder="Search Mobile"
                            className="h-8 w-44 rounded-md border border-slate-300 bg-white px-2.5 pr-8 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                          />
                          <MdSearch className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                          {showCustomerDropdown && matchingCustomers.length > 0 && (
                            <ul className="absolute left-0 top-full mt-1 max-h-48 w-64 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl z-50">
                              {matchingCustomers.map(c => (
                                <li key={c.id} onClick={() => handleSelectCustomer(c)}
                                  className="cursor-pointer px-3 py-1.5 hover:bg-teal-50 transition">
                                  <p className="text-[12px] font-semibold text-slate-800">{c.customer_name}</p>
                                  <p className="text-[10px] text-slate-500">{c.mobile_number}</p>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </Field>
                      <Field label="Customer Name" required>
                        <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
                          placeholder="Full Name"
                          className={`h-8 w-60 rounded-md border text-[12px] outline-none transition px-2.5 ${
                            customerId ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-bold" : "border-slate-300 bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                          }`}
                        />
                      </Field>
                      <Field label="Booking Date" required>
                        <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)}
                          className="h-8 w-36 rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400" />
                      </Field>
                      <Field label="Time" required>
                        <input type="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)}
                          className="h-8 w-28 rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400" />
                      </Field>
                    </div>
                  </SectionCard>

                  {/* Items */}
                  <SectionCard title="Booked Items">
                    <div className="space-y-2 mt-1">
                      <div className="hidden grid-cols-[180px_1fr_100px_80px_120px_50px] gap-3 px-2 sm:grid uppercase tracking-widest text-[10px] font-bold text-teal-500/80">
                        <div>Category</div><div>Item</div>
                        <div className="text-right">Price</div>
                        <div className="text-center">Qty</div>
                        <div className="text-right">Subtotal</div>
                        <div />
                      </div>
                      {invoiceItems.map(row => {
                        const availableItems = items.filter(i => String(i.item_category_id) === String(row.category_id));
                        return (
                          <div key={row.id}
                            className="grid grid-cols-2 gap-2 sm:grid-cols-[180px_1fr_100px_80px_120px_50px] items-center bg-slate-50/50 p-2 sm:p-0 sm:bg-transparent rounded-xl border border-slate-200 sm:border-0"
                          >
                            <select value={row.category_id}
                              onChange={e => updateRow(row.id, "category_id", e.target.value)}
                              className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[12px] outline-none col-span-2 sm:col-span-1"
                            >
                              <option value="">Category</option>
                              {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                            </select>
                            <select value={row.item_id}
                              onChange={e => updateRow(row.id, "item_id", e.target.value)}
                              disabled={!row.category_id}
                              className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[12px] outline-none disabled:bg-slate-50 col-span-2 sm:col-span-1"
                            >
                              <option value="">Select Item</option>
                              {availableItems.map(i => <option key={i.id} value={i.id}>{i.item_name}</option>)}
                            </select>
                            <input type="number" step="0.01" value={row.price}
                              onChange={e => updateRow(row.id, "price", e.target.value)}
                              placeholder="0.00"
                              className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[12px] text-right" />
                            <input type="number" min="1" value={row.quantity}
                              onChange={e => updateRow(row.id, "quantity", e.target.value)}
                              className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-[12px] text-center" />
                            <div className="text-right font-bold text-slate-700 text-[12px]">
                              PKR {Number(row.total || 0).toLocaleString()}
                            </div>
                            <button type="button" onClick={() => removeRow(row.id)}
                              className="flex justify-center text-rose-400 hover:text-rose-600 transition-colors">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                      <div className="pt-2">
                        <button type="button" onClick={addRow}
                          className="inline-flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-2 text-[12px] font-bold text-teal-700 border border-teal-200 hover:bg-teal-100 transition">
                          <MdAdd className="h-4 w-4" /> Add Line
                        </button>
                      </div>
                    </div>
                  </SectionCard>

                  {/* Payment */}
                  <div className="grid gap-4 lg:grid-cols-2">
                    <SectionCard title="Payment Summary">
                      <div className="space-y-3 py-1 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Subtotal</span>
                          <span className="font-bold text-slate-800">PKR {subTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 flex-1">Discount</span>
                          <input type="number" step="0.01" value={discount} onChange={e => setDiscount(e.target.value)}
                            placeholder="0.00"
                            className="h-8 w-32 rounded border border-slate-300 bg-white text-right px-2 text-[12px] focus:border-teal-400 outline-none" />
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                          <span className="font-bold text-slate-700">Payable</span>
                          <span className="text-xl font-black text-teal-600 font-mono">PKR {payable.toLocaleString()}</span>
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard title="Advance Deposit">
                      <div className="space-y-4 py-1">
                        <div className="flex gap-3">
                          <div className="flex-1 space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Method</p>
                            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                              className="h-10 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-3 text-[12px] font-bold outline-none focus:border-teal-500 transition">
                              <option value="Cash">Cash</option>
                              <option value="Online">Online</option>
                              <option value="Card">Card</option>
                              <option value="COD">COD</option>
                            </select>
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Amount Paid</p>
                            <input type="number" value={givenAmount} onChange={e => setGivenAmount(e.target.value)}
                              placeholder="0.00"
                              className="h-10 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 text-lg font-black focus:border-emerald-500 focus:bg-white transition outline-none" />
                          </div>
                        </div>
                        {payable > 0 && Number(givenAmount) > 0 && (
                          <div className={`p-3 rounded-xl border-2 flex items-center justify-between ${
                            isAllPaid ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"
                          }`}>
                            <span className={`text-[11px] font-black uppercase tracking-widest ${isAllPaid ? "text-emerald-700" : "text-rose-700"}`}>
                              {isAllPaid ? "FULL DEPOSIT" : "PARTIAL"}
                            </span>
                            <span className={`font-mono font-bold text-sm ${isAllPaid ? "text-emerald-600" : "text-rose-600"}`}>
                              PKR {isAllPaid ? (Number(givenAmount) - payable).toLocaleString() : remaining.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </SectionCard>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => { resetForm(); setIsFormOpen(false); }}
                      className="rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 transition">
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting || payable <= 0}
                      className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-100 hover:bg-teal-700 transition disabled:opacity-50">
                      <MdEventAvailable className="h-5 w-5" />
                      {submitting ? "Saving..." : editId ? "Update Booking" : "Confirm Booking"}
                    </button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bookings Table */}
        <Card className="mx-auto max-w-6xl p-0 overflow-hidden">
          <SectionHeader
            title="Booking Registry"
            description="Log of customer appointments and orders."
            icon={<MdHistory className="h-6 w-6 text-teal-600" />}
            action={
              <div className="p-4">
                <button type="button" onClick={fetchBookings}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition">
                  <MdRefresh className="inline mr-1" /> Refresh
                </button>
              </div>
            }
          />
          {loading ? (
            <TableState message="Loading bookings..." />
          ) : bookingsRecord.length === 0 ? (
            <TableState message="No bookings found." />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3">Booking ID</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Date & Time</th>
                    <th className="px-5 py-3 text-right">Payable</th>
                    <th className="px-5 py-3 text-right">Paid</th>
                    <th className="px-5 py-3 text-right">Due</th>
                    <th className="px-5 py-3 text-center">Payment</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {bookingsRecord.map(s => {
                    const payStatus =
                      s.payment_status === "Paid"    ? { label: "PAID",    tone: "emerald" } :
                      s.payment_status === "Partial" ? { label: "PARTIAL", tone: "amber"   } :
                                                       { label: "UNPAID",  tone: "rose"    };
                    const bkStatus =
                      s.booking_status === "Completed" ? { label: "DONE",    tone: "teal"  } :
                      s.booking_status === "Rejected"  ? { label: "REJECT",  tone: "rose"  } :
                                                         { label: "PENDING", tone: "slate" };
                    return (
                      <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className={`group transition-colors hover:bg-teal-50/20 ${editId === s.id ? "bg-teal-50/40" : ""}`}>
                        <td className="px-5 py-3.5 font-mono text-[11px] font-bold text-slate-400">
                          #BK-{String(s.id).padStart(4, "0")}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-slate-800 text-[12px]">{s.customer_name}</p>
                          <p className="text-[10px] text-teal-600 font-bold">{s.mobile_number || "—"}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-[12px] font-semibold text-slate-600">
                            {s.booking_date ? String(s.booking_date).slice(0, 10) : "—"}
                          </p>
                          <p className="text-[10px] text-slate-400">{s.booking_time || "—"}</p>
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-slate-700 text-[12px]">
                          PKR {Number(s.payable || 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-emerald-600 text-[12px]">
                          PKR {Number(s.paid || 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-rose-600 text-[12px]">
                          PKR {Number(s.to_be_paid || 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <StatusChip label={payStatus.label} tone={payStatus.tone} />
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <StatusChip label={bkStatus.label} tone={bkStatus.tone} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-2">
                            {Number(s.to_be_paid) > 0 && canRecordPayment && (
                              <ActionButton label="Pay" tone="emerald" onClick={() => setPayBooking(s)} />
                            )}
                            {canUpdateBooking && (
                              <ActionButton label="Edit" tone="teal" onClick={() => handleEdit(s)} />
                            )}
                            {canDeleteBooking && (
                              <ActionButton label="Delete" tone="rose" onClick={() => handleDelete(s.id)} />
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Payment Modal - Only show if user can record payments */}
        <AnimatePresence>
          {payBooking && canRecordPayment && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
              >
                <div className="bg-teal-600 p-4 text-white">
                  <h3 className="text-lg font-bold">Record Payment</h3>
                  <p className="text-xs text-teal-100">
                    Booking #BK-{String(payBooking.id).padStart(4, "0")} — {payBooking.customer_name}
                  </p>
                </div>
                <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 flex justify-between text-sm font-bold">
                    <span className="text-slate-500">Remaining Due:</span>
                    <span className="text-rose-600 font-mono">PKR {Number(payBooking.to_be_paid).toLocaleString()}</span>
                  </div>
                  <Field label="Payment Amount" required>
                    <input type="number" step="0.01" value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      max={payBooking.to_be_paid}
                      className="h-10 w-full rounded-xl border-2 border-slate-100 bg-white px-4 text-lg font-black focus:border-emerald-500 outline-none transition"
                      placeholder="0.00" autoFocus />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Method">
                      <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-bold outline-none focus:border-teal-400 transition">
                        <option value="Cash">Cash</option>
                        <option value="Online">Online</option>
                        <option value="Card">Card</option>
                      </select>
                    </Field>
                    <Field label="Date">
                      <input type="date" value={new Date().toISOString().slice(0, 10)} disabled
                        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-500 outline-none" />
                    </Field>
                  </div>
                  <Field label="Remarks">
                    <textarea value={payRemarks} onChange={e => setPayRemarks(e.target.value)} rows={2}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] outline-none focus:border-teal-400 transition"
                      placeholder="Optional notes..." />
                  </Field>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setPayBooking(null)}
                      className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 transition">
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting || !payAmount}
                      className="flex-[2] rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-100 hover:bg-teal-700 transition disabled:opacity-50">
                      {submitting ? "Recording..." : "Record Payment"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  );
}