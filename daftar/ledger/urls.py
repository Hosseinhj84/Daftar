from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views
from .views import send_overdue_reminders_manual

router = DefaultRouter()
router.register("categories", views.CategoryViewSet, basename="category")
router.register("clients", views.ClientViewSet, basename="client")
router.register("invoices", views.InvoiceViewSet, basename="invoice")
router.register("transactions", views.TransActionViewSet, basename="transaction")

urlpatterns = [
    path("clients/import/", views.import_clients, name="import_clients"),
    path("clients/import-template/", views.clients_import_template, name="clients_import_template"),
    path("transactions/import/", views.import_transactions, name="import_transactions"),
    path("transactions/import-template/", views.transactions_import_template, name="transactions_import_template"),
    path("invoices/import/", views.import_invoices, name="import_invoices"),
    path("invoices/import-template/", views.invoices_import_template, name="invoices_import_template"),
    path("profile/", views.ProfileView.as_view(), name="profile"),
    path("profile/change-password/", views.change_password, name="change_password"),
    path("", include(router.urls)),
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("dashboard/summary/", views.dashboard_summary, name="dashboard_summary"),
    path("dashboard/report/" , views.dashboard_report, name="dashboard_report"),
    path("dashboard/trend/" , views.dashboard_trend , name="dashboard_trend"),
    path("invoices/<int:pk>/pdf/" , views.invoice_pdf, name="invoice_pdf"),
    path("settings/" , views.SettingsView.as_view() , name="settings"),
    path("send-overdue-reminders/", send_overdue_reminders_manual, name="send-overdue-reminders"),
]
