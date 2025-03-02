import 'module-alias/register';
import app from './app';
import dotenv from 'dotenv';
import connectDB from './config/db';
import connectRedis from './config/redis';
import http from 'http';
import { Server } from 'socket.io';
import { notificationService } from './services/notification.service';
import supabase from './config/supabase';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Connect to Redis
    await connectRedis();
    
    // Create HTTP server
    const server = http.createServer(app);
    
    // Initialize Socket.io
    const io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? process.env.FRONTEND_URL
          : ['http://localhost:3000', 'https://abc123.ngrok.io'],
        credentials: true
      }
    });
    
    // Set Socket.io instance in notification service
    notificationService.setSocketIO(io);
    
    // Socket.io connection handler
    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);
      
      // Authenticate socket connection
      socket.on('authenticate', async (token) => {
        try {
          const { data, error } = await supabase.auth.getUser(token);
          
          if (error || !data.user) {
            socket.emit('authentication_error', 'Invalid or expired token');
            return;
          }
          
          const userId = data.user.id;
          
          // Join user's room for personalized notifications
          socket.join(userId);
          
          console.log(`User ${userId} authenticated and joined their room`);
          
          // Send any unread notifications
          const unreadNotifications = await notificationService.getUnreadNotifications(userId);
          if (unreadNotifications.length > 0) {
            socket.emit('unread_notifications', unreadNotifications);
          }
          
          socket.emit('authentication_success', { userId });
        } catch (error) {
          console.error('Socket authentication error:', error);
          socket.emit('authentication_error', 'Authentication failed');
        }
      });
      
      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
    
    // Start the server
    server.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`Socket.io initialized`);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      console.log(`Error: ${err.message}`);
      // Close server & exit process
      server.close(() => process.exit(1));
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();