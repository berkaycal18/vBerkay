import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import cors from 'cors';
import localtunnel from 'localtunnel';
import { startTunnel as startCloudflareTunnel } from 'untun';

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
app.use(express.static(path.join(__dirname, 'public'), { etag: false, maxAge: 0 }));

// State for Global Tunnel
let globalTunnel = null;
let publicUrl = null;

// Helper to get local IPv4 addresses (prioritizing USB Tethering / Ethernet / Wi-Fi)
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const name in interfaces) {
    const isVirtual = /virtual|vbox|vmware|wsl|hyper-v|loopback/i.test(name);
    const isUsb = /rndis|tether|apple|mobile|usb/i.test(name);
    
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (isUsb || iface.address.startsWith('192.168.42.') || iface.address.startsWith('172.20.10.')) {
          addresses.unshift(iface.address); // Top priority: USB cable tethering!
        } else if (!isVirtual && !iface.address.startsWith('192.168.56.')) {
          addresses.push(iface.address);
        }
      }
    }
  }
  return addresses.length > 0 ? addresses : ['127.0.0.1'];
}

const PORT = process.env.PORT || 3456;

// In-memory room state and 24-Hour (1 Day) Persistent Vault Storage
const rooms = new Map();
const VAULT_RETENTION_MS = 24 * 60 * 60 * 1000; // 24 Hours (1 Day) Auto-Expiry
const VAULT_FILE = path.join(__dirname, 'vault_storage.json');

// Load vault items from disk
function loadVaultFromDisk() {
  try {
    if (fs.existsSync(VAULT_FILE)) {
      const data = JSON.parse(fs.readFileSync(VAULT_FILE, 'utf-8'));
      const now = Date.now();
      return Array.isArray(data) ? data.filter(item => (item.expiresAt || (item.timestamp + VAULT_RETENTION_MS)) > now) : [];
    }
  } catch (e) {
    console.error('Error loading vault storage:', e);
  }
  return [];
}

let vaultItems = loadVaultFromDisk();

// Save vault items to disk
function saveVaultToDisk() {
  try {
    const now = Date.now();
    vaultItems = vaultItems.filter(item => (item.expiresAt || (item.timestamp + VAULT_RETENTION_MS)) > now);
    fs.writeFileSync(VAULT_FILE, JSON.stringify(vaultItems), 'utf-8');
  } catch (e) {
    console.error('Error saving vault storage:', e);
  }
}

// Clean expired vault items periodically
function cleanExpiredVaultItems() {
  saveVaultToDisk();
}
setInterval(cleanExpiredVaultItems, 15 * 60 * 1000); // Check every 15 mins

// Helper to start global Cloudflare tunnel
async function startTunnel() {
  if (globalTunnel && publicUrl) return publicUrl;
  
  try {
    console.log('⚡ Cloudflare Küresel Tüneli Başlatılıyor...');
    globalTunnel = await startCloudflareTunnel({ port: PORT });
    publicUrl = await globalTunnel.getURL();
    
    console.log(`\n======================================================`);
    console.log(`🌍 KÜRESEL SERBEST İNTERNET LİNKİ AKTİF:`);
    console.log(`👉 ${publicUrl}`);
    console.log(`(Başka internetten, 4G/5G'den ve başka cihazlardan doğrudan girilebilir)`);
    console.log(`======================================================\n`);
    
    io.emit('tunnel-status', { active: true, publicUrl });
    return publicUrl;
  } catch (err) {
    console.warn('Cloudflare tunnel failed, trying localtunnel fallback:', err.message);
    try {
      const subdomain = 'aetherdrop-' + Math.random().toString(36).substring(2, 8);
      globalTunnel = await localtunnel({ port: PORT, subdomain });
      publicUrl = globalTunnel.url;
      io.emit('tunnel-status', { active: true, publicUrl });
      return publicUrl;
    } catch (e) {
      console.error('All tunnels failed:', e);
      return null;
    }
  }
}

// Helper to stop global tunnel
async function stopTunnel() {
  if (globalTunnel) {
    if (globalTunnel.close) await globalTunnel.close();
    globalTunnel = null;
    publicUrl = null;
    io.emit('tunnel-status', { active: false, publicUrl: null });
  }
}

