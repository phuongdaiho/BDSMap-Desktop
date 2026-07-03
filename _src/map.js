// ── Map ──
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      maxZoom: 19,
    }).setView([21.0285, 105.8542], 13);
    L.control.zoom({ zoomInTitle: 'Phóng to', zoomOutTitle: 'Thu nhỏ' }).addTo(map);
    measureGroup = L.layerGroup().addTo(map);

    function makeClusterGroup() {
      if (typeof L.markerClusterGroup === 'function') {
        const color = '#1a73e8';
        return L.markerClusterGroup({
          maxClusterRadius: 60,
          disableClusteringAtZoom: 14,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          iconCreateFunction(cluster) {
            const count = cluster.getChildCount();
            const size  = count < 10 ? 34 : count < 100 ? 40 : 46;
            return L.divIcon({
              html: `<div style="background:${color};color:#fff;border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${size < 40 ? 13 : 14}px;box-shadow:0 2px 6px rgba(0,0,0,.35);border:2px solid #fff">${count}</div>`,
              className: '',
              iconSize: [size, size],
              iconAnchor: [size / 2, size / 2],
            });
          },
        });
      }
      const g = L.layerGroup();
      g.zoomToShowLayer = (_m, cb) => { if (cb) cb(); };
      return g;
    }
    const clusterGroup = makeClusterGroup().addTo(map);
    const communityClusterGroup = clusterGroup;

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
    let currentBaseLayer = 'street';
    L.DomEvent.disableClickPropagation(document.getElementById('layer-control'));

    function toggleLayerPicker() {
      const open = document.getElementById('layer-picker').classList.toggle('open');
      document.getElementById('btn-layer-toggle').classList.toggle('picker-open', open);
    }

    function setBaseLayer(mode) {
      document.getElementById('layer-picker').classList.remove('open');
      document.getElementById('btn-layer-toggle').classList.remove('picker-open');
      if (mode === currentBaseLayer) return;
      if (currentBaseLayer === 'street') map.removeLayer(layerStreet);
      else if (currentBaseLayer === 'satellite') map.removeLayer(layerSatellite);
      else if (currentBaseLayer === 'hybrid') map.removeLayer(layerHybrid);
      if (mode === 'street') layerStreet.addTo(map);
      else if (mode === 'satellite') layerSatellite.addTo(map);
      else if (mode === 'hybrid') layerHybrid.addTo(map);
      currentBaseLayer = mode;
      ['street','satellite','hybrid'].forEach(m => {
        const el = document.getElementById('layer-opt-' + m);
        el.classList.toggle('active', m === mode);
        el.querySelector('.check').style.visibility = m === mode ? 'visible' : 'hidden';
      });
    }

    // ── Đo khoảng cách / diện tích ──
    function clearMeasure() {
      measureGroup.clearLayers();
      measurePoints = [];
    }

    function fmtDist(d) {
      return d < 1000 ? Math.round(d) + ' m' : (d / 1000).toFixed(2) + ' km';
    }

    function geodesicArea(pts) {
      const R = 6378137;
      const toRad = d => d * Math.PI / 180;
      let area = 0;
      const n = pts.length;
      for (let i = 0; i < n; i++) {
        const p1 = pts[i], p2 = pts[(i + 1) % n];
        area += toRad(p2.lng - p1.lng) * (2 + Math.sin(toRad(p1.lat)) + Math.sin(toRad(p2.lat)));
      }
      return Math.abs(area * R * R / 2);
    }

    function redrawMeasure() {
      measureGroup.clearLayers();
      const pts = measurePoints;
      const ptIcon = L.divIcon({
        className: '',
        html: `<div style="width:11px;height:11px;background:#2e7d32;border:2.5px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
        iconSize: [11, 11], iconAnchor: [5, 5],
      });
      pts.forEach(p => measureGroup.addLayer(L.marker(p, { icon: ptIcon, interactive: false })));

      if (pts.length < 2) return;

      const isPolygon = pts.length >= 3;
      if (isPolygon) {
        measureGroup.addLayer(L.polygon(pts, {
          color: '#2e7d32', weight: 2.5, dashArray: '7,5',
          fillColor: '#43a047', fillOpacity: 0.12, interactive: false,
        }));
      } else {
        measureGroup.addLayer(L.polyline(pts, {
          color: '#2e7d32', weight: 2.5, dashArray: '7,5', opacity: 0.85, interactive: false,
        }));
      }

      const edges = isPolygon
        ? pts.map((p, i) => [p, pts[(i + 1) % pts.length]])
        : [[pts[0], pts[1]]];

      edges.forEach(([p1, p2]) => {
        const mid = L.latLng((p1.lat + p2.lat) / 2, (p1.lng + p2.lng) / 2);
        const m = L.marker(mid, { icon: L.divIcon({ className: '', iconSize: [0, 0] }), interactive: false });
        m.bindTooltip(fmtDist(map.distance(p1, p2)), { permanent: true, direction: 'center', className: 'measure-label', opacity: 1 });
        measureGroup.addLayer(m);
      });

      if (isPolygon) {
        const area = geodesicArea(pts);
        const cx = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
        const cy = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
        const areaStr = area < 10000 ? Math.round(area) + ' m²' : (area / 10000).toFixed(2) + ' ha';
        const am = L.marker([cx, cy], { icon: L.divIcon({ className: '', iconSize: [0, 0] }), interactive: false });
        am.bindTooltip(`DT: ${areaStr}`, { permanent: true, direction: 'center', className: 'measure-label', opacity: 1 });
        measureGroup.addLayer(am);
      }
    }

    function handleMeasureClick(latlng) {
      measurePoints.push(latlng);
      redrawMeasure();
      const n = measurePoints.length;
      if (n === 1) {
        showHint('Nhấp tiếp để đo khoảng cách hoặc diện tích');
      } else if (n === 2) {
        showHint(`📏 ${fmtDist(map.distance(measurePoints[0], measurePoints[1]))} — nhấp tiếp để đo diện tích`);
      } else {
        const area = geodesicArea(measurePoints);
        const areaStr = area < 10000 ? Math.round(area) + ' m²' : (area / 10000).toFixed(2) + ' ha';
        showHint(`📐 DT: ${areaStr} — nhấp tiếp để thêm điểm, tắt 📏 để xóa`);
      }
    }

    new (L.Control.extend({
      options: { position: 'bottomleft' },
      onAdd() {
        const wrap = L.DomUtil.create('div', 'measure-wrap leaflet-control');
        const btn = L.DomUtil.create('button', 'measure-btn', wrap);
        btn.innerHTML = '📏';
        btn.title = 'Đo khoảng cách / diện tích';
        L.DomEvent.disableClickPropagation(wrap);
        L.DomEvent.on(btn, 'click', () => {
          measureMode = !measureMode;
          clearMeasure();
          btn.classList.toggle('active', measureMode);
          map.getContainer().style.cursor = measureMode ? 'crosshair' : '';
          showHint(measureMode ? 'Nhấp vào bản đồ để chọn điểm đầu' : 'Đã tắt chế độ đo');
        });
        return wrap;
      },
    }))().addTo(map);

    // ── Compass rose (tĩnh, 8 hướng) ──
    new (L.Control.extend({
      options: { position: 'bottomright' },
      onAdd() {
        const div = L.DomUtil.create('div', 'north-arrow-wrap north-arrow');
        div.innerHTML = `<svg viewBox="0 0 130 130" width="96" height="96" style="display:block">
          <!-- Nền tròn -->
          <circle cx="65" cy="65" r="58" fill="white" stroke="#e0e0e0" stroke-width="1.5"/>

          <!-- Đường hướng phụ (mờ) -->
          <line x1="65" y1="65" x2="84" y2="46" stroke="#ddd" stroke-width="1.2"/>
          <line x1="65" y1="65" x2="84" y2="84" stroke="#ddd" stroke-width="1.2"/>
          <line x1="65" y1="65" x2="46" y2="84" stroke="#ddd" stroke-width="1.2"/>
          <line x1="65" y1="65" x2="46" y2="46" stroke="#ddd" stroke-width="1.2"/>

          <!-- Hướng Bắc (đỏ) -->
          <line x1="65" y1="65" x2="65" y2="31" stroke="#e53935" stroke-width="2.5"/>
          <polygon points="65,21 59,33 71,33" fill="#e53935"/>

          <!-- Hướng Nam -->
          <line x1="65" y1="65" x2="65" y2="99" stroke="#888" stroke-width="2"/>
          <polygon points="65,109 59,97 71,97" fill="#888"/>

          <!-- Hướng Đông -->
          <line x1="65" y1="65" x2="99" y2="65" stroke="#888" stroke-width="2"/>
          <polygon points="109,65 97,59 97,71" fill="#888"/>

          <!-- Hướng Tây -->
          <line x1="65" y1="65" x2="31" y2="65" stroke="#888" stroke-width="2"/>
          <polygon points="21,65 33,59 33,71" fill="#888"/>

          <!-- Tâm -->
          <circle cx="65" cy="65" r="4" fill="white" stroke="#666" stroke-width="1.5"/>

          <!-- Nhãn hướng chính -->
          <text x="65" y="13" text-anchor="middle" font-size="12" font-weight="700" fill="#e53935" font-family="sans-serif">B</text>
          <text x="65" y="124" text-anchor="middle" font-size="12" font-weight="600" fill="#555" font-family="sans-serif">N</text>
          <text x="122" y="69" text-anchor="middle" font-size="12" font-weight="600" fill="#555" font-family="sans-serif">Đ</text>
          <text x="8"  y="69" text-anchor="middle" font-size="12" font-weight="600" fill="#555" font-family="sans-serif">T</text>

          <!-- Nhãn hướng phụ -->
          <text x="94" y="41" text-anchor="middle" font-size="8.5" fill="#999" font-family="sans-serif">ĐB</text>
          <text x="94" y="95" text-anchor="middle" font-size="8.5" fill="#999" font-family="sans-serif">ĐN</text>
          <text x="36" y="95" text-anchor="middle" font-size="8.5" fill="#999" font-family="sans-serif">TN</text>
          <text x="36" y="41" text-anchor="middle" font-size="8.5" fill="#999" font-family="sans-serif">TB</text>
        </svg>`;
        return div;
      },
    }))().addTo(map);

    // Ẩn hint sau 4 giây
    setTimeout(() => {
      const hint = document.getElementById('map-hint');
      if (hint) hint.style.opacity = '0';
    }, 4000);

    // Click map → mở modal thêm
    map.on('click', (e) => {
      if (measureMode) { handleMeasureClick(e.latlng); return; }
      pendingLatLng = e.latlng;
      editingId = null;
      const data = pendingTextData
        ? { lat: e.latlng.lat, lng: e.latlng.lng, ...pendingTextData }
        : { lat: e.latlng.lat, lng: e.latlng.lng };
      pendingTextData = null;
      showHint('Click vào bản đồ để thêm địa điểm');
      openModal('Thêm địa điểm', data);
    });

    // Chuột phải → menu Street View
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
