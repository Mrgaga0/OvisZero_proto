import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 1067;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// API version
app.get('/api/version', (_, res) => {
  res.json({ 
    version: '0.3.0',
    name: 'Ovistra Backend API',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API version: http://localhost:${PORT}/api/version`);
});

export default app;