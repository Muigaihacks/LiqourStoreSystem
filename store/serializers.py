from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Category, Product, Inventory, StockMovement, Sale, SaleItem


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    current_stock = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Product
        fields = '__all__'


class InventorySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_barcode = serializers.CharField(source='product.barcode', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Inventory
        fields = '__all__'


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = StockMovement
        fields = '__all__'
        read_only_fields = ['created_by', 'previous_stock', 'new_stock']


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_barcode = serializers.CharField(source='product.barcode', read_only=True)
    
    class Meta:
        model = SaleItem
        fields = '__all__'
        read_only_fields = ['total_price']


class SaleSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.username', read_only=True)
    items = SaleItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Sale
        fields = '__all__'
        read_only_fields = ['sale_number']


class SaleCreateSerializer(serializers.Serializer):
    items = serializers.ListField()
    payment_method = serializers.CharField(max_length=10, default='CASH')
    customer_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    customer_phone = serializers.CharField(max_length=15, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        
        # Create a default employee for now
        from django.contrib.auth.models import User
        default_employee, created = User.objects.get_or_create(
            username='store_employee',
            defaults={'first_name': 'Store', 'last_name': 'Employee'}
        )
        
        # Generate sale number
        import uuid
        sale_number = f"SALE-{str(uuid.uuid4())[:8].upper()}"
        
        # Create sale
        sale = Sale.objects.create(
            sale_number=sale_number,
            employee=default_employee,
            total_amount=0,  # Will be calculated
            payment_method=validated_data.get('payment_method', 'CASH'),
            customer_name=validated_data.get('customer_name', ''),
            customer_phone=validated_data.get('customer_phone', ''),
            notes=validated_data.get('notes', '')
        )
        
        total_amount = 0
        for item_data in items_data:
            product_id = item_data['product']
            quantity = item_data['quantity']
            unit_price = float(item_data['unit_price'])
            
            # Get the product
            product = Product.objects.get(id=product_id)
            
            # Create sale item
            SaleItem.objects.create(
                sale=sale,
                product=product,
                quantity=quantity,
                unit_price=unit_price,
                total_price=quantity * unit_price
            )
            
            # Update inventory
            try:
                inventory = Inventory.objects.get(product=product)
                previous_stock = inventory.quantity
                inventory.quantity -= quantity
                inventory.save()
                
                # Create stock movement
                StockMovement.objects.create(
                    product=product,
                    movement_type='OUT',
                    quantity=-quantity,
                    previous_stock=previous_stock,
                    new_stock=inventory.quantity,
                    notes=f"Sale #{sale.sale_number}",
                    created_by=default_employee
                )
            except Inventory.DoesNotExist:
                pass  # Skip inventory update if not found
            
            total_amount += quantity * unit_price
        
        # Update sale total
        sale.total_amount = total_amount
        sale.save()
        
        # Return sale data
        return {
            'id': sale.id,
            'sale_number': sale.sale_number,
            'total_amount': str(sale.total_amount),
            'created_at': sale.created_at.isoformat()
        }


class StockInSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def create(self, validated_data):
        product = Product.objects.get(id=validated_data['product_id'])
        quantity = validated_data['quantity']
        notes = validated_data.get('notes', '')
        
        # Get or create inventory
        inventory, created = Inventory.objects.get_or_create(
            product=product,
            defaults={'quantity': 0, 'minimum_stock': 5}
        )
        
        previous_stock = inventory.quantity
        inventory.quantity += quantity
        inventory.save()
        
        # Create stock movement
        StockMovement.objects.create(
            product=product,
            movement_type='IN',
            quantity=quantity,
            previous_stock=previous_stock,
            new_stock=inventory.quantity,
            notes=notes,
            created_by=self.context['request'].user
        )
        
        return inventory


class BarcodeLookupSerializer(serializers.Serializer):
    barcode = serializers.CharField(max_length=50)
    
    def validate_barcode(self, value):
        try:
            Product.objects.get(barcode=value, is_active=True)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product with this barcode not found or inactive")
        return value
