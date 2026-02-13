import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testConnection, initializeDatabase } from './utils/database';
import authRoutes from './routes/auth';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Auth API Server is running',
    version: '1.0.0',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      profile: 'GET /api/auth/profile (requires Bearer token)'
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
  try {
    // Try to connect to database, but don't exit if it fails
    console.log('Attempting to connect to database...');
    const dbConnected = await testConnection();
    
    if (dbConnected) {
      console.log('Database connection successful!');
      // Initialize database
      await initializeDatabase();
    } else {
      console.log('⚠️  Database connection failed. Server will start without database functionality.');
      console.log('   Please check your MariaDB configuration in .env file');
      console.log('   Make sure MariaDB is running and credentials are correct');
    }

    // Start listening
    app.listen(PORT, () => {
      console.log(`\n🚀 Server is running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('\n📋 Available endpoints:');
      console.log('  POST /api/auth/register - Register a new user');
      console.log('  POST /api/auth/login - Login user');
      console.log('  GET  /api/auth/profile - Get user profile (protected)');
      console.log('  GET  /health - Health check');
      console.log('  GET  / - API information');
      console.log('\n🔗 Test with Postman or curl commands provided in documentation');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();