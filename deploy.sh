#!/bin/bash

# Liquor Store System - Production Deployment Script
# Run this script on your production server

set -e  # Exit on any error

echo "🚀 Starting Liquor Store System Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="liquor-store"
PROJECT_DIR="/opt/liquor-store"
VENV_DIR="$PROJECT_DIR/venv"
BACKUP_DIR="/opt/liquor-store-backups"
LOG_DIR="$PROJECT_DIR/logs"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (use sudo)"
    exit 1
fi

# Update system packages
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install required system packages
print_status "Installing system dependencies..."
apt install -y python3 python3-venv python3-pip postgresql postgresql-contrib nginx supervisor git curl

# Create project directory
print_status "Creating project directory..."
mkdir -p $PROJECT_DIR
mkdir -p $BACKUP_DIR
mkdir -p $LOG_DIR

# Create liquor store user
print_status "Creating liquor-store user..."
if ! id "liquor-store" &>/dev/null; then
    useradd -r -s /bin/bash -d $PROJECT_DIR liquor-store
fi

# Set up PostgreSQL database
print_status "Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE USER liquor_store_user WITH PASSWORD 'change_this_password';" || true
sudo -u postgres psql -c "CREATE DATABASE liquor_store_db OWNER liquor_store_user;" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE liquor_store_db TO liquor_store_user;" || true

# Clone or update repository
print_status "Setting up application code..."
if [ -d "$PROJECT_DIR/app" ]; then
    cd $PROJECT_DIR/app
    git pull origin main
else
    cd $PROJECT_DIR
    git clone https://github.com/yourusername/liquor-store-system.git app
    cd app
fi

# Create virtual environment
print_status "Creating Python virtual environment..."
python3 -m venv $VENV_DIR
source $VENV_DIR/bin/activate

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Set up environment variables
print_status "Setting up environment variables..."
if [ ! -f "$PROJECT_DIR/.env" ]; then
    cp env.example $PROJECT_DIR/.env
    print_warning "Please edit $PROJECT_DIR/.env with your production settings!"
fi

# Run Django migrations
print_status "Running database migrations..."
cd $PROJECT_DIR/app
export DJANGO_SETTINGS_MODULE=liquor_store_backend.settings_production
python manage.py migrate

# Collect static files
print_status "Collecting static files..."
python manage.py collectstatic --noinput

# Build React frontend
print_status "Building React frontend..."
cd frontend
npm install
npm run build
cd ..

# Set permissions
print_status "Setting file permissions..."
chown -R liquor-store:liquor-store $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

# Create Gunicorn configuration
print_status "Creating Gunicorn configuration..."
cat > $PROJECT_DIR/gunicorn.conf.py << EOF
bind = "127.0.0.1:8001"
workers = 3
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
user = "liquor-store"
group = "liquor-store"
tmp_upload_dir = None
errorlog = "$LOG_DIR/gunicorn_error.log"
accesslog = "$LOG_DIR/gunicorn_access.log"
loglevel = "info"
EOF

# Create Supervisor configuration
print_status "Creating Supervisor configuration..."
cat > /etc/supervisor/conf.d/liquor-store.conf << EOF
[program:liquor-store]
command=$VENV_DIR/bin/gunicorn liquor_store_backend.wsgi:application -c $PROJECT_DIR/gunicorn.conf.py
directory=$PROJECT_DIR/app
user=liquor-store
group=liquor-store
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=$LOG_DIR/supervisor.log
environment=DJANGO_SETTINGS_MODULE=liquor_store_backend.settings_production
EOF

# Create Nginx configuration
print_status "Creating Nginx configuration..."
cat > /etc/nginx/sites-available/liquor-store << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    client_max_body_size 20M;
    
    # Serve React frontend
    location / {
        root $PROJECT_DIR/app/frontend/build;
        try_files \$uri \$uri/ /index.html;
    }
    
    # Serve Django API
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Serve Django admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Serve static files
    location /static/ {
        alias $PROJECT_DIR/app/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Serve media files
    location /media/ {
        alias $PROJECT_DIR/app/media/;
        expires 1y;
        add_header Cache-Control "public";
    }
}
EOF

# Enable Nginx site
ln -sf /etc/nginx/sites-available/liquor-store /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Start services
print_status "Starting services..."
systemctl reload supervisor
supervisorctl reread
supervisorctl update
supervisorctl start liquor-store
systemctl reload nginx

# Set up automatic backups
print_status "Setting up automatic backups..."
cat > /etc/cron.d/liquor-store-backup << EOF
# Backup database every 6 hours
0 */6 * * * liquor-store cd $PROJECT_DIR/app && $VENV_DIR/bin/python manage.py backup_data
# Clean old backups weekly
0 2 * * 0 liquor-store find $BACKUP_DIR -name "*.json" -mtime +30 -delete
EOF

print_success "Deployment completed!"
print_status "Next steps:"
echo "1. Edit $PROJECT_DIR/.env with your production settings"
echo "2. Update the Nginx server_name with your actual domain"
echo "3. Set up SSL certificate (Let's Encrypt recommended)"
echo "4. Create a Django superuser: cd $PROJECT_DIR/app && $VENV_DIR/bin/python manage.py createsuperuser"
echo "5. Test the application at http://your-domain.com"

print_warning "Don't forget to:"
echo "- Change the PostgreSQL password"
echo "- Set up firewall rules"
echo "- Configure SSL/HTTPS"
echo "- Set up monitoring and alerts"
