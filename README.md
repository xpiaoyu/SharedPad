# SharedPad - 实时协作画板

多人实时协作绘画应用，基于 uni-app + Socket.IO。

## 快速开始

### 1. 启动后端

```bash
cd server
npm install
npm start
```

服务运行在 `http://localhost:3000`

### 2. 启动前端 (H5)

```bash
cd client
npm install
npm run dev:h5
```

### 3. 测试协作

- 打开两个浏览器标签访问前端地址
- 在一个标签中点击 **Share** 复制链接
- 在另一个标签中打开复制的链接（带 `?room=xxx` 参数）
- 两个标签加入同一房间，开始协作绘画

## 功能

- 多人实时同步绘画
- 6 种预设颜色
- 3 档线条粗细
- 清屏功能（全房间同步）
- 房间机制 + 分享链接
- 在线人数显示
- 断线自动重连
- 绘画历史回放（新用户加入可看到已有内容）

## 技术栈

- **前端**: uni-app (Vue 3 + Vite)
- **后端**: Node.js + Express + Socket.IO
- **绘画**: Canvas API

## 编译到微信小程序

```bash
cd client
npm run dev:mp-weixin
```

然后用微信开发者工具打开 `client/dist/dev/mp-weixin` 目录。

> 注意：小程序端需要将 Socket.IO 服务端地址配置到小程序后台的合法域名列表中，并修改 `utils/socket.js` 中的 `SERVER_URL`。
