# Authentication API Documentation

This API provides user registration and login functionality with JWT bearer token authentication, connected to a MariaDB database.

## Base URL

```
http://localhost:3000
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Register User

**POST** `/api/auth/register`

Register a new user account.

**Request Body:**

```json
{
	"username": "john_doe",
	"email": "john@example.com",
	"password": "Password123"
}
```

**Validation Rules:**

- `username`: 3-50 characters, letters, numbers, and underscores only
- `email`: Valid email format
- `password`: At least 6 characters, must contain at least one lowercase letter, one uppercase letter, and one number

**Success Response (201):**

```json
{
	"message": "User registered successfully",
	"user": {
		"id": 1,
		"username": "john_doe",
		"email": "john@example.com",
		"created_at": "2023-01-01T00:00:00.000Z",
		"updated_at": "2023-01-01T00:00:00.000Z"
	},
	"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

- `400` - Validation failed
- `409` - Username or email already exists
- `500` - Internal server error

### 2. Login User

**POST** `/api/auth/login`

Authenticate a user and receive a JWT token.

**Request Body:**

```json
{
	"email": "john@example.com",
	"password": "Password123"
}
```

**Success Response (200):**

```json
{
	"message": "Login successful",
	"user": {
		"id": 1,
		"username": "john_doe",
		"email": "john@example.com",
		"created_at": "2023-01-01T00:00:00.000Z",
		"updated_at": "2023-01-01T00:00:00.000Z"
	},
	"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

- `400` - Validation failed
- `401` - Invalid credentials
- `500` - Internal server error

### 3. Get User Profile

**GET** `/api/auth/profile`

Get the current user's profile information. Requires authentication.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Success Response (200):**

```json
{
	"user": {
		"id": 1,
		"username": "john_doe",
		"email": "john@example.com",
		"created_at": "2023-01-01T00:00:00.000Z",
		"updated_at": "2023-01-01T00:00:00.000Z"
	}
}
```

**Error Responses:**

- `401` - Invalid or missing token
- `404` - User not found
- `500` - Internal server error

### 4. Health Check

**GET** `/health`

Check if the API server is running.

**Success Response (200):**

```json
{
	"status": "OK",
	"timestamp": "2023-01-01T00:00:00.000Z",
	"uptime": 123.456
}
```

## Testing Examples

### Using curl

#### Register a new user:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Password123"
  }'
```

#### Login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

#### Get profile (replace TOKEN with your actual token):

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer TOKEN"
```

### Using JavaScript (fetch)

```javascript
// Register
const register = async () => {
	const response = await fetch("http://localhost:3000/api/auth/register", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			username: "testuser",
			email: "test@example.com",
			password: "Password123",
		}),
	});

	const data = await response.json();
	console.log(data);
	return data.token; // Save the token for later use
};

// Login
const login = async () => {
	const response = await fetch("http://localhost:3000/api/auth/login", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			email: "test@example.com",
			password: "Password123",
		}),
	});

	const data = await response.json();
	console.log(data);
	return data.token; // Save the token for later use
};

// Get profile
const getProfile = async (token) => {
	const response = await fetch("http://localhost:3000/api/auth/profile", {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	const data = await response.json();
	console.log(data);
};
```

## Database Setup

The API automatically creates the necessary database and tables on startup. Make sure your MariaDB server is running and update the database configuration in the `.env` file:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=auth_api
```

## Security Features

- Password hashing using bcrypt
- JWT token authentication
- Input validation and sanitization
- CORS protection
- Helmet security headers
- Rate limiting (can be added)

## Error Handling

All error responses follow a consistent format:

```json
{
  "error": "Error message",
  "details": [...] // Only for validation errors
}
```
