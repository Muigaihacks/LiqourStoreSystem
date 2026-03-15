from django.contrib import admin
from django.contrib.auth.admin import GroupAdmin, UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group, User
from django.utils.html import format_html
from unfold.admin import ModelAdmin, TabularInline
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm

from .admin_forms import InventoryAdminForm, StockMovementAdminForm
from .models import (
    Branch,
    Category,
    Customer,
    Inventory,
    PointTransaction,
    Product,
    Sale,
    SaleItem,
    StockMovement,
    UserProfile,
)

# Session key for admin branch switcher
CURRENT_BRANCH_SESSION_KEY = "current_branch_id"


class BranchScopedAdminMixin:
    """Mixin for ModelAdmin: filter queryset by current branch from session."""

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        branch_id = request.session.get(CURRENT_BRANCH_SESSION_KEY)
        if branch_id is not None:
            return qs.filter(branch_id=branch_id)
        return qs

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        branch_id = request.session.get(CURRENT_BRANCH_SESSION_KEY)
        if obj is None and branch_id is not None and "branch" in form.base_fields:
            form.base_fields["branch"].initial = branch_id
        return form


class BranchScopedViaProductMixin:
    """Mixin for models scoped by product.branch (e.g. Inventory, StockMovement)."""

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        branch_id = request.session.get(CURRENT_BRANCH_SESSION_KEY)
        if branch_id is not None:
            return qs.filter(product__branch_id=branch_id)
        return qs


# ----- Auth: custom User admin with profile (branch + Management access) -----


class UserProfileInline(TabularInline):
    model = UserProfile
    fk_name = "user"
    can_delete = True
    extra = 1
    fields = ("branch", "can_use_management_module")
    verbose_name = "Frontend profile (one per branch)"
    verbose_name_plural = "Frontend profiles (add one row per branch; owner can have multiple with Management)"


# Replace default User admin with our own (adds profile inline for branch + Management access)
admin.site.unregister(User)


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm
    inlines = [UserProfileInline]
    list_display = ["username", "email", "first_name", "last_name", "is_staff", "is_active"]
    list_filter = ["is_staff", "is_superuser", "is_active"]


# ----- Branch -----


@admin.register(Branch)
class BranchAdmin(ModelAdmin):
    list_display = ["name", "slug", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}
    ordering = ["name"]


# ----- Store models -----


@admin.register(Category)
class CategoryAdmin(ModelAdmin):
    list_display = ["name", "description", "created_at"]
    search_fields = ["name"]
    ordering = ["name"]


@admin.register(Product)
class ProductAdmin(ModelAdmin):
    list_display = [
        "name",
        "barcode",
        "category",
        "buying_price",
        "price",
        "profit_margin_display",
        "current_stock",
        "is_active",
        "brand",
    ]
    list_filter = ["category", "is_active", "brand"]
    search_fields = ["name", "barcode", "brand"]
    list_editable = ["buying_price", "price", "is_active"]
    readonly_fields = ["current_stock", "profit_margin_display", "profit_per_unit_display"]
    ordering = ["category", "name"]

    fieldsets = (
        ("Basic Information", {"fields": ("name", "barcode", "category", "brand")}),
        ("Pricing", {"fields": ("buying_price", "price", "profit_margin_display", "profit_per_unit_display")}),
        ("Details", {"fields": ("description", "size", "age")}),
        ("Status", {"fields": ("is_active",)}),
    )

    def profit_margin_display(self, obj):
        if obj.price and obj.buying_price:
            return f"{obj.profit_margin:.1f}%"
        return "N/A"

    profit_margin_display.short_description = "Profit Margin"

    def profit_per_unit_display(self, obj):
        if obj.price and obj.buying_price:
            return f"KSh {obj.profit_per_unit:.2f}"
        return "N/A"

    profit_per_unit_display.short_description = "Profit Per Unit"


@admin.register(Inventory)
class InventoryAdmin(ModelAdmin):
    form = InventoryAdminForm
    list_display = ["product", "branch", "quantity", "minimum_stock", "is_low_stock", "last_updated"]
    list_filter = ["branch", "product__category"]
    search_fields = ["product__name", "product__barcode"]
    readonly_fields = ["last_updated"]
    ordering = ["product__name"]
    list_select_related = ["product", "branch"]

    fieldsets = (
        ("Branch Selection", {"fields": ("branch",)}),
        ("Inventory Details", {"fields": ("product", "quantity", "minimum_stock")}),
        ("Status", {"fields": ("last_updated",)}),
    )

    def get_form(self, request, obj=None, **kwargs):
        form_class = super().get_form(request, obj, **kwargs)
        if form_class is not InventoryAdminForm:
            return form_class

        class FormWithRequest(form_class):
            def __init__(self, *args, **kw):
                kw["request"] = request
                super().__init__(*args, **kw)

        return FormWithRequest

    def is_low_stock(self, obj):
        if obj.is_low_stock:
            return format_html('<span style="color: red;">⚠️ Low Stock</span>')
        return format_html('<span style="color: green;">✓ OK</span>')

    is_low_stock.short_description = "Stock Status"


