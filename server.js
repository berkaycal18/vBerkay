import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import cors from 'cors';
import localtunnel from 'localtunnel';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e8 // 100MB per socket packet
});

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// State for Global Tunnel
let globalTunnel = null;
let publicUrl = null;

// Helper to get local IPv4 addresses (prioritizing Wi-Fi/Ethernet)
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const name in interfaces) {
    const isVirtual = /virtual|vbox|vmware|wsl|hyper-v|loopback/i.test(name);
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (!isVirtual && !iface.address.startsWith('192.168.56.')) {
          addresses.unshift(iface.address);
        } else {
          addresses.push(iface.address);
        }
      }
    }
  }
  return addresses.length > 0 ? addresses : ['127.0.0.1'];
}

const PORT = process.env.PORT || 3456;

// In-memory room state
const rooms = new Map();

// Helper to start global tunnel
async function startTunnel() {
  if (globalTunnel && publicUrl) return publicUrl;
  try {
    const subdomain = 'aetherdrop-' + Math.random().toString(36).substring(2, 8);
    globalTunnel = await localtunnel({ port: PORT, subdomain });
    publicUrl = globalTunnel.url;
    
    globalTunnel.on('close', () => {
      console.log('⚠️ Global tunnel closed');
      globalTunnel = null;
      publicUrl = null;
      io.emit('tunnel-status', { active: false, publicUrl: null });
    });

    globalTunnel.on('error', (err) => {
      console.error('Tunnel error:', err);
    });

    console.log(`\n🌍 KÜRESEL SERBEST İNTERNET ERİŞİMİ AKTİF: ${publicUrl}\n`);
    io.emit('tunnel-status', { active: true, publicUrl });
    return publicUrl;
  } catch (err) {
    console.error('Failed to create global tunnel:', err);
    return null;
  }
}

// Helper to stop global tunnel
async function stopTunnel() {
  if (globalTunnel) {
    globalTunnel.close();
    globalTunnel = null;
    publicUrl = null;
    io.emit('tunnel-status', { active: false, publicUrl: null });
  }
}

// API endpoint for server info
app.get('/api/info', async (req, res) => {
  const ips = getLocalIpAddresses();
  const primaryIp = ips[0];
  const port = server.address() ? server.address().port : PORT;
  const localUrl = `http://${primaryIp}:${port}`;
  
  res.json({
    primaryIp,
    ips,
    port,
    localUrl,
    publicUrl,
    isTunnelActive: !!publicUrl
  });
});

// API endpoint to toggle global tunnel
app.post('/api/tunnel/toggle', async (req, res) => {
  try {
    const { enable } = req.body;
    if (enable) {
      const url = await startTunnel();
      res.json({ success: true, active: !!url, publicUrl: url });
    } else {
      await stopTunnel();
      res.json({ success: true, active: false, publicUrl: null });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API endpoint to generate QR code for a specific URL
app.get('/api/qr', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'URL query parameter is required' });
    }
    const qrDataUrl = await QRCode.toDataURL(url, {
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
    res.json({ qr: qrDataUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Socket.io Real-Time Teleport Logic
io.on('connection', (socket) => {
  let currentRoom = null;
  let clientRole = null;
  let clientInfo = {};

  socket.on('register', ({ role, roomId, deviceInfo }) => {
    clientRole = role;
    clientInfo = deviceInfo || {};
    currentRoom = roomId;

    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        desktop: null,
        mobiles: new Set(),
        createdAt: Date.now()
      });
    }

    const room = rooms.get(roomId);

    if (role === 'desktop') {
      room.desktop = socket.id;
      socket.emit('registered', { role: 'desktop', roomId, publicUrl });
      const mobileCount = room.mobiles.size;
      socket.emit('room-status', {
        connectedMobiles: mobileCount,
        hasDesktop: true,
        publicUrl
      });
    } else {
      room.mobiles.add(socket.id);
      socket.emit('registered', { role: 'mobile', roomId });
      
      if (room.desktop) {
        io.to(room.desktop).emit('peer-connected', {
          id: socket.id,
          role: 'mobile',
          deviceInfo: clientInfo
        });
        io.to(room.desktop).emit('room-status', {
          connectedMobiles: room.mobiles.size,
          hasDesktop: true,
          publicUrl
        });
      }

      socket.emit('room-status', {
        hasDesktop: !!room.desktop,
        connectedMobiles: room.mobiles.size,
        publicUrl
      });
    }
  });

  // WebRTC P2P Signaling
  socket.on('signal', ({ targetId, signalData }) => {
    if (targetId) {
      io.to(targetId).emit('signal', {
        senderId: socket.id,
        signalData
      });
    } else if (currentRoom) {
      socket.to(currentRoom).emit('signal', {
        senderId: socket.id,
        signalData
      });
    }
  });

  // Instant Teleport Payload
  socket.on('teleport', (payload) => {
    if (!currentRoom) return;

    const packet = {
      ...payload,
      id: payload.id || 'tp_' + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      senderId: socket.id,
      senderRole: clientRole
    };

    socket.to(currentRoom).emit('teleport-receive', packet);
  });

  // High-Speed Chunk Streaming
  socket.on('teleport-chunk', (chunkData) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('teleport-chunk-receive', chunkData);
  });

  // Ping-pong for live latency calculation
  socket.on('ping-peer', ({ timestamp }) => {
    socket.emit('pong-peer', { timestamp, serverTime: Date.now() });
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    if (currentRoom && rooms.has(currentRoom)) {
      const room = rooms.get(currentRoom);
      if (clientRole === 'desktop' && room.desktop === socket.id) {
        room.desktop = null;
        socket.to(currentRoom).emit('desktop-disconnected');
      } else if (clientRole === 'mobile') {
        room.mobiles.delete(socket.id);
        if (room.desktop) {
          io.to(room.desktop).emit('peer-disconnected', { id: socket.id, role: 'mobile' });
        }
      }
      
      socket.to(currentRoom).emit('room-status', {
        hasDesktop: !!room.desktop,
        connectedMobiles: room.mobiles.size,
        publicUrl
      });

      if (!room.desktop && room.mobiles.size === 0) {
        rooms.delete(currentRoom);
      }
    }
  });
});

server.listen(PORT, '0.0.0.0', async () => {
  const ips = getLocalIpAddresses();
  console.log(`\n======================================================`);
  console.log(`🛸 AetherDrop Platform Running!`);
  console.log(`💻 Yerel PC Erişimi:     http://localhost:${PORT}`);
  ips.forEach(ip => {
    console.log(`📱 Aynı Wi-Fi Erişimi:   http://${ip}:${PORT}`);
  });
  console.log(`======================================================\n`);

  // Automatically start global tunnel if requested or default
  if (process.env.AUTO_TUNNEL === 'true' || process.argv.includes('--tunnel')) {
    await startTunnel();
  }
});
