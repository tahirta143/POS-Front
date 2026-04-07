const STORAGE_KEYS = {
  supplierPayments: 'pos_frontend_supplier_payments_v1',
  customerPayments: 'pos_frontend_customer_payments_v1',
  salesReturns: 'pos_frontend_sales_returns_v1',
  purchaseReturns: 'pos_frontend_purchase_returns_v1',
  closingStockSnapshots: 'pos_frontend_closing_stock_snapshots_v1',
}

function safeRead(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function safeWrite(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`
}

function sortByDateDesc(list, field = 'date') {
  return [...list].sort((a, b) => new Date(b[field] || 0) - new Date(a[field] || 0))
}

export function getSupplierPayments() {
  return sortByDateDesc(safeRead(STORAGE_KEYS.supplierPayments))
}

export function saveSupplierPayment(payment) {
  const next = [
    ...safeRead(STORAGE_KEYS.supplierPayments),
    {
      id: createId('SP'),
      createdAt: new Date().toISOString(),
      ...payment,
    },
  ]
  safeWrite(STORAGE_KEYS.supplierPayments, next)
  return sortByDateDesc(next)
}

export function updateSupplierPayment(paymentId, updates) {
  const next = safeRead(STORAGE_KEYS.supplierPayments).map((payment) =>
    payment.id === paymentId ? { ...payment, ...updates } : payment,
  )
  safeWrite(STORAGE_KEYS.supplierPayments, next)
  return sortByDateDesc(next)
}

export function deleteSupplierPayment(paymentId) {
  const next = safeRead(STORAGE_KEYS.supplierPayments).filter((payment) => payment.id !== paymentId)
  safeWrite(STORAGE_KEYS.supplierPayments, next)
  return sortByDateDesc(next)
}

export function getCustomerPayments() {
  return sortByDateDesc(safeRead(STORAGE_KEYS.customerPayments))
}

export function saveCustomerPayment(payment) {
  const next = [
    ...safeRead(STORAGE_KEYS.customerPayments),
    {
      id: createId('CP'),
      createdAt: new Date().toISOString(),
      ...payment,
    },
  ]
  safeWrite(STORAGE_KEYS.customerPayments, next)
  return sortByDateDesc(next)
}

export function updateCustomerPayment(paymentId, updates) {
  const next = safeRead(STORAGE_KEYS.customerPayments).map((payment) =>
    payment.id === paymentId ? { ...payment, ...updates } : payment,
  )
  safeWrite(STORAGE_KEYS.customerPayments, next)
  return sortByDateDesc(next)
}

export function deleteCustomerPayment(paymentId) {
  const next = safeRead(STORAGE_KEYS.customerPayments).filter((payment) => payment.id !== paymentId)
  safeWrite(STORAGE_KEYS.customerPayments, next)
  return sortByDateDesc(next)
}

export function getSalesReturns() {
  return sortByDateDesc(safeRead(STORAGE_KEYS.salesReturns))
}

export function saveSalesReturn(record) {
  const next = [
    ...safeRead(STORAGE_KEYS.salesReturns),
    {
      id: createId('SR'),
      createdAt: new Date().toISOString(),
      ...record,
    },
  ]
  safeWrite(STORAGE_KEYS.salesReturns, next)
  return sortByDateDesc(next)
}

export function updateSalesReturn(returnId, updates) {
  const next = safeRead(STORAGE_KEYS.salesReturns).map((record) =>
    record.id === returnId ? { ...record, ...updates } : record,
  )
  safeWrite(STORAGE_KEYS.salesReturns, next)
  return sortByDateDesc(next)
}

export function deleteSalesReturn(returnId) {
  const next = safeRead(STORAGE_KEYS.salesReturns).filter((record) => record.id !== returnId)
  safeWrite(STORAGE_KEYS.salesReturns, next)
  return sortByDateDesc(next)
}

export function getPurchaseReturns() {
  return sortByDateDesc(safeRead(STORAGE_KEYS.purchaseReturns))
}

export function savePurchaseReturn(record) {
  const next = [
    ...safeRead(STORAGE_KEYS.purchaseReturns),
    {
      id: createId('PR'),
      createdAt: new Date().toISOString(),
      ...record,
    },
  ]
  safeWrite(STORAGE_KEYS.purchaseReturns, next)
  return sortByDateDesc(next)
}

export function updatePurchaseReturn(returnId, updates) {
  const next = safeRead(STORAGE_KEYS.purchaseReturns).map((record) =>
    record.id === returnId ? { ...record, ...updates } : record,
  )
  safeWrite(STORAGE_KEYS.purchaseReturns, next)
  return sortByDateDesc(next)
}

export function deletePurchaseReturn(returnId) {
  const next = safeRead(STORAGE_KEYS.purchaseReturns).filter((record) => record.id !== returnId)
  safeWrite(STORAGE_KEYS.purchaseReturns, next)
  return sortByDateDesc(next)
}

export function getClosingStockSnapshots() {
  return sortByDateDesc(safeRead(STORAGE_KEYS.closingStockSnapshots), 'closing_date')
}

export function getClosingStockSnapshotByDate(closingDate) {
  return getClosingStockSnapshots().find((snapshot) => snapshot.closing_date === closingDate) || null
}

export function saveClosingStockSnapshot(snapshot) {
  const existing = safeRead(STORAGE_KEYS.closingStockSnapshots).filter(
    (entry) => entry.closing_date !== snapshot.closing_date,
  )

  const next = [
    ...existing,
    {
      id: createId('CSS'),
      createdAt: new Date().toISOString(),
      ...snapshot,
    },
  ]

  safeWrite(STORAGE_KEYS.closingStockSnapshots, next)
  return sortByDateDesc(next, 'closing_date')
}
