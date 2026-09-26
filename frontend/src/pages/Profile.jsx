import { useEffect, useState } from "react";
import apiClient from "../api/client";
import Layout from "../components/Layout";

const INITIAL_FORM = {
  first_name: "",
  last_name: "",
  job_title: "",
};

const INITIAL_PASSWORD_FORM = {
  old_password: "",
  new_password: "",
  confirm_password: "",
};

export default function Profile() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [passwordForm, setPasswordForm] = useState(
    INITIAL_PASSWORD_FORM
  );
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/profile/");

      setForm({
        first_name: response.data.first_name || "",
        last_name: response.data.last_name || "",
        job_title: response.data.job_title || "",
      });

      setAvatarPreview(response.data.avatar || null);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "خطا در دریافت اطلاعات پروفایل."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("لطفاً یک فایل تصویری انتخاب کنید.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("حجم تصویر نباید بیشتر از ۵ مگابایت باشد.");
      return;
    }

    setError("");
    setAvatarFile(file);

    setAvatarPreview((oldPreview) => {
      if (oldPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(oldPreview);
      }

      return URL.createObjectURL(file);
    });
  }

  function handleFormChange(e) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handlePasswordChange(e) {
    const { name, value } = e.target;

    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (saving) return;

    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const formData = new FormData();

      formData.append("first_name", form.first_name.trim());
      formData.append("last_name", form.last_name.trim());
      formData.append("job_title", form.job_title.trim());

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const response = await apiClient.patch(
        "/profile/",
        formData
      );

      setForm({
        first_name: response.data.first_name || form.first_name,
        last_name: response.data.last_name || form.last_name,
        job_title: response.data.job_title || form.job_title,
      });

      if (response.data.avatar) {
        setAvatarPreview(response.data.avatar);
      }

      setAvatarFile(null);
      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "خطا در ذخیره پروفایل."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();

    if (passwordSaving) return;

    setPasswordError("");
    setPasswordMessage("");

    if (
      !passwordForm.old_password ||
      !passwordForm.new_password ||
      !passwordForm.confirm_password
    ) {
      setPasswordError("لطفاً تمام فیلدها را تکمیل کنید.");
      return;
    }

    if (
      passwordForm.new_password !==
      passwordForm.confirm_password
    ) {
      setPasswordError(
        "رمز جدید و تکرار آن یکسان نیستند."
      );
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setPasswordError(
        "رمز جدید باید حداقل ۸ کاراکتر باشد."
      );
      return;
    }

    if (
      passwordForm.old_password ===
      passwordForm.new_password
    ) {
      setPasswordError(
        "رمز جدید باید با رمز فعلی متفاوت باشد."
      );
      return;
    }

    try {
      setPasswordSaving(true);

      await apiClient.post(
        "/profile/change-password/",
        {
          old_password: passwordForm.old_password,
          new_password: passwordForm.new_password,
        }
      );

      setPasswordMessage(
        "رمز عبور با موفقیت تغییر کرد."
      );

      setPasswordForm(INITIAL_PASSWORD_FORM);
    } catch (err) {
      setPasswordError(
        err.response?.data?.detail ||
          "خطا در تغییر رمز عبور."
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  const fullName =
    `${form.first_name} ${form.last_name}`.trim();

  const avatarLetter =
    form.first_name?.trim()?.charAt(0) ||
    form.last_name?.trim()?.charAt(0) ||
    "؟";

  if (loading) {
    return (
      <Layout>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 300,
            color: "#64748b",
          }}
        >
          در حال بارگذاری پروفایل...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          paddingBottom: "2rem",
        }}
      >
        {/* Page Header */}
        <div
          style={{
            marginBottom: "1.5rem",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "1.65rem",
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            پروفایل شخصی
          </h1>

          <p
            style={{
              margin: "0.45rem 0 0",
              color: "#64748b",
              fontSize: "0.92rem",
            }}
          >
            اطلاعات شخصی و تنظیمات امنیت حساب خود را مدیریت کنید.
          </p>
        </div>

        {/* Profile Hero */}
        <div
          className="form-card"
          style={{
            maxWidth: "none",
            marginBottom: "1.25rem",
            padding: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 82,
              height: 82,
              borderRadius: "50%",
              background: "#e6f4f1",
              border: "3px solid #ccfbf1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="تصویر پروفایل"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span
                style={{
                  color: "#0f766e",
                  fontSize: "1.8rem",
                  fontWeight: 800,
                }}
              >
                {avatarLetter}
              </span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 180 }}>
            <h2
              style={{
                margin: 0,
                fontSize: "1.15rem",
                color: "#0f172a",
              }}
            >
              {fullName || "کاربر دفتر"}
            </h2>

            <p
              style={{
                margin: "0.35rem 0 0",
                color: "#64748b",
                fontSize: "0.88rem",
              }}
            >
              {form.job_title || "عنوان شغلی ثبت نشده است"}
            </p>
          </div>

          <label
            className="outline-btn"
            style={{
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            تغییر تصویر
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
            />
          </label>
        </div>

        {/* Personal Information */}
        <form
          onSubmit={handleSubmit}
          className="form-card"
          style={{
            maxWidth: "none",
            marginBottom: "1.25rem",
          }}
        >
          <div
            style={{
              marginBottom: "1.25rem",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "1.05rem",
                color: "#0f172a",
              }}
            >
              اطلاعات شخصی
            </h3>

            <p
              style={{
                margin: "0.35rem 0 0",
                color: "#64748b",
                fontSize: "0.85rem",
              }}
            >
              اطلاعات نمایش داده‌شده در حساب کاربری خود را ویرایش کنید.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            <div>
              <label>نام</label>
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleFormChange}
                placeholder="نام"
              />
            </div>

            <div>
              <label>نام‌خانوادگی</label>
              <input
                name="last_name"
                value={form.last_name}
                onChange={handleFormChange}
                placeholder="نام‌خانوادگی"
              />
            </div>

            <div
              style={{
                gridColumn: "1 / -1",
              }}
            >
              <label>عنوان شغلی</label>
              <input
                name="job_title"
                value={form.job_title}
                onChange={handleFormChange}
                placeholder="مثال: فروشنده، مدیر فروشگاه، فریلنسر"
              />
            </div>
          </div>

          {error && (
            <div
              className="error"
              style={{
                marginTop: "1rem",
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginTop: "1.5rem",
              flexWrap: "wrap",
            }}
          >
            <button
              type="submit"
              className="primary-btn"
              disabled={saving}
              style={{
                minWidth: 140,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </button>

            {saved && (
              <span
                style={{
                  color: "#16a34a",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                }}
              >
                تغییرات با موفقیت ذخیره شد ✓
              </span>
            )}
          </div>
        </form>

        {/* Security */}
        <form
          onSubmit={handlePasswordSubmit}
          className="form-card"
          style={{
            maxWidth: "none",
          }}
        >
          <div
            style={{
              marginBottom: "1.25rem",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "1.05rem",
                color: "#0f172a",
              }}
            >
              امنیت حساب
            </h3>

            <p
              style={{
                margin: "0.35rem 0 0",
                color: "#64748b",
                fontSize: "0.85rem",
              }}
            >
              برای حفظ امنیت حساب، رمز عبور خود را مدیریت کنید.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            <div>
              <label>رمز فعلی</label>
              <input
                type="password"
                name="old_password"
                value={passwordForm.old_password}
                onChange={handlePasswordChange}
                autoComplete="current-password"
                required
              />
            </div>

            <div>
              <label>رمز جدید</label>
              <input
                type="password"
                name="new_password"
                value={passwordForm.new_password}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <div>
              <label>تکرار رمز جدید</label>
              <input
                type="password"
                name="confirm_password"
                value={passwordForm.confirm_password}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
          </div>

          {passwordError && (
            <div
              className="error"
              style={{
                marginTop: "1rem",
              }}
            >
              {passwordError}
            </div>
          )}

          {passwordMessage && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.7rem 0.9rem",
                borderRadius: 10,
                background: "#f0fdf4",
                color: "#15803d",
                fontSize: "0.88rem",
                fontWeight: 600,
              }}
            >
              {passwordMessage}
            </div>
          )}

          <button
            type="submit"
            className="primary-btn"
            disabled={passwordSaving}
            style={{
              marginTop: "1.5rem",
              minWidth: 140,
              opacity: passwordSaving ? 0.7 : 1,
            }}
          >
            {passwordSaving
              ? "در حال تغییر..."
              : "تغییر رمز عبور"}
          </button>
        </form>
      </div>
    </Layout>
  );
}