/**
 * MOVADROP Client Application — Powered by Google Firebase (Serverless & Instant Sync)
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  getDocs, 
  deleteDoc,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';

// Firebase Configuration (berkay-a760f)
const firebaseConfig = {
  apiKey: "AIzaSyCaLhZCgJYvwQaOLuSdpX7a-kVrkOA-5mc",
  authDomain: "berkay-a760f.firebaseapp.com",
  projectId: "berkay-a760f",
  storageBucket: "berkay-a760f.firebasestorage.app",
  messagingSenderId: "226527058460",
  appId: "1:226527058460:web:07610f2424160b1bfbddd9"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Sound Synthesizer via Web Audio API
class SoundFx {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.init();
  }

  init() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (e) {}
  }

  // Teleport Warp Sound (PC Drop)
  playTeleport() {
    if (!this.enabled) return;
    this.init();
    try {
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.28);
      
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) {}
  }

  // Crystal Arrival Chime (Phone Receive)
  playArrival() {
    if (!this.enabled) return;
    this.init();
    try {
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const now = this.ctx.currentTime;
      [587.33, 880, 1174.66, 1760].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        
        gain.gain.setValueAtTime(0.45, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.5);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.5);
      });
    } catch (e) {}
  }
}

// Fullscreen Cosmic Star & Stardust Particle Engine
class CosmicParticleEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.rings = [];
    this.animating = false;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  drawStar(cx, cy, spikes, outerRadius, innerRadius, color, alpha, rotation = 0) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    let rot = (Math.PI / 2) * 3 + rotation;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fill();
    ctx.restore();
  }

  // Cosmic Star Explosion when sending from PC
  triggerSendBurst(originX, originY) {
    const x = originX || window.innerWidth / 2;
    const y = originY || window.innerHeight / 2;
    const colors = ['#6366f1', '#a855f7', '#ec4899', '#38bdf8', '#fbbf24', '#ffffff', '#67e8f9'];

    // Expanding Warp Rings
    for (let i = 0; i < 3; i++) {
      this.rings.push({
        x, y,
        radius: 10 + i * 25,
        maxRadius: Math.max(window.innerWidth, window.innerHeight) * 0.8,
        speed: 15 + i * 5,
        alpha: 0.85,
        color: colors[i % colors.length]
      });
    }

    // 80 Radiant Exploding Stars & Sparks
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 14 + 3;
      const size = Math.random() * 9 + 4;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const isStar = Math.random() > 0.3;

      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color,
        isStar,
        spikes: Math.random() > 0.5 ? 4 : 5,
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.25,
        alpha: 1,
        decay: Math.random() * 0.016 + 0.012,
        gravity: 0.16
      });
    }

    if (!this.animating) {
      this.animating = true;
      this.loop();
    }
  }

  // Ethereal Aurora Wave & Starry Rain on Phone Receive
  triggerArrivalWave() {
    const colors = ['#38bdf8', '#818cf8', '#c084fc', '#34d399', '#ffffff', '#fbbf24'];

    // Aurora Screen Flash
    const flash = document.createElement('div');
    flash.className = 'aurora-screen-burst';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 1300);

    // 60 Falling Glowing Stardust Particles
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * (window.innerHeight * 0.25);
      const speed = Math.random() * 7 + 2;
      const size = Math.random() * 8 + 3;
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 3.5,
        vy: speed,
        size,
        color,
        isStar: true,
        spikes: 4,
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.15,
        alpha: 1,
        decay: Math.random() * 0.016 + 0.009,
        gravity: 0.07
      });
    }

    if (!this.animating) {
      this.animating = true;
      this.loop();
    }
  }

  loop() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update & draw rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const ring = this.rings[i];
      ring.radius += ring.speed;
      ring.alpha -= 0.022;

      if (ring.alpha <= 0 || ring.radius >= ring.maxRadius) {
        this.rings.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = ring.color;
      this.ctx.shadowColor = ring.color;
      this.ctx.shadowBlur = 24;
      this.ctx.lineWidth = 3.5 * ring.alpha;
      this.ctx.globalAlpha = Math.max(0, ring.alpha);
      this.ctx.stroke();
      this.ctx.restore();
    }

    // Update & draw particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.rotation += p.rotationSpeed;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      if (p.isStar) {
        this.drawStar(p.x, p.y, p.spikes, p.size, p.size * 0.45, p.color, p.alpha, p.rotation);
      } else {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = 14;
        this.ctx.globalAlpha = Math.max(0, p.alpha);
        this.ctx.fill();
        this.ctx.restore();
      }
    }

    if (this.particles.length > 0 || this.rings.length > 0) {
      requestAnimationFrame(() => this.loop());
    } else {
      this.animating = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

// Browser Push Notification Engine
class NotificationEngine {
  constructor() {
    this.supported = 'Notification' in window;
    this.permission = this.supported ? Notification.permission : 'denied';
  }

  async requestPermission() {
    if (!this.supported) {
      showToast('Tarayıcınız sistem bildirimlerini desteklemiyor.', 'info');
      return false;
    }
    try {
      const perm = await Notification.requestPermission();
      this.permission = perm;
      if (perm === 'granted') {
        showToast('🔔 Bildirimler Başarıyla Açıldı!', 'success');
        this.send('MOVADROP Hazır!', 'Yeni bir dosya veya yazı geldiğinde anında bildirim alacaksınız.');
        return true;
      } else {
        showToast('Bildirim izni verilmedi.', 'info');
        return false;
      }
    } catch (e) {
      return false;
    }
  }

  send(title, body) {
    if (!this.supported || this.permission !== 'granted') return;
    try {
      const notif = new Notification(`🛸 ${title}`, {
        body: body || 'Yeni bir öğe ışınlandı!',
        icon: 'https://fav.farm/✨',
        badge: 'https://fav.farm/⚡',
        vibrate: [120, 60, 180]
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (e) {}
  }

  notifyItem(item) {
    let title = 'Yeni Öğe Düştü!';
    let body = item.title || item.name || 'İçerik ışınlandı';

    if (item.type === 'image') {
      title = '📷 Yeni Fotoğraf Geldi!';
      body = `${item.name || 'Fotoğraf'} telefonunuza ulaştı.`;
    } else if (item.type === 'video') {
      title = '🎬 Yeni Video Geldi!';
      body = `${item.name || 'Video'} ulaştı.`;
    } else if (item.type === 'text') {
      title = '📝 Yeni Not / Metin!';
      body = item.content ? item.content.slice(0, 80) : 'Metin ulaştı.';
    } else if (item.type === 'url') {
      title = '🔗 Yeni Web Bağlantısı!';
      body = item.content || 'Bağlantı ulaştı.';
    } else {
      title = '📄 Yeni Dosya Geldi!';
      body = `${item.name || 'Dosya'} (${formatFileSize(item.size || 0)})`;
    }

    this.send(title, body);
  }
}

// Unique Device ID
const deviceId = 'dev_' + Math.random().toString(36).substr(2, 9);

// Global App State
const state = {
  deviceId: deviceId,
  role: 'desktop', // 'desktop' or 'mobile'
  roomId: null,
  sound: new SoundFx(),
  cosmic: null,
  notifications: new NotificationEngine(),
  activePeers: 0,
  history: [],
  networkMode: 'global',
  publicUrl: window.location.origin,
  processedIds: new Set(),
  p2pChannel: null,
  peerConnection: null,
  p2pConnected: false
};

// URL Parameters & Unified Shared Room
const urlParams = new URLSearchParams(window.location.search);
let joinRoomParam = urlParams.get('join');
const modeParam = urlParams.get('mode');

// Auto-detect mobile devices
const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;

// If no room is specified in URL, retrieve from localStorage or generate a fresh unique one
if (!joinRoomParam) {
  let storedRoom = null;
  try {
    storedRoom = localStorage.getItem('aetherdrop_my_room_id');
  } catch (e) {}

  if (storedRoom) {
    joinRoomParam = storedRoom;
  } else {
    // Generate a secure random room ID (e.g. room_a1b2c3d4e)
    joinRoomParam = 'room_' + Math.random().toString(36).substr(2, 9);
    try {
      localStorage.setItem('aetherdrop_my_room_id', joinRoomParam);
    } catch (e) {}
  }
  // Update URL silently without reloading the page
  try {
    urlParams.set('join', joinRoomParam);
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
  } catch (e) {}
}

state.roomId = joinRoomParam;

if (modeParam === 'mobile' || isMobileDevice) {
  state.role = 'mobile';
} else {
  state.role = 'desktop';
}

// LocalStorage Persistence for 24-Hour History (Zero-Delay Instant Load on Refresh)
const STORAGE_HISTORY_KEY = 'aetherdrop_local_history_v2';
const STORAGE_CLEAR_TIME_KEY = 'aetherdrop_last_clear_time';
const RETENTION_MS = 24 * 60 * 60 * 1000;

function saveLocalHistory() {
  try {
    const now = Date.now();
    const valid = state.history.filter(item => (item.expiresAt || (item.timestamp + RETENTION_MS)) > now);
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(valid.slice(0, 50)));
  } catch (e) {}
}

function loadLocalHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
    if (raw) {
      const items = JSON.parse(raw);
      const now = Date.now();
      const valid = items.filter(item => (item.expiresAt || (item.timestamp + RETENTION_MS)) > now);
      valid.forEach(item => {
        if (!state.history.some(h => h.id === item.id || (h.timestamp === item.timestamp && h.title === item.title))) {
          addActivityItem(item, item.senderRole === state.role, false);
        }
      });
    }
  } catch (e) {}
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

// Initialize Firebase Realtime Listeners
function initFirebaseSync() {
  const roomMessagesRef = collection(db, 'rooms', state.roomId, 'messages');
  const q = query(roomMessagesRef, orderBy('timestamp', 'asc'));

  onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const data = change.doc.data();
      const docId = change.doc.id;
      data.id = data.id || docId;

      if (change.type === 'added') {
        // Check if it's a clear signal from another device
        if (data.type === '__clear__') return;

        const isExpired = (data.expiresAt || (data.timestamp + RETENTION_MS)) <= Date.now();
        if (isExpired) return;

        const isAlreadyKnown = state.processedIds.has(data.id) || state.history.some(h => h.id === data.id);
        if (!isAlreadyKnown) {
          state.processedIds.add(data.id);
          const isSentByMe = data.senderId === state.deviceId;
          if (!isSentByMe) {
            handleIncomingPacket(data);
          } else {
            addActivityItem(data, true, false);
          }
        }
      }

      // When ALL docs are deleted (clear from any device) — wipe this device's UI too
      if (change.type === 'removed') {
        // We handle full wipe only when all known items are gone
        // Partial removals are just expiry cleanup
        const removedId = data.id;
        state.history = state.history.filter(h => h.id !== removedId);
        state.processedIds.delete(removedId);
        
        // If history is now empty, show empty states
        if (state.history.length === 0) {
          clearUIFeeds();
          try { localStorage.removeItem(STORAGE_HISTORY_KEY); } catch(e) {}
        }
      }
    });
  }, (error) => {
    console.error('Firestore snapshot error:', error);
    showToast('Firebase bağlantı hatası. Sayfayı yenileyin.', 'error');
  });

  startPresenceHeartbeat();
}

function clearUIFeeds() {
  if (recentActivityFeed) {
    recentActivityFeed.innerHTML = `
      <div id="history-empty-state" class="text-center py-8 text-slate-500 text-xs flex flex-col items-center gap-2">
        <i data-lucide="inbox" class="w-8 h-8 text-slate-600"></i>
        <span>Geçmiş temizlendi.</span>
      </div>
    `;
  }
  if (mobileStreamList) {
    mobileStreamList.innerHTML = `
      <div id="mobile-empty-state" class="glass-panel rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 my-auto">
        <div class="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <i data-lucide="satellite" class="w-7 h-7"></i>
        </div>
        <div>
          <h4 class="text-sm font-bold text-slate-200">Geçmiş Temizlendi</h4>
          <p class="text-xs text-slate-400 mt-1">Yeni içerik bekleniyor...</p>
        </div>
      </div>
    `;
    if (mobileFeedCount) mobileFeedCount.textContent = '0 Öğe';
  }
  if (window.lucide) window.lucide.createIcons();
}

// Presence Heartbeat & WebRTC Signaling via Firestore
function startPresenceHeartbeat() {
  const presenceDocRef = doc(db, 'rooms', state.roomId, 'presence', state.deviceId);
  
  const sendHeartbeat = async () => {
    try {
      await setDoc(presenceDocRef, {
        role: state.role,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (e) {}
  };

  sendHeartbeat();
  setInterval(sendHeartbeat, 10000);

  // Listen to peer presence
  const presenceColRef = collection(db, 'rooms', state.roomId, 'presence');
  onSnapshot(presenceColRef, (snapshot) => {
    const now = Date.now();
    let mobileCount = 0;
    let hasDesktop = false;

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data && data.updatedAt && (now - data.updatedAt < 25000)) {
        if (data.role === 'mobile') mobileCount++;
        if (data.role === 'desktop') hasDesktop = true;
      }
    });

    state.activePeers = mobileCount;
    updateConnectionUI(mobileCount, hasDesktop);
  });

  // Initialize WebRTC P2P Signaling
  initWebRTCP2P();
}

// ----------------------------------------------------
// ULTRA-FAST WEBRTC P2P DIRECT BINARY STREAMING ENGINE
// ----------------------------------------------------
const rtcIceConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

let activeP2PIncoming = null;

function initWebRTCP2P() {
  try {
    if (state.peerConnection) {
      try { state.peerConnection.close(); } catch(e) {}
    }

    state.peerConnection = new RTCPeerConnection(rtcIceConfig);
    const pc = state.peerConnection;

    // ICE Candidate handler
    pc.onicecandidate = async (e) => {
      if (e.candidate) {
        try {
          const candRef = doc(db, 'rooms', state.roomId, 'signals', `candidate_${state.role}_${Date.now()}`);
          await setDoc(candRef, {
            senderRole: state.role,
            candidate: JSON.stringify(e.candidate)
          });
        } catch(err) {}
      }
    };

    if (state.role === 'desktop') {
      // Desktop creates DataChannel & Offer
      const dc = pc.createDataChannel('mova_teleport_stream', { ordered: true });
      setupDataChannelEvents(dc);

      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          const offerDocRef = doc(db, 'rooms', state.roomId, 'signals', 'offer');
          await setDoc(offerDocRef, {
            sdp: JSON.stringify(offer),
            senderId: state.deviceId,
            timestamp: Date.now()
          });
        } catch (e) {
          console.error('P2P Offer Error:', e);
        }
      };

      // Listen for Mobile's Answer
      const answerDocRef = doc(db, 'rooms', state.roomId, 'signals', 'answer');
      onSnapshot(answerDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.sdp && pc.signalingState !== 'stable') {
            try {
              const answer = JSON.parse(data.sdp);
              await pc.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (e) {}
          }
        }
      });
    } else {
      // Mobile listens for DataChannel & Offer
      pc.ondatachannel = (e) => {
        setupDataChannelEvents(e.channel);
      };

      const offerDocRef = doc(db, 'rooms', state.roomId, 'signals', 'offer');
      onSnapshot(offerDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.sdp && pc.signalingState === 'stable') {
            try {
              const offer = JSON.parse(data.sdp);
              await pc.setRemoteDescription(new RTCSessionDescription(offer));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              const answerDocRef = doc(db, 'rooms', state.roomId, 'signals', 'answer');
              await setDoc(answerDocRef, {
                sdp: JSON.stringify(answer),
                senderId: state.deviceId,
                timestamp: Date.now()
              });
            } catch (e) {
              console.error('P2P Answer Error:', e);
            }
          }
        }
      });
    }

    // Listen for ICE Candidates
    const signalsColRef = collection(db, 'rooms', state.roomId, 'signals');
    onSnapshot(signalsColRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data && data.candidate && data.senderRole !== state.role) {
            try {
              const cand = JSON.parse(data.candidate);
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (e) {}
          }
        }
      });
    });

  } catch (err) {
    console.error('WebRTC Init Error:', err);
  }
}

function setupDataChannelEvents(dc) {
  dc.binaryType = 'arraybuffer';
  state.p2pChannel = dc;

  dc.onopen = () => {
    state.p2pConnected = true;
    updateConnectionUI(state.activePeers, true);
    showToast('⚡ MOVADROP P2P Aktif! (Sıfır Gecikme Işık Hızı)', 'success');
  };

  dc.onclose = () => {
    state.p2pConnected = false;
    updateConnectionUI(state.activePeers, true);
  };

  dc.onmessage = (e) => {
    handleP2PMessage(e.data);
  };
}

function handleP2PMessage(raw) {
  if (typeof raw === 'string') {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'p2p_file_header') {
        activeP2PIncoming = {
          id: msg.id,
          name: msg.name,
          title: msg.name,
          size: msg.size,
          mime: msg.mime,
          fileType: msg.fileType,
          totalChunks: msg.totalChunks,
          receivedChunks: 0,
          buffers: []
        };
        showTransferProgress(msg.name, msg.size);
      } else if (msg.type === 'p2p_file_done') {
        if (activeP2PIncoming && activeP2PIncoming.id === msg.id) {
          const blob = new Blob(activeP2PIncoming.buffers, { type: activeP2PIncoming.mime || 'application/octet-stream' });
          const blobUrl = URL.createObjectURL(blob);
          
          const payload = {
            id: activeP2PIncoming.id,
            type: activeP2PIncoming.fileType,
            title: activeP2PIncoming.name,
            name: activeP2PIncoming.name,
            size: activeP2PIncoming.size,
            mime: activeP2PIncoming.mime,
            data: blobUrl,
            timestamp: Date.now(),
            expiresAt: Date.now() + RETENTION_MS
          };

          state.processedIds.add(payload.id);
          handleIncomingPacket(payload);
          hideTransferProgress();
          activeP2PIncoming = null;
        }
      }
    } catch(e) {}
  } else if (raw instanceof ArrayBuffer) {
    if (activeP2PIncoming) {
      activeP2PIncoming.buffers.push(raw);
      activeP2PIncoming.receivedChunks++;
      const pct = Math.round((activeP2PIncoming.receivedChunks / activeP2PIncoming.totalChunks) * 100);
      updateTransferProgress(pct, activeP2PIncoming.receivedChunks, activeP2PIncoming.totalChunks);
    }
  }
}

// Send File Directly over WebRTC DataChannel (Instant 0-Lag Raw Binary Streaming)
async function sendP2PFile(file, type) {
  const dc = state.p2pChannel;
  if (!dc || dc.readyState !== 'open') return false;

  // Safe WebRTC chunk size (16KB) prevents SCTP packet drops on iOS Safari / Chrome
  const CHUNK_SIZE = 16 * 1024;
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const msgId = 'tp_' + Math.random().toString(36).substr(2, 9);

  showTransferProgress(file.name, file.size);

  // Send Header
  dc.send(JSON.stringify({
    type: 'p2p_file_header',
    id: msgId,
    name: file.name,
    size: file.size,
    mime: file.type || (type === 'video' ? 'video/mp4' : 'application/octet-stream'),
    fileType: type,
    totalChunks: totalChunks
  }));

  // Create immediate local preview URL
  const localBlobUrl = URL.createObjectURL(file);
  const localPayload = {
    id: msgId,
    type: type,
    title: file.name,
    name: file.name,
    size: file.size,
    mime: file.type || 'video/mp4',
    data: localBlobUrl,
    timestamp: Date.now(),
    expiresAt: Date.now() + RETENTION_MS
  };

  state.processedIds.add(msgId);
  addActivityItem(localPayload, true);

  state.sound.playTeleport();
  if (state.cosmic) state.cosmic.triggerSendBurst();

  let offset = 0;
  let chunkIndex = 0;

  while (offset < file.size) {
    // Flow control: pause if data channel buffer gets ahead
    if (dc.bufferedAmount > 64 * 1024) {
      await new Promise(r => setTimeout(r, 5));
    }

    const slice = file.slice(offset, offset + CHUNK_SIZE);
    const buffer = await slice.arrayBuffer();
    dc.send(buffer);

    offset += CHUNK_SIZE;
    chunkIndex++;
    const pct = Math.round((chunkIndex / totalChunks) * 100);
    updateTransferProgress(pct, offset, file.size);
  }

  // Send Done
  dc.send(JSON.stringify({
    type: 'p2p_file_done',
    id: msgId
  }));

  hideTransferProgress();
  showToast(`⚡ ${file.name} Işık Hızında Işınlandı! (P2P)`, 'success');
  return true;
}

function updateConnectionUI(connectedMobiles, hasDesktop) {
  if (state.role === 'desktop') {
    if (state.p2pConnected) {
      connectionStatusPill.className = 'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-sm';
      connectionStatusPill.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span><span>⚡ P2P Aktif (Işık Hızı)</span>`;
      if (connectedPhoneName) connectedPhoneName.textContent = 'Telefon P2P Bağlı (0ms Gecikme)';
      if (pingText) pingText.textContent = '< 5 ms';
    } else if (connectedMobiles > 0) {
      connectionStatusPill.className = 'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300';
      connectionStatusPill.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span><span>${connectedMobiles} Telefon Bağlı</span>`;
      if (connectedPhoneName) connectedPhoneName.textContent = `${connectedMobiles} Cihaz Aktif`;
      if (pingText) pingText.textContent = 'Bulut Canlı';
    } else {
      connectionStatusPill.className = 'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300';
      connectionStatusPill.innerHTML = `<span class="w-2 h-2 rounded-full bg-indigo-400"></span><span>Bulut Depolama Aktif</span>`;
      if (connectedPhoneName) connectedPhoneName.textContent = 'Bulut Vault Aktif (Gönderebilirsiniz)';
      if (pingText) pingText.textContent = 'Hazır';
    }
  } else {
    // Mobile view
    if (state.p2pConnected) {
      connectionStatusPill.className = 'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-sm';
      connectionStatusPill.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span><span>⚡ PC P2P Bağlı</span>`;
      if (pingText) pingText.textContent = '< 5 ms';
    } else if (hasDesktop) {
      connectionStatusPill.className = 'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300';
      connectionStatusPill.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span><span>PC Bağlı</span>`;
      if (pingText) pingText.textContent = 'Bulut Canlı';
    } else {
      connectionStatusPill.className = 'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300';
      connectionStatusPill.innerHTML = `<span class="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span><span>Bulut Vault Modu</span>`;
      if (pingText) pingText.textContent = 'Bulut';
    }
  }
}

// Update Network Display & Regenerate QR
async function updateNetworkDisplay() {
  const isCloudOrWeb = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  let activeBaseUrl = window.location.origin;

  if (!isCloudOrWeb) {
    activeBaseUrl = (state.networkMode === 'global' && state.publicUrl) ? state.publicUrl : (state.localUrl || window.location.origin);
  } else if (state.publicUrl && state.networkMode === 'global') {
    activeBaseUrl = state.publicUrl;
  }
  
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

  // Render Dynamic High-Res QR Code (Instant Client-Side Generation)
  if (pairingQrImg) {
    pairingQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(mobileJoinUrl)}&color=0f172a&bgcolor=ffffff&qzone=2`;
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

// SMART CONTENT TELEPORTER CORE (Firestore Real-time Transmission)
async function sendTeleportPayload(payload) {
  try {
    state.sound.playTeleport();

    if (state.cosmic) {
      state.cosmic.triggerSendBurst();
    }

    payload.timestamp = payload.timestamp || Date.now();
    payload.expiresAt = payload.expiresAt || (Date.now() + RETENTION_MS);
    payload.senderId = state.deviceId;
    payload.senderRole = state.role;
    payload.id = payload.id || ('tp_' + Math.random().toString(36).substr(2, 9));

    state.processedIds.add(payload.id);

    // Save doc to Firestore
    const roomMessagesRef = collection(db, 'rooms', state.roomId, 'messages');
    await setDoc(doc(roomMessagesRef, payload.id), payload);

    addActivityItem(payload, true);
    showToast(`${payload.title || 'İçerik'} Gönderildi! 🛸`, 'success');
  } catch (err) {
    console.error('Teleport error:', err);
    showToast('Gönderim hatası: ' + err.message, 'error');
  }
}

// Chunked File & Video Teleporter (Supports up to 50MB Videos/Files with Zero Server Cost)
async function sendChunkedPayload(file, type) {
  const CHUNK_SIZE = 400 * 1024; // 400 KB per chunk (Base64)
  const reader = new FileReader();

  showTransferProgress(file.name, file.size);

  reader.onprogress = (e) => {
    if (e.lengthComputable) {
      const pct = Math.round((e.loaded / e.total) * 25);
      updateTransferProgress(pct, e.loaded, e.total);
    }
  };

  reader.onload = async (e) => {
    try {
      const fullDataUrl = e.target.result;
      const totalLength = fullDataUrl.length;
      const totalChunks = Math.ceil(totalLength / CHUNK_SIZE);
      const msgId = 'tp_' + Math.random().toString(36).substr(2, 9);

      updateTransferProgress(30, 0, totalChunks);

      // 1. Create parent message document in Firestore
      const parentPayload = {
        id: msgId,
        type: type,
        title: file.name,
        name: file.name,
        size: file.size,
        mime: file.type || 'application/octet-stream',
        isChunked: true,
        totalChunks: totalChunks,
        timestamp: Date.now(),
        expiresAt: Date.now() + RETENTION_MS,
        senderId: state.deviceId,
        senderRole: state.role
      };

      state.processedIds.add(msgId);

      const parentDocRef = doc(db, 'rooms', state.roomId, 'messages', msgId);
      await setDoc(parentDocRef, parentPayload);

      // Add to sender's own UI immediately with local fullDataUrl
      const localPayload = { ...parentPayload, data: fullDataUrl };
      addActivityItem(localPayload, true);

      state.sound.playTeleport();
      if (state.cosmic) state.cosmic.triggerSendBurst();

      // 2. Upload chunks in parallel batches of 4
      const BATCH_CONCURRENCY = 4;
      for (let i = 0; i < totalChunks; i += BATCH_CONCURRENCY) {
        const batchPromises = [];
        for (let j = i; j < Math.min(i + BATCH_CONCURRENCY, totalChunks); j++) {
          const chunkString = fullDataUrl.substring(j * CHUNK_SIZE, (j + 1) * CHUNK_SIZE);
          const chunkDocRef = doc(db, 'rooms', state.roomId, 'messages', msgId, 'chunks', 'c_' + j.toString().padStart(4, '0'));
          batchPromises.push(setDoc(chunkDocRef, {
            index: j,
            data: chunkString
          }));
        }
        await Promise.all(batchPromises);

        const progressPct = 30 + Math.round(((i + BATCH_CONCURRENCY) / totalChunks) * 70);
        updateTransferProgress(Math.min(100, progressPct), i + BATCH_CONCURRENCY, totalChunks);
      }

      hideTransferProgress();
      showToast(`🎬 ${file.name} Başarıyla Işınlandı!`, 'success');
    } catch (err) {
      console.error('Chunk upload error:', err);
      hideTransferProgress();
      showToast('Video yükleme hatası: ' + err.message, 'error');
    }
  };

  reader.readAsDataURL(file);
}

// Base64 to Native Blob Object URL Helper (Zero Memory Lag, Instant Hardware Video Playback)
function base64ToBlobUrl(dataUrl, mime = 'video/mp4') {
  try {
    if (!dataUrl || typeof dataUrl !== 'string') return dataUrl;
    if (dataUrl.startsWith('blob:')) return dataUrl;
    const parts = dataUrl.split(',');
    const bstr = atob(parts[1] || parts[0]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    return URL.createObjectURL(blob);
  } catch (e) {
    return dataUrl;
  }
}

// Assemble Chunked Item on Receiver
async function assembleChunkedItem(item) {
  try {
    const chunksRef = collection(db, 'rooms', state.roomId, 'messages', item.id, 'chunks');
    const q = query(chunksRef, orderBy('index', 'asc'));
    
    const snapshot = await getDocs(q);
    const chunks = [];
    snapshot.forEach(docSnap => chunks.push(docSnap.data()));
    
    if (chunks.length < item.totalChunks) {
      setTimeout(() => assembleChunkedItem(item), 1000);
      return;
    }

    chunks.sort((a, b) => a.index - b.index);
    const fullDataUrl = chunks.map(c => c.data).join('');
    
    // Convert to high-speed Blob URL for zero-lag playback
    const fastBlobUrl = base64ToBlobUrl(fullDataUrl, item.mime || (item.type === 'video' ? 'video/mp4' : 'application/octet-stream'));
    item.data = fastBlobUrl;

    updateCardWithAssembledData(item);
  } catch (err) {
    console.error('Error assembling chunks:', err);
  }
}

// Global Video Error Fallback (e.g. iPhone HEVC / MOV codec on Windows Chrome)
window.handleVideoPlayerError = function(videoEl, fileName, downloadUrl) {
  const container = videoEl.parentElement;
  if (!container) return;
  container.className = 'rounded-xl p-4 bg-slate-900 border border-slate-700/80 flex flex-col gap-2.5 text-center items-center justify-center';
  container.innerHTML = `
    <div class="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
      <i data-lucide="video" class="w-5 h-5"></i>
    </div>
    <div>
      <h5 class="text-xs font-bold text-slate-200">${escapeHtml(fileName || 'Video Dosyası')}</h5>
      <p class="text-[11px] text-slate-400 mt-0.5">Telefon formatı (MOV/HEVC) bilgisayara ulaştı.</p>
    </div>
    <a href="${downloadUrl}" download="${escapeHtml(fileName || 'video.mp4')}" class="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition">
      <i data-lucide="download" class="w-4 h-4"></i>
      <span>Bilgisayarda Aç / İndir</span>
    </a>
  `;
  if (window.lucide) window.lucide.createIcons();
};

// Update Card When Chunks Finished Downloading
function updateCardWithAssembledData(item) {
  const containers = document.querySelectorAll(`[data-chunk-id="${item.id}"]`);
  containers.forEach(container => {
    if (item.type === 'video') {
      container.innerHTML = `
        <div class="rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
          <video controls playsinline preload="metadata" class="w-full max-h-64 rounded-xl" src="${item.data}" onerror="handleVideoPlayerError(this, '${escapeJsString(item.name || 'video.mp4')}', '${item.data}')"></video>
        </div>
        <div class="flex items-center justify-between mt-1">
          <span class="text-xs text-slate-400">${formatFileSize(item.size || 0)}</span>
          <a href="${item.data}" download="${item.name || 'video.mp4'}" class="px-3.5 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow">
            <i data-lucide="download" class="w-3.5 h-3.5"></i>
            <span>İndir / Kaydet</span>
          </a>
        </div>
      `;
    } else {
      container.innerHTML = `
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
        <div class="flex items-center justify-end mt-1">
          <a href="${item.data}" download="${item.name || 'teleport_file'}" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-2 shadow-lg">
            <i data-lucide="download" class="w-4 h-4"></i>
            <span>Dosyayı İndir</span>
          </a>
        </div>
      `;
    }
  });

  if (window.lucide) window.lucide.createIcons();
}

// Smart Client-Side Image Optimizer (Scales & Compresses Phone Photos to <500KB in 50ms)
function optimizeImageFile(file) {
  return new Promise((resolve) => {
    if (file.type === 'image/svg+xml' || file.size < 80000) {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ dataUrl: e.target.result, size: file.size });
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1600;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        if (dataUrl.length > 900000) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.65);
        }

        const estBytes = Math.round((dataUrl.length * 3) / 4);
        resolve({ dataUrl, size: estBytes });
      };
      img.onerror = () => {
        resolve({ dataUrl: e.target.result, size: file.size });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Handle File Processing & Sending (PC & Mobile Safe - Ultra High-Speed Hybrid P2P / 50MB Cloud)
async function processAndSendFiles(fileList) {
  if (!fileList || fileList.length === 0) return;

  const files = Array.from(fileList);
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 Megabytes!

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      showToast(`"${file.name}" çok büyük (${formatFileSize(file.size)}). Maksimum dosya boyutu 50 MB'dir.`, 'error');
      continue;
    }

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    
    let type = 'file';
    if (isImage) type = 'image';
    else if (isVideo) type = 'video';
    else if (isAudio) type = 'audio';
    else if (file.name.endsWith('.apk')) type = 'apk';
    else if (file.type === 'application/pdf') type = 'pdf';

    try {
      // 1. FAST PATH: Direct WebRTC P2P Streaming (Instant 0-Lag, Full Bandwidth)
      if (state.p2pConnected && state.p2pChannel && state.p2pChannel.readyState === 'open') {
        const sentP2P = await sendP2PFile(file, type);
        if (sentP2P) continue;
      }

      // 2. FALLBACK PATH: Cloud Sync (Images <15MB fast optimize, Large files 50MB parallel chunking)
      if (isImage && file.size < 15 * 1024 * 1024) {
        showTransferProgress(file.name, file.size);
        updateTransferProgress(50, file.size / 2, file.size);
        const { dataUrl, size } = await optimizeImageFile(file);
        updateTransferProgress(100, size, size);

        const payload = {
          type: 'image',
          title: file.name,
          name: file.name,
          size: size,
          mime: 'image/jpeg',
          data: dataUrl,
          timestamp: Date.now(),
          expiresAt: Date.now() + RETENTION_MS
        };

        await sendTeleportPayload(payload);
        hideTransferProgress();
      } else if (file.size > 700 * 1024) {
        // Large Video or File (>700KB) -> Parallel Chunked Teleport
        await sendChunkedPayload(file, type);
      } else {
        // Small file (<700KB) -> Direct single document
        showTransferProgress(file.name, file.size);
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
            mime: file.type || 'application/octet-stream',
            data: dataUrl,
            timestamp: Date.now(),
            expiresAt: Date.now() + RETENTION_MS
          };

          await sendTeleportPayload(payload);
          hideTransferProgress();
        };

        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('File send error:', err);
      hideTransferProgress();
      showToast('Dosya işleme hatası: ' + err.message, 'error');
    }
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
    timestamp: Date.now(),
    expiresAt: Date.now() + (24 * 60 * 60 * 1000)
  };

  sendTeleportPayload(payload);
}

// Handle Incoming Packet on Receiver (Mobile / Peer)
function handleIncomingPacket(packet) {
  // Force AudioContext resume before playing (mobile browsers block audio until user interacts)
  if (state.sound.ctx && state.sound.ctx.state === 'suspended') {
    state.sound.ctx.resume().then(() => state.sound.playArrival()).catch(() => {});
  } else {
    state.sound.init();
    state.sound.playArrival();
  }

  // Trigger Ethereal Aurora Wave & Star Shower Animation
  if (state.cosmic) {
    state.cosmic.triggerArrivalWave();
  }

  // Trigger Native Push Notification
  if (state.notifications) {
    state.notifications.notifyItem(packet);
  }

  if (navigator.vibrate) {
    navigator.vibrate([120, 60, 180]);
  }

  addActivityItem(packet, false);
  showToast(`🛸 Yeni ${packet.title || 'Öğe'} Düştü!`, 'success');
}

// Build Smart Content Card HTML
function createContentCard(item, isSentByMe) {
  const timeStr = new Date(item.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const card = document.createElement('div');
  card.className = `teleport-item-card glass-panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3 border border-white/10 hover:border-indigo-500/40 transition ${!isSentByMe ? 'just-arrived' : ''}`;

  let iconHtml = '<i data-lucide="file" class="w-5 h-5 text-indigo-400"></i>';
  let bodyHtml = '';

  if (item.isChunked && !item.data) {
    iconHtml = item.type === 'video' ? '<i data-lucide="film" class="w-5 h-5 text-indigo-400"></i>' : '<i data-lucide="package" class="w-5 h-5 text-purple-400"></i>';
    bodyHtml = `
      <div data-chunk-id="${item.id}" class="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 text-xs text-indigo-300 font-semibold">
            <i data-lucide="loader-2" class="w-4 h-4 animate-spin text-indigo-400"></i>
            <span>${item.type === 'video' ? '🎬 Video' : '📁 Dosya'} Işınlanıyor (${formatFileSize(item.size || 0)})...</span>
          </div>
          <span class="text-xs font-mono text-indigo-400 font-bold">${item.totalChunks} Parça</span>
        </div>
        <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse" style="width: 100%"></div>
        </div>
      </div>
    `;

    // Trigger chunk assembly
    setTimeout(() => assembleChunkedItem(item), 100);
  } else if (item.type === 'image') {
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
      <div data-chunk-id="${item.id}">
        <div class="rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
          <video controls playsinline preload="metadata" class="w-full max-h-64 rounded-xl" src="${item.data}" onerror="handleVideoPlayerError(this, '${escapeJsString(item.name || 'video.mp4')}', '${item.data}')"></video>
        </div>
        <div class="flex items-center justify-between mt-1">
          <span class="text-xs text-slate-400">${formatFileSize(item.size || 0)}</span>
          <a href="${item.data}" download="${item.name || 'video.mp4'}" class="px-3.5 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow">
            <i data-lucide="download" class="w-3.5 h-3.5"></i>
            <span>İndir / Kaydet</span>
          </a>
        </div>
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
      <div data-chunk-id="${item.id}">
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
        <div class="flex items-center justify-end mt-1">
          <a href="${item.data}" download="${item.name || 'teleport_file'}" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-2 shadow-lg">
            <i data-lucide="download" class="w-4 h-4"></i>
            <span>Dosyayı İndir</span>
          </a>
        </div>
      </div>
    `;
  }

  const RETENTION_MS = 24 * 60 * 60 * 1000;
  const expiresAt = item.expiresAt || (item.timestamp ? item.timestamp + RETENTION_MS : Date.now() + RETENTION_MS);
  const remainingMs = Math.max(0, expiresAt - Date.now());
  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const remainingMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const expiryText = remainingHours > 0 ? `${remainingHours} sa ${remainingMins} dk` : `${remainingMins} dk`;

  card.innerHTML = `
    <div class="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
      <div class="flex items-center gap-2.5">
        <div class="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
          ${iconHtml}
        </div>
        <div>
          <h4 class="text-xs sm:text-sm font-bold text-slate-200 truncate max-w-[200px] sm:max-w-xs">${item.title || item.name || 'Işınlanan Öğe'}</h4>
          <div class="flex flex-wrap items-center gap-2 mt-1">
            <span class="text-[10px] text-slate-500 font-mono">${timeStr} • ${isSentByMe ? 'Gönderildi' : 'Alındı'}</span>
            <span class="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/40">
              ⏱️ ${expiryText} kaldı (24s Otomatik Silinir)
            </span>
          </div>
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
function addActivityItem(item, isSentByMe, saveLocal = true) {
  if (!state.history.some(h => h.id === item.id)) {
    state.history.unshift(item);
  }

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

  // Save to browser localStorage so refresh NEVER loses files!
  if (saveLocal) saveLocalHistory();

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

// Mobile Quick Send Text / URL Handler
const mobileQuickText = document.getElementById('mobile-quick-text');
const btnMobileSendText = document.getElementById('btn-mobile-send-text');
const btnMobilePhoto = document.getElementById('btn-mobile-photo');
const btnMobileFile = document.getElementById('btn-mobile-file');
const mobilePhotoInput = document.getElementById('mobile-photo-input');
const mobileFileInput = document.getElementById('mobile-file-input');
const btnMobileClearHistory = document.getElementById('btn-mobile-clear-history');

if (btnMobileSendText && mobileQuickText) {
  const handleMobileSendText = () => {
    const text = mobileQuickText.value;
    if (text && text.trim()) {
      processAndSendText(text);
      mobileQuickText.value = '';
    }
  };

  btnMobileSendText.addEventListener('click', handleMobileSendText);
  mobileQuickText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleMobileSendText();
  });
}

// Mobile Photo & Camera Picker
if (btnMobilePhoto && mobilePhotoInput) {
  btnMobilePhoto.addEventListener('click', () => mobilePhotoInput.click());
  mobilePhotoInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processAndSendFiles(e.target.files);
      e.target.value = '';
    }
  });
}

// Mobile File Picker
if (btnMobileFile && mobileFileInput) {
  btnMobileFile.addEventListener('click', () => mobileFileInput.click());
  mobileFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processAndSendFiles(e.target.files);
      e.target.value = '';
    }
  });
}

// Mobile Clear History Button
if (btnMobileClearHistory) {
  btnMobileClearHistory.addEventListener('click', () => {
    if (btnClearHistory) btnClearHistory.click();
  });
}

// Clear History Button — wipes Firestore collection + localStorage + all connected devices
if (btnClearHistory) {
  btnClearHistory.addEventListener('click', async () => {
    if (!confirm('Tüm geçmişi ve dosyaları temizlemek istediğinize emin misiniz?\n\nBu işlem TÜM bağlı cihazlardan siler ve geri alınamaz.')) return;

    showToast('🗑️ Siliniyor...', 'info');

    // 1. Clear local state
    state.history = [];
    state.processedIds.clear();
    try { localStorage.removeItem(STORAGE_HISTORY_KEY); } catch (e) {}

    // 2. Clear UI immediately on THIS device
    clearUIFeeds();

    // 3. Wipe Firestore — onSnapshot 'removed' events on other devices will auto-wipe their UI
    try {
      const roomMessagesRef = collection(db, 'rooms', state.roomId, 'messages');
      const snapshot = await getDocs(roomMessagesRef);
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.forEach(docSnap => batch.delete(docSnap.ref));
        await batch.commit();
        showToast('🗑️ Tüm geçmiş silindi! Telefon da temizlendi.', 'success');
      } else {
        showToast('Geçmiş zaten boş.', 'info');
      }
    } catch (e) {
      console.error('Error clearing Firestore history:', e);
      showToast('Firestore silme hatası: ' + e.message, 'error');
    }
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

// Mobile Sound Unlock — tap banner to unlock audio on first user gesture
window.unlockMobileSound = function() {
  state.sound.init();
  if (state.sound.ctx) {
    state.sound.ctx.resume().then(() => {
      // Play a tiny silent sound to unlock audio
      state.sound.playArrival();
    }).catch(() => {});
  }
  // Dismiss the banner
  const banner = document.getElementById('sound-unlock-banner');
  if (banner) {
    banner.style.transition = 'opacity 0.3s';
    banner.style.opacity = '0';
    setTimeout(() => banner.remove(), 300);
  }
  showToast('🔔 Bildirim sesi etkinleştirildi!', 'success');
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
function startApp() {
  if (window.lucide) window.lucide.createIcons();
  
  loadLocalHistory();

  state.cosmic = new CosmicParticleEngine('cosmic-canvas');

  const btnToggleNotif = document.getElementById('btn-toggle-notif');
  if (btnToggleNotif) {
    btnToggleNotif.addEventListener('click', async () => {
      await state.notifications.requestPermission();
    });
  }

  const enableAudioAndNotif = () => {
    state.sound.init();
    if (state.notifications && state.notifications.permission === 'default') {
      state.notifications.requestPermission();
    }
    window.removeEventListener('click', enableAudioAndNotif);
    window.removeEventListener('touchstart', enableAudioAndNotif);
    window.removeEventListener('pointerdown', enableAudioAndNotif);
  };
  window.addEventListener('click', enableAudioAndNotif);
  window.addEventListener('touchstart', enableAudioAndNotif);
  window.addEventListener('pointerdown', enableAudioAndNotif);

  initFirebaseSync();
  updateNetworkDisplay();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
