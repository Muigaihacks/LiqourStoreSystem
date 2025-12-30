# Render Deployment Fix

## 🔧 **Build Configuration Update**

### **Issue:**
Build failing because:
1. Node.js not installed during build
2. Frontend build needs to happen before Django collectstatic
3. Build command needs proper ordering

### **Solution Applied:**

1. **Updated Procfile:**
   - Added `release` command for migrations
   - Added worker/timeout configuration to web command

2. **Created build.sh:**
   - Proper build order
   - Install Python deps → Install Node deps → Build React → Collect static

3. **Added .nvmrc:**
   - Specifies Node.js version for Render

### **Updated Build Command for Render:**

In Render Web Service settings, update the build command to:

```bash
chmod +x build.sh && ./build.sh
```

**OR** use this inline build command:

```bash
pip install --upgrade pip && pip install -r requirements.txt && cd frontend && npm install && npm run build && cd .. && python manage.py collectstatic --noinput
```

---

## 📋 **Render Configuration**

### **Build Command:**
```
pip install --upgrade pip && pip install -r requirements.txt && cd frontend && npm install && npm run build && cd .. && python manage.py collectstatic --noinput
```

### **Start Command:**
```
python manage.py migrate --noinput || true && gunicorn liquor_store_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
```

---

## ✅ **Checklist**

- [ ] Build command updated in Render
- [ ] Start command updated in Render
- [ ] All environment variables set
- [ ] Database connected
- [ ] Redeploy

---

**After updating, click "Manual Deploy" → "Deploy latest commit"**

