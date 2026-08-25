/**
 * AetherDrop Client Application
 * Handles Drag & Drop, Socket/WebRTC signaling, Smart Content Parsing, Sound FX & Haptics
 */

// Sound Synthesizer via Web Audio API
class SoundFx {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  // Teleport Warp Sound (PC Drop)
  playTeleport() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
      
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  // Crystal Arrival Chime (Phone Receive)
  playArrival() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [587.33, 880, 1174.66].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        
        gain.gain.setValueAtTime(0.25, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.35);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.35);
      });
    } catch (e) {}
  }
}

// Global App State
const state = {
  socket: null,
  role: 'desktop', // 'desktop' or 'mobile'
  roomId: null,
  sound: new SoundFx(),
  activePeers: 0,
  history: [],
  pingInterval: null,
  networkMode: 'local', // 'local' or 'global'
  localUrl: '',
  publicUrl: '',
  serverPort: 3456
};

// URL Parameters
const urlParams = new URLSearchParams(window.location.search);
const joinRoomParam = urlParams.get('join');
const modeParam = urlParams.get('mode');

// Auto-detect mobile devices or join links
const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;

if (modeParam === 'mobile' || (joinRoomParam && isMobileDevice) || (joinRoomParam && modeParam !== 'desktop')) {
  state.role = 'mobile';
  state.roomId = joinRoomParam || 'default-room';
} else {
  state.role = 'desktop';
  state.roomId = joinRoomParam || 'aether-' + Math.random().toString(36).substring(2, 8);
}

// DOM Elements
const desktopView = document.getElementById('desktop-view');
const mobileView = document.getElementById('mobile-view');
const btnSwitchMode = document.getElementById('btn-switch-mode');
const modeLabel = document.getElementById('mode-label');
const btnSoundToggle = document.getElementById('btn-sound-toggle');
const soundIcon = document.getElementById('sound-icon');
const btnToggleTunnel = document.getElementById('btn-toggle-tunnel');
const tunnelIcon = document.getElementById('tunnel-icon');
const tunnelModeText = document.getElementById('tunnel-mode-text');
const tabNetworkLocal = document.getElementById('tab-network-local');
const tabNetworkGlobal = document.getElementById('tab-network-global');
const globalDragOverlay = document.getElementById('global-drag-overlay');
const mainDropZone = document.getElementById('main-drop-zone');
const fileInputHidden = document.getElementById('file-input-hidden');
const btnBrowseFile = document.getElementById('btn-browse-file');
const quickTextInput = document.getElementById('quick-text-input');
const btnQuickSend = document.getElementById('btn-quick-send');
const pairingQrImg = document.getElementById('pairing-qr-img');
const roomCodeBadge = document.getElementById('room-code-badge');
const mobileJoinUrlInput = document.getElementById('mobile-join-url-input');
const btnCopyUrl = document.getElementById('btn-copy-url');
const connectionStatusPill = document.getElementById('connection-status-pill');
const connectionStatusText = document.getElementById('connection-status-text');
const connectedPhoneName = document.getElementById('connected-phone-name');
const pingText = document.getElementById('ping-text');
const recentActivityFeed = document.getElementById('recent-activity-feed');
const historyEmptyState = document.getElementById('history-empty-state');
const btnClearHistory = document.getElementById('btn-clear-history');
const mobileStreamList = document.getElementById('mobile-stream-list');
const mobileEmptyState = document.getElementById('mobile-empty-state');
const mobileFeedCount = document.getElementById('mobile-feed-count');
const btnMobileSend = document.getElementById('btn-mobile-send');

