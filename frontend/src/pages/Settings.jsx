import { useEffect, useState } from "react";
import apiClient from "../api/client";
import Layout from "../Components/Layout";
import "../Styles/Settings.css";

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10v9h16v-9" />
      <path d="M3 10 5 4h14l2 6" />
      <path d="M3 10c.7 1 1.7 1.5 3 1.5S8.3 11 9 10c.7 1 1.7 1.5 3 1.5s2.3-.5 3-1.5c.7 1 1.7 1.5 3 1.5s2.3-.5 3-1.5" />
      <path d="M8 19v-4h8v4" />
    </svg>
  );
}

function InvoiceIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3h10l3 3v15H7z" />
      <path d="M17 3v4h3" />
      <path d="M10 11h7M10 15h7M10 18h4" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h4a5 5 0 0 0 5-5c0-2.8-4-5-9-5Z" />
      <circle cx="7.5" cy="10" r="1" />
      <circle cx="9.5" cy="6.5" r="1" />
      <circle cx="14" cy="6" r="1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 3h12l3 3v15H5z" />
      <path d="M8 3v6h8V3M8 21v-7h8v7" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="m19.4 15 .1.1a2 2 0 0 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.2a2 2 0 0 1-4 0v-.2a2 2 0 0 0-3.4-1.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A2 2 0 0 0 3.7 12a2 2 0 0 0-1.7-2v-.2a2 2 0 0 1 3.4-1.4l.1.1A2 2 0 0 0 9 7.1V6.9a2 2 0 0 1 4 0v.2a2 2 0 0 0 3.4 1.4l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1A2 2 0 0 0 20.3 12a2 2 0 0 0-.9 3Z" />
    </svg>
  );
}

