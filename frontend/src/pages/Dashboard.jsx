import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpLeft,
  ArrowUpRight,
  BarChart3,
  FileText,
  Receipt,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import apiClient from "../api/Client";
import Layout from "../Components/Layout";
import "../Styles/Dashboard.css";

const PERSIAN_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

function formatMoney(value) {
  const number = Number(value || 0);

  return number.toLocaleString("fa-IR");
}

function formatMoneyWithUnit(value) {
  return `${formatMoney(value)} تومان`;
}

function formatPersianMonth(isoMonth) {
  if (!isoMonth) return "-";

  const date = new Date(`${isoMonth}-01T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return isoMonth;
  }

  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    month: "long",
  }).format(date);
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

function getInvoiceStatusLabel(status) {
  if (status === "paid") {
    return "پرداخت‌شده";
  }

  if (status === "pending" || status === "overdue") {
    return "معوق";
  }

  return status || "نامشخص";
}

function getInvoiceStatusClass(status) {
  if (status === "paid") {
    return "status-paid";
  }

  return "status-pending";
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  trend,
}) {
  return (
    <div className={`summary-card summary-card--${variant}`}>
      <div className="summary-card__top">
        <span className="summary-card__label">{title}</span>

        <div className="summary-card__icon">
          <Icon size={21} strokeWidth={1.9} />
        </div>
      </div>

      <div className="summary-card__value">
        {value}
      </div>

      {trend && (
        <div className={`summary-card__trend summary-card__trend--${trend.type}`}>
          {trend.type === "up" ? (
            <ArrowUpRight size={15} />
          ) : (
            <ArrowDownLeft size={15} />
          )}

          <span>{trend.text}</span>
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      <div className="skeleton skeleton--title" />

      <div className="dashboard-grid dashboard-grid--summary">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="skeleton-card" key={index}>
            <div className="skeleton skeleton--small" />
            <div className="skeleton skeleton--large" />
            <div className="skeleton skeleton--medium" />
          </div>
        ))}
      </div>

      <div className="skeleton-card skeleton-card--chart">
        <div className="skeleton skeleton--small" />
        <div className="skeleton skeleton--chart" />
      </div>

      <div className="skeleton-card skeleton-card--table">
        <div className="skeleton skeleton--small" />

        {Array.from({ length: 5 }).map((_, index) => (
          <div className="skeleton skeleton--row" key={index} />
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [summaryRes, trendRes, invoicesRes] =
          await Promise.all([
            apiClient.get("/dashboard/summary/"),
            apiClient.get("/dashboard/trend/"),
            apiClient.get("/invoices/"),
          ]);

        if (!isMounted) return;

        const formattedTrend = (trendRes.data || []).map((row) => ({
          ...row,
          label: formatPersianMonth(row.month),
          income: Number(row.income || 0),
          expense: Number(row.expense || 0),
        }));

        const invoices = Array.isArray(invoicesRes.data)
          ? invoicesRes.data
          : invoicesRes.data?.results || [];

        setSummary(summaryRes.data);
        setTrend(formattedTrend);
        setRecentInvoices(invoices.slice(0, 5));
      } catch (err) {
        console.error("Dashboard loading error:", err);

        if (!isMounted) return;

        setError(
          "دریافت اطلاعات داشبورد با مشکل مواجه شد. لطفاً دوباره تلاش کنید."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const cards = useMemo(() => {
    if (!summary) return [];

    return [
      {
        title: "درآمد این ماه",
        value: formatMoneyWithUnit(summary.total_income),
        icon: ArrowUpRight,
        variant: "income",
        trend: {
          type: "up",
          text: "افزایش نسبت به ماه قبل",
        },
      },
      {
        title: "هزینه این ماه",
        value: formatMoneyWithUnit(summary.total_expense),
        icon: ArrowDownLeft,
        variant: "expense",
      },
      {
        title: "سود خالص این ماه",
        value: formatMoneyWithUnit(summary.net_profit),
        icon: TrendingUp,
        variant: "profit",
        trend: {
          type: "up",
          text: "عملکرد مثبت",
        },
      },
      {
        title: "فاکتورهای معوق",
        value: Number(
          summary.pending_invoice_count || 0
        ).toLocaleString("fa-IR"),
        icon: Receipt,
        variant: "warning",
      },
    ];
  }, [summary]);

  if (loading) {
    return (
      <Layout>
        <div className="dashboard-page">
          <DashboardSkeleton />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="dashboard-page">
          <div className="dashboard-error">
            <div className="dashboard-error__icon">
              <BarChart3 size={25} />
            </div>

            <div>
              <h2>مشکلی پیش آمد</h2>
              <p>{error}</p>
            </div>

            <button
              type="button"
              className="btn btn--primary"
              onClick={() => window.location.reload()}
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
      <div className="dashboard-page">

        {/* =========================================
            Page Header
        ========================================= */}

        <header className="page-header dashboard-header">
          <div>
            <span className="page-eyebrow">
              مدیریت مالی
            </span>

            <h1 className="page-title">
              داشبورد
            </h1>

            <p className="page-subtitle">
              خلاصه‌ای از وضعیت مالی شما
            </p>
          </div>

          <Link
            to="/invoices/new"
            className="btn btn--primary"
          >
            <FileText size={18} />
            <span>ایجاد فاکتور</span>
          </Link>
        </header>

        {/* =========================================
            Summary Cards
        ========================================= */}

        <section
          className="dashboard-grid dashboard-grid--summary"
          aria-label="خلاصه وضعیت مالی"
        >
          {cards.map((card) => (
            <SummaryCard
              key={card.title}
              {...card}
            />
          ))}
        </section>

        {/* =========================================
            Financial Chart
        ========================================= */}

        <section className="dashboard-card chart-card">
          <div className="dashboard-card__header">
            <div>
              <h2 className="dashboard-card__title">
                روند درآمد و هزینه
              </h2>

              <p className="dashboard-card__description">
                مقایسه عملکرد مالی در ۶ ماه اخیر
              </p>
            </div>

            <div className="chart-legend-custom">
              <span>
                <i className="legend-dot legend-dot--income" />
                درآمد
              </span>

              <span>
                <i className="legend-dot legend-dot--expense" />
                هزینه
              </span>
            </div>
          </div>

          {trend.length === 0 ? (
            <div className="empty-chart">
              <BarChart3 size={32} />
              <p>اطلاعات کافی برای نمایش نمودار وجود ندارد.</p>
            </div>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart
                  data={trend}
                  margin={{
                    top: 15,
                    right: 10,
                    left: 10,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="4 5"
                    vertical={false}
                    stroke="#edf0f2"
                  />

                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#7b858e",
                      fontSize: 12,
                      fontFamily: "Vazirmatn",
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={65}
                    tick={{
                      fill: "#9aa3ad",
                      fontSize: 11,
                      fontFamily: "Vazirmatn",
                    }}
                    tickFormatter={(value) =>
                      `${Math.round(value / 1000000)}م`
                    }
                  />

                  <Tooltip
                    cursor={{
                      stroke: "#dfe5e8",
                      strokeWidth: 1,
                    }}
                    contentStyle={{
                      direction: "rtl",
                      border: "1px solid #e8ecef",
                      borderRadius: "12px",
                      boxShadow:
                        "0 8px 30px rgba(16, 24, 40, 0.08)",
                      fontFamily: "Vazirmatn",
                    }}
                    formatter={(value, name) => [
                      formatMoneyWithUnit(value),
                      name === "income" ? "درآمد" : "هزینه",
                    ]}
                    labelFormatter={(label) => `ماه ${label}`}
                  />

                  <Legend
                    verticalAlign="top"
                    height={0}
                    content={() => null}
                  />

                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#0f9f78"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      strokeWidth: 2,
                      fill: "#ffffff",
                    }}
                    activeDot={{
                      r: 6,
                      strokeWidth: 3,
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      strokeWidth: 2,
                      fill: "#ffffff",
                    }}
                    activeDot={{
                      r: 6,
                      strokeWidth: 3,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* =========================================
            Recent Invoices
        ========================================= */}

        <section className="dashboard-card invoices-card">
          <div className="dashboard-card__header">
            <div>
              <h2 className="dashboard-card__title">
                آخرین فاکتورها
              </h2>

              <p className="dashboard-card__description">
                آخرین فاکتورهای ثبت‌شده در حساب شما
              </p>
            </div>

            <Link
              to="/invoices"
              className="view-all-link"
            >
              مشاهده همه
              <ArrowUpLeft size={16} />
            </Link>
          </div>

          {recentInvoices.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">
                <FileText size={25} />
              </div>

              <h3>هنوز فاکتوری ثبت نشده است</h3>

              <p>
                اولین فاکتور خود را ایجاد کنید تا اینجا نمایش داده شود.
              </p>

              <Link
                to="/invoices/new"
                className="btn btn--secondary"
              >
                ایجاد فاکتور
              </Link>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table dashboard-invoices-table">
                <thead>
                  <tr>
                    <th>شماره فاکتور</th>
                    <th>مشتری</th>
                    <th>مبلغ</th>
                    <th>وضعیت</th>
                    <th>تاریخ</th>
                  </tr>
                </thead>

                <tbody>
                  {recentInvoices.map((invoice) => (
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
                        <span className="client-name">
                          {invoice.client_name || "بدون نام"}
                        </span>
                      </td>

                      <td>
                        <span className="invoice-amount">
                          {formatMoney(invoice.total_amount)}
                          <small> تومان</small>
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${getInvoiceStatusClass(
                            invoice.status
                          )}`}
                        >
                          <span className="status-dot" />
                          {getInvoiceStatusLabel(invoice.status)}
                        </span>
                      </td>

                      <td>
                        <span className="invoice-date">
                          {formatPersianDate(invoice.date)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </Layout>
  );
}