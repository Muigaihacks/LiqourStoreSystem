from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.views.generic import TemplateView
from . import views
from . import auth_views

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
    path('api/auth/login/', auth_views.login, name='auth_login'),
    path('api/auth/logout/', auth_views.logout, name='auth_logout'),
    path('api/auth/me/', auth_views.me, name='auth_me'),
    path('api/create-sale/', views.create_simple_sale, name='create_simple_sale'),
    path('api/award-points/', views.award_points, name='award_points'),
    path('api/backup/create/', views.create_backup, name='create_backup'),
    path('api/backup/status/', views.backup_status, name='backup_status'),
    path('api/backup/auto/', views.control_automated_backups, name='control_automated_backups'),
    # Serve React app for all non-API routes (React Router will handle client-side routing)
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
]
