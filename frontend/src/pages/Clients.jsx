import { useEffect, useMemo, useState } from "react";
import apiClient from "../api/Client";
import Layout from "../Components/Layout";
import "../Styles/Clients.css";

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    notes: "",
  });

  useEffect(() => {
    loadClients();
  }, []);

  // بستن مودال با Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && showModal && !saving) {
        closeModal();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showModal, saving]);

  async function loadClients() {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get("/clients/");
      setClients(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
      setError("خطا در دریافت لیست مشتریان.");
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingClient(null);
    setForm({
      name: "",
      phone: "",
      notes: "",
    });
    setFormError("");
    setError("");
    setShowModal(true);
  }

  function openEditModal(client) {
    setEditingClient(client);

    setForm({
      name: client.name || "",
      phone: client.phone || "",
      notes: client.notes || "",
    });

    setFormError("");
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingClient(null);
    setFormError("");
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget && !saving) {
      closeModal();
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formError) {
      setFormError("");
    }
  }

  function validateForm() {
    const name = form.name.trim();
    const phone = form.phone.trim();

    if (!name) {
      setFormError("لطفاً نام مشتری را وارد کنید.");
      return false;
    }

    if (name.length < 2) {
      setFormError("نام مشتری باید حداقل ۲ کاراکتر باشد.");
      return false;
    }

    if (phone) {
      const normalizedPhone = phone.replace(/\s|-/g, "");

      if (!/^(?:\+98|0098|98|0)?9\d{9}$/.test(normalizedPhone)) {
        setFormError("شماره تماس واردشده معتبر نیست.");
        return false;
      }
    }

    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    setFormError("");
    setError("");

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      notes: form.notes.trim(),
    };

    try {
      if (editingClient) {
        const response = await apiClient.put(
          `/clients/${editingClient.id}/`,
          payload,
        );

        setClients((prev) =>
          prev.map((client) =>
            client.id === editingClient.id ? response.data : client,
          ),
        );
      } else {
        const response = await apiClient.post("/clients/", payload);

        setClients((prev) => [response.data, ...prev]);
      }

      closeModal();
    } catch (err) {
      console.error(err);

      const apiError = err.response?.data;

      if (apiError) {
        if (typeof apiError === "object") {
          const firstError = Object.values(apiError).flat()?.[0];

          setFormError(firstError || "اطلاعات واردشده قابل ذخیره نیست.");
        } else {
          setFormError(String(apiError));
        }
      } else {
        setFormError(
          editingClient ? "خطا در ویرایش مشتری." : "خطا در ثبت مشتری.",
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(client) {
    const confirmed = window.confirm(
      `آیا از حذف مشتری «${client.name}» مطمئن هستید؟\n\nاگر این مشتری فاکتور یا اطلاعات مرتبط داشته باشد، ممکن است حذف امکان‌پذیر نباشد.`,
    );

    if (!confirmed) return;

    setDeletingId(client.id);
    setError("");

    try {
      await apiClient.delete(`/clients/${client.id}/`);

      setClients((prev) => prev.filter((item) => item.id !== client.id));
    } catch (err) {
      console.error(err);

      setError(
        "این مشتری قابل حذف نیست. احتمالاً فاکتور یا اطلاعات مرتبط با آن وجود دارد.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return clients;

    return clients.filter((client) => {
      const name = String(client.name || "").toLowerCase();
      const phone = String(client.phone || "").toLowerCase();
      const notes = String(client.notes || "").toLowerCase();

      return (
        name.includes(query) || phone.includes(query) || notes.includes(query)
      );
    });
  }, [clients, search]);

  return (
    <Layout>
      <div className="clients-page">
        {/* Header */}
        <header className="clients-header">
          <div>
            <div className="clients-title-row">
              <h1>مشتریان</h1>

              <span className="clients-count">
                {clients.length.toLocaleString("fa-IR")} مشتری
              </span>
            </div>

            <p className="clients-subtitle">
              مدیریت اطلاعات مشتریان و مخاطبان کاری شما
            </p>
          </div>

          <button
            type="button"
            className="primary-btn clients-add-btn"
            onClick={openAddModal}
          >
            <span className="btn-icon">+</span>
            مشتری جدید
          </button>
        </header>

        {/* Search / Toolbar */}
        <div className="clients-toolbar">
          <div className="clients-search">
            <span className="search-icon" aria-hidden="true">
              ⌕
            </span>

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی نام، شماره تماس یا توضیحات..."
              aria-label="جستجوی مشتری"
            />

            {search && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearch("")}
                aria-label="پاک کردن جستجو"
              >
                ×
              </button>
            )}
          </div>

          <div className="clients-result-count">
            {search ? (
              <>{filteredClients.length.toLocaleString("fa-IR")} نتیجه</>
            ) : (
              <>همه مشتریان</>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="clients-alert" role="alert">
            <span className="alert-icon">!</span>
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="بستن پیام"
            >
              ×
            </button>
          </div>
        )}

        {/* Content */}
        <section className="clients-card">
          {loading ? (
            <div className="clients-loading">
              <div className="loading-spinner" />
              <span>در حال دریافت اطلاعات مشتریان...</span>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="clients-empty">
              <div className="empty-icon">♙</div>

              {search ? (
                <>
                  <h3>مشتری‌ای پیدا نشد</h3>
                  <p>برای عبارت «{search}» نتیجه‌ای پیدا نکردیم.</p>

                  <button
                    type="button"
                    className="outline-btn"
                    onClick={() => setSearch("")}
                  >
                    پاک کردن جستجو
                  </button>
                </>
              ) : (
                <>
                  <h3>هنوز مشتری‌ای ثبت نشده است</h3>
                  <p>
                    اولین مشتری خود را اضافه کنید تا مدیریت فاکتورها راحت‌تر
                    شود.
                  </p>

                  <button
                    type="button"
                    className="primary-btn"
                    onClick={openAddModal}
                  >
                    + افزودن اولین مشتری
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="clients-table-wrapper">
                <table className="clients-table">
                  <thead>
                    <tr>
                      <th className="client-name-column">مشتری</th>
                      <th>شماره تماس</th>
                      <th>توضیحات</th>
                      <th className="client-actions-column">عملیات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredClients.map((client) => (
                      <tr key={client.id}>
                        <td>
                          <div className="client-identity">
                            <div className="client-avatar">
                              {getInitials(client.name)}
                            </div>

                            <div className="client-name-wrapper">
                              <strong>{client.name}</strong>
                              <span>
                                مشتری #{String(client.id).padStart(4, "0")}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="client-phone">
                            {client.phone || "ثبت نشده"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              client.notes
                                ? "client-notes"
                                : "client-notes muted"
                            }
                            title={client.notes || ""}
                          >
                            {client.notes || "بدون توضیحات"}
                          </span>
                        </td>

                        <td>
                          <div className="client-actions">
                            <button
                              type="button"
                              className="table-action edit"
                              onClick={() => openEditModal(client)}
                              title="ویرایش مشتری"
                            >
                              <span>✎</span>
                              <span className="action-label">ویرایش</span>
                            </button>

                            <button
                              type="button"
                              className="table-action delete"
                              onClick={() => handleDelete(client)}
                              disabled={deletingId === client.id}
                              title="حذف مشتری"
                            >
                              {deletingId === client.id ? (
                                <span className="mini-spinner" />
                              ) : (
                                <span>⌫</span>
                              )}

                              <span className="action-label">حذف</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="clients-mobile-list">
                {filteredClients.map((client) => (
                  <article className="client-mobile-card" key={client.id}>
                    <div className="client-mobile-top">
                      <div className="client-identity">
                        <div className="client-avatar">
                          {getInitials(client.name)}
                        </div>

                        <div className="client-name-wrapper">
                          <strong>{client.name}</strong>
                          <span>
                            مشتری #{String(client.id).padStart(4, "0")}
                          </span>
                        </div>
                      </div>

                      <div className="client-mobile-actions">
                        <button
                          type="button"
                          className="mobile-action edit"
                          onClick={() => openEditModal(client)}
                          aria-label="ویرایش مشتری"
                        >
                          ✎
                        </button>

                        <button
                          type="button"
                          className="mobile-action delete"
                          onClick={() => handleDelete(client)}
                          disabled={deletingId === client.id}
                          aria-label="حذف مشتری"
                        >
                          {deletingId === client.id ? (
                            <span className="mini-spinner" />
                          ) : (
                            "⌫"
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="client-mobile-info">
                      <div>
                        <span>شماره تماس</span>
                        <strong>{client.phone || "ثبت نشده"}</strong>
                      </div>

                      <div>
                        <span>توضیحات</span>
                        <strong>{client.notes || "بدون توضیحات"}</strong>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Modal */}
        {showModal && (
          <div
            className="clients-modal-overlay"
            onMouseDown={handleOverlayClick}
          >
            <form
              className="clients-modal"
              onSubmit={handleSubmit}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="clients-modal-header">
                <div>
                  <span className="modal-eyebrow">
                    {editingClient ? "ویرایش اطلاعات" : "مخاطب جدید"}
                  </span>

                  <h2>
                    {editingClient ? "ویرایش مشتری" : "افزودن مشتری جدید"}
                  </h2>

                  <p>
                    اطلاعات مشتری را وارد کنید تا در فاکتورها قابل استفاده باشد.
                  </p>
                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={closeModal}
                  disabled={saving}
                  aria-label="بستن"
                >
                  ×
                </button>
              </div>

              <div className="clients-modal-body">
                {formError && (
                  <div className="modal-error" role="alert">
                    <span>!</span>
                    <p>{formError}</p>
                  </div>
                )}

                <div className="client-form-field">
                  <label htmlFor="client-name">
                    نام و نام خانوادگی
                    <span>*</span>
                  </label>

                  <input
                    id="client-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="مثلاً محمد رضایی"
                    autoComplete="name"
                    disabled={saving}
                    autoFocus
                    required
                  />
                </div>

                <div className="client-form-field">
                  <label htmlFor="client-phone">
                    شماره تماس
                    <small>اختیاری</small>
                  </label>

                  <input
                    id="client-phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="مثلاً 0912 123 4567"
                    inputMode="tel"
                    autoComplete="tel"
                    disabled={saving}
                    dir="ltr"
                  />
                </div>

                <div className="client-form-field">
                  <label htmlFor="client-notes">
                    یادداشت
                    <small>اختیاری</small>
                  </label>

                  <textarea
                    id="client-notes"
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="مثلاً مشتری پروژه طراحی سایت..."
                    rows={4}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="clients-modal-footer">
                <button
                  type="button"
                  className="modal-secondary-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  className="primary-btn modal-save-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="button-spinner" />
                      در حال ذخیره...
                    </>
                  ) : (
                    <>{editingClient ? "ذخیره تغییرات" : "ذخیره مشتری"}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
}

function getInitials(name = "") {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (!words.length) return "?";

  if (words.length === 1) {
    return words[0].slice(0, 1);
  }

  return `${words[0].slice(0, 1)}${words[1].slice(0, 1)}`;
}