// Modal Elements
const modalTextComposer = document.getElementById('modal-text-composer');
const btnOpenTextModal = document.getElementById('btn-open-text-modal');
const btnCloseTextModal = document.getElementById('btn-close-text-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const btnSendModalText = document.getElementById('btn-send-modal-text');
const modalTextContent = document.getElementById('modal-text-content');

// Lightbox Elements
const lightboxModal = document.getElementById('lightbox-modal');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxDownloadLink = document.getElementById('lightbox-download-link');
const btnCloseLightbox = document.getElementById('btn-close-lightbox');

// Toast Container
const toastContainer = document.getElementById('toast-container');

// Progress Elements
const transferProgressCard = document.getElementById('transfer-progress-card');
const transferFileName = document.getElementById('transfer-file-name');
const transferStats = document.getElementById('transfer-stats');
const transferPercent = document.getElementById('transfer-percent');
const transferBar = document.getElementById('transfer-bar');

// Initialize UI Mode
function updateUIMode() {
  if (state.role === 'mobile') {
    desktopView.classList.add('hidden');
    mobileView.classList.remove('hidden');
    mobileView.classList.add('flex');
    if (modeLabel) modeLabel.textContent = 'PC Görünümü';
  } else {
    desktopView.classList.remove('hidden');
    mobileView.classList.add('hidden');
    mobileView.classList.remove('flex');
    if (modeLabel) modeLabel.textContent = 'Mobil Görünüm';
  }
}

updateUIMode();

// Initialize Socket.IO Connection
function initSocket() {
  state.socket = io();

  state.socket.on('connect', () => {
    console.log('🛸 Connected to AetherDrop Server. Socket ID:', state.socket.id);
    
    // Register device
    state.socket.emit('register', {
      role: state.role,
      roomId: state.roomId,
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screen: `${window.innerWidth}x${window.innerHeight}`
      }
    });

    startPingHeartbeat();
  });

  state.socket.on('room-status', ({ connectedMobiles, hasDesktop }) => {
    state.activePeers = connectedMobiles;
    updateConnectionUI(connectedMobiles, hasDesktop);
  });

  state.socket.on('peer-connected', ({ id, role, deviceInfo }) => {
    showToast(`📱 Yeni ${role === 'mobile' ? 'Telefon' : 'Cihaz'} Bağlandı!`, 'success');
    state.sound.playArrival();
    if (navigator.vibrate) navigator.vibrate(100);
  });

  state.socket.on('peer-disconnected', () => {
    showToast('Bir cihazın bağlantısı kesildi.', 'info');
  });

  // Handle Incoming Teleported Data
  state.socket.on('teleport-receive', (packet) => {
    handleIncomingPacket(packet);
  });

  // Pong for latency
  state.socket.on('pong-peer', ({ timestamp }) => {
    const rtt = Date.now() - timestamp;
    if (pingText) pingText.textContent = `${rtt} ms`;
  });
}

function startPingHeartbeat() {
  if (state.pingInterval) clearInterval(state.pingInterval);
  state.pingInterval = setInterval(() => {
    if (state.socket && state.socket.connected) {
      state.socket.emit('ping-peer', { timestamp: Date.now() });
    }
  }, 3000);
}

function updateConnectionUI(connectedMobiles, hasDesktop) {
  if (state.role === 'desktop') {
    if (connectedMobiles > 0) {
      connectionStatusPill.className = 'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300';
      connectionStatusPill.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span><span>${connectedMobiles} Telefon Bağlı</span>`;
      if (connectedPhoneName) connectedPhoneName.textContent = `${connectedMobiles} Cihaz Aktif`;
    } else {
      connectionStatusPill.className = 'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300';
      connectionStatusPill.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span><span>Telefon Bekleniyor...</span>`;
      if (connectedPhoneName) connectedPhoneName.textContent = 'Bekleniyor...';
    }
  } else {
    // Mobile view
    if (hasDesktop) {
      connectionStatusPill.className = 'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300';
      connectionStatusPill.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span><span>PC Bağlı</span>`;
    } else {
      connectionStatusPill.className = 'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300';
      connectionStatusPill.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span><span>PC Bekleniyor...</span>`;
    }
  }
}

