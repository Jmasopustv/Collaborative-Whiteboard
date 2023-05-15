// Connect to the server
const socket = io();

// Get the canvas element and its 2D context
const canvas = document.getElementById('whiteboard');
const context = canvas.getContext('2d');

// Set the initial color and size
let color = 'black';
let size = 5;

// Track the current position and whether the mouse is being dragged
let isDrawing = false;
let prevX = 0;
let prevY = 0;

// Get the canvas position
const canvasRect = canvas.getBoundingClientRect();

// Event handler for when the mouse is pressed down
canvas.addEventListener('mousedown', (event) => {
  isDrawing = true;
  prevX = event.clientX - canvasRect.left;
  prevY = event.clientY - canvasRect.top;
});

// Event handler for when the mouse is released or leaves the canvas
canvas.addEventListener('mouseup', () => {
  isDrawing = false;
});

canvas.addEventListener('mouseleave', () => {
  isDrawing = false;
});

// Function to draw a line on the canvas
function draw(prevX, prevY, currentX, currentY, color) {
  // Send the drawing action to the server
  socket.emit('draw', { prevX, prevY, currentX, currentY, color });

  // Draw the line on the canvas
  context.lineWidth = size;
  context.strokeStyle = color;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(prevX, prevY);
  context.lineTo(currentX, currentY);
  context.stroke();
}

// Socket.IO event handler for receiving drawing actions from other users
socket.on('draw', ({ prevX, prevY, x, y, color }) => {
  draw(prevX, prevY, x, y, color);
});

// Event listener for mouse move
document.addEventListener('mousemove', (event) => {
  // Update cursor position relative to the canvas
  const cursorX = event.clientX - canvasRect.left;
  const cursorY = event.clientY - canvasRect.top;

  // Emit the cursor position to the server
  socket.emit('cursorMove', { x: cursorX, y: cursorY });
});

// Socket.IO event handler for receiving cursor positions
socket.on('cursorMove', (data) => {
  const { userId, position } = data;
  updateCursor(userId, position);
});

// Socket.IO event handler for receiving user color
socket.on('userColor', ({ userId, color }) => {
    if (userId === socket.id) {
      // Update the color variable for the current user
      userColor = color; // Add this line to assign the color value
    } else {
        createCursor(userId, { x: 0, y: 0 }, color); // Pass a default position object since it's not provided in the event
    }
  });
   
  
  
// Socket.IO event handler for user disconnection
socket.on('userDisconnected', (userId) => {
  removeCursor(userId);
});

// Function to create a cursor element for a user
function createCursor(userId, position, color) {
    const cursorElement = document.createElement('div');
    cursorElement.id = `cursor-${userId}`;
    cursorElement.classList.add('cursor');
    cursorElement.style.setProperty('--cursor-color', color); // Set the CSS variable for the cursor color
    cursorElement.style.left = `${position.x}px`;
    cursorElement.style.top = `${position.y}px`;
    document.body.appendChild(cursorElement);
  }
  

// Function to update the position of a cursor element for a user
function updateCursor(userId, position) {
  const cursorElement = document.getElementById(`cursor-${userId}`);
  if (cursorElement) {
    cursorElement.style.left = `${position.x + canvasRect.left}px`;
    cursorElement.style.top = `${position.y + canvasRect.top}px`;
  }
}

// Function to remove the cursor element of a disconnected user
function removeCursor(userId) {
    const cursorElement = document.getElementById(`cursor-${userId}`);
    if (cursorElement) {
      cursorElement.remove();
    }
  }
  
  // Event listener for color change
  const colorInputs = document.querySelectorAll('input[name="color"]');
  colorInputs.forEach((input) => {
    input.addEventListener('change', (event) => {
      color = event.target.value;
    });
  });
  
  // Event listener for size change
  const sizeInput = document.getElementById('size');
  sizeInput.addEventListener('input', (event) => {
    size = event.target.value;
  });
  
  // Event listener for clear button
  const clearButton = document.getElementById('clear');
  clearButton.addEventListener('click', () => {
    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
  });
  
  // Event handler for drawing on the canvas
  canvas.addEventListener('mousemove', (event) => {
    if (!isDrawing) return;
  
    const currentX = event.clientX - canvasRect.left;
    const currentY = event.clientY - canvasRect.top;
    draw(prevX, prevY, currentX, currentY, color);
    prevX = currentX;
    prevY = currentY;
  });
  
  // Socket.IO event handler for receiving initial positions and colors of connected users
  socket.on('initialPositions', (usersData) => {
    for (const [userId, user] of Object.entries(usersData)) {
      createCursor(userId, user.position, user.color);
    }
  });
  
  // Emit the user's connection event to the server
  socket.emit('userConnected', socket.id);
  
  // Emit the user's color to the server
  socket.emit('userColor', color);
  