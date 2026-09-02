// import { useState, useEffect } from "react";
// import apiClient from "../api/client";
// import Layout from "../Components/Layout";

// export default function Transactions() {
//   const [transactions, setTransactions] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showModal, setShowModal] = useState(false);
//   const [showNewCategory, setShowNewCategory] = useState(false);
//   const [newCategoryName, setNewCategoryName] = useState("");
//   const [error, setError] = useState("");

//   const [form, setForm] = useState({
//     type: "income",
//     category: "",
//     amount: "",
//     date: new Date().toISOString().slice(0, 10),
//     description: "",
//   });

//   useEffect(() => {
//     loadTransactions();
//     loadCategories();
//   }, []);

//   async function loadTransactions() {
//     setLoading(true);
//     const response = await apiClient.get("/transactions/");
//     setTransactions(response.data);
//     setLoading(false);
//   }

//   async function loadCategories() {
//     const response = await apiClient.get("/categories/");
//     setCategories(response.data);
//   }

//   function openModal() {
//     setForm({
//       type: "income",
//       category: "",
//       amount: "",
//       date: new Date().toISOString().slice(0, 10),
//       description: "",
//     });
//     setShowNewCategory(false);
//     setError("");
//     setShowModal(true);
//   }

//   function switchType(type) {
//     // با تغییر نوع، دسته‌بندی انتخاب‌شده رو پاک می‌کنیم چون دسته‌ها بر اساس نوع فیلتر می‌شن
//     setForm({ ...form, type, category: "" });
//   }

//   async function handleAddCategory() {
//     if (!newCategoryName.trim()) return;
//     const response = await apiClient.post("/categories/", {
//       name: newCategoryName,
//       type: form.type,
//     });
//     await loadCategories();
//     setForm({ ...form, category: response.data.id });
//     setNewCategoryName("");
//     setShowNewCategory(false);
//   }

//   async function handleSubmit(e) {
//     e.preventDefault();
//     setError("");

//     if (!form.category) {
//       setError("لطفاً یک دسته‌بندی انتخاب کنید.");
//       return;
//     }

//     try {
//       await apiClient.post("/transactions/", form);
//       setShowModal(false);
//       loadTransactions();
//     } catch {
//       setError("خطا در ثبت تراکنش");
//     }
//   }

//   async function handleDelete(id) {
//     if (!confirm("مطمئنید می‌خواهید این تراکنش را حذف کنید؟")) return;
//     await apiClient.delete(`/transactions/${id}/`);
//     loadTransactions();
//   }

//   const filteredCategories = categories.filter((c) => c.type === form.type);

//   return (
//     <Layout>
//       <div className="page-header">
//         <h1>تراکنش‌ها</h1>
//         <button className="primary-btn" onClick={openModal}>
//           + ثبت تراکنش جدید
//         </button>
//       </div>

//       {loading ? (
//         <p>در حال بارگذاری...</p>
//       ) : transactions.length === 0 ? (
//         <p className="empty-state">هنوز تراکنشی ثبت نشده است.</p>
//       ) : (
//         <table className="data-table">
//           <thead>
//             <tr>
//               <th>تاریخ</th>
//               <th>عنوان / توضیح</th>
//               <th>دسته‌بندی</th>
//               <th>نوع</th>
//               <th>مبلغ (تومان)</th>
//               <th>عملیات</th>
//             </tr>
//           </thead>
//           <tbody>
//             {transactions.map((t) => (
//               <tr key={t.id}>
//                 <td>{t.date}</td>
//                 <td>{t.description || "—"}</td>
//                 <td>{t.category_name}</td>
//                 <td>{t.type === "income" ? "درآمد" : "هزینه"}</td>
//                 <td className={t.type === "income" ? "amount-positive" : "amount-negative"}>
//                   {t.type === "income" ? "+" : "-"}
//                   {Number(t.amount).toLocaleString("fa-IR")}
//                 </td>
//                 <td className="actions-cell">
//                   <button className="danger" onClick={() => handleDelete(t.id)}>
//                     حذف
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}

