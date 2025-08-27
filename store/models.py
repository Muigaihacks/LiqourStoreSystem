from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from decimal import Decimal
from django.utils import timezone


class Category(models.Model):
    """Product categories like Whiskey, Wine, Beer, etc."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    """Product model with barcode tracking"""
    name = models.CharField(max_length=200)
    barcode = models.CharField(max_length=50, unique=True, help_text="Unique barcode for this product")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], help_text="Selling price")
    buying_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], help_text="Cost price/buying price", default=0)
    size = models.CharField(max_length=50, blank=True, help_text="e.g., 750ml, 1L, etc.")
    age = models.CharField(max_length=50, blank=True, help_text="e.g., 12 years, 18 years, etc.")
    brand = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.name} - {self.barcode}"

    @property
    def current_stock(self):
        """Get current stock level for this product"""
        inventory = self.inventory_set.first()
        return inventory.quantity if inventory else 0
    
    @property
    def profit_margin(self):
        """Calculate profit margin percentage"""
        if self.price and self.buying_price and self.price > 0:
            return ((self.price - self.buying_price) / self.price) * 100
        return 0
    
    @property
    def profit_per_unit(self):
        """Calculate profit per unit"""
        if self.price and self.buying_price:
            return self.price - self.buying_price
        return 0


class Inventory(models.Model):
    """Inventory tracking for each product"""
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='inventory')
    quantity = models.PositiveIntegerField(default=0)
    minimum_stock = models.PositiveIntegerField(default=5, help_text="Alert when stock goes below this level")
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Inventories"

    def __str__(self):
        return f"{self.product.name} - Stock: {self.quantity}"

    @property
    def is_low_stock(self):
        """Check if stock is below minimum level"""
        return self.quantity <= self.minimum_stock


class StockMovement(models.Model):
    """Track all stock updates (in/out)"""
    MOVEMENT_TYPES = [
        ('IN', 'Stock In'),
        ('OUT', 'Stock Out'),
        ('ADJUSTMENT', 'Stock Adjustment'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_movements')
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    quantity = models.IntegerField(help_text="Positive for IN, negative for OUT")
    previous_stock = models.PositiveIntegerField()
    new_stock = models.PositiveIntegerField()
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Stock Update"
        verbose_name_plural = "Stock Updates"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.product.name} - {self.movement_type} ({self.quantity})"


class Sale(models.Model):
    """Sales transaction"""
    PAYMENT_METHODS = [
        ('CASH', 'Cash'),
        ('MPESA', 'M-Pesa'),
        ('CARD', 'Card'),
        ('BANK', 'Bank Transfer'),
        ('LOYALTY_POINTS', 'Loyalty Points'),
    ]

    sale_number = models.CharField(max_length=20, unique=True)
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sales')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=15, choices=PAYMENT_METHODS, default='CASH')
    customer_name = models.CharField(max_length=100, blank=True)
    customer_phone = models.CharField(max_length=15, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Sale #{self.sale_number} - {self.total_amount}"

    def save(self, *args, **kwargs):
        if not self.sale_number:
            # Generate sale number
            last_sale = Sale.objects.order_by('-id').first()
            if last_sale:
                last_number = int(last_sale.sale_number.split('-')[1])
                self.sale_number = f"SALE-{last_number + 1:06d}"
            else:
                self.sale_number = "SALE-000001"
        super().save(*args, **kwargs)


class SaleItem(models.Model):
    """Individual items in a sale"""
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ['sale', 'product']

    def __str__(self):
        return f"{self.product.name} x{self.quantity} - {self.total_price}"

    def save(self, *args, **kwargs):
        if not self.total_price:
            self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)


class Customer(models.Model):
    """Customer loyalty program members"""
    phone_number = models.CharField(max_length=15, unique=True, help_text="Customer's phone number (primary identifier)")
    name = models.CharField(max_length=100, help_text="Customer's full name")
    email = models.EmailField(blank=True, help_text="Customer's email address (optional)")
    total_points = models.PositiveIntegerField(default=0, help_text="Total loyalty points earned")
    points_redeemed = models.PositiveIntegerField(default=0, help_text="Total points redeemed")
    join_date = models.DateTimeField(default=timezone.now, help_text="Date customer joined loyalty program")
    is_active = models.BooleanField(default=True, help_text="Is customer active in loyalty program")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-total_points', 'name']
        verbose_name = "Loyalty Customer"
        verbose_name_plural = "Loyalty Customers"

    def __str__(self):
        return f"{self.name} ({self.phone_number}) - {self.available_points} pts"

    @property
    def available_points(self):
        """Calculate available points (total - redeemed)"""
        return self.total_points - self.points_redeemed

    @property
    def total_spent(self):
        """Calculate total amount spent by this customer"""
        from django.db.models import Sum
        total = Sale.objects.filter(customer_phone=self.phone_number).aggregate(
            total=Sum('total_amount')
        )['total']
        return total or 0


class PointTransaction(models.Model):
    """Track all point transactions (earned/redeemed)"""
    TRANSACTION_TYPES = [
        ('EARNED', 'Points Earned'),
        ('REDEEMED', 'Points Redeemed'),
        ('BONUS', 'Bonus Points'),
        ('ADJUSTMENT', 'Manual Adjustment'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='point_transactions')
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    points = models.IntegerField(help_text="Positive for earned, negative for redeemed")
    sale = models.ForeignKey(Sale, on_delete=models.SET_NULL, null=True, blank=True, help_text="Related sale (if applicable)")
    notes = models.TextField(blank=True, help_text="Additional notes about this transaction")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Point Transaction"
        verbose_name_plural = "Point Transactions"

    def __str__(self):
        action = "earned" if self.points > 0 else "redeemed"
        return f"{self.customer.name} {action} {abs(self.points)} points"

    def save(self, *args, **kwargs):
        # Update customer's total points
        if self.pk is None:  # Only for new transactions
            if self.transaction_type in ['EARNED', 'BONUS', 'ADJUSTMENT'] and self.points > 0:
                self.customer.total_points += self.points
            elif self.transaction_type == 'REDEEMED' and self.points < 0:
                self.customer.points_redeemed += abs(self.points)
            self.customer.save()
        super().save(*args, **kwargs)
