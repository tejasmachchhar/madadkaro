const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [process.env.CLIENT_URL || 'http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make uploads folder static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO middleware for authentication
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

// Socket.IO connections
const userSockets = new Map(); // Map to track user connections

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

// Make io accessible to our routes
app.set('io', io);
app.set('userSockets', userSockets);

// Routes
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

// Port
const PORT = process.env.PORT || 5000;

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});