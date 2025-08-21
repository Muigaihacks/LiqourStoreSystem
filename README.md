# Liquor Store Management System

A comprehensive Django-based inventory and point-of-sale system for liquor stores, designed to prevent fraud and streamline operations.

## Features

### Core Functionality
- **Product Management**: Add, edit, and manage products with unique barcodes
- **Inventory Tracking**: Real-time stock levels with low stock alerts
- **Point of Sale (POS)**: Barcode scanning for sales transactions
- **Stock Management**: Track stock movements (in/out) with detailed history
- **Sales Analytics**: Daily and monthly sales reports
- **User Management**: Different access levels for admin and employees

### Fraud Prevention
- **Barcode-Only Sales**: All sales must scan valid product barcodes
- **Real-time Inventory**: Instant stock updates prevent overselling
- **Audit Trail**: Complete history of all stock movements and sales
- **Employee Tracking**: All transactions linked to specific employees

## Technology Stack

- **Backend**: Django 5.2.5 + Django REST Framework
- **Database**: SQLite (development) / PostgreSQL (production)
- **Frontend**: React.js (to be implemented)
- **Authentication**: Django's built-in user system
- **API**: RESTful API with comprehensive endpoints

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Muigaihacks/LiqourStoreSystem.git
   cd LiqourStoreSystem
   ```

2. **Create virtual environment**
   ```bash
   python3 -m venv liquor_store_env
   source liquor_store_env/bin/activate  # On Windows: liquor_store_env\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations**
   ```bash
   python manage.py migrate
   ```

5. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

6. **Run the development server**
   ```bash
   python manage.py runserver
   ```

## Usage

### Admin Panel
- Access: `http://localhost:8000/admin/`
- Manage products, categories, inventory, and view sales
- Monitor stock levels and low stock alerts
- View detailed sales reports

### API Endpoints
- **Products**: `/api/products/`
- **Categories**: `/api/categories/`
- **Inventory**: `/api/inventory/`
- **Sales**: `/api/sales/`
- **Stock Movements**: `/api/stock-movements/`

### Key API Features
- **Barcode Lookup**: `POST /api/products/barcode_lookup/`
- **Stock In**: `POST /api/inventory/stock_in/`
- **Today's Sales**: `GET /api/sales/today_sales/`
- **Sales Summary**: `GET /api/sales/sales_summary/`

## Database Models

### Product
- Name, barcode, category, price, size, age, brand
- Unique barcode for each product variant
- Active/inactive status

### Inventory
- Current stock quantity
- Minimum stock level for alerts
- Automatic stock tracking

### Sale
- Sale number (auto-generated)
- Employee, payment method, customer info
- Total amount calculation

### StockMovement
- Complete audit trail of stock changes
- Movement type (IN/OUT/ADJUSTMENT)
- Previous and new stock levels

## Business Logic

### Stock Intake Process
1. Select product from master catalog
2. Enter quantity received
3. System updates inventory and creates movement record

### Sales Process
1. Scan product barcode
2. System validates product and stock availability
3. Create sale record with items
4. Automatically reduce inventory
5. Generate stock movement record

### Fraud Prevention
- Only products in master catalog can be sold
- Real-time stock validation
- Complete transaction logging
- Employee accountability

## Development Roadmap

### Phase 1: Backend (Current)
- ✅ Django models and admin interface
- ✅ REST API endpoints
- ✅ Basic authentication
- ✅ Stock management logic

### Phase 2: Frontend
- React.js POS interface
- Barcode scanner integration
- Real-time updates
- Mobile-responsive design

### Phase 3: Advanced Features
- Real-time notifications
- Advanced analytics
- Mobile app
- Integration with payment systems

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is proprietary software developed for specific business use.

## Support

For support and questions, please contact the development team.
