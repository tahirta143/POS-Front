import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Card,
  PageShell,
  TableState,
} from "../../components/layout/PageShell.jsx";
import axiosInstance from "../../services/axiosInstance";
import {
  getClosingStockSnapshotByDate,
  getSalesReturns,
  saveClosingStockSnapshot,
} from "../../utils/transactionStore.js";

function RefreshIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function SearchIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function DownloadIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v10m0 0l4-4m-4 4l-4-4M4 17v3a1 1 0 001 1h14a1 1 0 001-1v-3"
      />
    </svg>
  );
}

function PrinterIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 9V4h12v5M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v6H6v-6z"
      />
    </svg>
  );
}

function SaveIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
      />
    </svg>
  );
}

function MetricCard({ title, value, valueColor }) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[12px] font-medium uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className={`mt-2 text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

function toLocalYMD(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseListData(response) {
  const data = response?.data;
  return Array.isArray(data)
    ? data
    : data?.data && Array.isArray(data.data)
      ? data.data
      : [];
}

function isOnOrBeforeDate(dateValue, selectedValue) {
  if (!dateValue || !selectedValue) return false;

  const date = new Date(dateValue);
  const selected = new Date(`${selectedValue}T23:59:59`);

  if (Number.isNaN(date.getTime()) || Number.isNaN(selected.getTime())) {
    return false;
  }

  return date <= selected;
}

function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildFallbackReportData(items, purchases, sales, closingDate) {
  const snapshot = getClosingStockSnapshotByDate(closingDate);
  if (snapshot?.items?.length) {
    return snapshot.items.map((item) => ({
      id: item.id,
      opening_stock: Number(item.opening_stock ?? 0),
      total_purchases: Number(item.total_purchases ?? 0),
      total_sales: Number(item.total_sales ?? 0),
      adjustment: Number(item.adjustment ?? 0),
      current_stock: Number(item.calc_closing ?? item.current_stock ?? 0),
      is_snapshot: true,
    }));
  }

  const returns = getSalesReturns().filter((entry) =>
    isOnOrBeforeDate(entry.date || entry.createdAt, closingDate),
  );

  const purchaseQtyByItem = purchases.reduce((acc, purchase) => {
    if (
      !isOnOrBeforeDate(purchase.grn_date || purchase.created_at, closingDate)
    )
      return acc;
    if (purchase.status && purchase.status !== "received") return acc;

    purchase.items?.forEach((item) => {
      const itemId = item.item_id || item.id;
      if (!itemId) return;
      acc[itemId] = (acc[itemId] || 0) + Number(item.qty || item.quantity || 0);
    });

    return acc;
  }, {});

  const salesQtyByItem = sales.reduce((acc, invoice) => {
    if (!isOnOrBeforeDate(invoice.created_at, closingDate)) return acc;

    invoice.items?.forEach((item) => {
      const itemId = item.item_id || item.id;
      if (!itemId) return;
      acc[itemId] = (acc[itemId] || 0) + Number(item.qty || item.quantity || 0);
    });

    return acc;
  }, {});

  const returnQtyByItem = returns.reduce((acc, record) => {
    record.items?.forEach((item) => {
      const itemId = item.item_id || item.id;
      if (!itemId) return;
      acc[itemId] = (acc[itemId] || 0) + Number(item.qty || item.quantity || 0);
    });

    return acc;
  }, {});

  return items.map((item) => {
    const itemId = item.id;
    const totalPurchases = Number(purchaseQtyByItem[itemId] || 0);
    const totalSales = Math.max(
      Number(salesQtyByItem[itemId] || 0) -
        Number(returnQtyByItem[itemId] || 0),
      0,
    );
    const currentStock = Number(item.stock || 0);
    const openingStock = currentStock - totalPurchases + totalSales;

    return {
      id: itemId,
      opening_stock: openingStock,
      total_purchases: totalPurchases,
      total_sales: totalSales,
      adjustment: 0,
      current_stock: currentStock,
      is_snapshot: false,
    };
  });
}

export default function ClosingStock() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adjustmentById, setAdjustmentById] = useState({});
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [dateFilter, setDateFilter] = useState(() => toLocalYMD(new Date()));
  const today = useMemo(() => toLocalYMD(new Date()), []);

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const [
        itemsRes,
        categoriesRes,
        suppliersRes,
        purchasesRes,
        salesRes,
        reportRes,
      ] = await Promise.all([
        axiosInstance.get("/item-details").catch(() => null),
        axiosInstance.get("/categories").catch(() => null),
        axiosInstance.get("/suppliers").catch(() => null),
        axiosInstance.get("/purchases").catch(() => ({ data: [] })),
        axiosInstance.get("/sale-invoices").catch(() => ({ data: [] })),
        axiosInstance
          .get(`/reports/stock?date=${dateFilter}`)
          .catch(() => null),
      ]);

      const nextItems = parseListData(itemsRes);
      const nextCategories = parseListData(categoriesRes);
      const nextSuppliers = parseListData(suppliersRes);
      const purchases = parseListData(purchasesRes);
      const sales = parseListData(salesRes);

      const reportData = reportRes?.data
        ? parseListData(reportRes)
        : buildFallbackReportData(nextItems, purchases, sales, dateFilter);

      const nextAdjustments = {};
      const merged = nextItems.map((item) => {
        const report = reportData.find(
          (entry) => String(entry.id) === String(item.id),
        );

        if (report?.adjustment) {
          nextAdjustments[item.id] = Number(report.adjustment || 0);
        }

        return {
          ...item,
          opening_stock_val: Number(report?.opening_stock ?? item.stock ?? 0),
          purchases_in: Number(report?.total_purchases ?? 0),
          sales_out: Number(report?.total_sales ?? 0),
          current_stock: Number(report?.current_stock ?? item.stock ?? 0),
          is_snapshot: Boolean(report?.is_snapshot),
        };
      });

      setItems(merged);
      setAdjustmentById(nextAdjustments);
      setCategories(nextCategories);
      setSuppliers(nextSuppliers);
    } catch (error) {
      console.error(error);
      toast.error("Unable to load stock data.");
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const enrichedItems = useMemo(() => {
    return items.map((item) => {
      const adjustment =
        Number(adjustmentById[item.id] ?? item.adjustment ?? 0) || 0;
      const closingStock =
        item.opening_stock_val +
        item.purchases_in -
        item.sales_out +
        adjustment;

      return {
        ...item,
        adjustment,
        closing_stock: closingStock,
      };
    });
  }, [items, adjustmentById]);

  async function handleSaveSnapshot() {
    if (
      !window.confirm(
        `Save stock snapshot for ${dateFilter}? This will freeze the daily balances.`,
      )
    )
      return;

    setSaving(true);

    try {
      const payload = {
        closing_date: dateFilter,
        items: enrichedItems.map((item) => ({
          id: item.id,
          opening_stock: item.opening_stock_val,
          total_purchases: item.purchases_in,
          total_sales: item.sales_out,
          adjustment: item.adjustment,
          calc_closing: item.closing_stock,
          current_stock: item.closing_stock,
          purchase_price: item.purchase_price,
          sale_price: item.sale_price,
        })),
      };

      try {
        await axiosInstance.post("/reports/snapshot", payload);
      } catch {
        saveClosingStockSnapshot(payload);
      }

      toast.success("Snapshot saved successfully!");
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save snapshot.");
    } finally {
      setSaving(false);
    }
  }

  function handleAdjustmentChange(itemId, value) {
    setAdjustmentById((prev) => ({
      ...prev,
      [itemId]: value === "" ? "" : value,
    }));
  }

  function getCategoryName(categoryId) {
    const category = categories.find(
      (row) => String(row.id) === String(categoryId),
    );
    return category ? category.category_name : "Uncategorized";
  }

  const filteredItems = useMemo(() => {
    return enrichedItems.filter((item) => {
      const query = search.toLowerCase();
      const matchesSearch =
        !query ||
        item.item_name?.toLowerCase().includes(query) ||
        item.barcode?.toLowerCase().includes(query) ||
        item.supplier?.toLowerCase().includes(query) ||
        item.supplier_name?.toLowerCase().includes(query);

      const itemCategoryId = item.item_category_id || item.category_id;
      const matchesCategory =
        !categoryFilter || String(itemCategoryId) === String(categoryFilter);

      const supplierTokens = [
        item.supplier,
        item.supplier_name,
        item.supplier_id,
      ]
        .filter(Boolean)
        .map(String);
      const matchesSupplier =
        !supplierFilter || supplierTokens.includes(String(supplierFilter));

      return matchesSearch && matchesCategory && matchesSupplier;
    });
  }, [enrichedItems, search, categoryFilter, supplierFilter]);

  const totalItems = enrichedItems.length;
  const totalClosingStock = enrichedItems.reduce(
    (sum, item) => sum + item.closing_stock,
    0,
  );
  const costValue = enrichedItems.reduce(
    (sum, item) =>
      sum + item.closing_stock * (Number(item.purchase_price) || 0),
    0,
  );
  const retailValue = enrichedItems.reduce(
    (sum, item) => sum + item.closing_stock * (Number(item.sale_price) || 0),
    0,
  );

  function exportCsv() {
    const rows = [
      [
        "#",
        "Item Name",
        "Category",
        "Unit",
        "Opening Stock",
        "Purchases",
        "Sales",
        "Adjustment",
        "Closing Stock",
        "Purchase Price",
        "Sale Price",
      ],
      ...filteredItems.map((item, index) => [
        index + 1,
        item.item_name,
        getCategoryName(item.item_category_id || item.category_id),
        item.unit_name || item.item_unit || "-",
        item.opening_stock_val,
        item.purchases_in,
        item.sales_out,
        item.adjustment,
        item.closing_stock,
        Number(item.purchase_price || 0).toFixed(2),
        Number(item.sale_price || 0).toFixed(2),
      ]),
    ];

    downloadCsv(`closing-stock-${dateFilter || today}.csv`, rows);
  }

  return (
    <PageShell
      title="Closing Stock"
      description="End-of-period stock snapshot with calculated balances."
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      <div className="mx-auto w-full space-y-6 px-4 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-teal-600">Closing Stock</h1>
            <p className="text-sm text-slate-500">
              End-of-period stock balances: Opening + Purchases - Sales +/-
              Adjustments
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <DownloadIcon className="h-4 w-4" />
              Export CSV
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <PrinterIcon className="h-4 w-4" />
              Print
            </button>

            <button
              onClick={handleSaveSnapshot}
              disabled={loading || saving}
              className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-[12px] font-bold text-teal-700 shadow-sm transition hover:bg-teal-100 disabled:opacity-50"
            >
              <SaveIcon className="h-4 w-4" />
              {saving ? "Saving..." : "Save Snapshot"}
            </button>

            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshIcon
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Items"
            value={totalItems.toLocaleString()}
            valueColor="text-teal-500"
          />
          <MetricCard
            title="Closing Stock (Units)"
            value={totalClosingStock.toLocaleString()}
            valueColor="text-teal-500"
          />
          <MetricCard
            title="Stock Value (Cost)"
            value={`Rs ${costValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            valueColor="text-teal-600"
          />
          <MetricCard
            title="Stock Value (Retail)"
            value={`Rs ${retailValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            valueColor="text-teal-600"
          />
        </div>

        <Card className="border-l-[6px] border-l-teal-500 p-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="block h-4 w-1 rounded-full bg-teal-500" />
            <h2 className="text-[12px] font-bold uppercase tracking-wide text-slate-800">
              Filter Stock
            </h2>
          </div>

          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Search
              </label>
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Name, category, supplier, barcode..."
                  className="h-8 w-full rounded-md border border-slate-300 bg-white pl-8 pr-3 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Category ({categories.length})
              </label>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Supplier ({suppliers.length})
              </label>
              <select
                value={supplierFilter}
                onChange={(event) => setSupplierFilter(event.target.value)}
                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              >
                <option value="">All Suppliers</option>
                {suppliers.length > 0
                  ? suppliers.map((supplier) => (
                      <option
                        key={supplier.id}
                        value={supplier.supplier_name || supplier.id}
                      >
                        {supplier.supplier_name || supplier.id}
                      </option>
                    ))
                  : [
                      ...new Set(
                        items.map((item) => item.supplier).filter(Boolean),
                      ),
                    ].map((supplier, index) => (
                      <option key={index} value={supplier}>
                        {supplier}
                      </option>
                    ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Closing Date
              </label>
              <input
                type="date"
                max={today}
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-[12px] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
            <p className="text-[12px] text-slate-500">
              Showing{" "}
              <strong className="text-slate-800">{filteredItems.length}</strong>{" "}
              of{" "}
              <strong className="text-slate-800">{enrichedItems.length}</strong>{" "}
              items
            </p>

            <button
              onClick={() => {
                setSearch("");
                setCategoryFilter("");
                setSupplierFilter("");
                setDateFilter(today);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <RefreshIcon className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-[#f8fafc]">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="w-8 border-b border-slate-200 px-2 py-3 text-center">
                    #
                  </th>
                  <th className="min-w-[140px] border-b border-slate-200 px-2 py-3">
                    ITEM NAME
                  </th>
                  <th className="border-b border-slate-200 px-2 py-3">
                    CATEGORY
                  </th>
                  <th className="border-b border-slate-200 px-2 py-3">UNIT</th>
                  <th className="border-b border-slate-200 px-2 py-3 text-center">
                    <span className="inline-flex items-center gap-1">
                      OPENING
                      <span className="text-[9px] font-normal normal-case text-slate-400">
                        (SOH)
                      </span>
                    </span>
                  </th>
                  <th className="border-b border-slate-200 px-2 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-teal-600">
                      PURCHASES
                      <span className="text-[9px] font-normal normal-case">
                        (+)
                      </span>
                    </span>
                  </th>
                  <th className="border-b border-slate-200 px-2 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-teal-600">
                      SALES
                      <span className="text-[9px] font-normal normal-case">
                        (-)
                      </span>
                    </span>
                  </th>
                  <th className="border-b border-slate-200 px-2 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-teal-600">
                      ADJUST
                      <span className="text-[9px] font-normal normal-case">
                        (+/-)
                      </span>
                    </span>
                  </th>
                  <th className="border-b border-slate-200 px-2 py-3 text-center">
                    <span className="inline-flex items-center gap-1 font-extrabold text-teal-700">
                      CLOSING
                    </span>
                  </th>
                  <th className="border-b border-slate-200 px-2 py-3 text-right">
                    COST
                  </th>
                  <th className="border-b border-slate-200 px-2 py-3 text-right">
                    RETAIL
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="11" className="p-4">
                      <TableState message="Loading stock data..." />
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="p-4">
                      <TableState message="No items match the current filters." />
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, index) => {
                    const closingZero = item.closing_stock === 0;
                    const closingNegative = item.closing_stock < 0;

                    return (
                      <tr
                        key={item.id || index}
                        className={`text-[11px] transition hover:bg-slate-50/50 ${closingNegative ? "bg-teal-50/30" : ""}`}
                      >
                        <td className="border-b border-slate-50 px-2 py-2 text-center text-slate-400">
                          {index + 1}
                        </td>
                        <td className="border-b border-slate-50 px-2 py-2">
                          <div
                            className="max-w-[120px] truncate font-bold leading-tight text-slate-800"
                            title={item.item_name}
                          >
                            {item.item_name}
                          </div>
                          <div className="mt-0.5 max-w-[100px] truncate font-mono text-[9px] text-slate-400">
                            {item.barcode || item.id}
                          </div>
                        </td>
                        <td className="border-b border-slate-50 px-2 py-2">
                          <span className="inline-flex max-w-[80px] items-center truncate rounded-full border border-teal-100 bg-teal-50 px-1.5 py-0.5 text-[9px] font-semibold text-teal-700">
                            {getCategoryName(
                              item.item_category_id || item.category_id,
                            )}
                          </span>
                        </td>
                        <td className="border-b border-slate-50 px-2 py-2 text-slate-600">
                          {item.unit_name || item.item_unit || "-"}
                        </td>
                        <td className="border-b border-slate-50 px-2 py-2 text-center">
                          <span className="inline-flex min-w-[36px] items-center justify-center rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-700">
                            {item.opening_stock_val}
                          </span>
                        </td>
                        <td className="border-b border-slate-50 px-2 py-2 text-center">
                          <span className="inline-flex min-w-[36px] items-center justify-center rounded border border-teal-200 bg-teal-50 px-1.5 py-0.5 text-[11px] font-bold text-teal-700">
                            +{item.purchases_in}
                          </span>
                        </td>
                        <td className="border-b border-slate-50 px-2 py-2 text-center">
                          <span className="inline-flex min-w-[36px] items-center justify-center rounded border border-teal-100 bg-teal-50 px-1.5 py-0.5 text-[11px] font-bold text-teal-700">
                            -{item.sales_out}
                          </span>
                        </td>
                        <td className="border-b border-slate-50 px-2 py-2 text-center">
                          <div className="relative inline-block">
                            <input
                              type="number"
                              value={
                                adjustmentById[item.id] ?? item.adjustment ?? 0
                              }
                              onChange={(event) =>
                                handleAdjustmentChange(
                                  item.id,
                                  event.target.value,
                                )
                              }
                              className="h-6 w-12 cursor-text rounded border border-teal-200 bg-teal-50 text-center text-[11px] font-bold text-teal-800 outline-none transition hover:bg-teal-100 focus:border-teal-400 focus:bg-teal-100 focus:ring-2 focus:ring-teal-200/50"
                            />
                          </div>
                        </td>
                        <td className="border-b border-slate-50 px-2 py-2 text-center">
                          <span
                            className={`inline-flex min-w-[40px] items-center justify-center rounded border px-2 py-0.5 text-[11px] font-extrabold ${
                              closingNegative
                                ? "border-teal-200 bg-teal-50 text-teal-600"
                                : closingZero
                                  ? "border-slate-300 bg-slate-100 text-slate-600"
                                  : "border-teal-300 bg-teal-100 text-teal-800"
                            }`}
                          >
                            {item.closing_stock}
                          </span>
                        </td>
                        <td className="border-b border-slate-50 px-2 py-2 text-right font-semibold whitespace-nowrap text-teal-600">
                          {(
                            item.closing_stock *
                            (Number(item.purchase_price) || 0)
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </td>
                        <td className="border-b border-slate-50 px-2 py-2 text-right font-semibold whitespace-nowrap text-teal-600">
                          {(
                            item.closing_stock * (Number(item.sale_price) || 0)
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {filteredItems.length > 0 && (
                <tfoot className="border-t-2 border-teal-200 bg-slate-50">
                  <tr className="text-[11px] font-bold text-slate-700">
                    <td className="px-2 py-3" colSpan="4" />
                    <td className="px-2 py-3 text-center">
                      {filteredItems.reduce(
                        (sum, item) => sum + item.opening_stock_val,
                        0,
                      )}
                    </td>
                    <td className="px-2 py-3 text-center text-teal-700">
                      +
                      {filteredItems.reduce(
                        (sum, item) => sum + item.purchases_in,
                        0,
                      )}
                    </td>
                    <td className="px-2 py-3 text-center text-teal-700">
                      -
                      {filteredItems.reduce(
                        (sum, item) => sum + item.sales_out,
                        0,
                      )}
                    </td>
                    <td className="px-2 py-3 text-center text-teal-700">
                      {filteredItems.reduce(
                        (sum, item) => sum + item.adjustment,
                        0,
                      )}
                    </td>
                    <td className="px-2 py-3 text-center text-[12px] font-extrabold text-teal-800">
                      {filteredItems.reduce(
                        (sum, item) => sum + item.closing_stock,
                        0,
                      )}
                    </td>
                    <td className="px-2 py-3 text-right whitespace-nowrap text-teal-700">
                      {filteredItems
                        .reduce(
                          (sum, item) =>
                            sum +
                            item.closing_stock *
                              (Number(item.purchase_price) || 0),
                          0,
                        )
                        .toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                    </td>
                    <td className="px-2 py-3 text-right whitespace-nowrap text-teal-700">
                      {filteredItems
                        .reduce(
                          (sum, item) =>
                            sum +
                            item.closing_stock * (Number(item.sale_price) || 0),
                          0,
                        )
                        .toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
