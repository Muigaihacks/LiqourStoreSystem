# Create Superuser on Render Free Tier (No Shell Access)

## 🎯 **Solution: Use Environment Variables**

Since Render free tier doesn't have shell access, we'll create the superuser automatically using environment variables.

---

## 📋 **Step-by-Step Instructions**

### **Step 1: Add Environment Variables to Render**

1. Go to your Render service dashboard
2. Click on **"Environment"** tab
3. Click **"Add Environment Variable"**

Add these three variables:

**Variable 1:**
- **Name:** `ADMIN_USERNAME`
- **Value:** `admin` (or your preferred username)

**Variable 2:**
- **Name:** `ADMIN_EMAIL`
- **Value:** `admin@liquorstore.com` (or your email)

**Variable 3:**
- **Name:** `ADMIN_PASSWORD`
- **Value:** `YourSecurePassword123!` (use a strong password!)

### **Step 2: Redeploy**

After adding the environment variables:

1. Click **"Manual Deploy"** tab
2. Click **"Deploy latest commit"**
3. Wait for deployment to complete

The superuser will be created automatically during deployment!

---

## ✅ **How It Works**

The `Procfile` now includes:
```
release: python manage.py migrate --noinput || true && python manage.py create_superuser_from_env || true
```

This means:
1. Run migrations
2. Create superuser from environment variables (if not exists)
3. Start the web server

---

## 🔐 **Login Credentials**

After deployment, use these to log in at `https://liqourstoresystem.onrender.com/admin/`:

- **Username:** (value of `ADMIN_USERNAME` env var)
- **Password:** (value of `ADMIN_PASSWORD` env var)

---

## ⚠️ **Important Notes**

1. **Security:** The password is stored as an environment variable. Make sure it's strong!
2. **One-time:** Superuser is only created if it doesn't already exist
3. **Change later:** You can change the password later in the admin panel (User → Change password)
4. **Multiple users:** To create additional superusers, you'd need to temporarily add different `ADMIN_USERNAME` values

---

## 🔄 **If You Need to Change Password Later**

Once you're logged into the admin panel:
1. Go to Users → Click on your username
2. Scroll to "Change password" section
3. Enter new password and save

---

## 📋 **Quick Checklist**

- [ ] Add `ADMIN_USERNAME` environment variable
- [ ] Add `ADMIN_EMAIL` environment variable
- [ ] Add `ADMIN_PASSWORD` environment variable (strong password!)
- [ ] Save changes
- [ ] Redeploy service
- [ ] Visit `https://liqourstoresystem.onrender.com/admin/`
- [ ] Login with your credentials

---

**This method works perfectly on Render's free tier without shell access!** ✅