//       {showModal && (
//         <div className="modal-overlay" onClick={() => setShowModal(false)}>
//           <form
//             className="modal-card"
//             onClick={(e) => e.stopPropagation()}
//             onSubmit={handleSubmit}
//           >
//             <h2>ثبت تراکنش جدید</h2>

//             <div className="type-toggle">
//               <button
//                 type="button"
//                 className={form.type === "expense" ? "toggle-btn expense active" : "toggle-btn expense"}
//                 onClick={() => switchType("expense")}
//               >
//                 هزینه
//               </button>
//               <button
//                 type="button"
//                 className={form.type === "income" ? "toggle-btn income active" : "toggle-btn income"}
//                 onClick={() => switchType("income")}
//               >
//                 درآمد
//               </button>
//             </div>

//             <label>مبلغ (تومان)</label>
//             <input
//               type="number"
//               min="0"
//               value={form.amount}
//               onChange={(e) => setForm({ ...form, amount: e.target.value })}
//               required
//             />

//             <label>تاریخ</label>
//             <input
//               type="date"
//               value={form.date}
//               onChange={(e) => setForm({ ...form, date: e.target.value })}
//               required
//             />

//             <label>دسته‌بندی</label>
//             {!showNewCategory ? (
//               <>
//                 <select
//                   value={form.category}
//                   onChange={(e) => setForm({ ...form, category: e.target.value })}
//                 >
//                   <option value="">انتخاب کنید</option>
//                   {filteredCategories.map((c) => (
//                     <option key={c.id} value={c.id}>{c.name}</option>
//                   ))}
//                 </select>
//                 <button
//                   type="button"
//                   className="link-btn"
//                   onClick={() => setShowNewCategory(true)}
//                 >
//                   + افزودن دسته‌بندی جدید
//                 </button>
//               </>
//             ) : (
//               <div className="inline-add-row">
//                 <input
//                   value={newCategoryName}
//                   onChange={(e) => setNewCategoryName(e.target.value)}
//                   placeholder="نام دسته‌بندی جدید"
//                 />
//                 <button type="button" onClick={handleAddCategory}>افزودن</button>
//                 <button type="button" onClick={() => setShowNewCategory(false)}>لغو</button>
//               </div>
//             )}

//             <label>توضیحات (اختیاری)</label>
//             <textarea
//               value={form.description}
//               onChange={(e) => setForm({ ...form, description: e.target.value })}
//             />

//             {error && <p className="error">{error}</p>}

//             <div className="modal-actions">
//               <button type="button" onClick={() => setShowModal(false)}>
//                 انصراف
//               </button>
//               <button type="submit" className="primary-btn">
//                 ذخیره تراکنش
//               </button>
//             </div>
//           </form>
//         </div>
//       )}
//     </Layout>
//   );
// }

import { useEffect, useMemo, useState } from "react";
import apiClient from "../api/client";
import Layout from "../Components/Layout";
import "../Styles/Transactions.css";

const getToday = () => new Date().toISOString().slice(0, 10);

const initialForm = {
  type: "income",
  category: "",
  amount: "",
  date: getToday(),
  description: "",
};

