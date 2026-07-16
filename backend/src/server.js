const { createAdapter } = require('@socket.io/redis-adapter');
const redis = require('./config/redis');           // Your redis client
const express = require('express');
const http= require( 'http');
const { Server } =require( 'socket.io');
const cors =require( 'cors');
const helmet =require( 'helmet');
const morgan =require( 'morgan');
const path = require('path')
const dotenv =require( 'dotenv');
dotenv.config();

// const Routes
const notificationRoutes =require( './routes/notificationRoutes.js');
const activityRoutes =require( './routes/activityRoutes.js');
const interestRoutes = require('./routes/interestRoutes.js');
const errorHandler = require('./middleware/errorHandler');
const exploreRoutes=require('./routes/exploreRoutes.js');
const authRoutes =require( './routes/authRoutes.js');
const userRoutes =require( './routes/userRoutes.js');
const feedRoutes =require( './routes/feedRoutes.js');
const chatsRoutes= require('./routes/chatRoutes.js')
const limiter = require('./middleware/rateLimiter');

// const DB
const connectDB =require( './config/db.js');
const seedData = require('./utils/seed.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT'],
    credentials: true
  }
});

io.adapter(createAdapter(redis, redis.duplicate()));
global.io = io;   // ← Add this line
app.set('io', io);
console.log('✅ Socket.io with Redis Adapter initialized');

// ====================== MIDDLEWARE ======================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ====================== ROUTES ======================
// app.use('/api', limiter);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/interest', interestRoutes);
app.use('/api/explore',exploreRoutes);
app.use('/api/chats',chatsRoutes);
app.use(errorHandler);

// Health Check
app.get('/', (req, res) => {
  res.json({
    message: '🚀 VibeMeet Backend is running successfully',
    status: 'healthy',
    version: '1.0.0'
  });
});

app.get("/status",(req,res)=>{
  res.json({
    hey:"ohh"
  })
})

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

    await redis.connect();
    console.log("Redis connected");


    console.log(process.env.PORT)
    await connectDB();
    await seedData(); // Seed the database with initial data
    
    server.listen(PORT, () => {
      // console.log(`VibeMeet Backend Started Successfully`);
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
console.log(`Socket.io ready for real-time chat & notifications`);

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('\nSIGTERM received. Closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;