// import { useState, useEffect } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import apiClient from "../api/client";
// import Layout from "../Components/Layout";

// const emptyItem = {
//   item_type: "service",
//   title: "",
//   quantity: 1,
//   unit_price: 0,
// };

// export default function InvoiceForm() {
//   const navigate = useNavigate();
//   const { id } = useParams();
//   const isEdditing = !!id;

//   const [clients, setClients] = useState([]);
//   const [clientId, setClientId] = useState("");
//   const [invoiceNumber, setInvoiceNumber] = useState("");
//   const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
//   const [status, setStatus] = useState("pending");
//   const [discountPercent, setDiscountPercent] = useState(0);
//   const [error, setError] = useState("");
//   const [note, setNote] = useState("");
//   const [items, setItems] = useState([{ ...emptyItem }]);
//   const [saving, setSaving] = useState(false);

//   useEffect(() => {
//     loadClients();
//     if (isEdditing) loadInvoice();
//   }, []);

//   async function loadClients() {
//     const response = await apiClient.get("/clients/");
//     setClients(response.data);
//   }

//   async function loadInvoice() {
//     const response = await apiClient.get(`/invoices/${id}`);
//     const invoice = response.data;
//     setClientId(invoice.client);
//     setInvoiceNumber(invoice.invoice_number);
//     setDate(invoice.date);
//     setStatus(invoice.status);
//     setDiscountPercent(invoice.discount_percent);
//     setNote(invoice.note);
//     setItems(
//       invoice.items.map(({ item_type, title, quantity, unit_price }) => ({
//         item_type,
//         title,
//         quantity,
//         unit_price,
//       })),
//     );
//   }

//   function updateItem(index, field, value) {
//     const newItems = [...items];
//     newItems[index] = { ...newItems[index], [field]: value };
//     setItems(newItems);
//   }

//   function addItem() {
//     setItems([...items, { ...emptyItem }]);
//   }

//   function removeItem(index) {
//     setItems(items.filter((_, i) => i !== index));
//   }

//   const subtotal = items.reduce(
//     (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
//     0,
//   );
//   const discountAmount = subtotal * (Number(discountPercent) / 100);
//   const totalAmount = subtotal - discountAmount;

//   async function handleSubmit(e) {
//     e.preventDefault();
//     setError("");

//     if (!clientId) {
//       setError("لطفاً یک مشتری انتخاب کنید.");
//       return;
//     }
//     if (items.some((item) => !item.title || item.unit_price <= 0)) {
//       setError("همه‌ی ردیف‌ها باید عنوان و قیمت معتبر داشته باشند.");
//       return;
//     }

//     setSaving(true);
//     const payload = {
//       client: clientId,
//       invoice_number: invoiceNumber,
//       date,
//       status,
//       discount_percent: discountPercent,
//       note,
//       items,
//     };

//     try {
//       if (isEdditing) {
//         await apiClient.put(`/invoices/${id}/`, payload);
//       } else {
//         await apiClient.post("/invoices/", payload);
//       }
//       navigate("/invoices");
//     } catch (err) {
//         console.error(err);
//       const data = err.response?.data;
//       setError(data ? JSON.stringify(data) : "خطا در ذخیره‌ی فاکتور");
//     } finally {
//       setSaving(false);
//     }
//   }

//   return (
//     <Layout>
//       <div className="page-header">
//         <h1>{isEdditing ? "ویرایش فاکتور" : "فاکتور جدید"}</h1>
//       </div>

