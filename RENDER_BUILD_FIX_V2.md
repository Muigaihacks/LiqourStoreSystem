# Render Build Fix V2 - Simplified Approach

## 🔍 **Issue: Exit Status 127**

Exit code 127 = "command not found" - the Node.js installation command was wrong.

## ✅ **Solution: Render Auto-Detects Node.js**

Render automatically detects Node.js when it sees:
1. `package.json` in root directory
2. `frontend/package.json` 

We just need to tell Render to use it properly.

---

## 🔧 **New Build Command (Simple):**

**Go to Render → Your Service → Settings → Build Command**

Replace with this **simple** command:

```bash
pip install --upgrade pip && pip install -r requirements.txt && npm install --prefix frontend && npm run build --prefix frontend && python manage.py collectstatic --noinput
```

**OR even simpler (if npm is available):**

```bash
pip install -r requirements.txt && (cd frontend && npm install && npm run build) && python manage.py collectstatic --noinput
```

---

## 🎯 **Best Solution: Use package.json**

I've created a `package.json` in the root directory. This tells Render:
- Node.js version needed (18.x)
- That this project needs Node.js

**Now use this build command:**

```bash
pip install --upgrade pip && pip install -r requirements.txt && npm run build && python manage.py collectstatic --noinput
```

The `npm run build` will run the script in root `package.json`, which builds the frontend.

---

## 📋 **Updated Steps:**

1. **Pull latest changes** (I've added root package.json)
2. **In Render → Settings → Build Command:**
   ```
   pip install --upgrade pip && pip install -r requirements.txt && npm run build && python manage.py collectstatic --noinput
   ```
3. **Start Command:**
   ```
   python manage.py migrate --noinput || true && gunicorn liquor_store_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
   ```
4. **Save and Redeploy**

---

## 🐛 **If npm is still not found:**

Render might need explicit Node.js. Try this build command:

```bash
pip install --upgrade pip && pip install -r requirements.txt && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt-get install -y nodejs && npm run build && python manage.py collectstatic --noinput
```

But this is less likely to work on Render's build environment.

---

## ✅ **Recommended: Check Build Logs**

1. Go to **Logs** tab in Render
2. Look for what's failing
3. Share the error message so we can fix it precisely

The root `package.json` I added should help Render detect Node.js automatically!