// Fetch Server Info & Generate QR for Desktop
async function loadServerInfo() {
  if (state.role !== 'desktop') return;
  
  try {
    const res = await fetch('/api/info');
    const data = await res.json();
    
    state.localUrl = data.localUrl;
    state.publicUrl = data.publicUrl;
    state.serverPort = data.port;

    updateNetworkDisplay();
  } catch (err) {
    console.error('Failed to load server info:', err);
  }
}

// Update Network Display & Regenerate QR
async function updateNetworkDisplay() {
  const activeBaseUrl = (state.networkMode === 'global' && state.publicUrl) ? state.publicUrl : (state.localUrl || window.location.origin);
  const mobileJoinUrl = `${activeBaseUrl}/?join=${state.roomId}&mode=mobile`;
  
  if (mobileJoinUrlInput) mobileJoinUrlInput.value = mobileJoinUrl;
  if (roomCodeBadge) roomCodeBadge.textContent = `Oda: ${state.roomId}`;

  // Update tabs UI
  if (tabNetworkLocal && tabNetworkGlobal) {
    if (state.networkMode === 'local') {
      tabNetworkLocal.className = 'flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white shadow transition flex items-center justify-center gap-1.5';
      tabNetworkGlobal.className = 'flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5';
      if (tunnelModeText) tunnelModeText.textContent = 'Yerel Ağ';
      if (btnToggleTunnel) btnToggleTunnel.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-800/80 hover:bg-slate-700 border border-slate-700/70 text-slate-300 transition group shadow-sm';
    } else {
      tabNetworkGlobal.className = 'flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold bg-sky-600 text-white shadow transition flex items-center justify-center gap-1.5';
      tabNetworkLocal.className = 'flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5';
      if (tunnelModeText) tunnelModeText.textContent = 'Serbest İnternet (Global)';
      if (btnToggleTunnel) btnToggleTunnel.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 transition group shadow-sm';
    }
  }

  // Fetch & Render Dynamic QR Code
  try {
    const qrRes = await fetch(`/api/qr?url=${encodeURIComponent(mobileJoinUrl)}`);
    const qrData = await qrRes.json();
    if (pairingQrImg && qrData.qr) {
      pairingQrImg.src = qrData.qr;
    }
  } catch (e) {
    console.error('QR fetch error:', e);
  }
}

// Toggle Global Tunnel
async function setNetworkMode(mode) {
  state.networkMode = mode;

  if (mode === 'global' && !state.publicUrl) {
    showToast('Küresel Serbest İnternet tüneli oluşturuluyor...', 'info');
    try {
      const res = await fetch('/api/tunnel/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: true })
      });
      const data = await res.json();
      if (data.publicUrl) {
        state.publicUrl = data.publicUrl;
        showToast('🌍 Küresel İnternet Aktif! Dünyanın her yerinden bağlanabilirsiniz.', 'success');
      } else {
        showToast('Tünel oluşturulamadı, yerel ağda devam ediliyor.', 'error');
        state.networkMode = 'local';
      }
    } catch (err) {
      showToast('Tünel hatası', 'error');
      state.networkMode = 'local';
    }
  } else {
    showToast(mode === 'global' ? '🌍 Serbest İnternet Modu Açık' : '📡 Aynı Wi-Fi Modu Açık', 'info');
  }

  updateNetworkDisplay();
}

if (tabNetworkLocal) {
  tabNetworkLocal.addEventListener('click', () => setNetworkMode('local'));
}

if (tabNetworkGlobal) {
  tabNetworkGlobal.addEventListener('click', () => setNetworkMode('global'));
}

if (btnToggleTunnel) {
  btnToggleTunnel.addEventListener('click', () => {
    setNetworkMode(state.networkMode === 'local' ? 'global' : 'local');
  });
}