@admin.register(StockMovement)
class StockMovementAdmin(ModelAdmin):
    form = StockMovementAdminForm
    list_display = ["product", "branch", "movement_type", "quantity", "previous_stock", "new_stock", "created_by", "created_at"]
    list_filter = ["branch", "movement_type", "created_at"]
    search_fields = ["product__name", "product__barcode", "notes"]
    readonly_fields = ["previous_stock", "new_stock", "created_at"]
    ordering = ["-created_at"]
    list_select_related = ["product", "branch", "created_by"]

    fieldsets = (
        ("Branch Selection", {"fields": ("branch",)}),
        ("Movement Details", {"fields": ("product", "movement_type", "quantity", "notes")}),
        ("Stock Information", {"fields": ("previous_stock", "new_stock")}),
        ("Meta", {"fields": ("created_by", "created_at")}),
    )

    def get_form(self, request, obj=None, **kwargs):
        form_class = super().get_form(request, obj, **kwargs)
        if form_class is not StockMovementAdminForm:
            return form_class

        class FormWithRequest(form_class):
            def __init__(self, *args, **kw):
                kw["request"] = request
                super().__init__(*args, **kw)

        return FormWithRequest

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
            # Find inventory for this product AND branch
            inventory, created = Inventory.objects.get_or_create(
                product=obj.product,
                branch=obj.branch,
                defaults={"quantity": 0, "minimum_stock": 5},
            )
            obj.previous_stock = inventory.quantity
            if obj.movement_type == "IN":
                inventory.quantity += obj.quantity
                obj.new_stock = inventory.quantity
            elif obj.movement_type == "OUT":
                inventory.quantity = max(0, inventory.quantity - obj.quantity)
                obj.new_stock = inventory.quantity
            elif obj.movement_type == "ADJUSTMENT":
                inventory.quantity = obj.quantity
                obj.new_stock = inventory.quantity
            inventory.save()
        super().save_model(request, obj, form, change)


class SaleItemInline(TabularInline):
    model = SaleItem
    extra = 0
    readonly_fields = ["total_price"]


@admin.register(Sale)
class SaleAdmin(BranchScopedAdminMixin, ModelAdmin):
    list_display = [
        "sale_number",
        "branch",
        "employee",
        "total_amount",
        "payment_method",
        "customer_name",
        "created_at",
    ]
    list_filter = ["branch", "payment_method", "created_at"]
    search_fields = ["sale_number", "customer_name", "customer_phone"]
    readonly_fields = ["sale_number", "created_at", "updated_at"]
    ordering = ["-created_at"]
    inlines = [SaleItemInline]

    fieldsets = (
        ("Branch Selection", {"fields": ("branch",)}),
        ("Sale Information", {"fields": ("sale_number", "employee", "total_amount", "payment_method")}),
        ("Customer Information", {"fields": ("customer_name", "customer_phone")}),
        ("Additional Information", {"fields": ("notes",)}),
        ("Timestamps", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
    )


@admin.register(Customer)
class CustomerAdmin(ModelAdmin):
    list_display = [
        "name",
        "phone_number",
        "total_points",
        "points_redeemed",
        "available_points_display",
        "total_spent_display",
        "join_date",
        "is_active",
    ]
    list_filter = ["is_active", "join_date"]
    search_fields = ["name", "phone_number", "email"]
    list_editable = ["is_active"]
    readonly_fields = [
        "total_points",
        "points_redeemed",
        "available_points_display",
        "total_spent_display",
        "created_at",
        "updated_at",
    ]
    ordering = ["-total_points", "name"]

    fieldsets = (
        ("Customer Information", {"fields": ("name", "phone_number", "email")}),
        ("Loyalty Program", {"fields": ("total_points", "points_redeemed", "available_points_display", "join_date", "is_active")}),
        ("Statistics", {"fields": ("total_spent_display",), "classes": ("collapse",)}),
        ("Timestamps", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
    )

    def available_points_display(self, obj):
        points = obj.available_points
        if points >= 100:
            return format_html('<span style="color: green; font-weight: bold;">{} pts</span>', points)
        elif points >= 50:
            return format_html('<span style="color: orange; font-weight: bold;">{} pts</span>', points)
        return f"{points} pts"

    available_points_display.short_description = "Available Points"

    def total_spent_display(self, obj):
        return f"KSh {obj.total_spent:.2f}"

    total_spent_display.short_description = "Total Spent"


class PointTransactionInline(TabularInline):
    model = PointTransaction
    extra = 0
    readonly_fields = ["created_at"]
    fields = ["transaction_type", "points", "sale", "notes", "created_by", "created_at"]


CustomerAdmin.inlines = [PointTransactionInline]


@admin.register(PointTransaction)
class PointTransactionAdmin(ModelAdmin):
    list_display = ["customer", "transaction_type", "points", "sale", "created_by", "created_at"]
    list_filter = ["transaction_type", "created_at"]
    search_fields = ["customer__name", "customer__phone_number", "notes"]
    readonly_fields = ["created_at"]
    ordering = ["-created_at"]

    fieldsets = (
        ("Transaction Details", {"fields": ("customer", "transaction_type", "points", "sale")}),
        ("Additional Information", {"fields": ("notes", "created_by", "created_at")}),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("customer", "sale", "created_by")