const formatAmount = (amount) => Number(amount || 0).toLocaleString("fa-IR");

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [error, setError] = useState("");
  const [listError, setListError] = useState("");

  const [form, setForm] = useState(initialForm);

  const [filters, setFilters] = useState({
    type: "all",
    category: "all",
    from: "",
    to: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setListError("");

    try {
      const [transactionsRes, categoriesRes] = await Promise.all([
        apiClient.get("/transactions/"),
        apiClient.get("/categories/"),
      ]);

      setTransactions(transactionsRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      console.error(err);
      setListError("دریافت اطلاعات با خطا مواجه شد.");
    } finally {
      setLoading(false);
    }
  }

  function openModal() {
    setForm({
      ...initialForm,
      date: getToday(),
    });

    setNewCategoryName("");
    setShowNewCategory(false);
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setError("");
    setShowNewCategory(false);
  }

  function switchType(type) {
    setForm((prev) => ({
      ...prev,
      type,
      category: "",
    }));

    setError("");
  }

  function updateForm(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleAddCategory() {
    if (!newCategoryName.trim()) {
      setError("نام دسته‌بندی را وارد کنید.");
      return;
    }

    try {
      const response = await apiClient.post("/categories/", {
        name: newCategoryName.trim(),
        type: form.type,
      });

      setCategories((prev) => [...prev, response.data]);

      setForm((prev) => ({
        ...prev,
        category: response.data.id,
      }));

      setNewCategoryName("");
      setShowNewCategory(false);
      setError("");
    } catch (err) {
      console.error(err);
      setError("افزودن دسته‌بندی با خطا مواجه شد.");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.category) {
      setError("لطفاً یک دسته‌بندی انتخاب کنید.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError("مبلغ باید بیشتر از صفر باشد.");
      return;
    }

    if (!form.date) {
      setError("لطفاً تاریخ تراکنش را انتخاب کنید.");
      return;
    }

    setSaving(true);

    try {
      await apiClient.post("/transactions/", {
        ...form,
        amount: Number(form.amount),
      });

      setShowModal(false);
      setForm({
        ...initialForm,
        date: getToday(),
      });

      await loadData();
    } catch (err) {
      console.error(err);

      const backendError = err.response?.data;

      if (backendError) {
        setError(
          typeof backendError === "string"
            ? backendError
            : "اطلاعات واردشده معتبر نیست.",
        );
      } else {
        setError("خطا در ثبت تراکنش.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "مطمئنید می‌خواهید این تراکنش را حذف کنید؟",
    );

    if (!confirmed) return;

    setDeletingId(id);

    try {
      await apiClient.delete(`/transactions/${id}/`);
      setTransactions((prev) =>
        prev.filter((transaction) => transaction.id !== id),
      );
    } catch (err) {
      console.error(err);
      alert("حذف تراکنش با خطا مواجه شد.");
    } finally {
      setDeletingId(null);
    }
  }

  function updateFilter(field, value) {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function clearFilters() {
    setFilters({
      type: "all",
      category: "all",
      from: "",
      to: "",
    });
  }

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      if (filters.type === "all") return true;
      return category.type === filters.type;
    });
  }, [categories, filters.type]);

  const modalCategories = useMemo(() => {
    return categories.filter((category) => category.type === form.type);
  }, [categories, form.type]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (filters.type !== "all" && transaction.type !== filters.type) {
        return false;
      }

      if (
        filters.category !== "all" &&
        String(transaction.category) !== String(filters.category)
      ) {
        return false;
      }

      if (filters.from && transaction.date < filters.from) {
        return false;
      }

      if (filters.to && transaction.date > filters.to) {
        return false;
      }

      return true;
    });
  }, [transactions, filters]);

  const totalIncome = filteredTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const totalExpense = filteredTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const balance = totalIncome - totalExpense;

  return (
    <Layout>
      <div className="transactions-page">
        <header className="transactions-header page-header">
          <div>
            <span className="page-eyebrow">مدیریت مالی</span>
            <h1>تراکنش‌ها</h1>
            <p className="subtitle">
              درآمدها و هزینه‌های خود را مدیریت و پیگیری کنید.
            </p>
          </div>

          <button
            type="button"
            className="primary-btn transaction-add-btn"
            onClick={openModal}
          >
            <span className="btn-icon">+</span>
            ثبت تراکنش جدید
          </button>
        </header>

        <section className="transaction-overview">
          <div className="transaction-mini-card income-card">
            <div className="mini-card-icon">↗</div>
            <div>
              <span>درآمد فیلترشده</span>
              <strong>{formatAmount(totalIncome)} تومان</strong>
            </div>
          </div>

          <div className="transaction-mini-card expense-card">
            <div className="mini-card-icon">↘</div>
            <div>
              <span>هزینه فیلترشده</span>
              <strong>{formatAmount(totalExpense)} تومان</strong>
            </div>
          </div>

          <div className="transaction-mini-card balance-card">
            <div className="mini-card-icon">◉</div>
            <div>
              <span>مانده</span>
              <strong className={balance < 0 ? "negative" : ""}>
                {formatAmount(balance)} تومان
              </strong>
            </div>
          </div>
        </section>

        <section className="transaction-filter-card">
          <div className="filter-header">
            <div>
              <h2>فیلتر تراکنش‌ها</h2>
              <span>
                {filteredTransactions.length.toLocaleString("fa-IR")} تراکنش
              </span>
            </div>

            <button
              type="button"
              className="clear-filter-btn"
              onClick={clearFilters}
            >
              پاک کردن فیلترها
            </button>
          </div>

          <div className="transaction-filters">
            <div className="filter-field">
              <label>نوع تراکنش</label>
              <select
                value={filters.type}
                onChange={(e) => updateFilter("type", e.target.value)}
              >
                <option value="all">همه</option>
                <option value="income">درآمد</option>
                <option value="expense">هزینه</option>
              </select>
            </div>

            <div className="filter-field">
              <label>دسته‌بندی</label>
              <select
                value={filters.category}
                onChange={(e) => updateFilter("category", e.target.value)}
              >
                <option value="all">همه دسته‌بندی‌ها</option>

                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label>از تاریخ</label>
              <input
                type="date"
                value={filters.from}
                onChange={(e) => updateFilter("from", e.target.value)}
              />
            </div>

            <div className="filter-field">
              <label>تا تاریخ</label>
              <input
                type="date"
                value={filters.to}
                onChange={(e) => updateFilter("to", e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="transactions-table-card">
          <div className="table-heading">
            <div>
              <h2>لیست تراکنش‌ها</h2>
              <p>آخرین فعالیت‌های مالی شما</p>
            </div>
          </div>

          {listError ? (
            <div className="table-message error-message">
              <div className="message-icon">!</div>
              <strong>{listError}</strong>
              <button type="button" onClick={loadData}>
                تلاش مجدد
              </button>
            </div>
          ) : loading ? (
            <div className="table-message">
              <div className="loading-spinner" />
              <span>در حال دریافت تراکنش‌ها...</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="table-message empty-message">
              <div className="empty-icon">₮</div>
              <strong>تراکنشی پیدا نشد</strong>
              <span>هنوز تراکنشی مطابق فیلترهای انتخاب‌شده وجود ندارد.</span>

              <button type="button" className="outline-btn" onClick={openModal}>
                + ثبت اولین تراکنش
              </button>
            </div>
          ) : (
            <div className="transactions-table-wrapper">
              <table className="data-table transactions-table">
                <thead>
                  <tr>
                    <th>تاریخ</th>
                    <th>عنوان / توضیح</th>
                    <th>دسته‌بندی</th>
                    <th>نوع</th>
                    <th>مبلغ</th>
                    <th>عملیات</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.map((transaction) => {
                    const isIncome = transaction.type === "income";

                    return (
                      <tr key={transaction.id}>
                        <td>
                          <span className="transaction-date">
                            {transaction.date}
                          </span>
                        </td>

                        <td>
                          <div className="transaction-title">
                            <div
                              className={`transaction-type-icon ${
                                isIncome ? "income" : "expense"
                              }`}
                            >
                              {isIncome ? "↗" : "↘"}
                            </div>

                            <span>
                              {transaction.description || "بدون توضیحات"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`category-badge ${
                              isIncome ? "income" : "expense"
                            }`}
                          >
                            {transaction.category_name || "بدون دسته‌بندی"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`transaction-type-label ${
                              isIncome ? "income" : "expense"
                            }`}
                          >
                            <span className="type-dot" />
                            {isIncome ? "درآمد" : "هزینه"}
                          </span>
                        </td>

                        <td>
                          <strong
                            className={`transaction-amount ${
                              isIncome ? "positive" : "negative"
                            }`}
                          >
                            {isIncome ? "+" : "-"}
                            {formatAmount(transaction.amount)}
                            <small> تومان</small>
                          </strong>
                        </td>

                        <td className="actions-cell">
                          <button
                            type="button"
                            className="table-delete-btn"
                            onClick={() => handleDelete(transaction.id)}
                            disabled={deletingId === transaction.id}
                          >
                            {deletingId === transaction.id ? "..." : "حذف"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {showModal && (
          <div className="transaction-modal-overlay" onMouseDown={closeModal}>
            <form
              className="transaction-modal"
              onSubmit={handleSubmit}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <span className="modal-eyebrow">مدیریت مالی</span>
                  <h2>ثبت تراکنش جدید</h2>
                  <p>اطلاعات تراکنش را وارد کنید تا در حساب شما ثبت شود.</p>
                </div>

                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={closeModal}
                  disabled={saving}
                  aria-label="بستن"
                >
                  ×
                </button>
              </div>

              <div className="type-toggle">
                <button
                  type="button"
                  className={
                    form.type === "income"
                      ? "toggle-btn income active"
                      : "toggle-btn income"
                  }
                  onClick={() => switchType("income")}
                >
                  <span>↗</span>
                  درآمد
                </button>

                <button
                  type="button"
                  className={
                    form.type === "expense"
                      ? "toggle-btn expense active"
                      : "toggle-btn expense"
                  }
                  onClick={() => switchType("expense")}
                >
                  <span>↘</span>
                  هزینه
                </button>
              </div>

              <div className="modal-form-grid">
                <div className="modal-field full">
                  <label htmlFor="transaction-amount">
                    مبلغ <span>*</span>
                  </label>

                  <div className="amount-input-wrapper">
                    <input
                      id="transaction-amount"
                      type="number"
                      min="1"
                      inputMode="numeric"
                      placeholder="مثلاً ۱۵,۰۰۰,۰۰۰"
                      value={form.amount}
                      onChange={(e) => updateForm("amount", e.target.value)}
                      required
                    />

                    <span>تومان</span>
                  </div>
                </div>

                <div className="modal-field">
                  <label htmlFor="transaction-date">
                    تاریخ <span>*</span>
                  </label>

                  <input
                    id="transaction-date"
                    type="date"
                    value={form.date}
                    onChange={(e) => updateForm("date", e.target.value)}
                    required
                  />
                </div>

                <div className="modal-field">
                  <label htmlFor="transaction-category">
                    دسته‌بندی <span>*</span>
                  </label>

                  {!showNewCategory ? (
                    <select
                      id="transaction-category"
                      value={form.category}
                      onChange={(e) => updateForm("category", e.target.value)}
                    >
                      <option value="">انتخاب دسته‌بندی</option>

                      {modalCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      autoFocus
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="مثلاً تجهیزات"
                    />
                  )}

                  {!showNewCategory ? (
                    <button
                      type="button"
                      className="add-category-link"
                      onClick={() => {
                        setShowNewCategory(true);
                        setError("");
                      }}
                    >
                      + افزودن دسته‌بندی جدید
                    </button>
                  ) : (
                    <div className="new-category-actions">
                      <button
                        type="button"
                        className="small-primary-btn"
                        onClick={handleAddCategory}
                      >
                        افزودن
                      </button>

                      <button
                        type="button"
                        className="small-cancel-btn"
                        onClick={() => {
                          setShowNewCategory(false);
                          setNewCategoryName("");
                        }}
                      >
                        لغو
                      </button>
                    </div>
                  )}
                </div>

                <div className="modal-field full">
                  <label htmlFor="transaction-description">توضیحات</label>

                  <textarea
                    id="transaction-description"
                    rows="4"
                    placeholder="توضیح کوتاهی درباره این تراکنش..."
                    value={form.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="transaction-form-error">
                  <span>!</span>
                  {error}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  className="primary-btn modal-submit-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="button-spinner" />
                      در حال ذخیره...
                    </>
                  ) : (
                    "ذخیره تراکنش"
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