// API endpoint for server info
app.get('/api/info', async (req, res) => {
  const host = req.get('host') || '';
  const isCloudHost = host.includes('render.com') || host.includes('onrender.com') || host.includes('trycloudflare.com') || host.includes('loca.lt');
  const ips = getLocalIpAddresses();
  const primaryIp = ips[0];
  const port = server.address() ? server.address().port : PORT;
  const detectedUrl = isCloudHost ? `https://${host}` : `http://${primaryIp}:${port}`;
  
  res.json({
    primaryIp,
    ips,
    port,
    localUrl: detectedUrl,
    publicUrl: isCloudHost ? `https://${host}` : publicUrl,
    isCloud: isCloudHost,
    isTunnelActive: isCloudHost ? true : !!publicUrl
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

// API endpoint to fetch 24-hour vault history
app.get('/api/history', (req, res) => {
  const now = Date.now();
  const activeItems = vaultItems.filter(item => (item.expiresAt || (item.timestamp + VAULT_RETENTION_MS)) > now);
  res.json({ items: activeItems });
});

app.get('/api/room/:roomId/history', (req, res) => {
  const now = Date.now();
  const activeItems = vaultItems.filter(item => (item.expiresAt || (item.timestamp + VAULT_RETENTION_MS)) > now);
  res.json({ items: activeItems });
});

// POST /api/clear — wipe entire vault from disk and broadcast clear to all clients
app.post('/api/clear', (req, res) => {
  vaultItems = [];
  try { fs.writeFileSync(VAULT_FILE, '[]', 'utf-8'); } catch (e) {}
  // Broadcast clear event to all connected sockets
  io.emit('vault-cleared');
  res.json({ ok: true });
});


io.on('connection', (socket) => {
  let currentRoom = null;
  let clientRole = null;
  let clientInfo = {};

  socket.on('register', ({ role, roomId, deviceInfo }) => {
    clientRole = role;
    clientInfo = deviceInfo || {};
    currentRoom = roomId || 'main';

    socket.join(currentRoom);

    if (!rooms.has(currentRoom)) {
      rooms.set(currentRoom, {
        desktop: null,
        mobiles: new Set(),
        createdAt: Date.now()
      });
    }

    const room = rooms.get(currentRoom);

    if (role === 'desktop') {
      room.desktop = socket.id;
      socket.emit('registered', { role: 'desktop', roomId: currentRoom, publicUrl });
      const mobileCount = room.mobiles.size;
      socket.emit('room-status', {
        connectedMobiles: mobileCount,
        hasDesktop: true,
        publicUrl
      });
    } else {
      room.mobiles.add(socket.id);
      socket.emit('registered', { role: 'mobile', roomId: currentRoom });
      
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

    // Unconditionally send all active 24-hour vault items to connecting device (desktop or mobile)
    const now = Date.now();
    const activeItems = vaultItems.filter(item => (item.expiresAt || (item.timestamp + VAULT_RETENTION_MS)) > now);
    socket.emit('room-vault-history', activeItems);
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

  // Instant Teleport Payload (Saved to Disk with 24-Hour Expiry)
  socket.on('teleport', (payload) => {
    if (!currentRoom) {
      console.log('[TELEPORT] ERROR: no currentRoom for socket', socket.id);
      return;
    }

    const packet = {
      ...payload,
      id: payload.id || 'tp_' + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      expiresAt: Date.now() + VAULT_RETENTION_MS,
      senderId: socket.id,
      senderRole: clientRole
    };

    // Store in global persistent vault and save to disk
    vaultItems.unshift(packet);
    if (vaultItems.length > 100) vaultItems = vaultItems.slice(0, 100);
    saveVaultToDisk();

    const socketsInRoom = io.sockets.adapter.rooms.get(currentRoom);
    console.log(`[TELEPORT] room="${currentRoom}" sender=${socket.id} role=${clientRole} sockets_in_room=${socketsInRoom ? socketsInRoom.size : 0}`);
    
    socket.to(currentRoom).emit('teleport-receive', packet);
    console.log(`[TELEPORT] emitted teleport-receive to room "${currentRoom}"`);
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
