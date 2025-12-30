# Admin Panel Credentials

After deployment, the admin panel will automatically create a default admin user if no users exist.

## Default Credentials

- **Username:** `admin`
- **Password:** `admin123`
- **Email:** `admin@liquorstore.com`

## Important Notes

- These credentials are created automatically on first deployment
- The default admin is only created if no users exist in the database
- You can change the password after logging in through the Django admin panel
- **Note:** Environment variables (`ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`) are no longer needed and can be removed from Render settings

## Accessing the Admin Panel

1. Go to: `https://liqourstoresystem.onrender.com/admin/`
2. Use the credentials above
3. After logging in, change your password for security

