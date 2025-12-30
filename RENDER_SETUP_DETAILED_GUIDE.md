# Detailed Render Setup Guide - Step by Step

## 🌍 **Region Selection**

**Recommended: EU Central (Frankfurt, Germany)**

**Why:**
- ✅ Closest to Kenya (better latency)
- ✅ Good connectivity to Africa
- ✅ Stable and reliable
- ✅ Free tier available in all regions

**Options:**
- **EU Central** - Best for Kenya ✅ (Recommended)
- **Southeast Asia** - Alternative (Singapore)
- **US East/West** - Further away, higher latency

**Note:** All regions support free tier, so choose based on location (EU Central is best for you).

---

## 📋 **Setup Order**

### **Step 1: Create PostgreSQL Database FIRST**
1. Click **"New +"** → **"PostgreSQL"**
2. Name: `liquor-store-db`
3. Region: **EU Central** (same as web service)
4. Plan: **Free**
5. Click **"Create Database"**
6. **IMPORTANT:** Note the connection details (they appear after creation)

### **Step 2: Create Web Service**
1. Click **"New +"** → **"Web Service"**
2. Connect GitHub (if not already)
3. Select repository: `LiqourStoreSystem`
4. Configure the service

### **Step 3: Add Database Variables to Web Service**
After creating PostgreSQL, add its connection details to the web service environment variables.

---

## 🔧 **Environment Variables Setup**

### **Where to Add Variables:**

**In the Web Service (NOT in PostgreSQL service):**

Go to your Web Service → **"Environment"** tab → Click **"Add Environment Variable"**

### **Two Ways to Add:**

**Option 1: Manual Entry (Recommended for first time)**
- Click **"Add Environment Variable"**
- Enter Name and Value manually
- Better for understanding what each variable does

**Option 2: Import from .env**
- Click **"Add from .env"**
- Paste your `.env` file contents
- Render will parse and add all variables
- Faster but less control

---

## 📝 **Complete Environment Variables List**

### **Step 1: Add These Variables FIRST (Before Database)**

In your Web Service → Environment tab, add these:

```
Name: DJANGO_SETTINGS_MODULE
Value: liquor_store_backend.settings_production

Name: SECRET_KEY
Value: ur_m%8f+5-9pl&$lg^qmyz-p(96$w7a@*o^ct7$&!8l=^83e(+

Name: DEBUG
Value: False

Name: PYTHON_VERSION
Value: 3.13.0
```

**Note:** Replace SECRET_KEY with the one generated earlier (or generate new one if needed).

---

### **Step 2: Create PostgreSQL Database**

1. Go to Dashboard
2. Click **"New +"** → **"PostgreSQL"**
3. Fill in:
   - **Name:** `liquor-store-db`
   - **Region:** `EU Central`
   - **Plan:** `Free`
4. Click **"Create Database"**
5. Wait for it to provision (1-2 minutes)

---

### **Step 3: Get Database Connection Details**

After PostgreSQL is created:

1. Click on your PostgreSQL service
2. Go to **"Info"** tab or **"Connections"** section
3. You'll see:
   - **Internal Database URL:** (for Render services)
   - **Host:** `dpg-xxxxx-a.oregon-postgres.render.com`
   - **Port:** `5432`
   - **Database:** `liquor_store_xxxx`
   - **User:** `liquor_store_user`
   - **Password:** `xxxxxxxxxxxxxxxx`

**Copy these values!**

---

### **Step 4: Add Database Variables to Web Service**

Go back to your Web Service → **"Environment"** tab

Add these variables (use values from PostgreSQL service):

```
Name: DB_ENGINE
Value: django.db.backends.postgresql

Name: DB_NAME
Value: <paste from PostgreSQL - Database name>

Name: DB_USER
Value: <paste from PostgreSQL - User>

Name: DB_PASSWORD
Value: <paste from PostgreSQL - Password>

Name: DB_HOST
Value: <paste from PostgreSQL - Host>

Name: DB_PORT
Value: 5432
```

**OR** (Easier - if available):

```
Name: DATABASE_URL
Value: <paste from PostgreSQL - Internal Database URL>
```

Some Render configurations auto-parse DATABASE_URL, so check if this works.

---

### **Step 5: Add Allowed Hosts**

```
Name: ALLOWED_HOSTS
Value: your-service-name.onrender.com
```

**Note:** Replace `your-service-name` with your actual service name (you'll see it after creating the service).

---

## 🔄 **Complete Setup Flow**

```
1. Create PostgreSQL Database
   ↓
2. Create Web Service
   ↓
3. Add Django Settings Variables
   ↓
4. Add Database Connection Variables (from PostgreSQL)
   ↓
5. Configure Build/Start Commands
   ↓
6. Deploy
```

---

## ✅ **Quick Checklist**

### **PostgreSQL Service:**
- [ ] Created with name: `liquor-store-db`
- [ ] Region: `EU Central`
- [ ] Plan: `Free`
- [ ] Status: `Available`
- [ ] Connection details copied

### **Web Service Environment Variables:**
- [ ] `DJANGO_SETTINGS_MODULE` = `liquor_store_backend.settings_production`
- [ ] `SECRET_KEY` = (generated key)
- [ ] `DEBUG` = `False`
- [ ] `PYTHON_VERSION` = `3.13.0`
- [ ] `DB_ENGINE` = `django.db.backends.postgresql`
- [ ] `DB_NAME` = (from PostgreSQL)
- [ ] `DB_USER` = (from PostgreSQL)
- [ ] `DB_PASSWORD` = (from PostgreSQL)
- [ ] `DB_HOST` = (from PostgreSQL)
- [ ] `DB_PORT` = `5432`
- [ ] `ALLOWED_HOSTS` = (your-service-name.onrender.com)

---

## 🎯 **Key Points**

1. **Region:** EU Central (best for Kenya)
2. **Order:** PostgreSQL first, then Web Service, then add DB vars
3. **Variables:** All go in Web Service, NOT PostgreSQL service
4. **Database vars:** Copy from PostgreSQL service Info tab
5. **Allowed Hosts:** Use your actual service URL

---

## 🐛 **Troubleshooting**

### **Can't find database connection details?**
- Click on PostgreSQL service
- Go to "Info" tab
- Look for "Internal Database URL" or connection details

### **Variables not saving?**
- Make sure you're in Web Service, not PostgreSQL service
- Click "Save Changes" after adding variables

### **Build fails?**
- Check all required variables are added
- Verify database connection details are correct
- Check build logs for specific errors

---

**Ready to proceed? Follow this guide step by step!**

