from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
from ledger.models import Invoice, Settings, User


class Command(BaseCommand):
    help = "برای هر کاربر که یادآوری فعال داره، ایمیل خلاصه‌ی فاکتورهای معوق می‌فرسته"

    def handle(self, *args, **options):
        users_with_pending = User.objects.filter(
            invoice__status="pending"
        ).distinct()

        sent_count = 0

        for user in users_with_pending:
            user_settings, _ = Settings.objects.get_or_create(user=user)

            if not user_settings.notify_overdue_email:
                continue

            pending_invoices = Invoice.objects.filter(user=user, status="pending")

            if not pending_invoices.exists():
                continue

            lines = ["فاکتورهای معوق شما:\n"]
            for invoice in pending_invoices:
                lines.append(
                    f"- {invoice.invoice_number} | مشتری: {invoice.client.name} | "
                    f"مبلغ: {invoice.total_amount:.0f} تومان | تاریخ: {invoice.date}"
                )
            message = "\n".join(lines)

            send_mail(
                subject=f"یادآوری: {pending_invoices.count()} فاکتور معوق در دفتر درآمد",
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            sent_count += 1
            self.stdout.write(f"ایمیل برای {user.email} ارسال شد.")

        self.stdout.write(self.style.SUCCESS(f"مجموعاً {sent_count} ایمیل ارسال شد."))