// SMART CONTENT TELEPORTER CORE
async function sendTeleportPayload(payload) {
  if (!state.socket || !state.socket.connected) {
    showToast('Sunucu bağlantısı yok!', 'error');
    return;
  }

  // Play sci-fi teleport sound
  state.sound.playTeleport();

  // Send packet over socket
  state.socket.emit('teleport', payload);

  // Add to local activity feed
  addActivityItem(payload, true);

  showToast(`${payload.title || 'İçerik'} Telefona Işınlandı!`, 'success');
}

// Handle File Processing & Sending
async function processAndSendFiles(fileList) {
  if (!fileList || fileList.length === 0) return;

  const files = Array.from(fileList);

  for (const file of files) {
    showTransferProgress(file.name, file.size);

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    
    let type = 'file';
    if (isImage) type = 'image';
    else if (isVideo) type = 'video';
    else if (isAudio) type = 'audio';
    else if (file.name.endsWith('.apk')) type = 'apk';
    else if (file.type === 'application/pdf') type = 'pdf';

    const reader = new FileReader();
    
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        updateTransferProgress(percent, e.loaded, e.total);
      }
    };

    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      
      const payload = {
        type: type,
        title: file.name,
        name: file.name,
        size: file.size,
        mime: file.type,
        data: dataUrl,
        timestamp: Date.now()
      };

      await sendTeleportPayload(payload);
      hideTransferProgress();
    };

    reader.readAsDataURL(file);
  }
}

