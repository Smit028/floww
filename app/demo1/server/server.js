const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();

// Use CORS middleware
app.use(cors({
  origin: 'http://localhost:5000', // Allow only this origin
  methods: ['GET', 'POST'], // Specify allowed methods
  credentials: true // Allow cookies or other credentials
}));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5000',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');
  // Handle socket events here
});

server.listen(5000, () => {
  console.log('Server is running on http://localhost:5000');
});
