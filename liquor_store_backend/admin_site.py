"""
Custom Django Unfold admin site. Used at /admin/ so the whole admin uses Unfold UI.
"""
from unfold.sites import UnfoldAdminSite


admin_site = UnfoldAdminSite(name="admin")
