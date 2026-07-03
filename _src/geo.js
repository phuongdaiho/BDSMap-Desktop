function goToCoords() {
  const lat = parseFloat(document.getElementById('input-lat').value);
  const lng = parseFloat(document.getElementById('input-lng').value);
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    alert('Tọa độ không hợp lệ.\nLat: -90 đến 90 | Lng: -180 đến 180');
    return;
  }
  map.setView([lat, lng], 15);
}

function goToMyLocation() {
  if (!navigator.geolocation) { alert('Trình duyệt không hỗ trợ định vị.'); return; }
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const lat = coords.latitude, lng = coords.longitude;
      map.setView([lat, lng], 16);
      if (myLocationMarker) map.removeLayer(myLocationMarker);
      const icon = L.divIcon({
        className: '',
        html: '<div class="my-location-icon"><div class="ring"></div><div class="dot"></div></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      myLocationMarker = L.marker([lat, lng], { icon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`<b>Vị trí của bạn</b><br><span style="font-size:0.8rem;color:#666">${lat.toFixed(5)}, ${lng.toFixed(5)}</span>`)
        .openPopup();
    },
    () => alert('Không thể lấy vị trí. Vui lòng cho phép quyền truy cập.')
  );
}

// ── Sidebar resize ──
(function () {
  const resizer = document.getElementById('sidebar-resizer');
  const sidebar = document.getElementById('sidebar');
  const MIN_W = 180, MAX_W = 560;
  let startX, startW;

  resizer.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    startW = sidebar.offsetWidth;
    sidebar.classList.add('resizing');
    resizer.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!sidebar.classList.contains('resizing')) return;
    const delta = startX - e.clientX;
    const newW = Math.min(MAX_W, Math.max(MIN_W, startW + delta));
    sidebar.style.width = newW + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (!sidebar.classList.contains('resizing')) return;
    sidebar.classList.remove('resizing');
    resizer.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });

  resizer.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startW = sidebar.offsetWidth;
    sidebar.classList.add('resizing');
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    if (!sidebar.classList.contains('resizing')) return;
    const delta = startX - e.touches[0].clientX;
    const newW = Math.min(MAX_W, Math.max(MIN_W, startW + delta));
    sidebar.style.width = newW + 'px';
  }, { passive: false });

  document.addEventListener('touchend', () => {
    sidebar.classList.remove('resizing');
  });
})();
