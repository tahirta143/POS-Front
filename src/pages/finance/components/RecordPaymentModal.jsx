import { useEffect, useMemo, useState } from "react";
import { MdClose, MdPayment } from "react-icons/md";
import { toast } from "react-toastify";
import { Field } from "../../../components/layout/PageShell.jsx";
import axiosInstance from "../../../services/axiosInstance";

function createCustomerForm() {
  return {
    linkType: "invoice",
    invoiceId: "",
    bookingId: "",
    amount: "",
    paymentMethod: "Cash",
    paymentDate: new Date().toISOString().slice(0, 10),
    remarks: "",
  };
}

function createSupplierForm() {
  return {
    purchaseId: "",
    amount: "",
    paymentMethod: "Cash",
    paymentDate: new Date().toISOString().slice(0, 10),
    note: "",
  };
}

export default function RecordPaymentModal({
  open,
  onClose,
  onSuccess,
  type = "customer",
  entityId,
  entityName,
  outstanding = 0,
  invoices = [],
  bookings = [],
  purchases = [],
}) {
  const [form, setForm] = useState(type === "customer" ? createCustomerForm() : createSupplierForm());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(type === "customer" ? createCustomerForm() : createSupplierForm());
    }
  }, [open, type]);

  const unpaidInvoices = useMemo(
    () => invoices.filter((inv) => parseFloat(inv.to_be_paid || 0) > 0),
    [invoices],
  );
  const unpaidBookings = useMemo(
    () => bookings.filter((bk) => parseFloat(bk.to_be_paid || 0) > 0),
    [bookings],
  );
  const unpaidPurchases = useMemo(
    () => purchases.filter((p) => parseFloat(p.to_be_paid || 0) > 0),
    [purchases],
  );

  const selectedDue = useMemo(() => {
    if (type === "customer") {
      if (form.linkType === "invoice" && form.invoiceId) {
        const inv = unpaidInvoices.find((i) => String(i.id) === String(form.invoiceId));
        return inv ? parseFloat(inv.to_be_paid || 0) : null;
      }
      if (form.linkType === "booking" && form.bookingId) {
        const bk = unpaidBookings.find((b) => String(b.id) === String(form.bookingId));
        return bk ? parseFloat(bk.to_be_paid || 0) : null;
      }
      return null;
    }
    if (form.purchaseId) {
      const p = unpaidPurchases.find((x) => String(x.id) === String(form.purchaseId));
      return p ? parseFloat(p.to_be_paid || 0) : null;
    }
    return null;
  }, [type, form, unpaidInvoices, unpaidBookings, unpaidPurchases]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid payment amount.");
      return;
    }
    if (selectedDue !== null && amount > selectedDue) {
      toast.error(`Amount exceeds due (PKR ${selectedDue.toLocaleString()}).`);
      return;
    }

    setSubmitting(true);
    try {
      if (type === "customer") {
        if (form.linkType === "booking" && form.bookingId) {
          await axiosInstance.post(`/bookings/${form.bookingId}/payments`, {
            amount,
            paymentMethod: form.paymentMethod,
            paymentDate: form.paymentDate,
            remarks: form.remarks,
          });
        } else {
          await axiosInstance.post("/customer-payments", {
            customerId: entityId,
            invoiceId: form.invoiceId || null,
            amount,
            paymentMethod: form.paymentMethod,
            paymentDate: form.paymentDate,
            remarks: form.remarks,
          });
        }
        toast.success("Payment received successfully.");
      } else {
        await axiosInstance.post("/supplier-payments", {
          supplierId: entityId,
          purchaseId: form.purchaseId || null,
          amount,
          paymentMethod: form.paymentMethod,
          paymentDate: form.paymentDate,
          note: form.note,
        });
        toast.success("Payment recorded successfully.");
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save payment.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const title = type === "customer" ? "Receive Payment" : "Pay Supplier";
  const balanceLabel = type === "customer" ? "Total Receivable" : "Total Payable";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <MdPayment className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900 dark:text-slate-100">{title}</h2>
              <p className="text-[12px] text-slate-500">{entityName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition"
          >
            <MdClose className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-xl border border-teal-100 bg-teal-50/50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-teal-600">{balanceLabel}</p>
            <p className="text-lg font-black font-mono text-teal-700">
              PKR {outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>

          {type === "customer" && (
            <>
              <Field label="Payment Against">
                <select
                  value={form.linkType}
                  onChange={(e) => updateField("linkType", e.target.value)}
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[12px] outline-none focus:border-teal-400"
                >
                  <option value="invoice">Sales Invoice</option>
                  <option value="booking">Booking</option>
                  <option value="general">General (not linked)</option>
                </select>
              </Field>

              {form.linkType === "invoice" && unpaidInvoices.length > 0 && (
                <Field label="Invoice (optional)">
                  <select
                    value={form.invoiceId}
                    onChange={(e) => updateField("invoiceId", e.target.value)}
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[12px] outline-none focus:border-teal-400"
                  >
                    <option value="">— Not linked to invoice —</option>
                    {unpaidInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.receipt_no ? `RCP-${inv.receipt_no}` : `INV-${inv.id}`} — Due: PKR{" "}
                        {Number(inv.to_be_paid).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              {form.linkType === "booking" && unpaidBookings.length > 0 && (
                <Field label="Booking" required>
                  <select
                    value={form.bookingId}
                    onChange={(e) => updateField("bookingId", e.target.value)}
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[12px] outline-none focus:border-teal-400"
                  >
                    <option value="">Select booking...</option>
                    {unpaidBookings.map((bk) => (
                      <option key={bk.id} value={bk.id}>
                        BKG-{bk.id} — Due: PKR {Number(bk.to_be_paid).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </>
          )}

          {type === "supplier" && unpaidPurchases.length > 0 && (
            <Field label="Link to Purchase (optional)">
              <select
                value={form.purchaseId}
                onChange={(e) => updateField("purchaseId", e.target.value)}
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[12px] outline-none focus:border-teal-400"
              >
                <option value="">— Not linked to purchase —</option>
                {unpaidPurchases.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.invoice_no ? `INV-${p.invoice_no}` : `PO-${p.id}`} — Due: PKR{" "}
                    {Number(p.to_be_paid).toLocaleString()}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {selectedDue !== null && (
            <p className="text-[11px] font-semibold text-amber-600">
              Due on selected: PKR {selectedDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Amount" required>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => updateField("amount", e.target.value)}
                placeholder="0.00"
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[12px] font-bold outline-none focus:border-teal-400"
              />
            </Field>
            <Field label="Payment Date" required>
              <input
                type="date"
                value={form.paymentDate}
                onChange={(e) => updateField("paymentDate", e.target.value)}
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[12px] outline-none focus:border-teal-400"
              />
            </Field>
          </div>

          <Field label="Payment Method">
            <select
              value={form.paymentMethod}
              onChange={(e) => updateField("paymentMethod", e.target.value)}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[12px] outline-none focus:border-teal-400"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Online">Online</option>
            </select>
          </Field>

          <Field label={type === "customer" ? "Remarks" : "Note"}>
            <textarea
              value={type === "customer" ? form.remarks : form.note}
              onChange={(e) => updateField(type === "customer" ? "remarks" : "note", e.target.value)}
              rows={2}
              placeholder="Reference or note..."
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-[12px] outline-none focus:border-teal-400"
            />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-[13px] font-semibold text-slate-500 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-[13px] font-bold text-white hover:bg-teal-700 transition disabled:opacity-50"
            >
              <MdPayment />
              {submitting ? "Processing..." : type === "customer" ? "Receive Payment" : "Pay Now"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
