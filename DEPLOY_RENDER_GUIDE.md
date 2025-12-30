# Deploy Liquor Store to Render.com (Free Tier)

## 🚀 Quick Deployment Guide

### Step 1: Prepare Repository
✅ All files are ready (Procfile, runtime.txt, render.yaml)

### Step 2: Sign Up at Render
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended)
3. Verify your email

### Step 3: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub account (if not already connected)
3. Select repository: **`LiqourStoreSystem`** (or your repo name)
4. Configure:
   - **Name:** `liquor-store-backend`
   - **Region:** Choose closest to you
   - **Branch:** `main`
   - **Root Directory:** (leave empty - root is fine)
   - **Runtime:** `Python 3`
   - **Build Command:**
     ```bash
     pip install -r requirements.txt && cd frontend && npm install && npm run build && cd .. && python manage.py collectstatic --noinput
     ```
   - **Start Command:**
     ```bash
     python manage.py migrate && gunicorn liquor_store_backend.wsgi:application --bind 0.0.0.0:$PORT
     ```

### Step 4: Add PostgreSQL Database
1. Click **"New +"** → **"PostgreSQL"**
2. Name: `liquor-store-db`
3. Plan: **Free**
4. Click **"Create Database"**
5. Note the connection details (will be in environment variables)

### Step 5: Configure Environment Variables
In your Web Service settings, go to **"Environment"** tab and add:

**Required Variables:**
```
DJANGO_SETTINGS_MODULE=liquor_store_backend.settings_production
SECRET_KEY=your-secret-key-here-generate-one
DEBUG=False
ALLOWED_HOSTS=your-service-name.onrender.com
```

**Database Variables (from PostgreSQL service):**
- Click on your PostgreSQL database service
- Copy the values from "Connections" section
- Add to Web Service environment variables:
```
DB_ENGINE=django.db.backends.postgresql
DB_NAME=<from postgres service>
DB_USER=<from postgres service>
DB_PASSWORD=<from postgres service>
DB_HOST=<from postgres service>
DB_PORT=5432
```

**Generate Secret Key:**
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Step 6: Deploy
1. Click **"Save Changes"**
2. Render will automatically start building and deploying
3. Wait 5-10 minutes for first deployment
4. Your app will be live at: `https://your-service-name.onrender.com`

### Step 7: Create Superuser
After deployment, create admin user:

**Option A: Using Render Shell**
1. Go to your service → **"Shell"** tab
2. Run:
   ```bash
   python manage.py createsuperuser
   ```

**Option B: Using Render CLI**
```bash
render run python manage.py createsuperuser
```

### Step 8: Access Your Application
- **Frontend:** `https://your-service-name.onrender.com`
- **Admin Panel:** `https://your-service-name.onrender.com/admin/`
- **API:** `https://your-service-name.onrender.com/api/`

---

## 📝 Notes

### Free Tier Limitations:
- ✅ Sleeps after 15 minutes of inactivity
- ✅ Cold start takes ~30-60 seconds when waking up
- ✅ 750 hours/month free (enough for portfolio demo)
- ✅ Automatic HTTPS/SSL included

### What Happens:
1. First visitor after inactivity: App wakes up (30-60 sec wait)
2. App stays awake while being used
3. After 15 min of no activity: App sleeps
4. Next visitor: Wakes up again

### For Production (Later):
Upgrade to **"Starter"** plan ($7/month) for:
- No sleep (always on)
- Faster response times
- Better performance

---

## ✅ Deployment Checklist

- [ ] Repository pushed to GitHub
- [ ] Render account created
- [ ] Web service created
- [ ] PostgreSQL database added
- [ ] Environment variables configured
- [ ] Deployment successful
- [ ] Superuser created
- [ ] Test login and functionality
- [ ] Update portfolio links

---

## 🐛 Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Ensure all dependencies in requirements.txt
- Check Python version compatibility

### Database Connection Error
- Verify environment variables are set correctly
- Check PostgreSQL service is running
- Ensure database name/user/password match

### App Won't Start
- Check start command is correct
- Verify PORT variable is used (Render provides this)
- Check logs for specific errors

### Static Files Not Loading
- Ensure `collectstatic` runs in build command
- Check STATIC_ROOT setting
- Verify WhiteNoise middleware is configured

---

## 🎉 Success!

Once deployed, your Liquor Store system will be live and accessible!

