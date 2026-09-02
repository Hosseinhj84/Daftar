import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setError("ایمیل یا رمز عبور اشتباه است.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>دفتر درآمد</h2>
        <p className="subtitle">مدیریت مالی فریلنسرها</p>

        <h1>ورود به حساب کاربری</h1>
        <p className="hint">لطفاً اطلاعات خود را وارد کنید</p>

        <label>ایمیل</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          required
        />

        <label>رمز عبور</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "در حال ورود..." : "ورود"}
        </button>

        <p className="switch-link">
          حساب کاربری ندارید؟ <Link to="/signup">ثبت‌نام کنید</Link>
        </p>
      </form>
    </div>
  );
}
