from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet)
router.register(r'products', views.ProductViewSet)
router.register(r'inventory', views.InventoryViewSet)
router.register(r'stock-movements', views.StockMovementViewSet)
router.register(r'sales', views.SaleViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/create-sale/', views.create_simple_sale, name='create_simple_sale'),
]
