# Troubleshooting Guide

## Database Connection Issues

The server is running but having trouble connecting to MariaDB. Here are the solutions:

### Issue: `auth_gssapi_client` Plugin Error

This error occurs when MariaDB is configured to use GSSAPI authentication but the mysql2 library doesn't support it.

#### Solution 1: Configure MariaDB to use mysql_native_password

1. **Connect to MariaDB using MySQL client:**

   ```bash
   mysql -u root -p
   ```

2. **Check current authentication plugin:**

   ```sql
   SELECT user, plugin FROM mysql.user WHERE user='root';
   ```

3. **Update root user to use mysql_native_password:**

   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
   FLUSH PRIVILEGES;
   ```

4. **Create a dedicated user for the API:**

   ```sql
   CREATE USER 'api_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
   GRANT ALL PRIVILEGES ON auth_api.* TO 'api_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

5. **Update your .env file:**
   ```env
   DB_USER=api_user
   DB_PASSWORD=your_password
   ```

#### Solution 2: Modify MariaDB Configuration

1. **Find your MariaDB configuration file** (usually at `/etc/mysql/mariadb.conf.d/50-server.cnf` or similar)

2. **Add or modify the following settings:**

   ```ini
   [mysqld]
   # Authentication settings
   default-authentication-plugin=mysql_native_password

   # Network settings
   bind-address = 127.0.0.1
   port = 3306
   ```

3. **Restart MariaDB:**

   ```bash
   # On Windows
   net stop mariadb
   net start mariadb

   # On Linux/Mac
   sudo systemctl restart mariadb
   ```

#### Solution 3: Install MariaDB Connector/C

If you're on Windows, you might need to install MariaDB Connector/C:

1. Download from: https://mariadb.com/downloads/connector/c/
2. Install and make sure it's in your PATH
3. Restart your terminal and try again

### Testing the API

The server is now running on port 3000. You can test the endpoints:

#### Health Check (No database required):

```bash
curl -X GET http://localhost:3000/health
```

#### API Information (No database required):

```bash
curl -X GET http://localhost:3000/
```

#### Registration/Login (Will show database error until fixed):

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Password123"
  }'
```

### Quick Fix Steps

1. **Make sure MariaDB is running:**

   ```bash
   # Windows
   net start mariadb

   # Linux/Mac
   sudo systemctl status mariadb
   ```

2. **Update .env with correct credentials:**

   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_actual_password
   DB_NAME=auth_api
   ```

3. **Try connecting manually:**

   ```bash
   mysql -h localhost -P 3306 -u root -p
   ```

4. **If connection works, restart the API server:**
   ```bash
   npm run dev
   ```

### Alternative: Use MySQL Instead

If you continue to have issues with MariaDB, you can use MySQL instead:

1. **Install MySQL** (if not already installed)
2. **Update .env file** (same configuration)
3. **The API will work the same way**

### Postman Testing

1. Import the `postman_collection.json` file into Postman
2. Test the `/health` endpoint first (should work without database)
3. Once database is fixed, test register/login endpoints

### Common Issues

- **Port 3306 blocked**: Check firewall settings
- **Wrong password**: Reset MariaDB root password
- **Service not running**: Start MariaDB service
- **Connection refused**: Check if MariaDB is listening on correct IP/port

### Need Help?

If you're still having issues:

1. Check MariaDB logs: `/var/log/mysql/error.log` (Linux) or MariaDB installation logs (Windows)
2. Verify MariaDB is running on the correct port
3. Make sure your user has the necessary permissions
4. Try connecting with a GUI tool like DBeaver or HeidiSQL to test credentials

Once the database connection is working, all API endpoints will function normally!
