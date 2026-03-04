<template>
  <view class="container">
    <!-- Top bar: room info -->
    <view class="top-bar">
      <view class="room-info">
        <text class="room-label">Room:</text>
        <text class="room-id">{{ roomId }}</text>
        <text class="user-count">{{ userCount }} online</text>
      </view>
      <view class="share-btn" @tap="shareRoom">
        <text class="share-text">Share</text>
      </view>
    </view>

    <!-- Canvas -->
    <canvas
      canvas-id="drawCanvas"
      id="drawCanvas"
      class="draw-canvas"
      disable-scroll
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
    />

    <!-- Toolbar -->
    <view class="toolbar">
      <view class="tool-section colors">
        <view
          v-for="c in colors"
          :key="c"
          class="color-dot"
          :class="{ active: currentColor === c }"
          :style="{ backgroundColor: c }"
          @tap="currentColor = c"
        />
      </view>

      <view class="tool-section widths">
        <view
          v-for="w in lineWidths"
          :key="w.value"
          class="width-btn"
          :class="{ active: currentWidth === w.value }"
          @tap="currentWidth = w.value"
        >
          <view class="width-dot" :style="{ width: w.display + 'px', height: w.display + 'px' }" />
        </view>
      </view>

      <view class="tool-section">
        <view class="clear-btn" @tap="clearCanvas">
          <text class="clear-text">Clear</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import {
  getSocket,
  joinRoom,
  sendDraw,
  sendClear,
  onDraw,
  onClear,
  onHistory,
  onUserCount,
  onReconnect,
} from '../../utils/socket.js';

