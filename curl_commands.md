# Curl Commands for API Testing

## Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "Password123"
  }'
```

## Login User

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

## Get User Profile (Replace TOKEN with your actual JWT token)

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer TOKEN"
```

## Health Check

```bash
curl -X GET http://localhost:3000/health
```

## Example Usage Flow:

1. **Register a new user:**

   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser",
       "email": "test@example.com",
       "password": "Password123"
     }'
   ```

2. **Login to get JWT token:**

   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "Password123"
     }'
   ```

3. **Copy the token from the login response and use it for profile:**
   ```bash
   curl -X GET http://localhost:3000/api/auth/profile \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   ```

## How to Import Postman Collection:

1. Open Postman
2. Click on "Import" in the top left
3. Select "File" tab
4. Choose the `postman_collection.json` file from your project directory
5. Click "Import"
6. The collection will appear in your Postman workspace with all endpoints ready to use

## Notes:

- Make sure your API server is running on `http://localhost:3000`
- Update the `.env` file with your MariaDB credentials before starting the server
- The JWT token expires after 24 hours by default
- Use different email addresses for each test user
