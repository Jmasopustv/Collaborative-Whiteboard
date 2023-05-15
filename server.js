const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const randomColor = require('randomcolor');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Serve static files from the "public" directory
app.use(express.static('public'));

// Keep track of connected users and their cursor positions
const users = {};

function getRandomColor() {
  return randomColor(); // Use randomcolor library to generate a random color
}

// Socket.IO event handler for new connections
io.on('connection', (socket) => {
    console.log('A user connected');
  
    // Generate a random color for the user
    const userColor = getRandomColor();
  
    // Emit the user's color to the client
    socket.emit('userColor', { userId: socket.id, color: userColor });
  
    // Broadcast the new user connection to other connected users
    socket.broadcast.emit('userConnected', { userId: socket.id, color: userColor });
  
    // Emit the current positions and colors of all connected users to the newly connected user
    socket.emit('initialPositions', users);
  
    // Socket.IO event handler for receiving drawing actions from clients
    socket.on('draw', ({ prevX, prevY, x, y, color }) => {
      socket.broadcast.emit('draw', { prevX, prevY, x, y, color });
    });
  
    // Socket.IO event handler for receiving cursor position
    socket.on('cursorMove', (position) => {
      // Update the position of the user in the users object
      if (!users[socket.id]) {
        users[socket.id] = { position: position };
      } else {
        users[socket.id].position = position;
      }
  
      // Emit the updated cursor position to all connected users, except the sender
      socket.broadcast.emit('cursorMove', { userId: socket.id, position });
    });
  
    // Socket.IO event handler for disconnections
    socket.on('disconnect', () => {
      console.log('A user disconnected');
  
      // Remove the user from the users object
      delete users[socket.id];
  
      // Broadcast the updated users object to all connected users
      io.emit('userDisconnected', socket.id);
    });
  });
  

// Start the server
const port = 3000; // You can change the port if needed
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
