from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Q, Count, F
from django.utils import timezone
from datetime import datetime, timedelta
from django.contrib.auth.models import User
from django.http import HttpResponse
from django.core.management import call_command
from django.conf import settings
import uuid
import os
import tempfile
import zipfile

from .models import Category, Product, Inventory, StockMovement, Sale, SaleItem, Customer, PointTransaction
from .serializers import (
    CategorySerializer, ProductSerializer, InventorySerializer,
    StockMovementSerializer, SaleSerializer, SaleCreateSerializer,
    StockInSerializer, BarcodeLookupSerializer, UserSerializer,
    CustomerSerializer, PointTransactionSerializer, CustomerRegistrationSerializer
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):  # Read-only for employee interface
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]  # Allow unauthenticated access


class ProductViewSet(viewsets.ReadOnlyModelViewSet):  # Read-only for employee interface
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]  # Allow unauthenticated access
    
    def get_queryset(self):
        queryset = Product.objects.all()
        category = self.request.query_params.get('category', None)
        search = self.request.query_params.get('search', None)
        in_stock = self.request.query_params.get('in_stock', None)
        
        if category:
            queryset = queryset.filter(category__name__icontains=category)
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(barcode__icontains=search) |
                Q(brand__icontains=search)
            )
        
        if in_stock == 'true':
            queryset = queryset.filter(inventory__quantity__gt=0)
        elif in_stock == 'false':
            queryset = queryset.filter(Q(inventory__quantity=0) | Q(inventory__isnull=True))
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def barcode_lookup(self, request):
        """Look up product by barcode"""
        serializer = BarcodeLookupSerializer(data=request.data)
        if serializer.is_valid():
            barcode = serializer.validated_data['barcode']
            try:
                product = Product.objects.get(barcode=barcode, is_active=True)
                product_serializer = ProductSerializer(product)
                return Response(product_serializer.data)
            except Product.DoesNotExist:
                return Response(
                    {'error': 'Product not found or inactive'},
                    status=status.HTTP_404_NOT_FOUND
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get products with low stock"""
        products = Product.objects.filter(inventory__quantity__lte=F('inventory__minimum_stock'))
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def top_selling(self, request):
        """Get top-selling products with analytics"""
        days = int(request.query_params.get('days', 30))  # Default to last 30 days
        date_from = timezone.now() - timedelta(days=days)
        
        # Get top products by quantity sold
        top_by_quantity = (
            Product.objects
            .filter(saleitem__sale__created_at__gte=date_from)
            .annotate(
                total_quantity_sold=Sum('saleitem__quantity'),
                total_sales_count=Count('saleitem__sale', distinct=True),
                total_revenue=Sum(F('saleitem__quantity') * F('saleitem__unit_price')),
                total_profit=Sum(F('saleitem__quantity') * (F('price') - F('buying_price')))
            )
            .order_by('-total_quantity_sold')[:10]
        )
        
        # Get top products by revenue
        top_by_revenue = (
            Product.objects
            .filter(saleitem__sale__created_at__gte=date_from)
            .annotate(
                total_quantity_sold=Sum('saleitem__quantity'),
                total_sales_count=Count('saleitem__sale', distinct=True),
                total_revenue=Sum(F('saleitem__quantity') * F('saleitem__unit_price')),
                total_profit=Sum(F('saleitem__quantity') * (F('price') - F('buying_price')))
            )
            .order_by('-total_revenue')[:10]
        )
        
        # Get top products by profit
        top_by_profit = (
            Product.objects
            .filter(saleitem__sale__created_at__gte=date_from)
            .annotate(
                total_quantity_sold=Sum('saleitem__quantity'),
                total_sales_count=Count('saleitem__sale', distinct=True),
                total_revenue=Sum(F('saleitem__quantity') * F('saleitem__unit_price')),
                total_profit=Sum(F('saleitem__quantity') * (F('price') - F('buying_price')))
            )
            .order_by('-total_profit')[:10]
        )
        
        def serialize_products(products):
            return [
                {
                    'id': p.id,
                    'name': p.name,
                    'barcode': p.barcode,
                    'category_name': p.category.name,
                    'price': str(p.price),
                    'buying_price': str(p.buying_price),
                    'profit_margin': round(p.profit_margin, 1),
                    'total_quantity_sold': p.total_quantity_sold or 0,
                    'total_sales_count': p.total_sales_count or 0,
                    'total_revenue': str(p.total_revenue or 0),
                    'total_profit': str(p.total_profit or 0),
                }
                for p in products
            ]
        
        return Response({
            'period_days': days,
            'top_by_quantity': serialize_products(top_by_quantity),
            'top_by_revenue': serialize_products(top_by_revenue),
            'top_by_profit': serialize_products(top_by_profit),
        })


class InventoryViewSet(viewsets.ReadOnlyModelViewSet):  # Read-only for employee interface
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [permissions.AllowAny]  # Allow unauthenticated access
    
    def get_queryset(self):
        queryset = Inventory.objects.all()
        low_stock = self.request.query_params.get('low_stock', None)
        
        if low_stock == 'true':
            queryset = queryset.filter(quantity__lte=F('minimum_stock'))
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def stock_in(self, request):
        """Add stock to inventory"""
        serializer = StockInSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            inventory = serializer.save()
            inventory_serializer = InventorySerializer(inventory)
            return Response(inventory_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = StockMovement.objects.all()
        product_id = self.request.query_params.get('product_id', None)
        movement_type = self.request.query_params.get('movement_type', None)
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        if movement_type:
            queryset = queryset.filter(movement_type=movement_type)
        
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        return queryset


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def create_simple_sale(request):
    """Simple sale creation for debugging"""
    try:
        data = request.data
        items_data = data.get('items', [])
        
        if not items_data:
            return Response({'error': 'No items provided'}, status=400)
        
        # Get or create default employee
        default_employee, created = User.objects.get_or_create(
            username='store_employee',
            defaults={'first_name': 'Store', 'last_name': 'Employee'}
        )
        
        # Generate sale number
        sale_number = f"SALE-{str(uuid.uuid4())[:8].upper()}"
        
        # Create sale
        sale = Sale.objects.create(
            sale_number=sale_number,
            employee=default_employee,
            total_amount=0,
            payment_method=data.get('payment_method', 'CASH'),
            customer_name=data.get('customer_name', ''),
            customer_phone=data.get('customer_phone', ''),
            notes=data.get('notes', '')
        )
        
        total_amount = 0
        for item_data in items_data:
            try:
                product_id = item_data['product']
                quantity = int(item_data['quantity'])
                unit_price = float(item_data['unit_price'])
                
                # Get product
                product = Product.objects.get(id=product_id)
                
                # Create sale item
                sale_item = SaleItem.objects.create(
                    sale=sale,
                    product=product,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_price=quantity * unit_price
                )
                
                total_amount += quantity * unit_price
                
                # Update inventory
                try:
                    inventory = Inventory.objects.get(product=product)
                    inventory.quantity -= quantity
                    inventory.save()
                except Inventory.DoesNotExist:
                    pass  # Skip if no inventory record
                
            except Exception as e:
                return Response({'error': f'Error processing item: {str(e)}'}, status=400)
        
        # Update sale total
        sale.total_amount = total_amount
        sale.save()
        
        return Response({
            'success': True,
            'sale_id': sale.id,
            'sale_number': sale.sale_number,
            'total_amount': str(sale.total_amount),
            'message': f'Sale created successfully: {sale.sale_number}'
        })
        
    except Exception as e:
        return Response({'error': f'Sale creation failed: {str(e)}'}, status=500)


class SaleViewSet(viewsets.ModelViewSet):  # Allow create operations for sales
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [permissions.AllowAny]  # Allow unauthenticated access
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SaleCreateSerializer
        return SaleSerializer
    
    def get_queryset(self):
        queryset = Sale.objects.all()
        employee_id = self.request.query_params.get('employee_id', None)
        payment_method = self.request.query_params.get('payment_method', None)
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
        
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def today_sales(self, request):
        """Get today's sales summary"""
        today = timezone.now().date()
        sales = Sale.objects.filter(created_at__date=today)
        
        total_sales = sales.count()
        total_amount = sales.aggregate(total=Sum('total_amount'))['total'] or 0
        
        payment_methods = sales.values('payment_method').annotate(
            count=Count('id'),
            total=Sum('total_amount')
        )
        
        return Response({
            'date': today,
            'total_sales': total_sales,
            'total_amount': total_amount,
            'payment_methods': payment_methods
        })
    
    @action(detail=False, methods=['get'])
    def sales_summary(self, request):
        """Get sales summary for a date range"""
        days = int(request.query_params.get('days', 7))
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        sales = Sale.objects.filter(created_at__date__range=[start_date, end_date])
        
        daily_sales = sales.values('created_at__date').annotate(
            count=Count('id'),
            total=Sum('total_amount')
        ).order_by('created_at__date')
        
        total_sales = sales.count()
        total_amount = sales.aggregate(total=Sum('total_amount'))['total'] or 0
        
        return Response({
            'period': f"{start_date} to {end_date}",
            'total_sales': total_sales,
            'total_amount': total_amount,
            'daily_sales': daily_sales
        })


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.AllowAny]  # Allow unauthenticated access
    
    def get_queryset(self):
        queryset = Customer.objects.all()
        phone = self.request.query_params.get('phone', None)
        
        if phone:
            queryset = queryset.filter(phone_number__icontains=phone)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def prize_eligible(self, request):
        """Get customers eligible for prizes (100+ points)"""
        threshold = int(request.query_params.get('threshold', 100))
        eligible_customers = Customer.objects.filter(
            is_active=True
        ).annotate(
            available_points=F('total_points') - F('points_redeemed')
        ).filter(available_points__gte=threshold).order_by('-total_points')
        
        serializer = CustomerSerializer(eligible_customers, many=True)
        return Response({
            'threshold': threshold,
            'count': eligible_customers.count(),
            'customers': serializer.data
        })
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        """Register a new customer"""
        serializer = CustomerRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            customer = serializer.save()
            customer_serializer = CustomerSerializer(customer)
            return Response(customer_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def award_points(request):
    """Award or redeem points for a customer"""
    phone_number = request.data.get('phone_number')
    sale_amount = float(request.data.get('sale_amount', 0))
    sale_id = request.data.get('sale_id')
    points_to_redeem = request.data.get('points_to_redeem', 0)
    
    if not phone_number:
        return Response({'error': 'Phone number required'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    try:
        customer = Customer.objects.get(phone_number=phone_number, is_active=True)
        
        if sale_amount < 0:  # Redemption (negative sale amount)
            # Handle points redemption
            points_to_redeem = int(points_to_redeem) if points_to_redeem else int(abs(sale_amount))
            
            if customer.available_points < points_to_redeem:
                return Response({
                    'error': f'Insufficient points. Available: {customer.available_points}, Required: {points_to_redeem}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create redemption transaction
            PointTransaction.objects.create(
                customer=customer,
                transaction_type='REDEEMED',
                points=-points_to_redeem,  # Negative for redemption
                sale_id=sale_id,
                notes=f"Points redeemed for purchase (KSh {abs(sale_amount)})",
                created_by=request.user if request.user.is_authenticated else None
            )
            
            return Response({
                'success': True,
                'customer_name': customer.name,
                'points_redeemed': points_to_redeem,
                'remaining_points': customer.available_points,
                'message': f'{points_to_redeem} points redeemed successfully'
            })
            
        elif sale_amount > 0:  # Award points (positive sale amount)
            # Calculate points: 1 point per KSh 100 spent
            points_to_award = int(sale_amount // 100)
            
            if points_to_award > 0:
                # Create point transaction
                PointTransaction.objects.create(
                    customer=customer,
                    transaction_type='EARNED',
                    points=points_to_award,
                    sale_id=sale_id,
                    notes=f"Points earned from sale (KSh {sale_amount})",
                    created_by=request.user if request.user.is_authenticated else None
                )
                
                return Response({
                    'success': True,
                    'customer_name': customer.name,
                    'points_awarded': points_to_award,
                    'total_points': customer.total_points,
                    'available_points': customer.available_points
                })
            else:
                return Response({
                    'success': True,
                    'message': 'No points awarded (minimum KSh 100 required)',
                    'points_awarded': 0
                })
        else:
            return Response({'error': 'Invalid sale amount'}, 
                           status=status.HTTP_400_BAD_REQUEST)
            
    except Customer.DoesNotExist:
        return Response({'error': 'Customer not found'}, 
                       status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def create_backup(request):
    """Create a data backup"""
    backup_format = request.data.get('format', 'json')  # json or sql
    include_media = request.data.get('include_media', False)
    
    if backup_format not in ['json', 'sql']:
        return Response({'error': 'Invalid format. Use "json" or "sql"'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Create temporary directory for backup
        with tempfile.TemporaryDirectory() as temp_dir:
            # Run backup command
            call_command('backup_data', 
                        format=backup_format,
                        output_dir=temp_dir,
                        include_media=include_media)
            
            # Find the created backup file
            backup_files = [f for f in os.listdir(temp_dir) 
                           if f.startswith('liquor_store_backup_')]
            
            if not backup_files:
                return Response({'error': 'Backup creation failed'}, 
                               status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            backup_file = backup_files[0]
            backup_path = os.path.join(temp_dir, backup_file)
            
            # Read backup file and return as download
            with open(backup_path, 'rb') as f:
                response = HttpResponse(f.read(), 
                                      content_type='application/octet-stream')
                response['Content-Disposition'] = f'attachment; filename="{backup_file}"'
                return response
                
    except Exception as e:
        return Response({'error': f'Backup creation failed: {str(e)}'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def backup_status(request):
    """Get backup system status and information"""
    # Check if backup directory exists
    backup_dir = 'backups'
    backups = []
    
    if os.path.exists(backup_dir):
        backup_files = [f for f in os.listdir(backup_dir) 
                       if f.startswith('liquor_store_backup_')]
        
        for backup_file in sorted(backup_files, reverse=True):
            file_path = os.path.join(backup_dir, backup_file)
            file_stat = os.stat(file_path)
            
            backups.append({
                'filename': backup_file,
                'size': file_stat.st_size,
                'created_at': datetime.fromtimestamp(file_stat.st_ctime).isoformat(),
                'format': 'json' if backup_file.endswith('.json') else 'archive'
            })
    
    # Get database statistics
    stats = {
        'categories': Category.objects.count(),
        'products': Product.objects.count(),
        'inventory_items': Inventory.objects.count(),
        'stock_movements': StockMovement.objects.count(),
        'sales': Sale.objects.count(),
        'customers': Customer.objects.count(),
        'point_transactions': PointTransaction.objects.count(),
    }
    
    return Response({
        'backup_system': {
            'available': True,
            'formats_supported': ['json', 'sql'],
            'media_backup_supported': True,
        },
        'recent_backups': backups[:10],  # Last 10 backups
        'database_stats': stats,
        'last_backup': backups[0] if backups else None
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def control_automated_backups(request):
    """Control automated backup system"""
    from .backup_scheduler import (
        start_automated_backups, 
        stop_automated_backups, 
        get_backup_scheduler_status
    )
    
    action = request.data.get('action')
    
    if action not in ['start', 'stop', 'status']:
        return Response({'error': 'Invalid action. Use start, stop, or status'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    try:
        if action == 'start':
            interval_hours = request.data.get('interval_hours', 6)
            max_backups = request.data.get('max_backups', 20)
            backup_dir = request.data.get('backup_dir', 'backups')
            
            scheduler = start_automated_backups(interval_hours, max_backups, backup_dir)
            
            return Response({
                'success': True,
                'message': f'Automated backups started (every {interval_hours} hours)',
                'status': scheduler.get_status()
            })
            
        elif action == 'stop':
            stop_automated_backups()
            return Response({
                'success': True,
                'message': 'Automated backups stopped'
            })
            
        elif action == 'status':
            backup_status = get_backup_scheduler_status()
            return Response({
                'success': True,
                'status': backup_status
            })
            
    except Exception as e:
        return Response({'error': f'Failed to {action} automated backups: {str(e)}'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)
