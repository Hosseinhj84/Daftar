import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import apiClient from "../api/Client";
import Layout from "../Components/Layout";
import "../Styles/Reports.css";

const PIE_COLORS = [
  "#0f766e",
  "#16a34a",
  "#0891b2",
  "#7c3aed",
  "#ea580c",
  "#dc2626",
  "#ca8a04",
  "#475569",
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString("fa-IR");
}

function formatCurrency(value) {
  return `${formatNumber(value)} تومان`;
}

/**
 * تبدیل ماه میلادی دریافتی از API مثل:
 * 2026-08
 *
 * به نام واقعی ماه شمسی.
 */
function formatMonthLabel(isoMonth) {
  if (!isoMonth) return "-";

  const [year, month] = isoMonth.split("-").map(Number);

  if (!year || !month) return isoMonth;

  const date = new Date(year, month - 1, 1);

  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    month: "long",
  }).format(date);
}

/**
 * تبدیل ماه به عبارت کامل‌تر برای tooltip
 * مثلاً:
 * مرداد ۱۴۰۵
 */
function formatFullMonthLabel(isoMonth) {
  if (!isoMonth) return "-";

  const [year, month] = isoMonth.split("-").map(Number);

  if (!year || !month) return isoMonth;

  const date = new Date(year, month - 1, 1);

  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="report-tooltip">
      <div className="report-tooltip-title">{label}</div>

      {payload.map((item) => (
        <div className="report-tooltip-row" key={item.dataKey}>
          <span className="report-tooltip-label">
            <span
              className="tooltip-dot"
              style={{ backgroundColor: item.color }}
            />
            {item.name}
          </span>

          <strong>{formatCurrency(item.value)}</strong>
        </div>
      ))}
    </div>
  );
}

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0];

  return (
    <div className="report-tooltip">
      <div className="report-tooltip-title">{item.payload.category_name}</div>

      <strong>{formatCurrency(item.value)}</strong>
    </div>
  );
}

function EmptyChart({ text }) {
  return (
    <div className="report-empty-chart">
      <div className="report-empty-icon">◌</div>
      <span>{text}</span>
    </div>
  );
}

