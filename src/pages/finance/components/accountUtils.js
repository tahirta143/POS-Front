export function fmtDate(val) {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString([], { dateStyle: "medium" });
  } catch {
    return String(val).slice(0, 10);
  }
}

export function fmtMoney(val) {
  return `PKR ${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export function invoiceStatusBadge(status) {
  if (status === "paid") return "bg-emerald-50 text-emerald-600";
  if (status === "partially_paid" || status === "partial") return "bg-amber-50 text-amber-600";
  return "bg-rose-50 text-rose-600";
}

export function buildTimelineEvents({ invoices = [], bookings = [], purchases = [], payments = [] }) {
  const events = [];

  for (const inv of invoices) {
    events.push({
      id: inv.id,
      type: "invoice",
      date: inv.created_at,
      title: `Sales Invoice Created — ${inv.receipt_no ? `RCP-${inv.receipt_no}` : `INV-${inv.id}`}`,
      subtitle: inv.status || "pending",
      amount: inv.payable || inv.to_be_paid || 0,
    });
  }

  for (const bk of bookings) {
    events.push({
      id: bk.id,
      type: "booking",
      date: bk.created_at || bk.booking_date,
      title: `Booking Created — BKG-${bk.id}`,
      subtitle: bk.booking_status || bk.payment_status,
      amount: bk.total_amount || bk.payable || 0,
    });
  }

  for (const p of purchases) {
    events.push({
      id: p.id,
      type: "purchase",
      date: p.created_at,
      title: `Purchase Invoice — ${p.invoice_no ? `INV-${p.invoice_no}` : `PO-${p.id}`}`,
      subtitle: p.payment_status || "unpaid",
      amount: p.payable || p.to_be_paid || 0,
    });
  }

  for (const pay of payments) {
    const isOutgoing = pay.direction === "outgoing";
    let title = "Payment Received";
    if (isOutgoing) title = "Payment Made";
    else if (pay.type === "Booking") title = "Booking Payment Received";

    events.push({
      id: pay.id,
      type: "payment",
      date: pay.payment_date,
      title,
      subtitle: pay.payment_method || "Cash",
      amount: pay.amount || 0,
      amountPrefix: isOutgoing ? "-" : "+",
    });
  }

  return events
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);
}

export function countOverdue(items, dateField = "created_at", days = 30) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return items.filter((item) => {
    const due = parseFloat(item.to_be_paid || 0);
    if (due <= 0) return false;
    const d = new Date(item[dateField] || item.created_at);
    return d.getTime() < cutoff;
  });
}
