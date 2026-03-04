import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3030';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.log('[Socket] Connection error:', err.message);
    });
  }
  return socket;
}

export function joinRoom(roomId) {
  const s = getSocket();
  s.emit('join-room', roomId);
}

export function sendDraw(data) {
  const s = getSocket();
  s.emit('draw', data);
}

export function sendClear() {
  const s = getSocket();
  s.emit('clear');
}

export function onDraw(callback) {
  const s = getSocket();
  s.off('draw');
  s.on('draw', callback);
}

export function onClear(callback) {
  const s = getSocket();
  s.off('clear');
  s.on('clear', callback);
}

export function onHistory(callback) {
  const s = getSocket();
  s.off('history');
  s.on('history', callback);
}

export function onUserCount(callback) {
  const s = getSocket();
  s.off('user-count');
  s.on('user-count', callback);
}

export function onReconnect(callback) {
  const s = getSocket();
  s.io.off('reconnect');
  s.io.on('reconnect', callback);
}
