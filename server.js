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

// Dedicated 24-Hour Storage & Log System
const VAULT_STORAGE_DIR = path.join(__dirname, 'vault_storage');
const VAULT_FILES_DIR = path.join(VAULT_STORAGE_DIR, 'files');
const VAULT_LOGS_DIR = path.join(VAULT_STORAGE_DIR, 'logs');
const VAULT_LOG_FILE = path.join(VAULT_LOGS_DIR, 'vault_activity.json');

// Ensure directories exist on startup
if (!fs.existsSync(VAULT_STORAGE_DIR)) fs.mkdirSync(VAULT_STORAGE_DIR, { recursive: true });
if (!fs.existsSync(VAULT_FILES_DIR)) fs.mkdirSync(VAULT_FILES_DIR, { recursive: true });
if (!fs.existsSync(VAULT_LOGS_DIR)) fs.mkdirSync(VAULT_LOGS_DIR, { recursive: true });

// Serve saved physical files statically
app.use('/vault_files', express.static(VAULT_FILES_DIR, { maxAge: '1d' }));

const PORT = process.env.PORT || 3456;

// In-memory room state and 24-Hour (1 Day) Persistent Vault Storage
const rooms = new Map();
const VAULT_RETENTION_MS = 24 * 60 * 60 * 1000; // 24 Hours Auto-Expiry
const VAULT_FILE = path.join(__dirname, 'vault_storage.json');

let clearTimes = {};

// Helper: Append log record to activity log file
function logVaultActivity(entry) {
  try {
    let logs = [];
    if (fs.existsSync(VAULT_LOG_FILE)) {
      const raw = fs.readFileSync(VAULT_LOG_FILE, 'utf-8');
      logs = JSON.parse(raw);
    }
    logs.unshift({
      id: entry.id,
      timestamp: entry.timestamp,
      dateFormatted: new Date(entry.timestamp).toISOString().replace('T', ' ').substring(0, 19),
      expiresAt: entry.expiresAt,
      type: entry.type,
      title: entry.title || entry.name || 'Mesaj',
      size: entry.size || 0,
      mime: entry.mime || '',
      roomId: entry.roomId || 'main',
      savedFilePath: entry.savedFilePath || null
    });

    // Keep logs within 24h window
    const now = Date.now();
    logs = logs.filter(l => (l.expiresAt || (l.timestamp + VAULT_RETENTION_MS)) > now);

    fs.writeFileSync(VAULT_LOG_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing activity log:', e);
  }
}

// Helper: Save Base64 file/video data to physical disk file
function savePayloadFileToDisk(payload) {
  try {
    if (!payload.data || typeof payload.data !== 'string' || !payload.data.startsWith('data:')) {
      return null;
    }

    const matches = payload.data.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;

    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const safeName = (payload.name || payload.title || 'file').replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const fileName = `${payload.id}_${safeName}`;
    const filePath = path.join(VAULT_FILES_DIR, fileName);

    fs.writeFileSync(filePath, buffer);
    const fileUrl = `/vault_files/${fileName}`;

    return { filePath, fileUrl };
  } catch (e) {
    console.error('Error saving file to disk:', e);
    return null;
  }
}

// Load vault items from disk
function loadVaultFromDisk() {
  try {
    if (fs.existsSync(VAULT_FILE)) {
      const data = JSON.parse(fs.readFileSync(VAULT_FILE, 'utf-8'));
      const now = Date.now();
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        clearTimes = data.clearTimes || {};
        if (data.clearTime && Object.keys(clearTimes).length === 0) {
          clearTimes['main'] = data.clearTime;
        }
        const items = data.items || [];
        return items.filter(item => (item.expiresAt || (item.timestamp + VAULT_RETENTION_MS)) > now);
      } else if (Array.isArray(data)) {
        return data.filter(item => (item.expiresAt || (item.timestamp + VAULT_RETENTION_MS)) > now);
      }
    }
  } catch (e) {
    console.error('Error loading vault storage:', e);
  }
  return [];
}

let vaultItems = loadVaultFromDisk();

// Save vault items to disk & Purge files older than 24 hours
function saveVaultToDisk() {
  try {
    const now = Date.now();
    vaultItems = vaultItems.filter(item => (item.expiresAt || (item.timestamp + VAULT_RETENTION_MS)) > now);
    fs.writeFileSync(VAULT_FILE, JSON.stringify({ items: vaultItems, clearTimes }), 'utf-8');
  } catch (e) {
    console.error('Error saving vault storage:', e);
  }
}

// AUTOMATIC 24-HOUR DISK PURGE ROUTINE (Scans files & logs every 10 mins)
function purgeExpiredVaultData() {
  try {
    const now = Date.now();
    
    // 1. Purge expired physical files in vault_storage/files/
    if (fs.existsSync(VAULT_FILES_DIR)) {
      const files = fs.readdirSync(VAULT_FILES_DIR);
      files.forEach(file => {
        const filePath = path.join(VAULT_FILES_DIR, file);
        try {
          const stats = fs.statSync(filePath);
          const ageMs = now - stats.mtimeMs;
          if (ageMs > VAULT_RETENTION_MS) {
            fs.unlinkSync(filePath);
            console.log(`[VAULT PURGE 24H] Deleted expired physical file: ${file}`);
          }
        } catch (e) {}
      });
    }

    // 2. Purge expired JSON records
    saveVaultToDisk();

    // 3. Purge expired activity logs
    if (fs.existsSync(VAULT_LOG_FILE)) {
      const raw = fs.readFileSync(VAULT_LOG_FILE, 'utf-8');
      let logs = JSON.parse(raw);
      logs = logs.filter(l => (l.expiresAt || (l.timestamp + VAULT_RETENTION_MS)) > now);
      fs.writeFileSync(VAULT_LOG_FILE, JSON.stringify(logs, null, 2), 'utf-8');
    }
  } catch (e) {
    console.error('Error in 24h vault purge routine:', e);
  }
}