//       <form onSubmit={handleSubmit} className="invoice-form">
//         <section className="form-card">
//           <h3>۱. اطلاعات کلی فاکتور</h3>
//           <div className="form-row">
//             <div>
//               <label>مشتری</label>
//               <select
//                 value={clientId}
//                 onChange={(e) => setClientId(e.target.value)}
//                 required
//               >
//                 <option value="">انتخاب کنید</option>
//                 {clients.map((c) => (
//                   <option key={c.id} value={c.id}>
//                     {c.name}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div>
//               <label>شماره فاکتور</label>
//               <input
//                 value={invoiceNumber}
//                 onChange={(e) => setInvoiceNumber(e.target.value)}
//                 required
//               />
//             </div>
//             <div>
//               <label>تاریخ</label>
//               <input
//                 type="date"
//                 value={date}
//                 onChange={(e) => setDate(e.target.value)}
//                 required
//               />
//             </div>
//             <div>
//               <label>وضعیت</label>
//               <select
//                 value={status}
//                 onChange={(e) => setStatus(e.target.value)}
//               >
//                 <option value="pending">معوق</option>
//                 <option value="paid">پرداخت‌شده</option>
//               </select>
//             </div>
//           </div>
//         </section>

//         <section className="form-card">
//           <h3>۲. ردیف‌های فاکتور</h3>
//           <table className="items-table">
//             <thead>
//               <tr>
//                 <th>نوع</th>
//                 <th>عنوان</th>
//                 <th>تعداد</th>
//                 <th>قیمت واحد (تومان)</th>
//                 <th>جمع ردیف</th>
//                 <th></th>
//               </tr>
//             </thead>
//             <tbody>
//               {items.map((item, index) => (
//                 <tr key={index}>
//                   <td>
//                     <select
//                       value={item.item_type}
//                       onChange={(e) =>
//                         updateItem(index, "item_type", e.target.value)
//                       }
//                     >
//                       <option value="service">خدمت</option>
//                       <option value="product">کالا</option>
//                     </select>
//                   </td>
//                   <td>
//                     <input
//                       value={item.title}
//                       onChange={(e) =>
//                         updateItem(index, "title", e.target.value)
//                       }
//                       placeholder="عنوان کالا/خدمت"
//                     />
//                   </td>
//                   <td>
//                     <input
//                       type="number"
//                       min="1"
//                       value={item.quantity}
//                       onChange={(e) =>
//                         updateItem(index, "quantity", e.target.value)
//                       }
//                     />
//                   </td>
//                   <td>
//                     <input
//                       type="number"
//                       min="0"
//                       value={item.unit_price}
//                       onChange={(e) =>
//                         updateItem(index, "unit_price", e.target.value)
//                       }
//                     />
//                   </td>
//                   <td>
//                     {(
//                       Number(item.quantity) * Number(item.unit_price)
//                     ).toLocaleString("fa-IR")}
//                   </td>
//                   <td>
//                     <button
//                       type="button"
//                       className="danger"
//                       onClick={() => removeItem(index)}
//                       disabled={items.length === 1}
//                     >
//                       حذف
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//           <button type="button" className="outline-btn" onClick={addItem}>
//             + افزودن ردیف جدید
//           </button>
//         </section>

//         <div className="form-bottom">
//           <section className="form-card summary-card">
//             <h3>۳. خلاصه مبلغ</h3>
//             <div className="summary-row">
//               <span>{subtotal.toLocaleString("fa-IR")} تومان</span>
//               <span>جمع جزء</span>
//             </div>
//             <div className="summary-row">
//               <input
//                 type="number"
//                 min="0"
//                 max="100"
//                 value={discountPercent}
//                 onChange={(e) => setDiscountPercent(e.target.value)}
//                 style={{ width: "70px" }}
//               />
//               <span>تخفیف (%)</span>
//             </div>
//             <div className="summary-row total">
//               <span>{totalAmount.toLocaleString("fa-IR")} تومان</span>
//               <span>مبلغ نهایی</span>
//             </div>
//           </section>

//           <section className="form-card">
//             <h3>۴. یادداشت فاکتور</h3>
//             <textarea
//               value={note}
//               onChange={(e) => setNote(e.target.value)}
//               rows={5}
//             />
//           </section>
//         </div>

//         {error && <p className="error">{error}</p>}

//         <div className="modal-actions">
//           <button type="button" onClick={() => navigate("/invoices")}>
//             انصراف
//           </button>
//           <button type="submit" className="primary-btn" disabled={saving}>
//             {saving ? "در حال ذخیره..." : "ذخیره فاکتور"}
//           </button>
//         </div>
//       </form>
//     </Layout>
//   );
// }

