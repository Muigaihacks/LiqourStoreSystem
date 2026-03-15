"""Admin forms for Store models: branch-aware Inventory and StockMovement."""
from collections import OrderedDict
from django import forms
from .models import Branch, Product, Inventory, StockMovement


class InventoryAdminForm(forms.ModelForm):
    """Add inventory: select branch then product."""
    class Meta:
        model = Inventory
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        self.request = kwargs.pop("request", None)
        super().__init__(*args, **kwargs)
        # Ensure products are global
        self.fields["product"].queryset = Product.objects.filter(is_active=True).select_related("category").order_by("name")


class StockMovementAdminForm(forms.ModelForm):
    """Stock movement: select branch then product."""
    class Meta:
        model = StockMovement
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        self.request = kwargs.pop("request", None)
        super().__init__(*args, **kwargs)
        self.fields["product"].queryset = Product.objects.filter(is_active=True).select_related("category").order_by("name")
        if not self.instance.pk:
            self.initial.setdefault("movement_type", "IN")
