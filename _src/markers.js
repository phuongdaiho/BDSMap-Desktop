// ── Render markers on map ──
    function addMarker(loc) {
      if (leafletMarkers[loc.id]) { clusterGroup.removeLayer(leafletMarkers[loc.id]); delete leafletMarkers[loc.id]; }
      const m = L.marker([loc.lat, loc.lng], { icon: createIcon(loc.color, loc.name), draggable: true });
      clusterGroup.addLayer(m);
      m.bindPopup(makePopupHtml(loc), { maxWidth: 260 });
      m.on('popupopen', () => incrementViews(loc.id));
      m.on('dragend', async (e) => {
        const { lat, lng } = e.target.getLatLng();
        const cur = locations.find(l => l.id === loc.id);
        const origLat = cur ? cur.lat : loc.lat;
        const origLng = cur ? cur.lng : loc.lng;
        if (!confirm(`Thay đổi tọa độ của "${loc.name}"?\n\nTừ: ${origLat.toFixed(5)}, ${origLng.toFixed(5)}\nĐến: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)) {
          e.target.setLatLng([origLat, origLng]);
          return;
        }
        if (editingId === loc.id) {
          document.getElementById('modal-lat').value = lat.toFixed(6);
          document.getElementById('modal-lng').value = lng.toFixed(6);
        }
        if (appMode === 'guest') {
          const idx = locations.findIndex(l => l.id === loc.id);
          if (idx >= 0) { locations[idx].lat = lat; locations[idx].lng = lng; }
          m.setPopupContent(makePopupHtml({ ...loc, lat, lng }));
          guestPersist();
          return;
        }
        await userCol().doc(String(loc.id)).update({ lat, lng });
        if (cur?.isPublic) {
          await publicCol().doc(String(loc.id)).update({ lat, lng }).catch(() => {});
        }
      });
      leafletMarkers[loc.id] = m;
    }

    function renderMarkers() {
      clusterGroup.clearLayers();
      leafletMarkers = {};
      locations.forEach(loc => addMarker(loc));
    }
