"""Context processors for admin branch switcher."""
from .models import Branch
from .admin import CURRENT_BRANCH_SESSION_KEY


def admin_branch_switcher(request):
    """Add current_branch and admin_branches to context for staff users."""
    if not getattr(request, "user", None) or not request.user.is_staff:
        return {}
    branch_id = request.session.get(CURRENT_BRANCH_SESSION_KEY)
    current_branch = Branch.objects.filter(pk=branch_id).first() if branch_id else None
    if not current_branch and branch_id is None:
        # Default to first active branch
        first = Branch.objects.filter(is_active=True).order_by("name").first()
        if first:
            request.session[CURRENT_BRANCH_SESSION_KEY] = first.pk
            current_branch = first
    branches = list(Branch.objects.filter(is_active=True).order_by("name"))
    return {
        "admin_current_branch": current_branch,
        "admin_branches": branches,
    }
