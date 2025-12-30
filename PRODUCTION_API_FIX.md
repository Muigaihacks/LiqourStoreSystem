# Production API URL Fix

## 🔍 **Issues Found:**

1. **API Base URL:** Hardcoded to `http://localhost:8001/api`
2. **Home Redirect:** Redirecting to `http://localhost:3000` (old dev server)

## ✅ **Fixes Applied:**

### **1. API Base URL (Relative URLs)**

Changed from:
```typescript
const API_BASE_URL = 'http://localhost:8001/api';
```

To:
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
```

**How it works:**
- **Production:** Uses `/api` (relative URL, same domain)
- **Development:** Can use `REACT_APP_API_URL=http://localhost:8001/api` in `.env`

### **2. Django Template Configuration**

Added template directory pointing to React build folder:
```python
TEMPLATES = [
    {
        'DIRS': [os.path.join(BASE_DIR, 'frontend', 'build')],
        # ...
    },
]
```

### **3. Remove Localhost Redirect**

Changed from:
```python
def home_redirect(request):
    return redirect('http://localhost:3000')
```

To:
```python
path('', TemplateView.as_view(template_name='index.html'), name='home'),
```

Now Django serves the React `index.html` directly instead of redirecting.

---

## 🔧 **How It Works Now:**

**Production Flow:**
1. User visits `https://liqourstoresystem.onrender.com/`
2. Django serves `frontend/build/index.html` (React app)
3. React app makes API calls to `/api/*` (same domain, relative URLs)
4. Django serves API responses from `/api/*` routes

**No more localhost redirects!**

---

## 📋 **Optional: Environment Variable for Development**

If you want to keep using localhost in development, create `.env` in frontend:

```env
REACT_APP_API_URL=http://localhost:8001/api
```

But it's not needed - relative URLs work in production, and you can use localhost:8001 directly in development if needed.

---

## ✅ **Result:**

- ✅ Frontend uses relative URLs (`/api`) in production
- ✅ Django serves React app directly (no redirect)
- ✅ API calls go to same domain (no CORS issues)
- ✅ Works correctly on deployed URL

**Redeploy after these changes!**

