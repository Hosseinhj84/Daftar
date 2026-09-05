import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  FileText,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Layout from "../Components/Layout";
import apiClient from "../api/Client";
import "../Styles/InvoicesList.css";

const ITEMS_PER_PAGE = 8;

function formatMoney(value) {
  return Number(value || 0).toLocaleString("fa-IR");
}

function formatPersianDate(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function normalizeInvoices(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

function getStatusLabel(status) {
  switch (status) {
    case "paid":
      return "پرداخت‌شده";

    case "pending":
    case "overdue":
      return "معوق";

    default:
      return "نامشخص";
  }
}

function getStatusClass(status) {
  return status === "paid" ? "status-paid" : "status-pending";
}

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  async function loadInvoices() {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/invoices/");

      setInvoices(normalizeInvoices(response.data));
    } catch (err) {
      console.error("Invoice loading error:", err);

      setError("دریافت فاکتورها با مشکل مواجه شد. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  /*
   * ---------------------------------------------
   * Filtering
   * ---------------------------------------------
   */

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesSearch =
        !query ||
        String(invoice.invoice_number || "")
          .toLowerCase()
          .includes(query) ||
        String(invoice.client_name || "")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" || invoice.status === statusFilter;

      const invoiceDate = invoice.date ? new Date(invoice.date) : null;

      const matchesFromDate =
        !fromDate ||
        !invoiceDate ||
        invoiceDate >= new Date(`${fromDate}T00:00:00`);

      const matchesToDate =
        !toDate ||
        !invoiceDate ||
        invoiceDate <= new Date(`${toDate}T23:59:59`);

      return matchesSearch && matchesStatus && matchesFromDate && matchesToDate;
    });
  }, [invoices, search, statusFilter, fromDate, toDate]);

  /*
   * ---------------------------------------------
   * Pagination
   * ---------------------------------------------
   */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE),
  );

  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredInvoices.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInvoices, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, fromDate, toDate]);

  /*
   * ---------------------------------------------
   * Delete
   * ---------------------------------------------
   */

  async function handleDelete(invoice) {
    const confirmed = window.confirm(
      `آیا از حذف فاکتور ${invoice.invoice_number} مطمئن هستید؟\n\nاین عملیات قابل بازگشت نیست.`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(invoice.id);

      await apiClient.delete(`/invoices/${invoice.id}/`);

      setInvoices((previous) =>
        previous.filter((item) => item.id !== invoice.id),
      );
    } catch (err) {
      console.error("Invoice delete error:", err);

      window.alert("حذف فاکتور انجام نشد. لطفاً دوباره تلاش کنید.");
    } finally {
      setDeletingId(null);
    }
  }

  /*
   * ---------------------------------------------
   * Download PDF
   * ---------------------------------------------
   */

  async function handleDownloadPdf(invoice) {
    try {
      setDownloadingId(invoice.id);

      const response = await apiClient.get(`/invoices/${invoice.id}/pdf/`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `${invoice.invoice_number}.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download error:", err);

      window.alert("دریافت فایل PDF با مشکل مواجه شد.");
    } finally {
      setDownloadingId(null);
    }
  }

  /*
   * ---------------------------------------------
   * Clear Filters
   * ---------------------------------------------
   */

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
  }

  const hasActiveFilters =
    search || statusFilter !== "all" || fromDate || toDate;

  /*
   * ---------------------------------------------
   * Loading
   * ---------------------------------------------
   */

  if (loading) {
    return (
      <div className="invoice-page">
        <InvoiceSkeleton />
      </div>
    );
  }

  /*
   * ---------------------------------------------
   * Error
   * ---------------------------------------------
   */

  if (error) {
    return (
      <Layout>
        <div className="invoice-page">
          <div className="invoice-error">
            <div className="invoice-error__icon">
              <FileText size={25} />
            </div>

            <div>
              <h2>دریافت فاکتورها ناموفق بود</h2>
              <p>{error}</p>
            </div>

            <button
              type="button"
              className="btn btn--primary"
              onClick={loadInvoices}
            >
              تلاش مجدد
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="invoice-page">
        {/* =========================================
          Header
      ========================================= */}

        <header className="page-header invoice-header">
          <div>
            <span className="page-eyebrow">مدیریت مالی</span>

            <h1 className="page-title">فاکتورها</h1>

            <p className="page-subtitle">مدیریت و پیگیری فاکتورهای مشتریان</p>
          </div>

          <Link to="/invoices/new" className="btn btn--primary">
            <Plus size={18} />
            <span>فاکتور جدید</span>
          </Link>
        </header>

        {/* =========================================
          Filters
      ========================================= */}

        <section className="invoice-filters">
          <div className="invoice-search">
            <Search size={18} />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جست‌وجوی نام مشتری یا شماره فاکتور..."
              aria-label="جست‌وجوی فاکتور"
            />

            {search && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearch("")}
                aria-label="پاک کردن جست‌وجو"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="filter-field">
            <label htmlFor="invoice-status">وضعیت</label>

            <select
              id="invoice-status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">همه وضعیت‌ها</option>

              <option value="paid">پرداخت‌شده</option>

              <option value="pending">معوق</option>
            </select>
          </div>

          <div className="date-filter">
            <div className="filter-field">
              <label htmlFor="from-date">از تاریخ</label>

              <div className="date-input">
                <CalendarDays size={16} />

                <input
                  id="from-date"
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
              </div>
            </div>

            <div className="filter-field">
              <label htmlFor="to-date">تا تاریخ</label>

              <div className="date-input">
                <CalendarDays size={16} />

                <input
                  id="to-date"
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                />
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="clear-filters"
              onClick={clearFilters}
            >
              پاک کردن فیلترها
            </button>
          )}
        </section>

        {/* =========================================
          Table Card
          ========================================= */}

        <section className="invoice-table-card">
          <div className="table-card-header">
            <div>
              <h2>لیست فاکتورها</h2>

              <span>
                {filteredInvoices.length.toLocaleString("fa-IR")} فاکتور
              </span>
            </div>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="invoice-empty">
              <div className="invoice-empty__icon">
                <FileText size={28} />
              </div>

              <h3>
                {hasActiveFilters
                  ? "فاکتوری با این مشخصات پیدا نشد"
                  : "هنوز فاکتوری ثبت نشده است"}
              </h3>

              <p>
                {hasActiveFilters
                  ? "فیلترها را تغییر دهید یا دوباره جست‌وجو کنید."
                  : "اولین فاکتور خود را ایجاد کنید تا در این بخش نمایش داده شود."}
              </p>

              {hasActiveFilters ? (
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={clearFilters}
                >
                  پاک کردن فیلترها
                </button>
              ) : (
                <Link to="/invoices/new" className="btn btn--primary">
                  <Plus size={17} />
                  ایجاد اولین فاکتور
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="data-table invoice-data-table">
                  <thead>
                    <tr>
                      <th>شماره فاکتور</th>
                      <th>مشتری</th>
                      <th>تاریخ</th>
                      <th>مبلغ</th>
                      <th>وضعیت</th>
                      <th className="actions-column">عملیات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedInvoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>
                          <Link
                            to={`/invoices/${invoice.id}`}
                            className="invoice-number"
                          >
                            {invoice.invoice_number}
                          </Link>
                        </td>

                        <td>
                          <div className="client-cell">
                            <div className="client-avatar">
                              {(invoice.client_name || "؟").charAt(0)}
                            </div>

                            <span>{invoice.client_name || "بدون نام"}</span>
                          </div>
                        </td>

                        <td>{formatPersianDate(invoice.date)}</td>

                        <td>
                          <span className="invoice-amount">
                            {formatMoney(invoice.total_amount)}

                            <small>تومان</small>
                          </span>
                        </td>

                        <td>
                          <span
                            className={`status-badge ${getStatusClass(
                              invoice.status,
                            )}`}
                          >
                            <span className="status-dot" />

                            {getStatusLabel(invoice.status)}
                          </span>
                        </td>

                        <td>
                          <div className="invoice-actions">
                            <button
                              type="button"
                              className="icon-btn"
                              title="دانلود PDF"
                              aria-label={`دانلود PDF ${invoice.invoice_number}`}
                              onClick={() => handleDownloadPdf(invoice)}
                              disabled={downloadingId === invoice.id}
                            >
                              <Download size={16} />
                            </button>

                            <Link
                              to={`/invoices/${invoice.id}/edit`}
                              className="icon-btn"
                              title="ویرایش"
                              aria-label={`ویرایش ${invoice.invoice_number}`}
                            >
                              <Edit3 size={16} />
                            </Link>

                            <button
                              type="button"
                              className="icon-btn icon-btn--danger"
                              title="حذف"
                              aria-label={`حذف ${invoice.invoice_number}`}
                              onClick={() => handleDelete(invoice)}
                              disabled={deletingId === invoice.id}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* =====================================
                Pagination
            ===================================== */}

              {totalPages > 1 && (
                <div className="pagination">
                  <span className="pagination-info">
                    صفحه {currentPage.toLocaleString("fa-IR")}
                    {" از "}
                    {totalPages.toLocaleString("fa-IR")}
                  </span>

                  <div className="pagination-controls">
                    <button
                      type="button"
                      className="pagination-btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((page) => page - 1)}
                      aria-label="صفحه قبلی"
                    >
                      <ChevronRight size={17} />
                    </button>

                    {Array.from({ length: totalPages }, (_, index) => index + 1)
                      .filter((page) => {
                        if (totalPages <= 5) return true;

                        return (
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1
                        );
                      })
                      .map((page, index, pages) => {
                        const previousPage = pages[index - 1];

                        const needsEllipsis =
                          previousPage && page - previousPage > 1;

                        return (
                          <span key={page} className="pagination-item">
                            {needsEllipsis && (
                              <span className="pagination-dots">...</span>
                            )}

                            <button
                              type="button"
                              className={`pagination-number ${
                                page === currentPage ? "active" : ""
                              }`}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page.toLocaleString("fa-IR")}
                            </button>
                          </span>
                        );
                      })}

                    <button
                      type="button"
                      className="pagination-btn"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((page) => page + 1)}
                      aria-label="صفحه بعدی"
                    >
                      <ChevronLeft size={17} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </Layout>
  );
}

/* =========================================================
   Loading Skeleton
   ========================================================= */

function InvoiceSkeleton() {
  return (
    <>
      <div className="invoice-skeleton-header">
        <div>
          <div className="skeleton skeleton--eyebrow" />
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--subtitle" />
        </div>

        <div className="skeleton skeleton--button" />
      </div>

      <div className="skeleton-filter">
        <div className="skeleton skeleton--search" />
        <div className="skeleton skeleton--filter" />
        <div className="skeleton skeleton--filter" />
      </div>

      <div className="skeleton-table">
        <div className="skeleton skeleton--table-header" />

        {Array.from({ length: 7 }).map((_, index) => (
          <div className="skeleton skeleton--table-row" key={index} />
        ))}
      </div>
    </>
  );
}