import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../api/client";
import Layout from "../Components/Layout";
import "../Styles/InvoiceForm.css";

const emptyItem = {
  item_type: "service",
  title: "",
  quantity: 1,
  unit_price: 0,
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString("fa-IR");
}

function formatDateForDisplay(date) {
  if (!date) return "";

  const parts = date.split("-");

  if (parts.length !== 3) return date;

  return `${formatNumber(parts[2])}/${formatNumber(parts[1])}/${formatNumber(parts[0])}`;
}

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEditing = Boolean(id);

  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState("pending");

  const [discountPercent, setDiscountPercent] = useState(0);
  const [note, setNote] = useState("");
  const [items, setItems] = useState([{ ...emptyItem }]);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const clientDropdownRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        clientDropdownRef.current &&
        !clientDropdownRef.current.contains(event.target)
      ) {
        setClientDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const clientsResponse = await apiClient.get("/clients/");
      setClients(clientsResponse.data);

      if (isEditing) {
        const invoiceResponse = await apiClient.get(`/invoices/${id}/`);
        const invoice = invoiceResponse.data;

        setClientId(invoice.client);
        setInvoiceNumber(invoice.invoice_number || "");
        setDate(invoice.date || "");
        setStatus(invoice.status || "pending");
        setDiscountPercent(invoice.discount_percent || 0);
        setNote(invoice.note || "");

        setItems(
          invoice.items?.length
            ? invoice.items.map(
                ({ item_type, title, quantity, unit_price }) => ({
                  item_type: item_type || "service",
                  title: title || "",
                  quantity: quantity || 1,
                  unit_price: unit_price || 0,
                }),
              )
            : [{ ...emptyItem }],
        );

        const selectedClient = clientsResponse.data.find(
          (client) => String(client.id) === String(invoice.client),
        );

        if (selectedClient) {
          setClientSearch(selectedClient.name);
        }
      } else {
        if (!invoiceNumber) {
          setInvoiceNumber("INV-1024");
        }
      }
    } catch (err) {
      console.error(err);
      setError("اطلاعات فاکتور دریافت نشد. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }

  function updateItem(index, field, value) {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  function addItem() {
    setItems((currentItems) => [
      ...currentItems,
      {
        ...emptyItem,
      },
    ]);
  }

  function removeItem(index) {
    if (items.length === 1) return;

    setItems((currentItems) =>
      currentItems.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  function selectClient(client) {
    setClientId(client.id);
    setClientSearch(client.name);
    setClientDropdownOpen(false);
  }

  const filteredClients = useMemo(() => {
    const search = clientSearch.trim().toLowerCase();

    if (!search) {
      return clients;
    }

    return clients.filter((client) =>
      client.name?.toLowerCase().includes(search),
    );
  }, [clients, clientSearch]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;

      return sum + quantity * unitPrice;
    }, 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    const discount = Math.min(Math.max(Number(discountPercent) || 0, 0), 100);

    return subtotal * (discount / 100);
  }, [subtotal, discountPercent]);

  const totalAmount = Math.max(subtotal - discountAmount, 0);

  function getApiErrorMessage(err) {
    const data = err?.response?.data;

    if (!data) {
      return "خطا در ذخیره‌ی فاکتور. لطفاً دوباره تلاش کنید.";
    }

    if (typeof data === "string") {
      return data;
    }

    if (data.detail) {
      return data.detail;
    }

    const messages = [];

    Object.entries(data).forEach(([field, value]) => {
      if (Array.isArray(value)) {
        messages.push(`${field}: ${value.join("، ")}`);
      } else if (typeof value === "string") {
        messages.push(`${field}: ${value}`);
      }
    });

    return messages.length
      ? messages.join(" | ")
      : "اطلاعات واردشده معتبر نیست.";
  }

  function validateForm() {
    if (!clientId) {
      return "لطفاً مشتری فاکتور را انتخاب کنید.";
    }

    if (!invoiceNumber.trim()) {
      return "شماره فاکتور را وارد کنید.";
    }

    if (!date) {
      return "تاریخ فاکتور را انتخاب کنید.";
    }

    if (!items.length) {
      return "حداقل یک ردیف برای فاکتور اضافه کنید.";
    }

    const invalidItem = items.find(
      (item) =>
        !item.title.trim() ||
        Number(item.quantity) <= 0 ||
        Number(item.unit_price) <= 0,
    );

    if (invalidItem) {
      return "عنوان، تعداد و قیمت تمام ردیف‌های فاکتور باید معتبر باشند.";
    }

    if (Number(discountPercent) < 0 || Number(discountPercent) > 100) {
      return "درصد تخفیف باید بین ۰ تا ۱۰۰ باشد.";
    }

    return "";
  }

  async function handleSubmit(event, downloadPdf = false) {
    event.preventDefault();

    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    setSaving(true);

    const payload = {
      client: clientId,
      invoice_number: invoiceNumber.trim(),
      date,
      status,
      discount_percent: Number(discountPercent) || 0,
      note: note.trim(),
      items: items.map((item) => ({
        item_type: item.item_type,
        title: item.title.trim(),
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
      })),
    };

    try {
      let response;

      if (isEditing) {
        response = await apiClient.put(`/invoices/${id}/`, payload);
      } else {
        response = await apiClient.post("/invoices/", payload);
      }

      const savedInvoice = response.data;
      const invoiceId = savedInvoice?.id || id;

      if (downloadPdf && invoiceId) {
        await downloadPdfFile(invoiceId, savedInvoice);
      }

      navigate("/invoices");
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err));

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setSaving(false);
    }
  }

  async function downloadPdfFile(invoiceId, invoiceData = {}) {
    const response = await apiClient.get(`/invoices/${invoiceId}/pdf/`, {
      responseType: "blob",
    });

    const blob = new Blob([response.data], {
      type: "application/pdf",
    });

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `${invoiceData.invoice_number || invoiceNumber}.pdf`;

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <Layout>
        <div className="invoice-page">
          <div className="invoice-loading">
            <div className="loading-spinner"></div>
            <span>در حال دریافت اطلاعات فاکتور...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="invoice-page">
        <div className="invoice-header">
          <div>
            <div className="breadcrumb">
              <button type="button" onClick={() => navigate("/invoices")}>
                فاکتورها
              </button>

              <span>/</span>

              <span>{isEditing ? "ویرایش فاکتور" : "فاکتور جدید"}</span>
            </div>

            <h1>{isEditing ? "ویرایش فاکتور" : "فاکتور جدید"}</h1>

            <p>
              {isEditing
                ? "اطلاعات فاکتور را بررسی و ویرایش کنید."
                : "یک فاکتور جدید برای مشتری خود ایجاد کنید."}
            </p>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate("/invoices")}
              disabled={saving}
            >
              انصراف
            </button>

            <button
              type="button"
              className="primary-btn"
              disabled={saving}
              onClick={(event) => handleSubmit(event, false)}
            >
              {saving ? (
                <>
                  <span className="button-spinner"></span>
                  در حال ذخیره...
                </>
              ) : (
                <>
                  <span className="button-icon">✓</span>
                  ذخیره فاکتور
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="invoice-alert" role="alert">
            <div className="alert-icon">!</div>

            <div className="alert-content">
              <strong>خطا در ثبت اطلاعات</strong>
              <span>{error}</span>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="بستن پیام خطا"
            >
              ×
            </button>
          </div>
        )}

        <form
          onSubmit={(event) => handleSubmit(event, false)}
          className="invoice-form"
        >
          {/* اطلاعات کلی */}
          <section className="invoice-section">
            <div className="section-heading">
              <div className="section-number">۱</div>

              <div>
                <h2>اطلاعات کلی فاکتور</h2>
                <p>اطلاعات اصلی فاکتور را وارد کنید.</p>
              </div>
            </div>

            <div className="invoice-fields-grid">
              <div className="form-field client-field" ref={clientDropdownRef}>
                <label htmlFor="client-search">
                  مشتری
                  <span>*</span>
                </label>

                <div className="client-search-wrapper">
                  <input
                    id="client-search"
                    type="text"
                    value={clientSearch}
                    placeholder="جست‌وجوی نام مشتری..."
                    onFocus={() => setClientDropdownOpen(true)}
                    onChange={(event) => {
                      setClientSearch(event.target.value);
                      setClientId("");
                      setClientDropdownOpen(true);
                    }}
                    autoComplete="off"
                  />

                  <span className="field-icon">⌄</span>

                  {clientDropdownOpen && (
                    <div className="client-dropdown">
                      {filteredClients.length > 0 ? (
                        <>
                          {filteredClients.map((client) => (
                            <button
                              type="button"
                              className="client-option"
                              key={client.id}
                              onClick={() => selectClient(client)}
                            >
                              <span className="client-avatar">
                                {client.name?.charAt(0) || "م"}
                              </span>

                              <span className="client-option-info">
                                <strong>{client.name}</strong>

                                {client.email && <small>{client.email}</small>}
                              </span>

                              {String(client.id) === String(clientId) && (
                                <span className="selected-check">✓</span>
                              )}
                            </button>
                          ))}
                        </>
                      ) : (
                        <div className="client-empty">
                          <span>مشتری‌ای پیدا نشد.</span>
                        </div>
                      )}

                      <button
                        type="button"
                        className="add-client-option"
                        onClick={() => navigate("/clients")}
                      >
                        <span>+</span>
                        افزودن مشتری جدید
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="invoice-number">
                  شماره فاکتور
                  <span>*</span>
                </label>

                <input
                  id="invoice-number"
                  type="text"
                  value={invoiceNumber}
                  onChange={(event) => setInvoiceNumber(event.target.value)}
                  placeholder="INV-1024"
                  required
                />

                <small className="field-hint">
                  شماره یکتا برای پیگیری فاکتور
                </small>
              </div>

              <div className="form-field">
                <label htmlFor="invoice-date">
                  تاریخ فاکتور
                  <span>*</span>
                </label>

                <div className="date-input-wrapper">
                  <input
                    id="invoice-date"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    required
                  />
                </div>

                {date && (
                  <small className="field-hint">
                    {formatDateForDisplay(date)}
                  </small>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="invoice-status">وضعیت</label>

                <div className="status-select-wrapper">
                  <span
                    className={`status-dot ${
                      status === "paid"
                        ? "status-dot-paid"
                        : "status-dot-pending"
                    }`}
                  ></span>

                  <select
                    id="invoice-status"
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                  >
                    <option value="pending">معوق</option>
                    <option value="paid">پرداخت‌شده</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* ردیف ها */}
          <section className="invoice-section">
            <div className="section-heading section-heading-with-action">
              <div className="section-heading-main">
                <div className="section-number">۲</div>

                <div>
                  <h2>ردیف‌های فاکتور</h2>
                  <p>خدمات یا کالاهای ارائه‌شده را به فاکتور اضافه کنید.</p>
                </div>
              </div>

              <span className="items-count">
                {formatNumber(items.length)} ردیف
              </span>
            </div>

            <div className="invoice-table-wrapper">
              <table className="invoice-items-table">
                <thead>
                  <tr>
                    <th className="type-column">نوع</th>
                    <th className="title-column">عنوان</th>
                    <th className="quantity-column">تعداد</th>
                    <th className="price-column">
                      قیمت واحد
                      <small>تومان</small>
                    </th>
                    <th className="total-column">
                      جمع ردیف
                      <small>تومان</small>
                    </th>
                    <th className="remove-column"></th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item, index) => {
                    const rowTotal =
                      Number(item.quantity || 0) * Number(item.unit_price || 0);

                    return (
                      <tr key={index}>
                        <td>
                          <select
                            value={item.item_type}
                            onChange={(event) =>
                              updateItem(index, "item_type", event.target.value)
                            }
                            className="item-type-select"
                          >
                            <option value="service">خدمت</option>
                            <option value="product">کالا</option>
                          </select>
                        </td>

                        <td>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(event) =>
                              updateItem(index, "title", event.target.value)
                            }
                            placeholder="مثلاً طراحی رابط کاربری"
                          />
                        </td>

                        <td>
                          <input
                            className="number-input"
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(event) =>
                              updateItem(index, "quantity", event.target.value)
                            }
                          />
                        </td>

                        <td>
                          <input
                            className="number-input price-input"
                            type="number"
                            min="0"
                            step="1000"
                            value={item.unit_price}
                            onChange={(event) =>
                              updateItem(
                                index,
                                "unit_price",
                                event.target.value,
                              )
                            }
                          />
                        </td>

                        <td>
                          <div className="row-total">
                            {formatNumber(rowTotal)}
                          </div>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="remove-item-btn"
                            onClick={() => removeItem(index)}
                            disabled={items.length === 1}
                            aria-label="حذف ردیف"
                            title="حذف ردیف"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button type="button" className="add-row-btn" onClick={addItem}>
              <span>+</span>
              افزودن ردیف جدید
            </button>
          </section>

          {/* خلاصه + یادداشت */}
          <div className="invoice-bottom-grid">
            <section className="invoice-section summary-section">
              <div className="section-heading">
                <div className="section-number">۳</div>

                <div>
                  <h2>خلاصه مبلغ</h2>
                  <p>مبلغ نهایی فاکتور را بررسی کنید.</p>
                </div>
              </div>

              <div className="summary-content">
                <div className="summary-row">
                  <span>جمع جزء</span>

                  <strong>
                    {formatNumber(subtotal)}
                    <small> تومان</small>
                  </strong>
                </div>

                <div className="summary-row discount-row">
                  <div className="discount-label">
                    <span>تخفیف</span>
                    <small>اختیاری</small>
                  </div>

                  <div className="discount-input">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={discountPercent}
                      onChange={(event) =>
                        setDiscountPercent(event.target.value)
                      }
                    />

                    <span>%</span>
                  </div>
                </div>

                {discountAmount > 0 && (
                  <div className="summary-row discount-result">
                    <span>مبلغ تخفیف</span>

                    <strong>
                      - {formatNumber(discountAmount)}
                      <small> تومان</small>
                    </strong>
                  </div>
                )}

                <div className="summary-divider"></div>

                <div className="final-total">
                  <div>
                    <span>مبلغ نهایی قابل پرداخت</span>
                    <small>پس از اعمال تخفیف</small>
                  </div>

                  <strong>
                    {formatNumber(totalAmount)}
                    <small> تومان</small>
                  </strong>
                </div>
              </div>
            </section>

            <section className="invoice-section note-section">
              <div className="section-heading">
                <div className="section-number">۴</div>

                <div>
                  <h2>یادداشت فاکتور</h2>
                  <p>توضیحات یا شرایط پرداخت را اضافه کنید.</p>
                </div>
              </div>

              <div className="form-field">
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="مثلاً مبلغ فاکتور حداکثر تا ۷ روز پس از دریافت قابل پرداخت است."
                  rows={7}
                />
              </div>
            </section>
          </div>

          {/* Action Bar */}
          <div className="invoice-action-bar">
            <div className="action-bar-info">
              <span className="action-bar-icon">✓</span>

              <div>
                <strong>فاکتور آماده ذخیره است</strong>
                <span>پس از ذخیره می‌توانید نسخه PDF آن را دریافت کنید.</span>
              </div>
            </div>

            <div className="action-buttons">
              <button
                type="button"
                className="secondary-btn large-btn"
                onClick={() => navigate("/invoices")}
                disabled={saving}
              >
                انصراف
              </button>

              <button
                type="submit"
                className="primary-btn large-btn"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="button-spinner"></span>
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <span>↓</span>
                    ذخیره و دریافت PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
