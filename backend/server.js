// backend/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/meetme', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.log('❌ MongoDB error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/swipes', require('./routes/swipes'));
app.use('/api/matches', require('./routes/matches'));

// Socket.IO — Чат
const activeUsers = new Map(); // userId => socketId

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // Регистрация пользователя в сокете
  socket.on('register', (userId) => {
    activeUsers.set(userId, socket.id);
    console.log(`👤 User ${userId} registered with socket ${socket.id}`);
  });

  // Отправка сообщения
  socket.on('sendMessage', ({ from, to, text }) => {
    const receiverSocketId = activeUsers.get(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receiveMessage', { from, text, createdAt: new Date() });
      // Также сохраним в БД (если нужно)
      console.log(`📩 Message from ${from} to ${to}: ${text}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
    for (let [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        activeUsers.delete(userId);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));