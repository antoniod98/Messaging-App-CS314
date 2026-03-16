const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const httpServer = http.createServer(app);

// middleware
app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    // allow any localhost origin
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // parse cookies for JWT authentication
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect(process.env.DATABASE_URI)
.then(() => console.log('✅ MongoDB Connected'))
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('⚠️  Server will continue running without database connection');
  console.log('💡 Troubleshooting tips:');
  console.log('   - check if you are on a network that blocks MongoDB Atlas');
  console.log('   - verify your IP is whitelisted in Atlas Network Access');
  console.log('   - wait a few minutes for DNS propagation');
});

// import routes
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const messageRoutes = require('./routes/messages');
const userRoutes = require('./routes/users');

// initialize Socket.IO
const { initializeSocket } = require('./socket');
const io = initializeSocket(httpServer);

// basic test route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the MERN Stack API!' });
});

// test route for frontend to connect to
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

// start server with Socket.IO support
const PORT = process.env.PORT || 8747;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Socket.IO initialized and ready for connections`);
});
