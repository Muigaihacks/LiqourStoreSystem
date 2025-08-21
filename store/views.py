from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import datetime, timedelta

from .models import Category, Product, Inventory, StockMovement, Sale, SaleItem
from .serializers import (
    CategorySerializer, ProductSerializer, InventorySerializer,
    StockMovementSerializer, SaleSerializer, SaleCreateSerializer,
    StockInSerializer, BarcodeLookupSerializer, UserSerializer
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    
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
        products = Product.objects.filter(inventory__quantity__lte=models.F('inventory__minimum_stock'))
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)


class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Inventory.objects.all()
        low_stock = self.request.query_params.get('low_stock', None)
        
        if low_stock == 'true':
            queryset = queryset.filter(quantity__lte=models.F('minimum_stock'))
        
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


class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
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


# Import missing modules
from django.db import models
from django.db.models import Count
