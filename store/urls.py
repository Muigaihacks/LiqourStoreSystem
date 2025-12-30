from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.shortcuts import redirect
from . import views

def home_redirect(request):
    """Redirect to React frontend"""
    return redirect('http://localhost:3000')

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet)
router.register(r'products', views.ProductViewSet)
router.register(r'inventory', views.InventoryViewSet)
router.register(r'stock-movements', views.StockMovementViewSet)
router.register(r'sales', views.SaleViewSet)
router.register(r'customers', views.CustomerViewSet)
router.register(r'point-transactions', views.PointTransactionViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/create-sale/', views.create_simple_sale, name='create_simple_sale'),
    path('api/award-points/', views.award_points, name='award_points'),
    path('api/backup/create/', views.create_backup, name='create_backup'),
    path('api/backup/status/', views.backup_status, name='backup_status'),
    path('api/backup/auto/', views.control_automated_backups, name='control_automated_backups'),
    path('', home_redirect, name='home'),  # Root redirect to React frontend
]
