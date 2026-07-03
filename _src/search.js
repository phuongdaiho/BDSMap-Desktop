const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
let searchTimeout;

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  const q = searchInput.value.trim();
  if (q.length < 3) {
    searchResults.style.display = 'none';
    if (!q && searchMarker) { map.removeLayer(searchMarker); searchMarker = null; }
    return;
  }
  searchTimeout = setTimeout(() => fetchSuggestions(q), 400);
});
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') searchLocation();
  if (e.key === 'Escape') searchResults.style.display = 'none';
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-wrap')) searchResults.style.display = 'none';
});

async function fetchSuggestions(query) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=vi`);
    const data = await res.json();
    searchResults.innerHTML = '';
    if (!data.length) { searchResults.style.display = 'none'; return; }
    data.forEach(item => {
      const div = document.createElement('div');
      div.className = 'result-item';
      div.textContent = item.display_name;
      div.onclick = () => selectResult(item);
      searchResults.appendChild(div);
    });
    searchResults.style.display = 'block';
  } catch { searchResults.style.display = 'none'; }
}

function selectResult(item) {
  const lat = parseFloat(item.lat), lng = parseFloat(item.lon);
  const name = item.display_name.split(',')[0];
  map.setView([lat, lng], 15);
  searchInput.value = name;
  searchResults.style.display = 'none';

  if (searchMarker) { map.removeLayer(searchMarker); searchMarker = null; }

  searchMarker = L.marker([lat, lng], { icon: createSearchIcon() }).addTo(map);
  searchMarker.bindPopup(`
    <div style="font-family:sans-serif;min-width:180px;padding:2px 0">
      <div style="font-size:0.78rem;color:#0d47a1;font-weight:600;margin-bottom:3px">🔍 Kết quả tìm kiếm</div>
      <strong style="font-size:0.92rem;color:#202124">${esc(name)}</strong>
      <div style="color:#666;font-size:0.78rem;margin-top:3px">${esc(item.display_name)}</div>
      <div style="color:#aaa;font-size:0.72rem;margin-top:4px">📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
      <button onclick="saveSearchResult(${lat},${lng},'${esc(name).replace(/'/g,'&#39;')}')"
        style="margin-top:8px;width:100%;background:#1a73e8;color:white;border:none;border-radius:6px;
               padding:6px 0;font-size:0.82rem;cursor:pointer;font-family:inherit">
        + Lưu địa điểm này
      </button>
    </div>
  `, { maxWidth: 260 }).openPopup();
}

function saveSearchResult(lat, lng, name) {
  if (searchMarker) searchMarker.closePopup();
  pendingLatLng = { lat, lng };
  editingId = null;
  openModal('Thêm địa điểm', { lat, lng, name });
}

async function searchLocation() {
  const query = searchInput.value.trim();
  if (!query) return;
  searchResults.style.display = 'none';
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&accept-language=vi`);
    const data = await res.json();
    if (data.length) selectResult(data[0]);
    else alert('Không tìm thấy địa điểm: ' + query);
  } catch { alert('Lỗi kết nối. Vui lòng thử lại.'); }
}
