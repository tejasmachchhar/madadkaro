const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app);

// Configure allowed origins for CORS
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean); // Remove any undefined/null values

// Function to check if origin is allowed (handles dynamic Vercel preview URLs)
const isOriginAllowed = (origin) => {
  if (!origin) return true; // Allow requests with no origin
  
  // Check exact match in allowed origins
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  
  // Allow any Vercel preview deployment URL
  // Pattern: https://[project-name]-[hash]-[username].vercel.app
  // Example: https://madadkaro-7qvgxnifx-tejasmachchhars-projects.vercel.app
  const vercelPattern = /^https?:\/\/.*-tejasmachchhars-projects\.vercel\.app$/;
  if (vercelPattern.test(origin)) {
    return true;
  }
  
  // Also allow any .vercel.app subdomain for flexibility
  // You can remove this if you want to be more restrictive
  if (origin.endsWith('.vercel.app')) {
    return true;
  }
  
  return false;
};

const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make uploads folder static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO middleware for authentication - will set up after DB connects
let setupSocketIO = false;

// Socket.IO connections
const userSockets = new Map(); // Map to track user connections

// Make io accessible to our routes
app.set('io', io);
app.set('userSockets', userSockets);

// Routes will be set up after database connects in startServer()

// Port
const PORT = process.env.PORT || 5000;

// Start server function
const startServer = async () => {
  try {
    console.log('Starting server...');
    console.log('Node Environment:', process.env.NODE_ENV);
    console.log('Port:', PORT);
    
    // Connect to MongoDB first
    await connectDB();
    console.log('Database connection successful');
    
    // Load models after DB connection
    const User = require('./models/User');
    console.log('User model loaded');
    
    // Set up Socket.IO middleware for authentication after DB connects
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error: Token not provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }
        
        socket.user = user;
        next();
      } catch (error) {
        return next(new Error('Authentication error: Invalid token'));
      }
    });

    // Socket.IO connection handler
    io.on('connection', (socket) => {
      console.log(`User connected: ${socket.user._id}`);
      
      // Store user socket connection
      userSockets.set(socket.user._id.toString(), socket.id);
      
      // Handle chat message
      socket.on('send_message', (messageData) => {
        // Get receiver's socket if they're online
        const receiverSocketId = userSockets.get(messageData.receiver);
        
        if (receiverSocketId) {
          // Send the message to the receiver
          io.to(receiverSocketId).emit('new_message', {
            ...messageData,
            sender: {
              _id: socket.user._id,
              name: socket.user.name,
              profilePicture: socket.user.profilePicture
            }
          });
        }
      });
      
      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user._id}`);
        userSockets.delete(socket.user._id.toString());
      });
    });

    // Set up routes after DB connects
    console.log('Loading routes...');
    app.use('/api/users', require('./routes/userRoutes'));
    app.use('/api/tasks', require('./routes/taskRoutes'));
    app.use('/api/bids', require('./routes/bidRoutes'));
    app.use('/api/reviews', require('./routes/reviewRoutes'));
    app.use('/api/messages', require('./routes/messageRoutes'));
    app.use('/api/notifications', require('./routes/notificationRoutes'));
    app.use('/api/categories', require('./routes/categoryRoutes'));
    app.use('/api/admin', require('./routes/adminRoutes'));
    app.use('/api/admin/platform-fees', require('./routes/platformFeeRoutes'));

    // Default route
    app.get('/', (req, res) => {
      res.send('MadadKaro API is running...');
    });

    // Error Middleware
    app.use(notFound);
    app.use(errorHandler);

    console.log('Routes loaded successfully');
    
    // Only start listening after everything is set up
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

// Start the server
startServer();