export default {
  data() {
    return {
      roomId: '',
      userCount: 0,
      currentColor: '#000000',
      currentWidth: 4,
      colors: ['#000000', '#e74c3c', '#2ecc71', '#3498db', '#f39c12', '#9b59b6'],
      lineWidths: [
        { value: 2, display: 6 },
        { value: 4, display: 10 },
        { value: 8, display: 16 },
      ],
      isDrawing: false,
      lastX: 0,
      lastY: 0,
      ctx: null,
      canvasWidth: 0,
      canvasHeight: 0,
      userId: '',
    };
  },

  onLoad(query) {
    this.userId = 'u_' + Math.random().toString(36).substring(2, 10);
    if (query && query.room) {
      this.roomId = query.room;
    } else {
      this.roomId = this.generateRoomId();
    }
  },

  onReady() {
    this.initCanvas();
    this.initSocket();
  },

  methods: {
    generateRoomId() {
      return Math.random().toString(36).substring(2, 8);
    },

    initCanvas() {
      const ctx = uni.createCanvasContext('drawCanvas', this);
      this.ctx = ctx;

      const sysInfo = uni.getSystemInfoSync();
      this.canvasWidth = sysInfo.windowWidth;
      this.canvasHeight = sysInfo.windowHeight - 44 - 60;

      ctx.setFillStyle('#ffffff');
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      ctx.draw();
    },

    initSocket() {
      getSocket();
      joinRoom(this.roomId);

      onUserCount((count) => { this.userCount = count; });
      onDraw((data) => { this.drawRemote(data); });
      onHistory((history) => { this.replayHistory(history); });
      onClear(() => { this.doClear(); });
      onReconnect(() => { joinRoom(this.roomId); });
    },

    normalize(x, y) {
      return {
        x: x / this.canvasWidth,
        y: y / this.canvasHeight,
      };
    },

    denormalize(nx, ny) {
      return {
        x: nx * this.canvasWidth,
        y: ny * this.canvasHeight,
      };
    },

    getCanvasPosition(e) {
      const touch = e.touches ? e.touches[0] : e;
      return {
        x: touch.clientX || touch.x,
        y: (touch.clientY || touch.y) - 44,
      };
    },

    onTouchStart(e) {
      const pos = this.getCanvasPosition(e);
      this.startDraw(pos.x, pos.y);
    },

    onTouchMove(e) {
      if (!this.isDrawing) return;
      const pos = this.getCanvasPosition(e);
      this.moveDraw(pos.x, pos.y);
    },

    onTouchEnd() {
      this.endDraw();
    },

    onMouseDown(e) {
      const pos = this.getCanvasPosition(e);
      this.startDraw(pos.x, pos.y);
    },

    onMouseMove(e) {
      if (!this.isDrawing) return;
      const pos = this.getCanvasPosition(e);
      this.moveDraw(pos.x, pos.y);
    },

    onMouseUp() {
      this.endDraw();
    },

    startDraw(x, y) {
      this.isDrawing = true;
      this.lastX = x;
      this.lastY = y;

      const norm = this.normalize(x, y);
      sendDraw({
        type: 'start',
        x: norm.x,
        y: norm.y,
        color: this.currentColor,
        lineWidth: this.currentWidth,
        userId: this.userId,
      });
    },

    moveDraw(x, y) {
      this.drawLine(this.lastX, this.lastY, x, y, this.currentColor, this.currentWidth);

      const norm = this.normalize(x, y);
      sendDraw({
        type: 'move',
        x: norm.x,
        y: norm.y,
        color: this.currentColor,
        lineWidth: this.currentWidth,
        userId: this.userId,
      });

      this.lastX = x;
      this.lastY = y;
    },

    endDraw() {
      if (!this.isDrawing) return;
      this.isDrawing = false;

      const norm = this.normalize(this.lastX, this.lastY);
      sendDraw({
        type: 'end',
        x: norm.x,
        y: norm.y,
        color: this.currentColor,
        lineWidth: this.currentWidth,
        userId: this.userId,
      });
    },

    drawLine(x1, y1, x2, y2, color, lineWidth) {
      const ctx = this.ctx;
      ctx.beginPath();
      ctx.setStrokeStyle(color);
      ctx.setLineWidth(lineWidth);
      ctx.setLineCap('round');
      ctx.setLineJoin('round');
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.draw(true);
    },

    drawRemote(data) {
      const pos = this.denormalize(data.x, data.y);

      if (data.type === 'start') {
        if (!this._remoteUsers) this._remoteUsers = {};
        this._remoteUsers[data.userId] = { x: pos.x, y: pos.y };
      } else if (data.type === 'move') {
        if (!this._remoteUsers) this._remoteUsers = {};
        const last = this._remoteUsers[data.userId];
        if (last) {
          this.drawLine(last.x, last.y, pos.x, pos.y, data.color, data.lineWidth);
        }
        this._remoteUsers[data.userId] = { x: pos.x, y: pos.y };
      } else if (data.type === 'end') {
        if (this._remoteUsers) {
          delete this._remoteUsers[data.userId];
        }
      }
    },

    replayHistory(history) {
      this.doClear();

      const userPositions = {};
      for (const data of history) {
        const pos = this.denormalize(data.x, data.y);
        if (data.type === 'start') {
          userPositions[data.userId] = { x: pos.x, y: pos.y };
        } else if (data.type === 'move') {
          const last = userPositions[data.userId];
          if (last) {
            this.drawLine(last.x, last.y, pos.x, pos.y, data.color, data.lineWidth);
          }
          userPositions[data.userId] = { x: pos.x, y: pos.y };
        } else if (data.type === 'end') {
          delete userPositions[data.userId];
        }
      }
    },

    clearCanvas() {
      sendClear();
    },

    doClear() {
      const ctx = this.ctx;
      ctx.setFillStyle('#ffffff');
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      ctx.draw();
    },

    shareRoom() {
      // #ifdef H5
      const url = window.location.origin + window.location.pathname + '?room=' + this.roomId;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
        uni.showToast({ title: 'Link copied!', icon: 'none' });
      } else {
        uni.showModal({
          title: 'Share this room',
          content: url,
          showCancel: false,
        });
      }
      return;
      // #endif

      uni.showModal({
        title: 'Room ID',
        content: this.roomId,
        showCancel: false,
      });
    },
  },
};
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: #ffffff;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 12px;
  background-color: #1a1a2e;
  flex-shrink: 0;
}

.room-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.room-label { color: #a0a0b0; font-size: 13px; }
.room-id { color: #ffffff; font-size: 14px; font-weight: bold; letter-spacing: 1px; }
.user-count { color: #2ecc71; font-size: 12px; margin-left: 6px; }

.share-btn {
  padding: 4px 12px;
  background-color: #3498db;
  border-radius: 14px;
}
.share-text { color: #ffffff; font-size: 12px; }

.draw-canvas {
  flex: 1;
  width: 100%;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 12px;
  background-color: #f5f5f5;
  border-top: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.tool-section { display: flex; align-items: center; gap: 6px; }
.colors { display: flex; gap: 8px; }

.color-dot {
  width: 26px; height: 26px; border-radius: 50%;
  border: 2px solid transparent; box-sizing: border-box;
}
.color-dot.active {
  border-color: #333;
  box-shadow: 0 0 0 2px #fff, 0 0 0 4px #333;
}

.widths { display: flex; gap: 6px; }
.width-btn {
  width: 32px; height: 32px; display: flex;
  align-items: center; justify-content: center;
  border-radius: 6px; background-color: #e8e8e8;
}
.width-btn.active { background-color: #333; }
.width-dot { border-radius: 50%; background-color: #333; }
.width-btn.active .width-dot { background-color: #fff; }

.clear-btn { padding: 6px 14px; background-color: #e74c3c; border-radius: 6px; }
.clear-text { color: #ffffff; font-size: 13px; font-weight: bold; }
</style>
