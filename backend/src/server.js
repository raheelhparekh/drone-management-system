import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cookieParser from 'cookie-parser';

import userRoutes from './routes/userRoutes.js';
import droneRoutes from './routes/droneRoutes.js';
import missionRoutes from './routes/missionRoutes.js';
import realtimeRoutes from './routes/realtimeRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 8000;
const MONGO_URI = process.env.MONGO_URI;

// Set up CORS for Express
const corsOptions = {
  origin: ['http://localhost:5173','http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Use the API routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/drones', droneRoutes);
app.use('/api/v1/missions', missionRoutes);
app.use('/api/v1/realtime', realtimeRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Define a simple test route for the root path
app.get('/', (req, res) => {
  res.send('Drone Survey Management System Backend is running!');
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Database Connection
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const startServer = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173','http://localhost:5174'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Join user to their own room for targeted updates
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
    
    // Send connection confirmation
    socket.emit('connection_confirmed', {
      message: 'Real-time connection established',
      userId,
      timestamp: new Date()
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Handle ping for connection health
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date() });
  });
});

startServer();

export { io };