export default function Settings() {
  const [form, setForm] = useState({
    business_name: "",
    invoice_prefix: "",
    default_invoice_note: "",
    notify_overdue_email: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderError, setReminderError] = useState("");

  async function handleSendOverdueReminders() {
    if (sendingReminders) {
      return;
    }

    setSendingReminders(true);
    setReminderMessage("");
    setReminderError("");

    try {
      const response = await apiClient.post("/send-overdue-reminders/");

      setReminderMessage(
        response.data.detail || "ایمیل یادآوری با موفقیت ارسال شد.",
      );
    } catch (error) {
      setReminderError(
        error.response?.data?.detail ||
          "ارسال ایمیل انجام نشد. تنظیمات ایمیل را بررسی کنید.",
      );
    } finally {
      setSendingReminders(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setLoadError("");

    try {
      const response = await apiClient.get("/settings/");

      setForm({
        business_name: response.data?.business_name ?? "",
        invoice_prefix: response.data?.invoice_prefix ?? "",
        default_invoice_note: response.data?.default_invoice_note ?? "",
        notify_overdue_email: response.data?.notify_overdue_email ?? true,
      });
    } catch (err) {
      console.error(err);
      setLoadError("دریافت تنظیمات با خطا مواجه شد. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setSaved(false);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.business_name.trim()) {
      setError("لطفاً نام کسب‌وکار را وارد کنید.");
      return;
    }

    if (!form.invoice_prefix.trim()) {
      setError("لطفاً پیشوند شماره فاکتور را وارد کنید.");
      return;
    }

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      await apiClient.put("/settings/", {
        business_name: form.business_name.trim(),
        invoice_prefix: form.invoice_prefix.trim(),
        default_invoice_note: form.default_invoice_note,
        notify_overdue_email: form.notify_overdue_email,
      });

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (err) {
      console.error(err);

      const backendError = err.response?.data;

      if (backendError && typeof backendError === "object") {
        const firstError = Object.values(backendError)
          .flat()
          .find((item) => typeof item === "string");

        setError(
          firstError ||
            "ذخیره تنظیمات با خطا مواجه شد. لطفاً دوباره تلاش کنید.",
        );
      } else {
        setError("ذخیره تنظیمات با خطا مواجه شد. لطفاً دوباره تلاش کنید.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="settings-page">
          <div className="settings-header settings-skeleton-header">
            <div>
              <div className="settings-skeleton settings-skeleton-title" />
              <div className="settings-skeleton settings-skeleton-subtitle" />
            </div>
          </div>

          <div className="settings-grid">
            <div className="settings-card">
              <div className="settings-skeleton settings-skeleton-section" />
              <div className="settings-skeleton settings-skeleton-input" />
              <div className="settings-skeleton settings-skeleton-input" />
              <div className="settings-skeleton settings-skeleton-input large" />
            </div>

            <div className="settings-card">
              <div className="settings-skeleton settings-skeleton-section" />
              <div className="settings-skeleton settings-skeleton-input" />
              <div className="settings-skeleton settings-skeleton-input" />
              <div className="settings-skeleton settings-skeleton-input large" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="settings-page" dir="rtl">
        <header className="settings-header">
          <div className="settings-title-wrapper">
            <div className="settings-page-icon">
              <SettingsIcon />
            </div>

            <div>
              <h1>تنظیمات دفتر</h1>
              <p>اطلاعات و تنظیمات اصلی دفتر درآمد خود را مدیریت کنید.</p>
            </div>
          </div>
        </header>

        {loadError && (
          <div className="settings-alert settings-alert-error">
            <span>{loadError}</span>

            <button type="button" onClick={loadSettings}>
              تلاش دوباره
            </button>
          </div>
        )}

        {!loadError && (
          <form onSubmit={handleSubmit}>
            <div className="settings-grid">
              {/* اطلاعات کسب‌وکار */}
              <section className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-icon">
                    <StoreIcon />
                  </div>

                  <div>
                    <h2>اطلاعات کسب‌وکار</h2>
                    <p>
                      این اطلاعات در بخش‌های مختلف دفتر و فاکتورها استفاده
                      می‌شوند.
                    </p>
                  </div>
                </div>

                <div className="settings-fields">
                  <div className="settings-field">
                    <label htmlFor="business_name">
                      نام کسب‌وکار
                      <span className="required-mark">*</span>
                    </label>

                    <input
                      id="business_name"
                      type="text"
                      value={form.business_name}
                      onChange={(e) =>
                        updateField("business_name", e.target.value)
                      }
                      placeholder="مثال: بوتیک آوای شب"
                      autoComplete="organization"
                    />

                    <span className="settings-field-hint">
                      نامی که می‌خواهید روی فاکتورها نمایش داده شود.
                    </span>
                  </div>

                  <div className="settings-field">
                    <label htmlFor="invoice_prefix">
                      پیشوند شماره فاکتور
                      <span className="required-mark">*</span>
                    </label>

                    <div className="settings-input-with-preview">
                      <input
                        id="invoice_prefix"
                        type="text"
                        value={form.invoice_prefix}
                        onChange={(e) =>
                          updateField("invoice_prefix", e.target.value)
                        }
                        placeholder="مثال: INV-"
                        maxLength={20}
                      />

                      <div className="invoice-preview">
                        <span>نمونه</span>
                        <strong>{form.invoice_prefix || "INV-"}1024</strong>
                      </div>
                    </div>

                    <span className="settings-field-hint">
                      این پیشوند قبل از شماره فاکتورهای جدید قرار می‌گیرد.
                    </span>
                  </div>
                </div>
              </section>

              {/* تنظیمات فاکتور */}
              <section className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-icon">
                    <InvoiceIcon />
                  </div>

                  <div>
                    <h2>تنظیمات فاکتور</h2>
                    <p>
                      متن پیش‌فرض و تنظیمات پایه فاکتورهای جدید را مشخص کنید.
                    </p>
                  </div>
                </div>

                <div className="settings-fields">
                  <div className="settings-field">
                    <label htmlFor="default_invoice_note">
                      یادداشت پیش‌فرض فاکتور
                    </label>

                    <textarea
                      id="default_invoice_note"
                      value={form.default_invoice_note}
                      onChange={(e) =>
                        updateField("default_invoice_note", e.target.value)
                      }
                      rows={5}
                      placeholder="مثلاً: لطفاً مبلغ فاکتور را حداکثر تا ۷ روز کاری واریز نمایید."
                    />

                    <span className="settings-field-hint">
                      این متن می‌تواند هنگام ساخت فاکتور به‌صورت خودکار قرار
                      بگیرد.
                    </span>
                  </div>
                </div>
              </section>

              {/* اعلان ایمیلی */}
              <section className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-icon">
                    <MailIcon />
                  </div>

                  <div>
                    <h2>اعلان‌های ایمیلی</h2>
                    <p>اطلاع‌رسانی مربوط به فاکتورهای معوق را مدیریت کنید.</p>
                  </div>
                </div>

                <div className="settings-notification-box">
                  <div className="settings-notification-content">
                    <div className="settings-notification-title">
                      <span>یادآوری فاکتورهای معوق</span>

                      <span
                        className={
                          form.notify_overdue_email
                            ? "settings-status active"
                            : "settings-status"
                        }
                      >
                        {form.notify_overdue_email ? "فعال" : "غیرفعال"}
                      </span>
                    </div>

                    <p>
                      در صورت فعال بودن، سیستم امکان ارسال یادآوری ایمیلی برای
                      فاکتورهای معوق را خواهد داشت.
                    </p>
                  </div>

                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={form.notify_overdue_email}
                      onChange={(e) =>
                        updateField("notify_overdue_email", e.target.checked)
                      }
                    />

                    <span className="settings-switch-track">
                      <span className="settings-switch-thumb" />
                    </span>

                    <span className="sr-only">
                      فعال‌سازی یادآوری ایمیلی فاکتورهای معوق
                    </span>
                  </label>
                </div>

                <div className="settings-info-box">
                  <div className="settings-info-icon">i</div>

                  <p>
                    تنظیمات پیشرفته‌تر ارسال گزارش مالی مانند ایمیل دریافت‌کننده
                    و زمان‌بندی گزارش در نسخه‌های بعدی قابل اضافه شدن است.
                  </p>
                </div>
              </section>
              <section className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <h2>یادآوری فاکتورهای معوق</h2>
                    <p>
                      با فشردن این دکمه، یادآوری فاکتورهای پرداخت‌نشده به ایمیل
                      شما ارسال می‌شود.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={handleSendOverdueReminders}
                  disabled={sendingReminders}
                >
                  {sendingReminders
                    ? "در حال ارسال..."
                    : "ارسال دستی یادآوری‌ها"}
                </button>

                {reminderMessage && (
                  <p className="success-message">{reminderMessage}</p>
                )}

                {reminderError && (
                  <p className="error-message">{reminderError}</p>
                )}
              </section>

              {/* ظاهر */}
              <section className="settings-card settings-card-muted">
                <div className="settings-card-header">
                  <div className="settings-card-icon">
                    <PaletteIcon />
                  </div>

                  <div>
                    <h2>شخصی‌سازی ظاهر</h2>
                    <p>
                      امکانات شخصی‌سازی ظاهری در نسخه‌های بعدی توسعه داده خواهند
                      شد.
                    </p>
                  </div>
                </div>

                <div className="settings-coming-soon">
                  <div className="settings-coming-soon-icon">
                    <PaletteIcon />
                  </div>

                  <div>
                    <strong>شخصی‌سازی بیشتر به‌زودی</strong>
                    <p>
                      انتخاب تم و رنگ برند از قابلیت‌هایی است که می‌توان در
                      ادامه به دفتر درآمد اضافه کرد.
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {error && (
              <div className="settings-alert settings-alert-error settings-submit-alert">
                <span>{error}</span>
              </div>
            )}

            {saved && (
              <div className="settings-alert settings-alert-success settings-submit-alert">
                <span className="settings-success-icon">
                  <CheckIcon />
                </span>

                <span>تغییرات با موفقیت ذخیره شد.</span>
              </div>
            )}

            <div className="settings-footer">
              <div className="settings-footer-hint">
                <span>✓</span>
                تغییرات پس از ذخیره در دفتر شما اعمال می‌شوند.
              </div>

              <button
                type="submit"
                className="settings-save-btn"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="settings-spinner" />
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <SaveIcon />
                    ذخیره تغییرات
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
