#!/bin/bash
set -e

echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "📦 Installing Node.js dependencies..."
cd frontend
npm install
echo "🏗️ Building React frontend..."
npm run build
cd ..

echo "📦 Collecting static files..."
python manage.py collectstatic --noinput

echo "✅ Build complete!"

