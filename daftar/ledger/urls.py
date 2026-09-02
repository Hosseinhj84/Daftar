from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

router = DefaultRouter()
router.register("categories", views.CategoryViewSet, basename="category")
router.register("clients", views.ClientViewSet, basename="client")
router.register("invoices", views.InvoiceViewSet, basename="invoice")
router.register("transactions", views.TransActionViewSet, basename="transaction")

urlpatterns = [
    path("", include(router.urls)),
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("dashboard/summary/", views.dashboard_summary, name="dashboard_summary"),
    path("dashboard/report/" , views.dashboard_report, name="dashboard_report"),
    path("dashboard/trend/" , views.dashboard_trend , name="dashboard_trend"),
    path("invoices/<int:pk>/pdf/" , views.invoice_pdf, name="invoice_pdf"),
]
