import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Test routes
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/version', (_req, res) => {
  res.json({ 
    version: '0.1.0',
    name: 'Ovistra Backend API',
    environment: process.env.NODE_ENV
  });
});

// Mock auth route
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'test@ovistra.com' && password === 'testpass123') {
    res.json({
      success: true,
      data: {
        user: {
          id: '123',
          email: 'test@ovistra.com',
          name: 'Test User',
          role: 'EDITOR'
        },
        accessToken: 'mock-jwt-token-123',
        refreshToken: 'mock-refresh-token-456'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: { message: 'Invalid credentials' }
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log('Available endpoints:');
  console.log('  GET  /health');
  console.log('  GET  /api/version');
  console.log('  POST /api/auth/login');
});