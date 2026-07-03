// ── Firebase ──
    firebase.initializeApp({
      apiKey: "AIzaSyBuuxnR8w8Sd2VSuMfU8Sx7S3aoYLWneD8",
      authDomain: "bdsmap-3b584.firebaseapp.com",
      projectId: "bdsmap-3b584",
      storageBucket: "bdsmap-3b584.firebasestorage.app",
      messagingSenderId: "1040944177628",
      appId: "1:1040944177628:web:147c05fd57d278c333ef19"
    });
    const db   = firebase.firestore();
    const auth = firebase.auth();

    // ── Config ──
    const SHARE_WORKER_URL = 'https://bdsmap-share.phuongdai-ho.workers.dev';
    const FIREBASE_API_KEY = 'AIzaSyBuuxnR8w8Sd2VSuMfU8Sx7S3aoYLWneD8';
    const FIREBASE_PROJECT = 'bdsmap-3b584';

    // ── State ──

    let appMode = 'loading';   // 'loading' | 'guest' | 'user'
    let currentUser = null;
    const GUEST_KEY      = 'map_guest_locations';
    const GUEST_MODE_KEY = 'map_auth_mode';

    let locations = [];
    let searchMarker = null;
    let myLocationMarker = null;
    let quickViewItems = [];
    let quickViewIdx   = 0;
    let quickViewUserPos = null;
    let pendingShareId = new URLSearchParams(location.search).get('share');
    let leafletMarkers = {};   // id → L.marker
    let pendingLatLng = null;   // tọa độ đang chờ lưu
    let pendingTextData = null; // dữ liệu đã parse từ text, chờ click map
    let editingId = null;       // id đang chỉnh sửa
    let selectedColor = '#e53935';
    let sidebarVisible = false;
    let measureMode = false;
    let measurePoints = [];
    let measureGroup = null;
    let communityLocations = [];
    let communityMarkers = {};
    let communityUnsub = null;
    let communityVpTimer;
    let communityVisible = true;
    const recentlyViewed = new Set();

    // Trả về collection của user hiện tại
    function userCol() {
      return db.collection('users').doc(currentUser.uid).collection('locations');
    }

    // Collection địa điểm công khai (readable bởi tất cả)
    function publicCol() {
      return db.collection('public_locations');
    }

    // Guest mode: persist locations array vào localStorage
    function guestPersist() {
      localStorage.setItem(GUEST_KEY, JSON.stringify(locations));
    }

    function loadGuestData() {
      locations = JSON.parse(localStorage.getItem(GUEST_KEY) || '[]');
      renderMarkers();
      renderSidebar();
    }
