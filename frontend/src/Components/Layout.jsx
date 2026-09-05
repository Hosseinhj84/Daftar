import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  ArrowLeftRight,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  WalletCards,
  ChevronDown,
} from "lucide-react";
import "../Styles/Layout.css";

import { useAuth } from "../context/AuthContext";

const navItems = [
  {
    to: "/dashboard",
    label: "داشبورد",
    icon: LayoutDashboard,
  },
  {
    to: "/invoices",
    label: "فاکتورها",
    icon: FileText,
  },
  {
    to: "/transactions",
    label: "تراکنش‌ها",
    icon: ArrowLeftRight,
  },
  {
    to: "/reports",
    label: "گزارش‌ها",
    icon: BarChart3,
  },
  {
    to: "/clients",
    label: "مشتریان",
    icon: Users,
  },
  {
    to: "/settings",
    label: "تنظیمات",
    icon: Settings,
  },
];

export default function Layout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${
          isSidebarOpen ? "sidebar-overlay--visible" : ""
        }`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`sidebar ${
          isSidebarOpen ? "sidebar--open" : ""
        }`}
      >
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">
              <WalletCards size={22} strokeWidth={2.2} />
            </div>

            <div className="brand-text">
              <span className="brand-name">دفتر درآمد</span>
              <span className="brand-description">
                مدیریت مالی فریلنسرها
              </span>
            </div>
          </div>

          {/* Mobile close */}
          <button
            type="button"
            className="sidebar-close"
            onClick={closeSidebar}
            aria-label="بستن منو"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" aria-label="منوی اصلی">
          <div className="nav-section">
            <span className="nav-section-title">منوی اصلی</span>

            <div className="nav-list">
              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? "nav-link--active" : ""}`
                    }
                  >
                    <span className="nav-link-icon">
                      <Icon size={20} strokeWidth={1.9} />
                    </span>

                    <span className="nav-link-label">
                      {item.label}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Sidebar bottom */}
        <div className="sidebar-bottom">
          {/* User profile */}
          <button
            type="button"
            className="sidebar-user"
            aria-label="پروفایل کاربر"
          >
            <div className="user-avatar">
              <span>ع</span>
              <span className="user-status" />
            </div>

            <div className="user-info">
              <span className="user-name">کاربر دفتر درآمد</span>
              <span className="user-role">فریلنسر</span>
            </div>

            <ChevronDown
              className="user-chevron"
              size={17}
              strokeWidth={1.8}
            />
          </button>

          {/* Logout */}
          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={19} strokeWidth={1.9} />
            <span>خروج از حساب</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="app-main">
        {/* Mobile header */}
        <header className="mobile-header">
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="باز کردن منو"
          >
            <Menu size={23} />
          </button>

          <div className="mobile-brand">
            <div className="mobile-brand-icon">
              <WalletCards size={19} strokeWidth={2.2} />
            </div>

            <span>دفتر درآمد</span>
          </div>

          <div className="mobile-user-avatar">ع</div>
        </header>

        {/* Page content */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}