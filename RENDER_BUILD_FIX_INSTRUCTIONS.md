# Render Build Fix - Instructions

## 🔧 **What Was Wrong:**

The build was failing because:
1. Build command wasn't properly structured
2. Node.js installation might not be automatic
3. Build order needs to be explicit

## ✅ **Fix Steps:**

### **Step 1: Update Build Command in Render**

Go to your Web Service → **"Settings"** tab → **"Build Command"**

**Replace the build command with:**

```bash
pip install --upgrade pip && pip install -r requirements.txt && cd frontend && npm install && npm run build && cd .. && python manage.py collectstatic --noinput
```

**OR if that doesn't work, try this version (with explicit Node installation):**

```bash
pip install --upgrade pip && pip install -r requirements.txt && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash && export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && nvm install 18 && nvm use 18 && cd frontend && npm install && npm run build && cd .. && python manage.py collectstatic --noinput
```

### **Step 2: Update Start Command**

Go to **"Start Command"** section, replace with:

```bash
python manage.py migrate --noinput || true && gunicorn liquor_store_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
```

### **Step 3: Check Environment Variables**

Make sure these are set:
- ✅ `DJANGO_SETTINGS_MODULE=liquor_store_backend.settings_production`
- ✅ `SECRET_KEY` (your generated key)
- ✅ `DEBUG=False`
- ✅ All database variables (`DB_NAME`, `DB_USER`, etc.)
- ✅ `ALLOWED_HOSTS` (your-service-name.onrender.com)

### **Step 4: Redeploy**

1. Click **"Save Changes"**
2. Go to **"Manual Deploy"** tab
3. Click **"Deploy latest commit"**
4. Wait for build to complete (5-10 minutes)

---

## 🐛 **If Still Failing:**

### **Check Build Logs:**

1. Go to your service
2. Click **"Logs"** tab
3. Look for error messages
4. Common issues:

**Issue: Node.js not found**
- Solution: Use the longer build command with explicit Node installation

**Issue: npm install fails**
- Solution: Check if package.json is correct
- Check if there are any dependency issues

**Issue: collectstatic fails**
- Solution: Make sure frontend/build exists before collectstatic runs

**Issue: Database connection fails**
- Solution: Check database environment variables are correct
- Make sure PostgreSQL service is running

---

## 📋 **Alternative: Simpler Build Command**

If the above doesn't work, try this simpler approach:

**Build Command:**
```bash
pip install --upgrade pip && pip install -r requirements.txt && (cd frontend && npm install && npm run build) && python manage.py collectstatic --noinput
```

**Start Command:**
```bash
gunicorn liquor_store_backend.wsgi:application --bind 0.0.0.0:$PORT
```

---

## ✅ **What Should Happen:**

1. ✅ Python dependencies install
2. ✅ Node.js dependencies install (frontend)
3. ✅ React frontend builds
4. ✅ Django static files collected
5. ✅ Migrations run (on start)
6. ✅ Gunicorn starts
7. ✅ App is live!

---

**After updating, redeploy and check logs for any errors!**

