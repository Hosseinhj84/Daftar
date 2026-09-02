from django.shortcuts import render
from rest_framework import viewsets, generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Sum, Q
from .models import Category, Client, Invoice, Transation
from .serializers import (
    CategorySerializer, ClientSerializer, InvoiceSerializer,
    TransactionSerializer, RegisterSerializer,
)
from django.db.models.functions import TruncMonth
from datetime import date
from dateutil.relativedelta import relativedelta
from pathlib import Path
from django.conf import settings
from django.http import HttpResponse
from django.template.loader import render_to_string
from weasyprint import HTML


# Create your views here.

class RegisterView(generics.CreateAPIView):
    queryset = None
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class UserScopedModelViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return self.queryset.model.objects.filter(user=self.request.user)
    
    def perform_create(self , serializer):
        serializer.save(user=self.request.user)

class CategoryViewSet(UserScopedModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class ClientViewSet(UserScopedModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer

class InvoiceViewSet(UserScopedModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        return context

class TransActionViewSet(UserScopedModelViewSet):
    queryset = Transation.objects.all()
    serializer_class = TransactionSerializer

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def dashboard_summary(request):
    user = request.user
    transactions = Transation.objects.filter(user=user)
    
    income = transactions.filter(type="income").aggregate(total=Sum("amount"))["total"] or 0
    expense = transactions.filter(type="expense").aggregate(total=Sum("amount"))["total"] or 0
    pending_invoices = Invoice.objects.filter(user=user , status="pending").count()
    
    return Response({
        "total_income" : income,
        "total_expense" : expense,
        "net_profit" : income - expense,
        "pending_invoice_count" : pending_invoices
    })

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def dashboard_trend(request):
    """
    روند درآمد و هزینه در ۶ ماه اخیر، برای نمودار داشبورد.
    """
    user = request.user
    six_months_ago = date.today().replace(day=1) - relativedelta(months=5)

    transactions = (
        Transation.objects.filter(user=user, date__gte=six_months_ago)
        .annotate(month=TruncMonth("date"))
        .values("month", "type")
        .annotate(total=Sum("amount"))
        .order_by("month")
    )

    # ساخت دیکشنری {ماه: {income: x, expense: y}} برای همه‌ی ۶ ماه، حتی اگه دیتا نداشته باشن
    result = {}
    for i in range(6):
        month_date = six_months_ago + relativedelta(months=i)
        key = month_date.strftime("%Y-%m")
        result[key] = {"month": key, "income": 0, "expense": 0}

    for row in transactions:
        key = row["month"].strftime("%Y-%m")
        if key in result:
            result[key][row["type"]] = float(row["total"])

    return Response(list(result.values()))

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def invoice_pdf(request , pk):
    invoice = Invoice.objects.filter(user=request.user , pk=pk).first()
    if invoice is None:
        return Response({"detail" : "فاکتور یافت نشد"} , status=404)
    
    fonts_dir = Path(__file__).resolve().parent / "static" / "fonts"
    html_string = render_to_string("invoice_pdf.html", {
        "invoice" : invoice,
        "font_regular_path": (fonts_dir / "vazirmatn-arabic-400-normal.ttf").as_uri(),
        "font_bold_path": (fonts_dir / "vazirmatn-arabic-700-normal.ttf").as_uri(),
    })
    pdf_bytes = HTML(string=html_string).write_pdf()
    
    response = HttpResponse(pdf_bytes, content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{invoice.invoice_number}.pdf"'
    return response

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def dashboard_report(request):
    """
    گزارش مالی کامل: خلاصه‌ی ماهانه‌ی چند ماه اخیر + سهم هر دسته‌بندی از کل هزینه‌ها.
    پارامتر اختیاری ?months=3 تعداد ماه‌های موردنظر رو مشخص می‌کنه (پیش‌فرض ۶).
    """
    user = request.user
    months_count = int(request.GET.get("months", 6))
    start_date = date.today().replace(day=1) - relativedelta(months=months_count - 1)

    transactions = Transation.objects.filter(user=user, date__gte=start_date)

    # خلاصه‌ی ماهانه (همون منطق dashboard_trend ولی با تعداد ماه قابل‌تنظیم)
    monthly_data = (
        transactions
        .annotate(month=TruncMonth("date"))
        .values("month", "type")
        .annotate(total=Sum("amount"))
        .order_by("month")
    )

    monthly = {}
    for i in range(months_count):
        month_date = start_date + relativedelta(months=i)
        key = month_date.strftime("%Y-%m")
        monthly[key] = {"month": key, "income": 0, "expense": 0}

    for row in monthly_data:
        key = row["month"].strftime("%Y-%m")
        if key in monthly:
            monthly[key][row["type"]] = float(row["total"])

    monthly_list = list(monthly.values())
    for row in monthly_list:
        row["net_profit"] = row["income"] - row["expense"]

    # سهم هر دسته‌بندی از کل هزینه‌ها
    expense_by_category = (
        transactions.filter(type="expense")
        .values("category__name")
        .annotate(total=Sum("amount"))
        .order_by("-total")
    )
    total_expense = sum(row["total"] for row in expense_by_category) or 1  # جلوگیری از تقسیم بر صفر

    category_breakdown = [
        {
            "category_name": row["category__name"],
            "total": float(row["total"]),
            "percent": round(float(row["total"]) / float(total_expense) * 100, 1),
        }
        for row in expense_by_category
    ]

    totals = {
        "total_income": sum(row["income"] for row in monthly_list),
        "total_expense": sum(row["expense"] for row in monthly_list),
    }
    totals["net_profit"] = totals["total_income"] - totals["total_expense"]

    return Response({
        "monthly": monthly_list,
        "category_breakdown": category_breakdown,
        "totals": totals,
    })