// Process Text / URL / Code
function processAndSendText(rawText) {
  if (!rawText || !rawText.trim()) return;

  const text = rawText.trim();
  const isUrl = /^(http|https):\/\/[^ "]+$/.test(text);

  const payload = {
    type: isUrl ? 'url' : 'text',
    title: isUrl ? 'Web Bağlantısı' : 'Metin / Not',
    content: text,
    timestamp: Date.now()
  };

  sendTeleportPayload(payload);
}

// Handle Incoming Packet on Receiver (Mobile / Peer)
function handleIncomingPacket(packet) {
  state.sound.playArrival();
  if (navigator.vibrate) {
    navigator.vibrate([120, 60, 120]);
  }

  addActivityItem(packet, false);
  showToast(`🛸 Yeni ${packet.title || 'Öğe'} Düştü!`, 'success');
}

// Build Smart Content Card HTML
function createContentCard(item, isSentByMe) {
  const timeStr = new Date(item.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const card = document.createElement('div');
  card.className = 'teleport-item-card glass-panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3 border border-white/10 hover:border-indigo-500/40 transition';

  let iconHtml = '<i data-lucide="file" class="w-5 h-5 text-indigo-400"></i>';
  let bodyHtml = '';

  if (item.type === 'image') {
    iconHtml = '<i data-lucide="image" class="w-5 h-5 text-pink-400"></i>';
    bodyHtml = `
      <div class="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 cursor-pointer group max-h-64 flex items-center justify-center" onclick="openLightbox('${item.data}')">
        <img src="${item.data}" alt="${item.name || 'Image'}" class="w-full h-auto max-h-64 object-contain rounded-xl group-hover:scale-105 transition duration-300">
        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition backdrop-blur-xs">
          <span class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow">
            <i data-lucide="maximize-2" class="w-3.5 h-3.5"></i> Büyüt
          </span>
        </div>
      </div>
      <div class="flex items-center justify-between mt-1">
        <span class="text-xs text-slate-400">${formatFileSize(item.size || 0)}</span>
        <a href="${item.data}" download="${item.name || 'image.png'}" class="px-3.5 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow">
          <i data-lucide="download" class="w-3.5 h-3.5"></i>
          <span>Kaydet / İndir</span>
        </a>
      </div>
    `;
  } else if (item.type === 'video') {
    iconHtml = '<i data-lucide="film" class="w-5 h-5 text-indigo-400"></i>';
    bodyHtml = `
      <div class="rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
        <video controls class="w-full max-h-64 rounded-xl" src="${item.data}"></video>
      </div>
      <div class="flex items-center justify-between mt-1">
        <span class="text-xs text-slate-400">${formatFileSize(item.size || 0)}</span>
        <a href="${item.data}" download="${item.name || 'video.mp4'}" class="px-3.5 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold transition flex items-center gap-1.5">
          <i data-lucide="download" class="w-3.5 h-3.5"></i>
          <span>İndir</span>
        </a>
      </div>
    `;
  } else if (item.type === 'url') {
    iconHtml = '<i data-lucide="globe" class="w-5 h-5 text-sky-400"></i>';
    bodyHtml = `
      <div class="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-2">
        <a href="${item.content}" target="_blank" rel="noopener noreferrer" class="text-sm font-semibold text-indigo-300 hover:text-indigo-200 underline break-all flex items-center gap-1.5">
          <i data-lucide="external-link" class="w-4 h-4 flex-shrink-0"></i>
          <span>${item.content}</span>
        </a>
      </div>
      <div class="flex items-center justify-end gap-2">
        <button onclick="copyToClipboard('${item.content}')" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1.5">
          <i data-lucide="copy" class="w-3.5 h-3.5"></i>
          <span>Linki Kopyala</span>
        </button>
        <a href="${item.content}" target="_blank" rel="noopener noreferrer" class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1.5">
          <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i>
          <span>Tarayıcıda Aç</span>
        </a>
      </div>
    `;
  } else if (item.type === 'text') {
    iconHtml = '<i data-lucide="file-text" class="w-5 h-5 text-emerald-400"></i>';
    bodyHtml = `
      <div class="p-4 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs sm:text-sm text-slate-200 whitespace-pre-wrap break-words max-h-48 overflow-y-auto leading-relaxed select-all">
        ${escapeHtml(item.content)}
      </div>
      <div class="flex items-center justify-between mt-1">
        <span class="text-xs text-slate-500">${item.content.length} karakter</span>
        <button onclick="copyToClipboard('${escapeJsString(item.content)}')" class="px-3.5 py-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow">
          <i data-lucide="copy" class="w-3.5 h-3.5"></i>
          <span>Panoya Kopyala</span>
        </button>
      </div>
    `;
  } else {
    // Generic File / APK / PDF
    iconHtml = '<i data-lucide="file-check" class="w-5 h-5 text-purple-400"></i>';
    bodyHtml = `
      <div class="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-3 overflow-hidden">
          <div class="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
            <i data-lucide="paperclip" class="w-5 h-5"></i>
          </div>
          <div class="overflow-hidden">
            <h5 class="text-xs sm:text-sm font-semibold text-white truncate">${item.name || item.title || 'Dosya'}</h5>
            <span class="text-[11px] text-slate-400">${formatFileSize(item.size || 0)}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center justify-end">
        <a href="${item.data}" download="${item.name || 'teleport_file'}" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-2 shadow-lg">
          <i data-lucide="download" class="w-4 h-4"></i>
          <span>Dosyayı İndir</span>
        </a>
      </div>
    `;
  }

  card.innerHTML = `
    <div class="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
      <div class="flex items-center gap-2.5">
        <div class="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
          ${iconHtml}
        </div>
        <div>
          <h4 class="text-xs sm:text-sm font-bold text-slate-200 truncate max-w-[200px] sm:max-w-xs">${item.title || item.name || 'Işınlanan Öğe'}</h4>
          <span class="text-[10px] text-slate-500 font-mono">${timeStr} • ${isSentByMe ? 'Gönderildi' : 'Alındı'}</span>
        </div>
      </div>
      <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isSentByMe ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}">
        ${isSentByMe ? 'Çıkan' : 'Gelen'}
      </span>
    </div>
    <div class="flex flex-col gap-2">
      ${bodyHtml}
    </div>
  `;

  return card;
}

// Add Item to Stream / Activity Feed
function addActivityItem(item, isSentByMe) {
  state.history.unshift(item);

  const card = createContentCard(item, isSentByMe);

  // Desktop Activity Feed
  if (recentActivityFeed) {
    if (historyEmptyState) historyEmptyState.remove();
    recentActivityFeed.prepend(card.cloneNode(true));
  }

  // Mobile Stream Feed
  if (mobileStreamList) {
    if (mobileEmptyState) mobileEmptyState.remove();
    mobileStreamList.prepend(card);
    if (mobileFeedCount) {
      mobileFeedCount.textContent = `${state.history.length} Öğe`;
    }
  }

  // Refresh lucide icons
  if (window.lucide) window.lucide.createIcons();
}

// Lightbox Handler
window.openLightbox = function(imgSrc) {
  if (lightboxImg && lightboxModal) {
    lightboxImg.src = imgSrc;
    if (lightboxDownloadLink) lightboxDownloadLink.href = imgSrc;
    lightboxModal.classList.remove('hidden');
    lightboxModal.classList.add('flex');
  }
};

if (btnCloseLightbox) {
  btnCloseLightbox.addEventListener('click', () => {
    lightboxModal.classList.add('hidden');
    lightboxModal.classList.remove('flex');
  });
}

// Toast Notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  const bgColors = {
    success: 'bg-emerald-500/90 border-emerald-400/50 text-white',
    error: 'bg-rose-500/90 border-rose-400/50 text-white',
    info: 'bg-indigo-600/90 border-indigo-400/50 text-white'
  };

  toast.className = `px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-xl border text-xs font-semibold flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0 ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `
    <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info'}" class="w-4 h-4"></i>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Global Drag and Drop Handlers
let dragCounter = 0;

window.addEventListener('dragenter', (e) => {
  e.preventDefault();
  dragCounter++;
  if (globalDragOverlay) {
    globalDragOverlay.classList.add('active');
  }
});

window.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dragCounter--;
  if (dragCounter <= 0) {
    dragCounter = 0;
    if (globalDragOverlay) {
      globalDragOverlay.classList.remove('active');
    }
  }
});

