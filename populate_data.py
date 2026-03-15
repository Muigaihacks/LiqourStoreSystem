import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "liquor_store_backend.settings")
django.setup()

from django.contrib.auth.models import User
from store.models import Branch, UserProfile

# Create Branches
main_branch, _ = Branch.objects.get_or_create(name="Main", defaults={"slug": "main"})
gate_c_branch, _ = Branch.objects.get_or_create(name="Gate C", defaults={"slug": "gate-c"})
print("Branches created.")

# Create Users
def create_user(username, password="frontend123", is_superuser=False):
    user, created = User.objects.get_or_create(username=username)
    user.set_password(password)
    user.is_staff = True
    user.is_superuser = is_superuser
    user.save()
    return user

admin = create_user("admin", is_superuser=True)
kim = create_user("Kim")
claire = create_user("Claire")
netanyahu = create_user("Netanyahu")
print("Users created.")

# Create Profiles
# Admin gets both
UserProfile.objects.get_or_create(user=admin, branch=main_branch, can_use_management_module=True)
UserProfile.objects.get_or_create(user=admin, branch=gate_c_branch, can_use_management_module=True)

# Kim -> Gate C (Manager)
UserProfile.objects.get_or_create(user=kim, branch=gate_c_branch, can_use_management_module=True)

# Claire -> Main (Manager)
UserProfile.objects.get_or_create(user=claire, branch=main_branch, can_use_management_module=True)

# Netanyahu -> Main (Manager)
UserProfile.objects.get_or_create(user=netanyahu, branch=main_branch, can_use_management_module=True)

print("Profiles assigned.")
