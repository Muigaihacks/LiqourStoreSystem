"""
URL configuration for liquor_store_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.shortcuts import redirect
from django.urls import path, include, reverse
from django.contrib.admin.views.decorators import staff_member_required

from store.models import Branch


@staff_member_required
def set_current_branch(request, branch_id):
    """Set the current branch in session for admin branch switcher. Redirects to admin or next."""
    branch = Branch.objects.filter(pk=branch_id, is_active=True).first()
    if branch:
        request.session["current_branch_id"] = branch_id
    next_url = request.GET.get("next") or reverse("admin:index")
    return redirect(next_url)


urlpatterns = [
    path("admin/set-branch/<int:branch_id>/", set_current_branch, name="admin_set_branch"),
    path("admin/", admin.site.urls),
    path("", include("store.urls")),  # This includes the /api/ paths from store.urls
    path("api-auth/", include("rest_framework.urls")),
]
