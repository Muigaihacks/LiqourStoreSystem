# Admin Panel Access - Production

## 🎯 **Admin Panel URL**

The Django admin panel is accessible at:

**Production URL:**
```
https://liqourstoresystem.onrender.com/admin/
```

---

## ✅ **How It Works**

### **URL Configuration:**

1. **Main URLs** (`liquor_store_backend/urls.py`):
   ```python
   urlpatterns = [
       path('admin/', admin.site.urls),  # Admin panel
       path('', include('store.urls')),  # API routes and React frontend
   ]
   ```

2. **Store URLs** (`store/urls.py`):
   ```python
   urlpatterns = [
       path('api/', ...),  # API endpoints
       path('', TemplateView.as_view(template_name='index.html')),  # React frontend
   ]
   ```

### **URL Routing:**

| URL Path | What It Serves |
|----------|----------------|
| `/admin/` | Django Admin Panel |
| `/api/*` | API Endpoints |
| `/` | React Frontend (user interface) |
| `/inventory`, `/sales`, etc. | React Router (handled by React) |

---

## 🔐 **Creating Admin User**

After deployment, you need to create a superuser:

### **Option 1: Using Render Shell**

1. Go to your Render service
2. Click **"Shell"** tab
3. Run:
   ```bash
   python manage.py createsuperuser
   ```
4. Enter username, email, and password

### **Option 2: Using Render CLI**

```bash
render run python manage.py createsuperuser
```

---

## 📋 **Access Summary**

### **User Interface (Frontend):**
- **URL:** `https://liqourstoresystem.onrender.com/`
- **Login:** Use hardcoded credentials (admin/admin123)

### **Admin Panel (Django Admin):**
- **URL:** `https://liqourstoresystem.onrender.com/admin/`
- **Login:** Use superuser credentials created after deployment

---

## 🎯 **Important Notes**

1. **Different Credentials:**
   - Frontend login: Hardcoded in React (`admin`/`admin123`)
   - Admin panel: Django superuser (created via `createsuperuser`)

2. **Different Uses:**
   - Frontend: For POS/operational use (sales, inventory)
   - Admin panel: For management (add products, manage users, etc.)

3. **Both Accessible:**
   - Both are on the same domain
   - Frontend: `/`
   - Admin: `/admin/`

---

## ✅ **Quick Access Guide**

**For Daily Operations (POS):**
- Go to: `https://liqourstoresystem.onrender.com/`
- Login with: `admin` / `admin123`

**For Admin Management:**
- Go to: `https://liqourstoresystem.onrender.com/admin/`
- Login with: Superuser credentials (create after deployment)

---

**Everything is on the same domain - no separate URLs needed!**

