# Authentication API with TypeScript and MariaDB

A secure REST API built with TypeScript, Express.js, and MariaDB that provides user registration and login functionality with JWT bearer token authentication.

## Features

- ✅ User registration with email validation
- ✅ User login with JWT authentication
- ✅ Password hashing with bcrypt
- ✅ Input validation and sanitization
- ✅ Bearer token authentication middleware
- ✅ MariaDB database integration
- ✅ TypeScript for type safety
- ✅ Comprehensive API documentation
- ✅ Security best practices (CORS, Helmet, etc.)

## Prerequisites

- Node.js (v16 or higher)
- MariaDB server running locally
- npm or yarn

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd api-contract
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Update the `.env` file with your MariaDB configuration:

   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mariadb_password
   DB_NAME=auth_api

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=24h
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

   The server will automatically:
   - Connect to your MariaDB database
   - Create the database and users table if they don't exist
   - Start listening on port 3000

## API Endpoints

| Method | Endpoint             | Description         | Authentication |
| ------ | -------------------- | ------------------- | -------------- |
| POST   | `/api/auth/register` | Register a new user | No             |
| POST   | `/api/auth/login`    | Login user          | No             |
| GET    | `/api/auth/profile`  | Get user profile    | Yes            |
| GET    | `/health`            | Health check        | No             |

## Usage Examples

### Register a new user

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "Password123"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

### Get profile (with Bearer token)

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Project Structure

```
src/
├── controllers/     # Route controllers
├── middleware/      # Express middleware
├── models/         # Database models
├── routes/         # API routes
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── server.ts       # Main server file
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests (placeholder)

## Security Features

- Password hashing with bcrypt (12 salt rounds)
- JWT token authentication
- Input validation with express-validator
- CORS protection
- Helmet security headers
- SQL injection prevention with parameterized queries

## Database Schema

The API automatically creates a `users` table with the following structure:

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## API Documentation

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.
