from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Product, Inventory, StockMovement, Sale, SaleItem


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    search_fields = ['name']
    ordering = ['name']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'barcode', 'category', 'price', 'current_stock', 'is_active', 'brand']
    list_filter = ['category', 'is_active', 'brand']
    search_fields = ['name', 'barcode', 'brand']
    list_editable = ['price', 'is_active']
    readonly_fields = ['current_stock']
    ordering = ['category', 'name']

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'barcode', 'category', 'brand')
        }),
        ('Details', {
            'fields': ('description', 'size', 'age', 'price')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )


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
