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

// Batching mechanism for draw events
let currentStroke = null;
let batchTimer = null;
const BATCH_INTERVAL = 200; // 200ms = 5 packets per second

function flushDrawBatch(endStroke) {
  if (!currentStroke || currentStroke.points.length === 0) return;

  const s = getSocket();
  console.log('[Socket] Sending stroke:', currentStroke.points.length, 'points');
  s.emit('draw-stroke', currentStroke);

  if (endStroke) {
    // Stroke finished, clear completely
    currentStroke = null;
  } else {
    // Mid-stroke flush: keep last point for continuity
    const lastPoint = currentStroke.points[currentStroke.points.length - 1];
    currentStroke = {
      userId: currentStroke.userId,
      color: currentStroke.color,
      lineWidth: currentStroke.lineWidth,
      points: [lastPoint],
    };
  }
}

export function sendDraw(data) {
  // Start new stroke
  if (data.type === 'start') {
    // Flush previous stroke if exists
    if (currentStroke) {
      flushDrawBatch(true);
    }
    currentStroke = {
      userId: data.userId,
      color: data.color,
      lineWidth: data.lineWidth,
      points: [[data.x, data.y]]
    };
  }
  // Add point to current stroke
  else if (data.type === 'move' && currentStroke) {
    currentStroke.points.push([data.x, data.y]);

    // Start timer if not already running
    if (!batchTimer) {
      batchTimer = setTimeout(() => {
        flushDrawBatch(false);
        batchTimer = null;
      }, BATCH_INTERVAL);
    }
  }
  // End stroke
  else if (data.type === 'end' && currentStroke) {
    currentStroke.points.push([data.x, data.y]);
    flushDrawBatch(true);
  }
}

// Force flush when drawing ends
export function flushDraw() {
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
  flushDrawBatch(true);
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

export function onDrawBatch(callback) {
  const s = getSocket();
  s.off('draw-batch');
  s.on('draw-batch', (batch) => {
    console.log('[Socket] Received batch:', batch.length, 'items');
    callback(batch);
  });
}

export function onDrawStroke(callback) {
  const s = getSocket();
  s.off('draw-stroke');
  s.on('draw-stroke', (stroke) => {
    console.log('[Socket] Received stroke:', stroke.points.length, 'points');
    callback(stroke);
  });
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
