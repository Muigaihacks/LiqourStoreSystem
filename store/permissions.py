"""Custom permissions for frontend Management module."""
from rest_framework import permissions
from .models import UserProfile


class HasManagementProfile(permissions.BasePermission):
    """
    User must be authenticated and have at least one UserProfile
    with can_use_management_module=True (for the requested branch when applicable).
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return UserProfile.objects.filter(
            user=request.user, can_use_management_module=True
        ).exists()
