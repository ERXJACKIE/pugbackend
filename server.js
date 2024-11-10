const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8100", // Your Ionic frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize callInProgress object to track active calls
const callInProgress = {};

// Set Pug as the view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the views directory
app.use(express.static(path.join(__dirname, 'views')));

// Endpoint to render the index.pug file and emit incoming call
app.get('/call/:uniqueId', (req, res) => {
  const uniqueId = req.params.uniqueId;

  // Render the index.pug view and pass the unique ID to the view
  res.render('index', { callId: uniqueId });

  // Emit the incoming-call event only if this call ID is not already in progress
  if (!callInProgress[uniqueId]) {
    callInProgress[uniqueId] = true;  // Mark call as in progress
    io.emit('incoming-call', { from: 'User 1', callId: uniqueId });
  }
});

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Start call event handler
  socket.on('start-call', (data) => {
    const callId = data.callId || 'default'; // Use provided callId or a default ID
    console.log(`Start-call event received with callId: ${callId}`);
    io.emit('incoming-call', { callId, from: data.from });
  });

  // Accept call event handler
  socket.on('accept-call', (data) => {
    if (data && data.user && data.callId) {
      console.log(`${data.user} has accepted the call with ID: ${data.callId}`);
      // Emit the call-accepted event to notify other peers
      io.emit('call-accepted', { callId: data.callId, from: data.user });
    } else {
      console.error('Error: callId or user property is missing from data', data);
    }
  });

  // Signal event for ICE candidate and offer/answer exchange
  socket.on('signal', (data) => {
    console.log(`Signal event received: `, data);
    // Broadcast the signal to other clients
    socket.broadcast.emit('signal', data);
  });

  // Disconnect event
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Signaling server running at http://localhost:${PORT}`);
});