window.addEventListener('dragover', (e) => {
  e.preventDefault();
});

window.addEventListener('drop', (e) => {
  e.preventDefault();
  dragCounter = 0;
  if (globalDragOverlay) {
    globalDragOverlay.classList.remove('active');
  }

  // Check for dropped files
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    processAndSendFiles(e.dataTransfer.files);
    return;
  }

  // Check for dropped plain text or URLs
  const text = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
  if (text) {
    processAndSendText(text);
  }
});

// Dropzone Direct File Selector
if (btnBrowseFile && fileInputHidden) {
  btnBrowseFile.addEventListener('click', () => fileInputHidden.click());
  fileInputHidden.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processAndSendFiles(e.target.files);
      e.target.value = '';
    }
  });
}

// Clipboard Paste Detection (Ctrl + V on Desktop)
window.addEventListener('paste', (e) => {
  const items = e.clipboardData && e.clipboardData.items;
  if (!items) return;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.indexOf('image') !== -1) {
      const blob = item.getAsFile();
      processAndSendFiles([blob]);
      return;
    }
  }

  // Plain text paste if not typing in input
  if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    const text = e.clipboardData.getData('text');
    if (text && text.trim()) {
      processAndSendText(text);
    }
  }
});

// Quick Text Input Enter Key
if (quickTextInput && btnQuickSend) {
  const handleQuickSend = () => {
    const val = quickTextInput.value;
    if (val && val.trim()) {
      processAndSendText(val);
      quickTextInput.value = '';
    }
  };

  btnQuickSend.addEventListener('click', handleQuickSend);
  quickTextInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleQuickSend();
  });
}

