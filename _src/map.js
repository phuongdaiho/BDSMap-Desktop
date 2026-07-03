const map = L.map('map').setView([21.0285, 105.8542], 13);

const layerStreet = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom: 19,
});

const layerSatellite = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: '© <a href="https://www.esri.com">Esri</a>, Maxar, Earthstar Geographics',
  maxZoom: 19,
});

const layerHybrid = L.layerGroup([
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
  }),
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    opacity: 0.45, maxZoom: 19,
    attribution: '© Esri © OpenStreetMap',
  }),
]);

layerStreet.addTo(map);

L.control.layers(
  { '🗺️ Bản đồ': layerStreet, '🛰️ Vệ tinh': layerSatellite, '🛰️ Vệ tinh + đường': layerHybrid },
  {},
  { position: 'topright', collapsed: false }
).addTo(map);

setTimeout(() => {
  const hint = document.getElementById('map-hint');
  if (hint) hint.style.opacity = '0';
}, 4000);

map.on('click', (e) => {
  pendingLatLng = e.latlng;
  editingId = null;
  openModal('Thêm địa điểm', { lat: e.latlng.lat, lng: e.latlng.lng });
});

map.on('contextmenu', (e) => {
  const lat = e.latlng.lat;
  const lng = e.latlng.lng;
  const svUrl = `https://www.google.com/maps/@${lat},${lng},3a,75y,90t/data=!3m6!1e1`;
  L.popup({ maxWidth: 230, closeButton: true })
    .setLatLng(e.latlng)
    .setContent(`
      <div style="font-family:sans-serif;padding:2px 0">
        <div style="font-size:0.72rem;color:#999;margin-bottom:8px">📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
        <a href="${svUrl}" target="_blank" rel="noopener"
          style="display:block;background:#43a047;color:white;text-decoration:none;border-radius:8px;
                 padding:7px 12px;font-size:0.85rem;text-align:center;font-family:inherit">
          🚶 Xem Street View tại đây
        </a>
      </div>`)
    .openOn(map);
});