// Run 24-Hour Purge Routine every 10 minutes
setInterval(purgeExpiredVaultData, 10 * 60 * 1000);
// Also run once at server startup
purgeExpiredVaultData();

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

// API endpoint to inspect 24-hour vault storage status and activity logs
app.get('/api/vault/status', (req, res) => {
  try {
    let filesCount = 0;
    let totalBytes = 0;
    if (fs.existsSync(VAULT_FILES_DIR)) {
      const files = fs.readdirSync(VAULT_FILES_DIR);
      filesCount = files.length;
      files.forEach(f => {
        try { totalBytes += fs.statSync(path.join(VAULT_FILES_DIR, f)).size; } catch(e) {}
      });
    }

    let logs = [];
    if (fs.existsSync(VAULT_LOG_FILE)) {
      logs = JSON.parse(fs.readFileSync(VAULT_LOG_FILE, 'utf-8'));
    }

    res.json({
      ok: true,
      storageDirectory: VAULT_STORAGE_DIR,
      filesDirectory: VAULT_FILES_DIR,
      logsDirectory: VAULT_LOGS_DIR,
      totalSavedFiles: filesCount,
      totalDiskUsageBytes: totalBytes,
      totalDiskUsageFormatted: (totalBytes / (1024 * 1024)).toFixed(2) + ' MB',
      autoPurgeInterval: '10 Minutes',
      retentionPolicy: '24 Hours (86,400,000 ms)',
      recentLogs: logs.slice(0, 20)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

// API endpoint to fetch 24-hour vault history (main room only)
app.get('/api/history', (req, res) => {
  const now = Date.now();
  const activeItems = vaultItems.filter(item => (!item.roomId || item.roomId === 'main') && (item.expiresAt || (item.timestamp + VAULT_RETENTION_MS)) > now);
  res.json({ items: activeItems });
});

// API endpoint to fetch room-scoped history
app.get('/api/room/:roomId/history', (req, res) => {
  const now = Date.now();
  const targetRoom = req.params.roomId || 'main';
  const activeItems = vaultItems.filter(item => item.roomId === targetRoom && (item.expiresAt || (item.timestamp + VAULT_RETENTION_MS)) > now);
  res.json({ items: activeItems });
});

// POST /api/clear — wipe main vault and broadcast clear to main clients
app.post('/api/clear', (req, res) => {
  vaultItems = vaultItems.filter(item => item.roomId && item.roomId !== 'main');
  clearTimes['main'] = Date.now();
  saveVaultToDisk();
  io.to('main').emit('vault-cleared', { clearTime: clearTimes['main'] });
  res.json({ ok: true });
});

// POST /api/room/:roomId/clear — wipe room vault and broadcast clear to that room
app.post('/api/room/:roomId/clear', (req, res) => {
  const targetRoom = req.params.roomId || 'main';
  vaultItems = vaultItems.filter(item => item.roomId !== targetRoom);
  clearTimes[targetRoom] = Date.now();
  saveVaultToDisk();
  io.to(targetRoom).emit('vault-cleared', { clearTime: clearTimes[targetRoom] });
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
    const activeItems = vaultItems.filter(item => item.roomId === currentRoom && (item.expiresAt || (item.timestamp + VAULT_RETENTION_MS)) > now);
    const roomClearTime = clearTimes[currentRoom] || 0;
    socket.emit('room-vault-history', { items: activeItems, clearTime: roomClearTime });
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

    const id = payload.id || 'tp_' + Math.random().toString(36).substr(2, 9);
    let diskInfo = null;

    // Save Base64 file/video data to physical file on disk
    if (payload.data && typeof payload.data === 'string' && payload.data.startsWith('data:')) {
      diskInfo = savePayloadFileToDisk({ ...payload, id });
    }

    const packet = {
      ...payload,
      id,
      roomId: currentRoom,
      timestamp: Date.now(),
      expiresAt: Date.now() + VAULT_RETENTION_MS,
      senderId: socket.id,
      senderRole: clientRole,
      data: diskInfo ? diskInfo.fileUrl : payload.data, // Fast static file URL!
      savedFilePath: diskInfo ? diskInfo.filePath : null
    };

    // Store in global persistent vault and save to disk
    vaultItems.unshift(packet);
    if (vaultItems.length > 100) vaultItems = vaultItems.slice(0, 100);
    saveVaultToDisk();

    // Log vault activity to vault_activity.json
    logVaultActivity(packet);

    const socketsInRoom = io.sockets.adapter.rooms.get(currentRoom);
    console.log(`[TELEPORT 24H VAULT] room="${currentRoom}" type=${payload.type} fileSaved=${!!diskInfo} sockets=${socketsInRoom ? socketsInRoom.size : 0}`);
    
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
