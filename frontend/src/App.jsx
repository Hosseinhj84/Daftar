import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProductedRoute from "./Components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Clients from "./pages/Clients";
import InvoiceForm from "./pages/InvoiceForm";
import InvoiceList from "./pages/InvoiceList";
import Transactions from "./pages/Transactions";
import Dashboard from "./pages/Dashboard";
import Report from "./pages/Report";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProductedRoute>
                <Dashboard />
              </ProductedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProductedRoute>
                <Clients />
              </ProductedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProductedRoute>
                <Transactions />
              </ProductedRoute>
            }
          />
          <Route
            path="/invoices"
            element={
              <ProductedRoute>
                <InvoiceList />
              </ProductedRoute>
            }
          />
          <Route
            path="/invoices/new"
            element={
              <ProductedRoute>
                <InvoiceForm />
              </ProductedRoute>
            }
          />
          <Route
            path="/invoices/:id/edit"
            element={
              <ProductedRoute>
                <InvoiceForm />
              </ProductedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProductedRoute>
                <Report />
              </ProductedRoute>
            }
          />
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