export default function Report() {
  const [monthsRange, setMonthsRange] = useState(6);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReport();
  }, [monthsRange]);

  async function loadReport() {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get(
        `/dashboard/report/?months=${monthsRange}`,
      );

      setReport(response.data);
    } catch (err) {
      console.error(err);
      setError("دریافت اطلاعات گزارش با خطا مواجه شد.");
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  const monthlyChartData = useMemo(() => {
    if (!report?.monthly) return [];

    return report.monthly.map((row) => ({
      ...row,
      income: Number(row.income || 0),
      expense: Number(row.expense || 0),
      net_profit: Number(row.net_profit || 0),
      label: formatMonthLabel(row.month),
      fullLabel: formatFullMonthLabel(row.month),
    }));
  }, [report]);

  const categoryData = useMemo(() => {
    if (!report?.category_breakdown) return [];

    return report.category_breakdown
      .map((item) => ({
        ...item,
        total: Number(item.total || 0),
      }))
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [report]);

  const totalExpense = Number(report?.totals?.total_expense || 0);

  const categoryDataWithPercent = useMemo(() => {
    return categoryData.map((item) => ({
      ...item,
      percent:
        totalExpense > 0 ? Math.round((item.total / totalExpense) * 100) : 0,
    }));
  }, [categoryData, totalExpense]);

  if (loading) {
    return (
      <Layout>
        <div className="report-page">
          <div className="report-loading">
            <div className="loading-spinner" />
            <span>در حال آماده‌سازی گزارش مالی...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !report) {
    return (
      <Layout>
        <div className="report-page">
          <div className="report-error">
            <div className="report-error-icon">!</div>

            <div>
              <h3>گزارش قابل دریافت نیست</h3>
              <p>{error || "اطلاعاتی برای نمایش وجود ندارد."}</p>
            </div>

            <button className="primary-btn" onClick={loadReport}>
              تلاش مجدد
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const totals = {
    income: Number(report.totals?.total_income || 0),
    expense: Number(report.totals?.total_expense || 0),
    profit: Number(report.totals?.net_profit || 0),
  };

  return (
    <Layout>
      <div className="report-page" dir="rtl">
        {/* =========================
            PAGE HEADER
        ========================== */}
        <header className="report-header">
          <div>
            <div className="report-eyebrow">گزارش‌های مالی</div>

            <h1>گزارش مالی</h1>

            <p>
              تصویر کاملی از درآمد، هزینه و سود کسب‌وکار شما در بازه انتخاب‌شده
            </p>
          </div>

          <div className="report-header-actions">
            <div className="report-period">
              <span className="period-label">بازه گزارش</span>

              <select
                value={monthsRange}
                onChange={(e) => setMonthsRange(Number(e.target.value))}
                aria-label="بازه گزارش"
              >
                <option value={1}>این ماه</option>
                <option value={3}>سه ماه اخیر</option>
                <option value={6}>شش ماه اخیر</option>
                <option value={12}>دوازده ماه اخیر</option>
              </select>
            </div>

            <button
              type="button"
              className="report-pdf-btn"
              onClick={handlePrint}
            >
              <span className="btn-icon">↓</span>
              دریافت PDF گزارش
            </button>
          </div>
        </header>

        {/* =========================
            SUMMARY CARDS
        ========================== */}
        <section className="report-summary-grid">
          <article className="report-summary-card income-card">
            <div className="summary-card-top">
              <div className="summary-icon income-icon">↗</div>

              <span className="summary-badge positive">درآمد</span>
            </div>

            <div className="summary-card-content">
              <span>کل درآمد</span>

              <strong>{formatCurrency(totals.income)}</strong>

              <small>مجموع درآمد در بازه انتخاب‌شده</small>
            </div>
          </article>

          <article className="report-summary-card expense-card">
            <div className="summary-card-top">
              <div className="summary-icon expense-icon">↘</div>

              <span className="summary-badge negative">هزینه</span>
            </div>

            <div className="summary-card-content">
              <span>کل هزینه</span>

              <strong>{formatCurrency(totals.expense)}</strong>

              <small>مجموع هزینه در بازه انتخاب‌شده</small>
            </div>
          </article>

          <article
            className={`report-summary-card profit-card ${
              totals.profit < 0 ? "loss-card" : ""
            }`}
          >
            <div className="summary-card-top">
              <div className="summary-icon profit-icon">
                {totals.profit >= 0 ? "✓" : "!"}
              </div>

              <span
                className={`summary-badge ${
                  totals.profit >= 0 ? "positive" : "negative"
                }`}
              >
                {totals.profit >= 0 ? "سودده" : "زیان‌ده"}
              </span>
            </div>

            <div className="summary-card-content">
              <span>سود خالص</span>

              <strong>{formatCurrency(totals.profit)}</strong>

              <small>درآمد منهای کل هزینه‌ها</small>
            </div>
          </article>
        </section>

        {/* =========================
            MAIN BAR CHART
        ========================== */}
        <section className="report-card chart-card">
          <div className="report-card-header">
            <div>
              <h2>درآمد و هزینه</h2>
              <p>مقایسه عملکرد مالی در ماه‌های اخیر</p>
            </div>

            <div className="chart-legend-custom">
              <span>
                <i className="legend-income" />
                درآمد
              </span>

              <span>
                <i className="legend-expense" />
                هزینه
              </span>
            </div>
          </div>

          {monthlyChartData.length === 0 ? (
            <EmptyChart text="داده‌ای برای نمایش نمودار وجود ندارد." />
          ) : (
            <div className="main-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyChartData}
                  margin={{
                    top: 15,
                    right: 5,
                    left: 10,
                    bottom: 5,
                  }}
                  barGap={8}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="#e5e7eb"
                  />

                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontFamily: "Vazirmatn, sans-serif",
                      fontSize: 12,
                      fill: "#64748b",
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={75}
                    tick={{
                      fontFamily: "Vazirmatn, sans-serif",
                      fontSize: 11,
                      fill: "#64748b",
                    }}
                    tickFormatter={(value) =>
                      value >= 1000000
                        ? `${formatNumber(Math.round(value / 1000000))}م`
                        : formatNumber(value)
                    }
                  />

                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{
                      fill: "rgba(15, 118, 110, 0.04)",
                    }}
                  />

                  <Bar
                    dataKey="income"
                    name="درآمد"
                    fill="#16a34a"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={34}
                  />

                  <Bar
                    dataKey="expense"
                    name="هزینه"
                    fill="#ea580c"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={34}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* =========================
            BOTTOM GRID
        ========================== */}
        <div className="report-bottom-grid">
          {/* =========================
              PIE CHART
          ========================== */}
          <section className="report-card category-card">
            <div className="report-card-header">
              <div>
                <h2>ترکیب هزینه‌ها</h2>
                <p>سهم هر دسته از کل هزینه‌های شما</p>
              </div>
            </div>

            {categoryDataWithPercent.length === 0 ? (
              <EmptyChart text="هزینه‌ای در این بازه ثبت نشده است." />
            ) : (
              <div className="category-chart-wrapper">
                <div className="pie-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryDataWithPercent}
                        dataKey="total"
                        nameKey="category_name"
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={92}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {categoryDataWithPercent.map((entry, index) => (
                          <Cell
                            key={`${entry.category_name}-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>

                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="pie-center">
                    <strong>{formatNumber(totalExpense)}</strong>
                    <span>تومان</span>
                  </div>
                </div>

                <div className="category-list">
                  {categoryDataWithPercent.map((item, index) => (
                    <div className="category-row" key={item.category_name}>
                      <div className="category-name">
                        <span
                          className="category-dot"
                          style={{
                            backgroundColor:
                              PIE_COLORS[index % PIE_COLORS.length],
                          }}
                        />

                        <span>{item.category_name}</span>
                      </div>

                      <div className="category-values">
                        <strong>{formatNumber(item.percent)}٪</strong>

                        <small>{formatCurrency(item.total)}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* =========================
              MONTHLY SUMMARY TABLE
          ========================== */}
          <section className="report-card monthly-card">
            <div className="report-card-header">
              <div>
                <h2>خلاصه ماهانه</h2>
                <p>جزئیات عملکرد مالی هر ماه</p>
              </div>
            </div>

            {monthlyChartData.length === 0 ? (
              <EmptyChart text="اطلاعات ماهانه‌ای وجود ندارد." />
            ) : (
              <div className="monthly-table-wrapper">
                <table className="monthly-report-table">
                  <thead>
                    <tr>
                      <th>ماه</th>
                      <th>درآمد</th>
                      <th>هزینه</th>
                      <th>سود خالص</th>
                    </tr>
                  </thead>

                  <tbody>
                    {monthlyChartData.map((row) => (
                      <tr key={row.month}>
                        <td>
                          <div className="month-cell">
                            <strong>{row.label}</strong>
                            <small>{row.fullLabel}</small>
                          </div>
                        </td>

                        <td className="income-number">
                          +{formatNumber(row.income)}
                        </td>

                        <td className="expense-number">
                          -{formatNumber(row.expense)}
                        </td>

                        <td
                          className={
                            row.net_profit >= 0
                              ? "profit-number"
                              : "loss-number"
                          }
                        >
                          {row.net_profit >= 0 ? "+" : ""}
                          {formatNumber(row.net_profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* =========================
            REPORT FOOTER
        ========================== */}
        <div className="report-footer">
          <span>
            این گزارش بر اساس تراکنش‌های ثبت‌شده در دفتر درآمد تهیه شده است.
          </span>

          <button type="button" onClick={loadReport}>
            ↻ بروزرسانی اطلاعات
          </button>
        </div>
      </div>
    </Layout>
  );
}
