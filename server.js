require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Integrate Socket.IO
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*", // Replace with your frontend URL if needed
    methods: ["GET", "POST"]
  }
});

// Track connected drivers
const connectedDrivers = new Map();

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("registerDriver", (driverId) => {
    connectedDrivers.set(driverId, socket.id);
    console.log(`✅ Driver registered: ${driverId}`);
  });

  socket.on("disconnect", () => {
    for (const [driverId, socketId] of connectedDrivers.entries()) {
      if (socketId === socket.id) {
        connectedDrivers.delete(driverId);
        console.log(`❌ Driver disconnected: ${driverId}`);
        break;
      }
    }
  });
});

// Expose io + connectedDrivers to all routes
app.set('io', io);
app.set('connectedDrivers', connectedDrivers);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/drivers', require('./routes/drivers'));

// Connect to MongoDB
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB Connected');
  server.listen(PORT, '0.0.0.0', () =>
    console.log(`🚀 Server running at http://0.0.0.0:${PORT}`)
  );
}).catch(err => console.error('❌ MongoDB error:', err));
