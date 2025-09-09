# 🚀 Liquor Store System - Production Deployment Guide

## 📋 **Pre-Deployment Checklist**

### **System Requirements**
- **Server**: Ubuntu 20.04+ or similar Linux distribution
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB SSD
- **Domain**: Registered domain name pointing to your server
- **SSL Certificate**: Let's Encrypt (free) or commercial certificate

### **Required Services**
- Python 3.8+
- PostgreSQL 12+
- Nginx
- Supervisor
- Node.js 16+ (for building frontend)

## 🎯 **Deployment Options**

### **Option 1: Automated Deployment (Recommended)**

1. **Upload your code to a Git repository** (GitHub, GitLab, etc.)

2. **Run the deployment script on your server:**
   ```bash
   wget https://raw.githubusercontent.com/yourusername/liquor-store/main/deploy.sh
   chmod +x deploy.sh
   sudo ./deploy.sh
   ```

3. **Configure environment variables:**
   ```bash
   sudo nano /opt/liquor-store/.env
   ```
   Fill in your production settings using `env.example` as a template.

4. **Create Django superuser:**
   ```bash
   cd /opt/liquor-store/app
   sudo -u liquor-store /opt/liquor-store/venv/bin/python manage.py createsuperuser
   ```

5. **Set up SSL certificate:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

### **Option 2: Manual Deployment**

Follow these steps if you prefer manual control:

#### **1. Server Setup**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3 python3-venv python3-pip postgresql postgresql-contrib nginx supervisor git nodejs npm
```

#### **2. Database Setup**
```bash
sudo -u postgres psql
CREATE USER liquor_store_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE liquor_store_db OWNER liquor_store_user;
GRANT ALL PRIVILEGES ON DATABASE liquor_store_db TO liquor_store_user;
\q
```

#### **3. Application Setup**
```bash
# Create application directory
sudo mkdir -p /opt/liquor-store
cd /opt/liquor-store

# Clone your repository
sudo git clone https://github.com/yourusername/liquor-store.git app
cd app

# Create virtual environment
sudo python3 -m venv /opt/liquor-store/venv
sudo /opt/liquor-store/venv/bin/pip install -r requirements.txt

# Set up environment variables
sudo cp env.example /opt/liquor-store/.env
sudo nano /opt/liquor-store/.env  # Edit with your settings

# Run migrations
export DJANGO_SETTINGS_MODULE=liquor_store_backend.settings_production
sudo /opt/liquor-store/venv/bin/python manage.py migrate
sudo /opt/liquor-store/venv/bin/python manage.py collectstatic --noinput

# Build frontend
cd frontend
sudo npm install
sudo npm run build
cd ..
```

#### **4. Configure Services**
See the automated deployment script for Nginx, Supervisor, and Gunicorn configurations.

## 🔧 **Configuration Files**

### **Environment Variables (.env)**
```env
SECRET_KEY=your-super-secret-key-change-this
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

DB_ENGINE=django.db.backends.postgresql
DB_NAME=liquor_store_db
DB_USER=liquor_store_user
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### **Nginx Configuration**
The deployment script creates an Nginx configuration that:
- Serves the React frontend on `/`
- Proxies API requests to Django on `/api/`
- Serves static files efficiently
- Handles media file uploads

### **SSL/HTTPS Setup**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal (already set up by certbot)
sudo crontab -l | grep certbot
```

## 📊 **Post-Deployment Tasks**

### **1. Create Initial Data**
```bash
cd /opt/liquor-store/app
sudo -u liquor-store /opt/liquor-store/venv/bin/python manage.py createsuperuser
```

### **2. Add Initial Categories and Products**
- Access Django admin: `https://your-domain.com/admin/`
- Create product categories (Beer, Wine, Spirits, etc.)
- Add your initial product catalog with barcodes

### **3. Test the System**
- [ ] Frontend loads correctly
- [ ] Admin panel accessible
- [ ] API endpoints responding
- [ ] Barcode scanning works
- [ ] Sales processing works
- [ ] Customer registration works
- [ ] Backup system functional

### **4. Set Up Monitoring**
```bash
# Check service status
sudo supervisorctl status
sudo systemctl status nginx
sudo systemctl status postgresql

# View logs
sudo tail -f /opt/liquor-store/logs/django.log
sudo tail -f /opt/liquor-store/logs/gunicorn_error.log
```

## 🔐 **Security Checklist**

- [ ] Change all default passwords
- [ ] Set up firewall (UFW)
- [ ] Enable SSL/HTTPS
- [ ] Regular security updates
- [ ] Database backups configured
- [ ] Monitor error logs
- [ ] Set up fail2ban for SSH protection

### **Firewall Setup**
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw status
```

## 📱 **Mobile Optimization**

The React frontend is already mobile-responsive, but test on various devices:
- Tablet POS usage
- Mobile inventory checks
- Barcode scanning on mobile

## 🔄 **Backup Strategy**

### **Automated Backups**
The system includes automated backups that run every 6 hours:
```bash
# Manual backup
cd /opt/liquor-store/app
sudo -u liquor-store /opt/liquor-store/venv/bin/python manage.py backup_data

# Restore from backup
sudo -u liquor-store /opt/liquor-store/venv/bin/python manage.py restore_data backup_file.json
```

### **Database Backups**
```bash
# PostgreSQL backup
sudo -u postgres pg_dump liquor_store_db > backup.sql

# Restore
sudo -u postgres psql liquor_store_db < backup.sql
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **502 Bad Gateway**
   - Check Gunicorn status: `sudo supervisorctl status liquor-store`
   - Check logs: `sudo tail -f /opt/liquor-store/logs/gunicorn_error.log`

2. **Static Files Not Loading**
   - Run: `sudo /opt/liquor-store/venv/bin/python manage.py collectstatic --noinput`
   - Check Nginx configuration

3. **Database Connection Issues**
   - Verify PostgreSQL is running: `sudo systemctl status postgresql`
   - Check database credentials in `.env`

4. **Permission Issues**
   - Fix ownership: `sudo chown -R liquor-store:liquor-store /opt/liquor-store`

### **Useful Commands**
```bash
# Restart services
sudo supervisorctl restart liquor-store
sudo systemctl reload nginx

# View real-time logs
sudo tail -f /opt/liquor-store/logs/django.log

# Update application
cd /opt/liquor-store/app
sudo -u liquor-store git pull origin main
sudo supervisorctl restart liquor-store
```

## 📞 **Support**

For deployment issues:
1. Check the logs first
2. Verify all services are running
3. Test each component individually
4. Review the configuration files

## 🎉 **Go Live Checklist**

- [ ] Domain pointing to server
- [ ] SSL certificate installed
- [ ] All services running
- [ ] Admin user created
- [ ] Initial products added
- [ ] Backup system tested
- [ ] Staff training completed
- [ ] POS hardware connected
- [ ] Payment methods configured
- [ ] Emergency procedures documented

**Congratulations! Your Liquor Store Management System is ready for business! 🍾**
