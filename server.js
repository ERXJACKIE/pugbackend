const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8100", // Your Ionic frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Root endpoint to avoid 404 error
app.get('/', (req, res) => {
  res.send('Welcome to the signaling server!');
});

// Endpoint to initiate a call
app.get('/call', (req, res) => {
  io.emit('incoming-call', { from: 'User 1' }); // Notify frontend about incoming call
  res.send('Call initiated');
});

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('start-call', (data) => {
    // Send call offer to the target user
    io.emit('incoming-call', { from: data.from });
  });

  socket.on('accept-call', (data) => {
    if (data && data.user) {
      console.log(`${data.user} has accepted the call`);
      // Broadcast answer to accept the call
      io.emit('call-accepted', { from: data.user });
    } else {
      console.error('Error: user property is missing from data', data);
    }
  });

  socket.on('signal', (data) => {
    socket.broadcast.emit('signal', data);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Signaling server running at http://localhost:${PORT}`);
});
