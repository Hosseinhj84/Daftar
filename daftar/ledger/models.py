from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator

# Create your models here.

class User(AbstractUser):
    email= models.EmailField(unique=True)
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]
    
    def __str__(self):
        return self.email

class Category(models.Model):
    class CategoryType(models.TextChoices):
        INCOME = "income" , "درآمد"
        EXPENSE = "expense" , "هزینه"
        
    user = models.ForeignKey(
        User , on_delete=models.CASCADE , related_name="catgories"
    )
    name = models.CharField(blank=True , max_length=100)
    type = models.CharField(max_length=10 , choices=CategoryType.choices)
    
    class Meta :
        unique_together = ("user" , "name" , "type")
        verbose_name_plural = "categories"
    
    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"

class Client(models.Model):
    user = models.ForeignKey(
        User , on_delete=models.CASCADE , related_name="Clients"
    )
    name = models.CharField(blank=True , max_length=150)
    phone = models.CharField(max_length=20,blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class Invoice(models.Model):
    class Status(models.TextChoices):
        PAID = "paid" , "پرداخت شده"
        PENDING = "pending" , "معوق"
    
    user = models.ForeignKey(
        User , on_delete=models.CASCADE , related_name="invoice"
    )
    client = models.ForeignKey(
        Client , on_delete=models.CASCADE , related_name="invoice"
    )
    invoice_number = models.CharField(max_length=30 , unique=True)
    date = models.DateField()
    status = models.CharField(max_length=10 , choices=Status.choices , default=Status.PENDING)
    discount_percent = models.DecimalField(
        max_digits=5 , default=0 , decimal_places=2 , validators=[MinValueValidator(0)]
    )
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta :
        ordering = ['-date']
    
    def __str__(self):
        return self.invoice_number
    
    @property
    def subtotal(self) :
        return sum(item.line_total for item in self.items.all())
    
    @property
    def total_amount(self):
        discount =self.subtotal * (self.discount_percent / 100)
        return self.subtotal - discount

class InvoiceItem(models.Model):
    class ItemType(models.TextChoices):
        SERVICE = "service" , "خدمت"
        PRODUCT = "product" , "کالا"
    
    invoice = models.ForeignKey(
        Invoice , on_delete=models.CASCADE , related_name="items"
    )
    item_type = models.CharField(max_length=10 , choices=ItemType.choices)
    title = models.CharField(max_length=200)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(
        max_digits=14 , decimal_places=0 , validators=[MinValueValidator(0)]
    )
    
    def __str__(self):
        return f"{self.title} x {self.quantity}"
    
    @property
    def line_total(self):
        return self.quantity * self.unit_price

class Transation(models.Model):
    class TransactionType(models.TextChoices):
        INCOME = "income" , "درآمد"
        EXPENSE = "expense" , "هزینه"
    
    user = models.ForeignKey(
        User , on_delete=models.CASCADE , related_name="transaction"
    )
    category = models.ForeignKey(
        Category ,  on_delete=models.CASCADE , related_name="transactions"
    )
    type = models.CharField(max_length=10 , choices=TransactionType.choices)
    amount = models.DecimalField(max_digits=14 , decimal_places=0 , validators=[MinValueValidator(0)])
    date = models.DateField()
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["-date"]
    
    def __str__(self):
        return f"{self.get_type_display()} - {self.amount}"