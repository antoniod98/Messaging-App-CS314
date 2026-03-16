const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const app = express();
const httpServer = http.createServer(app);

// compression helps reduce response sizes
app.use(compression());

app.use(cors({
  origin: function(origin, callback) {
    // mobile apps and tools like curl don't send an origin header
    if (!origin) return callback(null, true);
    // dev environment - allow any localhost
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  etag: true,
}));

// setup mongoose options
mongoose.set('strictQuery', false);
mongoose.connect(process.env.DATABASE_URI, {
  maxPoolSize: 10,
  minPoolSize: 2,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('⚠️  Server will continue running without database connection');
  console.log('💡 Troubleshooting tips:');
  console.log('   - check if you are on a network that blocks MongoDB Atlas');
  console.log('   - verify your IP is whitelisted in Atlas Network Access');
  console.log('   - wait a few minutes for DNS propagation');
});

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const messageRoutes = require('./routes/messages');
const userRoutes = require('./routes/users');

const { initializeSocket } = require('./socket');
const io = initializeSocket(httpServer);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the MERN Stack API!' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 8747;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Socket.IO initialized and ready for connections`);
});
