const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    // Allow any localhost origin
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.DATABASE_URI)
.then(() => console.log('✅ MongoDB Connected'))
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('⚠️  Server will continue running without database connection');
  console.log('💡 Troubleshooting tips:');
  console.log('   - Check if you are on a network that blocks MongoDB Atlas');
  console.log('   - Verify your IP is whitelisted in Atlas Network Access');
  console.log('   - Wait a few minutes for DNS propagation');
});

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the MERN Stack API!' });
});

// Test route for frontend to connect to
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Start server
const PORT = process.env.PORT || 8747;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
