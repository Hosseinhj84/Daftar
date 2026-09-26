from rest_framework import serializers
from .models import User , Category , Client , Invoice , InvoiceItem , Transation
from .models import Settings

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id" , "email" , "username" , "first_name" , "last_name"]

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True , min_length=8)
    
    class Meta:
        model = User
        fields = ["id" , "email" , "username" , "password"]
    
    def create(self , validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            username=validated_data["username"],
            password=validated_data["password"],
        )
        return user

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id" , "name" , "type"]

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ["id" , "name" , "phone" , "notes" , "created_at"]
        read_only_fields = ["created_at"]

class InvoiceItemSerializer(serializers.ModelSerializer):
    line_total = serializers.ReadOnlyField()
    
    class Meta:
        model = InvoiceItem
        fields = ["id" , "item_type" , "title" , "quantity" , "unit_price" , "line_total"]

class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True)
    subtotal = serializers.ReadOnlyField()
    total_amount = serializers.ReadOnlyField()
    client_name = serializers.CharField(source="client.name", read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            "id", "client", "client_name", "invoice_number", "date",
            "status", "discount_percent", "note", "items",
            "subtotal", "total_amount", "created_at",
        ]
        read_only_fields = ["created_at"]
    
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        invoice = Invoice.objects.create(**validated_data)
        for item_data in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item_data)
        return invoice
    
    def update(self , instance , validated_data):
        items_data = validated_data.pop("items" ,None)
        for attr, value in validated_data.items():
            setattr(instance , attr,value)
        instance.save()
        
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                InvoiceItem.objects.create(invoice=instance , **item_data)
        return instance

class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name" , read_only=True)
    
    class Meta:
        model = Transation
        fields = [
            "id" , "category" , "category_name" , "type",
            "amount" , "date" , "description" , "created_at"
        ]
        read_only_fields = ["created_at"]

class SettingsSerialaizer(serializers.ModelSerializer):
    class Meta:
        model = Settings
        fields = [
            "business_name" , "invoice_prefix" , "default_invoice_note" , "notify_overdue_email",
        ]

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "job_title", "avatar"]
        read_only_fields = ["id", "email"]