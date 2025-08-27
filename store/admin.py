from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Product, Inventory, StockMovement, Sale, SaleItem, Customer, PointTransaction


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    search_fields = ['name']
    ordering = ['name']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'barcode', 'category', 'buying_price', 'price', 'profit_margin_display', 'current_stock', 'is_active', 'brand']
    list_filter = ['category', 'is_active', 'brand']
    search_fields = ['name', 'barcode', 'brand']
    list_editable = ['buying_price', 'price', 'is_active']
    readonly_fields = ['current_stock', 'profit_margin_display', 'profit_per_unit_display']
    ordering = ['category', 'name']

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'barcode', 'category', 'brand')
        }),
        ('Pricing', {
            'fields': ('buying_price', 'price', 'profit_margin_display', 'profit_per_unit_display')
        }),
        ('Details', {
            'fields': ('description', 'size', 'age')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )

    def profit_margin_display(self, obj):
        """Display profit margin as percentage"""
        if obj.price and obj.buying_price:
            return f"{obj.profit_margin:.1f}%"
        return "N/A"
    profit_margin_display.short_description = "Profit Margin"

    def profit_per_unit_display(self, obj):
        """Display profit per unit"""
        if obj.price and obj.buying_price:
            return f"KSh {obj.profit_per_unit:.2f}"
        return "N/A"
    profit_per_unit_display.short_description = "Profit Per Unit"


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ['product', 'quantity', 'minimum_stock', 'is_low_stock', 'last_updated']
    list_filter = ['product__category']
    search_fields = ['product__name', 'product__barcode']
    readonly_fields = ['last_updated']  # Only last_updated is read-only
    ordering = ['product__name']

    def is_low_stock(self, obj):
        if obj.is_low_stock:
            return format_html('<span style="color: red;">⚠️ Low Stock</span>')
        return format_html('<span style="color: green;">✓ OK</span>')
    is_low_stock.short_description = 'Stock Status'


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['product', 'movement_type', 'quantity', 'previous_stock', 'new_stock', 'created_by', 'created_at']
    list_filter = ['movement_type', 'created_at']
    search_fields = ['product__name', 'product__barcode', 'notes']
    readonly_fields = ['previous_stock', 'new_stock', 'created_at']
    ordering = ['-created_at']

    def save_model(self, request, obj, form, change):
        if not change:  # Only for new records
            obj.created_by = request.user
            
            # Get the product's current inventory
            inventory, created = Inventory.objects.get_or_create(
                product=obj.product,
                defaults={'quantity': 0, 'minimum_stock': 5}
            )
            
            # Record previous stock
            obj.previous_stock = inventory.quantity
            
            # Update inventory based on movement type
            if obj.movement_type == 'IN':
                inventory.quantity += obj.quantity
                obj.new_stock = inventory.quantity
            elif obj.movement_type == 'OUT':
                inventory.quantity = max(0, inventory.quantity - obj.quantity)
                obj.new_stock = inventory.quantity
            elif obj.movement_type == 'ADJUSTMENT':
                inventory.quantity = obj.quantity  # Set to exact quantity
                obj.new_stock = inventory.quantity
            
            inventory.save()
        super().save_model(request, obj, form, change)
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if obj is None:  # Only for new records
            form.base_fields['movement_type'].initial = 'IN'
        return form


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0
    readonly_fields = ['total_price']


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ['sale_number', 'employee', 'total_amount', 'payment_method', 'customer_name', 'created_at']
    list_filter = ['payment_method', 'created_at']
    search_fields = ['sale_number', 'customer_name', 'customer_phone']
    readonly_fields = ['sale_number', 'created_at', 'updated_at']
    ordering = ['-created_at']
    inlines = [SaleItemInline]

    fieldsets = (
        ('Sale Information', {
            'fields': ('sale_number', 'employee', 'total_amount', 'payment_method')
        }),
        ('Customer Information', {
            'fields': ('customer_name', 'customer_phone')
        }),
        ('Additional Information', {
            'fields': ('notes',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


# SaleItem admin removed - not needed for single-scan workflow
# Each barcode scan = one sale, no need to manage individual sale items


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone_number', 'total_points', 'points_redeemed', 'available_points_display', 'total_spent_display', 'join_date', 'is_active']
    list_filter = ['is_active', 'join_date']
    search_fields = ['name', 'phone_number', 'email']
    list_editable = ['is_active']
    readonly_fields = ['total_points', 'points_redeemed', 'available_points_display', 'total_spent_display', 'created_at', 'updated_at']
    ordering = ['-total_points', 'name']

    fieldsets = (
        ('Customer Information', {
            'fields': ('name', 'phone_number', 'email')
        }),
        ('Loyalty Program', {
            'fields': ('total_points', 'points_redeemed', 'available_points_display', 'join_date', 'is_active')
        }),
        ('Statistics', {
            'fields': ('total_spent_display',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def available_points_display(self, obj):
        """Display available points with color coding"""
        points = obj.available_points
        if points >= 100:
            return format_html('<span style="color: green; font-weight: bold;">{} pts</span>', points)
        elif points >= 50:
            return format_html('<span style="color: orange; font-weight: bold;">{} pts</span>', points)
        else:
            return f"{points} pts"
    available_points_display.short_description = "Available Points"

    def total_spent_display(self, obj):
        """Display total amount spent"""
        return f"KSh {obj.total_spent:.2f}"
    total_spent_display.short_description = "Total Spent"


class PointTransactionInline(admin.TabularInline):
    model = PointTransaction
    extra = 0
    readonly_fields = ['created_at']
    fields = ['transaction_type', 'points', 'sale', 'notes', 'created_by', 'created_at']


@admin.register(PointTransaction)
class PointTransactionAdmin(admin.ModelAdmin):
    list_display = ['customer', 'transaction_type', 'points', 'sale', 'created_by', 'created_at']
    list_filter = ['transaction_type', 'created_at']
    search_fields = ['customer__name', 'customer__phone_number', 'notes']
    readonly_fields = ['created_at']
    ordering = ['-created_at']

    fieldsets = (
        ('Transaction Details', {
            'fields': ('customer', 'transaction_type', 'points', 'sale')
        }),
        ('Additional Information', {
            'fields': ('notes', 'created_by', 'created_at')
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('customer', 'sale', 'created_by')


# Add inline to Customer admin
CustomerAdmin.inlines = [PointTransactionInline]
