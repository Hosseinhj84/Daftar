from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User , Category , Client , Invoice , InvoiceItem , Transation

# Register your models here.
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    ordering = ("email",)
    list_display = ("email" , "username" , "is_staff")

admin.site.register(Category)
admin.site.register(Client)

class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 1


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("invoice_number" , "client" , "date" , "status" , "total_amount")
    inlines = [InvoiceItemInline]

@admin.register(Transation)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("type" , "amount" , "category" , "date")