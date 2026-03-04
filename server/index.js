const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store drawing history and online count per room
const rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { history: [], users: new Set() });
  }
  return rooms.get(roomId);
}

io.on('connection', (socket) => {
  let currentRoom = null;

  socket.on('join-room', (roomId) => {
    // Leave previous room if any
    if (currentRoom) {
      const prevRoom = getRoom(currentRoom);
      prevRoom.users.delete(socket.id);
      socket.leave(currentRoom);
      io.to(currentRoom).emit('user-count', prevRoom.users.size);
    }

    currentRoom = roomId;
    socket.join(roomId);

    const room = getRoom(roomId);
    room.users.add(socket.id);

    // Send existing drawing history to the new user
    socket.emit('history', room.history);

    // Broadcast updated user count
    io.to(roomId).emit('user-count', room.users.size);

    console.log(`User ${socket.id} joined room ${roomId} (${room.users.size} online)`);
  });

  socket.on('draw', (data) => {
    if (!currentRoom) return;
    const room = getRoom(currentRoom);
    room.history.push(data);
    // Broadcast to others in the room
    socket.to(currentRoom).emit('draw', data);
  });

  socket.on('clear', () => {
    if (!currentRoom) return;
    const room = getRoom(currentRoom);
    room.history = [];
    // Broadcast clear to everyone in the room (including sender for consistency)
    io.to(currentRoom).emit('clear');
  });

  socket.on('disconnect', () => {
    if (currentRoom) {
      const room = getRoom(currentRoom);
      room.users.delete(socket.id);
      io.to(currentRoom).emit('user-count', room.users.size);
      console.log(`User ${socket.id} left room ${currentRoom} (${room.users.size} online)`);

      // Clean up empty rooms
      if (room.users.size === 0 && room.history.length === 0) {
        rooms.delete(currentRoom);
      }
    }
  });
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size });
});

const PORT = process.env.PORT || 3030;
server.listen(PORT, () => {
  console.log(`SharedPad server running on http://localhost:${PORT}`);
});
