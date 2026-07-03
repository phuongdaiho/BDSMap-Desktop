// ── Search (Nominatim) ──
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
      if (!e.target.closest('#layer-control')) {
        document.getElementById('layer-picker').classList.remove('open');
        document.getElementById('btn-layer-toggle').classList.remove('picker-open');
      }
    });

    async function fetchSuggestions(query) {
      if (/^\s*-?\d+(?:\.\d+)?\s*[,\s]\s*-?\d+(?:\.\d+)?\s*$/.test(query)) {
        searchResults.style.display = 'none'; return;
      }
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

    function createSearchIcon() {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
        <path d="M16 0C7.16 0 0 7.16 0 16c0 11 16 26 16 26S32 27 32 16C32 7.16 24.84 0 16 0z"
          fill="#0d47a1" stroke="white" stroke-width="2"/>
        <circle cx="16" cy="16" r="6" fill="white"/>
        <circle cx="16" cy="16" r="3" fill="#0d47a1"/>
      </svg>`;
      return L.divIcon({
        className: '',
        html: svg,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -44],
      });
    }

    function selectResult(item) {
      const lat = parseFloat(item.lat), lng = parseFloat(item.lon);
      const name = item.display_name.split(',')[0];
      map.setView([lat, lng], 15);
      searchInput.value = name;
      searchResults.style.display = 'none';

      // Xóa marker tìm kiếm cũ
      if (searchMarker) { map.removeLayer(searchMarker); searchMarker = null; }

      // Thêm marker kết quả tìm kiếm
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
      // Nhận biết tọa độ: "21.0285, 105.8542" hoặc "21.0285 105.8542"
      const coordMatch = query.match(/^\s*(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)\s*$/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]), lng = parseFloat(coordMatch[2]);
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          map.setView([lat, lng], 15);
          return;
        }
      }
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&accept-language=vi`);
        const data = await res.json();
        if (data.length) selectResult(data[0]);
        else alert('Không tìm thấy địa điểm: ' + query);
      } catch { alert('Lỗi kết nối. Vui lòng thử lại.'); }
    }