// Text Modal Handlers
if (btnOpenTextModal && modalTextComposer) {
  btnOpenTextModal.addEventListener('click', () => {
    modalTextComposer.classList.remove('hidden');
    modalTextComposer.classList.add('flex');
    modalTextContent.focus();
  });
}

function closeTextModal() {
  if (modalTextComposer) {
    modalTextComposer.classList.add('hidden');
    modalTextComposer.classList.remove('flex');
  }
}

if (btnCloseTextModal) btnCloseTextModal.addEventListener('click', closeTextModal);
if (btnCancelModal) btnCancelModal.addEventListener('click', closeTextModal);

if (btnSendModalText && modalTextContent) {
  btnSendModalText.addEventListener('click', () => {
    const val = modalTextContent.value;
    if (val && val.trim()) {
      processAndSendText(val);
      modalTextContent.value = '';
      closeTextModal();
    }
  });
}

// Copy URL Button
if (btnCopyUrl && mobileJoinUrlInput) {
  btnCopyUrl.addEventListener('click', () => {
    copyToClipboard(mobileJoinUrlInput.value);
  });
}

// Sound Toggle Button
if (btnSoundToggle) {
  btnSoundToggle.addEventListener('click', () => {
    state.sound.enabled = !state.sound.enabled;
    if (soundIcon) {
      soundIcon.setAttribute('data-lucide', state.sound.enabled ? 'volume-2' : 'volume-x');
      if (window.lucide) window.lucide.createIcons();
    }
    showToast(`Ses Efektleri: ${state.sound.enabled ? 'Açık' : 'Kapalı'}`, 'info');
  });
}

// Mode Switcher Button
if (btnSwitchMode) {
  btnSwitchMode.addEventListener('click', () => {
    state.role = state.role === 'desktop' ? 'mobile' : 'desktop';
    updateUIMode();
    showToast(`Görünüm Değiştirildi: ${state.role === 'desktop' ? 'Masaüstü' : 'Mobil'}`);
  });
}

// Mobile Send to PC Button
if (btnMobileSend) {
  btnMobileSend.addEventListener('click', () => {
    if (fileInputHidden) fileInputHidden.click();
  });
}

// Clear History Button
if (btnClearHistory && recentActivityFeed) {
  btnClearHistory.addEventListener('click', () => {
    state.history = [];
    recentActivityFeed.innerHTML = `
      <div id="history-empty-state" class="text-center py-8 text-slate-500 text-xs flex flex-col items-center gap-2">
        <i data-lucide="inbox" class="w-8 h-8 text-slate-600"></i>
        <span>Geçmiş temizlendi.</span>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  });
}

// Progress Bar Helper
function showTransferProgress(name, size) {
  if (transferProgressCard) {
    transferProgressCard.classList.remove('hidden');
    transferProgressCard.classList.add('flex');
    transferFileName.textContent = name;
    transferPercent.textContent = '0%';
    transferBar.style.width = '0%';
    transferStats.textContent = `0 KB / ${formatFileSize(size)}`;
  }
}

function updateTransferProgress(percent, loaded, total) {
  if (transferBar) transferBar.style.width = `${percent}%`;
  if (transferPercent) transferPercent.textContent = `${percent}%`;
  if (transferStats) transferStats.textContent = `${formatFileSize(loaded)} / ${formatFileSize(total)}`;
}

function hideTransferProgress() {
  setTimeout(() => {
    if (transferProgressCard) {
      transferProgressCard.classList.add('hidden');
      transferProgressCard.classList.remove('flex');
    }
  }, 600);
}

// Utility Functions
window.copyToClipboard = function(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Panoya Kopyalandı!', 'success');
  }).catch(() => {
    showToast('Kopyalama başarısız oldu.', 'error');
  });
};

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeJsString(str) {
  return (str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(err => {
    console.log('SW registration failed:', err);
  });
}

// Start Application
window.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) window.lucide.createIcons();
  initSocket();
  loadServerInfo();
});
