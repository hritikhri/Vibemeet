const express = require('express');
const http= require( 'http');
const { Server } =require( 'socket.io');
const cors =require( 'cors');
const helmet =require( 'helmet');
const morgan =require( 'morgan');
const path = require('path')
const dotenv =require( 'dotenv');

// const Routes
const authRoutes =require( './routes/authRoutes.js');
const userRoutes =require( './routes/userRoutes.js');
const activityRoutes =require( './routes/activityRoutes.js');
const feedRoutes =require( './routes/feedRoutes.js');
const notificationRoutes =require( './routes/notificationRoutes.js');
const exploreRoutes=require('./routes/exploreRoutes.js')
const chatsRoutes= require('./routes/chatRoutes.js')

// const DB
const connectDB =require( './config/db.js');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT'],
    credentials: true
  }
});
app.set('io', io);

// ====================== MIDDLEWARE ======================
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ====================== ROUTES ======================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/explore',exploreRoutes);
app.use('/api/chats',chatsRoutes);

// Health Check
app.get('/', (req, res) => {
  res.json({
    message: '🚀 VibeMeet Backend is running successfully',
    status: 'healthy',
    version: '1.0.0'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ====================== SOCKET.IO SETUP ======================
const {setupSocket}= require ('./socket/index.js');
setupSocket(io);

// ====================== START SERVER ======================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log(process.env.PORT)
    await connectDB();
    
    server.listen(PORT, () => {
      console.log(`\nVibeMeet Backend Started Successfully`);
      console.log(`Server running on: http://localhost:${PORT}`);
      console.log(`Allowed Frontend: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
      console.log(`Socket.io ready for real-time chat & notifications\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('\nSIGTERM received. Closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;