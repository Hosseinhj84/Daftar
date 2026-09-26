from django.shortcuts import render
from django.core.mail import send_mail
import pandas as pd
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import parser_classes
from rest_framework import viewsets, generics, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Sum, Q
from .models import Category, Client, Invoice, Transation , Settings , InvoiceItem
from .serializers import (
    CategorySerializer, ClientSerializer, InvoiceSerializer,
    TransactionSerializer, RegisterSerializer, SettingsSerialaizer, ProfileSerializer
)
from django.db.models.functions import TruncMonth
from datetime import date
from dateutil.relativedelta import relativedelta
from pathlib import Path
from django.conf import settings
from django.http import HttpResponse
from django.template.loader import render_to_string
from weasyprint import HTML
from rest_framework import status
from .models import User

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
    
    settings_obj , _ = Settings.objects.get_or_create(user=request.user)
    
    fonts_dir = Path(__file__).resolve().parent / "static" / "fonts"
    html_string = render_to_string("invoice_pdf.html", {
        "invoice" : invoice,
        "settings" : settings_obj,
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

class SettingsView(generics.RetrieveUpdateAPIView):
    serializer_class = SettingsSerialaizer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        settings_obj, _ = Settings.objects.get_or_create(user=self.request.user)
        return settings_obj

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def clients_import_template(request):
    df = pd.DataFrame([
        {"name" : "علی رضایی" , "phone" : "09120000000" , "note" : "مشتری نمونه"}
    ])
    respone = HttpResponse(
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    respone["Content-disposition"] = 'attachment; filename="قالب-مشتریان.xlsx"'
    df.to_excel(respone, index=False , engine="openpyxl")
    return respone

@api_view(["POST"])
@parser_classes([MultiPartParser])
@permission_classes([permissions.IsAuthenticated])
def import_clients(request):
    file = request.FILES.get("file")
    if not file:
        return Response({"detail" : "فایلی ارسال نشده"}, status=400)
    
    try:
        df = pd.read_excel(file)
    except Exception:
        return Response({"detail": "فایل اکسل قابل خواندن نیست"} , status=400)
    
    if "name" not in df.columns:
        return Response({"detail" : "ستون 'name' در فایل یافت نشد"}, status=400)
    
    created_count = 0
    errors = []
    for index, row in df.iterrows():
        name = str(row.get("name" , "")).strip()
        if not name or name.lower() == "nan":
            errors.append(f"ردیف {index + 2}: رد شد . نام خالی سات")
            continue
        
        phone = row.get("phone" , "")
        phone = "" if pd.isna(phone) else str(phone).strip()
        
        notes = row.get("notes", "")
        notes = "" if pd.isna(notes) else str(notes).strip()
        
        Client.objects.create(user=request.user, name=name , phone=phone , notes=notes)
        created_count += 1
        
    return Response({"created" : created_count, "errors" : errors})

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def transactions_import_template(request):
    df = pd.DataFrame([{
        "type" : "income",
        "category": "پروژه",
        "amount" : 500000,
        "date" : "2026-01-15",
        "description": "دریافت دستمزد پروژه نمونه",
    }])
    response = HttpResponse(
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response["Content-Disposition"] = 'attachment; filename="قالب-تراکنش ها.xlsx"'
    df.to_excel(response, index=False, engine="openpyxl")
    return response

@api_view(["POST"])
@parser_classes([MultiPartParser])
@permission_classes([permissions.IsAuthenticated])
def import_transactions(request):
    file = request.FILES.get("file")
    if not file:
        return Response({"detail" : "فایل ارسال نشده است."}, status=400)
    
    try:
        df = pd.read_excel(file)
    except Exception:
        return Response({"detail" : "فایل اکسل قابل خواندن نیست"}, status=400)
    
    required_columns = {"type", "category" , "amount" , "date"}
    if not required_columns.issubset(df.columns):
        return Response(
            {"detail": f"ستون های لازم یافت نشد: {', '.join(required_columns)}"},
            status=400,
        )
        
    created_count = 0
    errors = []
    
    for index, row in df.iterrows():
        row_num = index + 2  # چون ردیف اول هدره و ایندکس از صفر شروع می‌شه

        tx_type = str(row.get("type", "")).strip().lower()
        if tx_type not in ("income", "expense"):
            errors.append(f"ردیف {row_num}: نوع باید 'income' یا 'expense' باشد، رد شد.")
            continue

        category_name = str(row.get("category", "")).strip()
        if not category_name or category_name.lower() == "nan":
            errors.append(f"ردیف {row_num}: دسته‌بندی خالی است، رد شد.")
            continue

        try:
            amount = float(row.get("amount", 0))
            if amount < 0:
                raise ValueError
        except (ValueError, TypeError):
            errors.append(f"ردیف {row_num}: مبلغ نامعتبر است، رد شد.")
            continue

        raw_date = row.get("date")
        try:
            tx_date = pd.to_datetime(raw_date).date()
        except Exception:
            errors.append(f"ردیف {row_num}: تاریخ نامعتبر است، رد شد.")
            continue

        description = row.get("description", "")
        description = "" if pd.isna(description) else str(description).strip()

        category, _ = Category.objects.get_or_create(
            user=request.user, name=category_name, type=tx_type
        )

        Transation.objects.create(
            user=request.user,
            category=category,
            type=tx_type,
            amount=amount,
            date=tx_date,
            description=description,
        )
        created_count += 1

    return Response({"created": created_count, "errors": errors})

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def invoices_import_template(request):
    df = pd.DataFrame([
        {
            "client_name": "علی رضایی",
            "invoice_number": "INV-2001",
            "date": "2026-01-15",
            "status": "pending",
            "discount_percent": 0,
            "item_type": "service",
            "title": "طراحی لوگو",
            "quantity": 1,
            "unit_price": 3000000,
            "note": "",
        }
    ])
    response = HttpResponse(
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response["Content-Disposition"] = 'attachment; filename="قالب-فاکتورها.xlsx"'
    df.to_excel(response, index=False, engine="openpyxl")
    return response


@api_view(["POST"])
@parser_classes([MultiPartParser])
@permission_classes([permissions.IsAuthenticated])
def import_invoices(request):
    file = request.FILES.get("file")
    if not file:
        return Response({"detail": "فایلی ارسال نشده است."}, status=400)

    try:
        df = pd.read_excel(file)
    except Exception:
        return Response({"detail": "فایل اکسل قابل خواندن نیست."}, status=400)

    required_columns = {
        "client_name", "invoice_number", "date", "item_type", "title",
        "quantity", "unit_price",
    }
    if not required_columns.issubset(df.columns):
        return Response(
            {"detail": f"ستون‌های لازم یافت نشد: {', '.join(required_columns)}"},
            status=400,
        )

    created_count = 0
    errors = []

    for index, row in df.iterrows():
        row_num = index + 2

        client_name = str(row.get("client_name", "")).strip()
        if not client_name or client_name.lower() == "nan":
            errors.append(f"ردیف {row_num}: نام مشتری خالی است، رد شد.")
            continue

        invoice_number = str(row.get("invoice_number", "")).strip()
        if not invoice_number or invoice_number.lower() == "nan":
            errors.append(f"ردیف {row_num}: شماره فاکتور خالی است، رد شد.")
            continue

        if Invoice.objects.filter(invoice_number=invoice_number).exists():
            errors.append(f"ردیف {row_num}: شماره فاکتور '{invoice_number}' تکراری است، رد شد.")
            continue

        raw_date = row.get("date")
        try:
            invoice_date = pd.to_datetime(raw_date).date()
        except Exception:
            errors.append(f"ردیف {row_num}: تاریخ نامعتبر است، رد شد.")
            continue

        status_value = str(row.get("status", "pending")).strip().lower()
        if status_value not in ("paid", "pending"):
            status_value = "pending"

        try:
            discount_percent = float(row.get("discount_percent", 0) or 0)
        except (ValueError, TypeError):
            discount_percent = 0

        item_type = str(row.get("item_type", "")).strip().lower()
        if item_type not in ("service", "product"):
            errors.append(f"ردیف {row_num}: نوع قلم باید 'service' یا 'product' باشد، رد شد.")
            continue

        title = str(row.get("title", "")).strip()
        if not title or title.lower() == "nan":
            errors.append(f"ردیف {row_num}: عنوان قلم خالی است، رد شد.")
            continue

        try:
            quantity = int(row.get("quantity", 1))
            unit_price = float(row.get("unit_price", 0))
            if quantity <= 0 or unit_price < 0:
                raise ValueError
        except (ValueError, TypeError):
            errors.append(f"ردیف {row_num}: تعداد یا قیمت نامعتبر است، رد شد.")
            continue

        note = row.get("note", "")
        note = "" if pd.isna(note) else str(note).strip()

        client = Client.objects.filter(user=request.user, name=client_name).first()
        if client is None:
            client = Client.objects.create(user=request.user, name=client_name)

        invoice = Invoice.objects.create(
            user=request.user,
            client=client,
            invoice_number=invoice_number,
            date=invoice_date,
            status=status_value,
            discount_percent=discount_percent,
            note=note,
        )
        InvoiceItem.objects.create(
            invoice=invoice,
            item_type=item_type,
            title=title,
            quantity=quantity,
            unit_price=unit_price,
        )
        created_count += 1

    return Response({"created": created_count, "errors": errors})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_overdue_reminders_manual(request):
    user = request.user

    overdue_invoices = (
        Invoice.objects
        .filter(
            user=user,
            status__in=["pending", "overdue"],
        )
        .select_related("client")
        .prefetch_related("items")
        .order_by("-date")
    )

    if not overdue_invoices.exists():
        return Response(
            {
                "detail": "هیچ فاکتور پرداخت‌نشده‌ای برای ارسال یادآوری وجود ندارد."
            },
            status=status.HTTP_200_OK,
        )

    if not user.email:
        return Response(
            {
                "detail": "برای حساب کاربری شما ایمیل ثبت نشده است."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    email_lines = [
        f"سلام {user.get_full_name() or user.username}",
        "",
        "فهرست فاکتورهای پرداخت‌نشده شما:",
        "",
    ]

    total_unpaid_amount = 0

    for index, invoice in enumerate(overdue_invoices, start=1):
        client_name = (
            invoice.client.name
            if getattr(invoice, "client", None)
            else "بدون نام مشتری"
        )

        invoice_total = invoice.total_amount or 0
        total_unpaid_amount += invoice_total

        status_label = {
            "pending": "در انتظار پرداخت",
            "overdue": "معوق",
        }.get(invoice.status, invoice.status)

        email_lines.extend(
            [
                f"{index}. فاکتور شماره: {invoice.invoice_number}",
                f"نام مشتری: {client_name}",
                f"تاریخ فاکتور: {invoice.date}",
                f"وضعیت: {status_label}",
                f"تخفیف: {invoice.discount_percent} درصد",
                f"مبلغ نهایی: {invoice_total:,.0f} تومان",
            ]
        )

        if invoice.note:
            email_lines.append(f"یادداشت: {invoice.note}")

        email_lines.append("اقلام فاکتور:")

        for item in invoice.items.all():
            line_total = item.line_total or (
                item.quantity * item.unit_price
            )

            email_lines.append(
                f"- {item.title} | "
                f"تعداد: {item.quantity} | "
                f"قیمت واحد: {item.unit_price:,.0f} تومان | "
                f"جمع: {line_total:,.0f} تومان"
            )

        email_lines.extend(
            [
                "",
                "----------------------------------------",
                "",
            ]
        )

    email_lines.extend(
        [
            f"تعداد کل فاکتورهای پرداخت‌نشده: {overdue_invoices.count()}",
            f"مجموع مبلغ پرداخت‌نشده: {total_unpaid_amount:,.0f} تومان",
            "",
            "لطفاً برای بررسی جزئیات بیشتر وارد دفتر درآمد شوید.",
        ]
    )

    send_mail(
        subject="گزارش فاکتورهای پرداخت‌نشده دفتر درآمد",
        message="\n".join(email_lines),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )

    return Response(
        {
            "detail": "جزئیات فاکتورهای پرداخت‌نشده با موفقیت ارسال شد.",
            "invoice_count": overdue_invoices.count(),
            "email": user.email,
        },
        status=status.HTTP_200_OK,
    )

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    old_password = request.data.get("old_password")
    new_password = request.data.get("new_password")

    if not old_password or not new_password:
        return Response({"detail": "رمز فعلی و رمز جدید هر دو لازم است."}, status=400)

    if not request.user.check_password(old_password):
        return Response({"detail": "رمز فعلی اشتباه است."}, status=400)

    if len(new_password) < 8:
        return Response({"detail": "رمز جدید باید حداقل ۸ کاراکتر باشد."}, status=400)

    request.user.set_password(new_password)
    request.user.save()
    return Response({"detail": "رمز عبور با موفقیت تغییر کرد."})

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        return self.request.user