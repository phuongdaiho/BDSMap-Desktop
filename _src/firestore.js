// ── Firestore: viewport-based lazy-load ──
    let viewportUnsub = null;

    function applyDocChange(change) {
      const d = change.doc.data();
      const id = d.id ?? Number(change.doc.id);

      if (change.type === 'removed') {
        locations = locations.filter(l => l.id !== id);
        if (leafletMarkers[id]) { clusterGroup.removeLayer(leafletMarkers[id]); delete leafletMarkers[id]; }
        return;
      }

      const loc = { ...d, id };
      const idx = locations.findIndex(l => l.id === id);

      if (change.type === 'added') {
        if (idx < 0) {
          locations.push(loc);
          addMarker(loc);
        } else {
          locations[idx] = loc;
          leafletMarkers[id]?.setPopupContent(makePopupHtml(loc));
        }
      } else { // modified
        if (idx >= 0) locations[idx] = loc; else locations.push(loc);
        if (leafletMarkers[id]) {
          leafletMarkers[id].setIcon(createIcon(loc.color, loc.name));
          leafletMarkers[id].setLatLng([loc.lat, loc.lng]);
          leafletMarkers[id].setPopupContent(makePopupHtml(loc));
        } else {
          addMarker(loc);
        }
      }
    }

    function loadByViewport() {
      if (appMode !== 'user' || !currentUser) return;
      if (viewportUnsub) { viewportUnsub(); viewportUnsub = null; }

      viewportUnsub = userCol()
        .onSnapshot(snap => {
          let changed = false;
          snap.docChanges().forEach(change => {
            applyDocChange(change);
            changed = true;
          });
          if (changed) {
            locations.sort((a, b) => (a.sortOrder ?? a.createdAt ?? a.id ?? 0) - (b.sortOrder ?? b.createdAt ?? b.id ?? 0));
            renderSidebar();
          }
        }, err => {
          console.error('Firestore lỗi:', err);
          showHint('Không kết nối được Firestore. Kiểm tra kết nối mạng.');
        });
    }

    function startFirestoreSync() {
      locations = [];
      clusterGroup.clearLayers();
      leafletMarkers = {};
      loadByViewport();
      loadCommunityByViewport(true);
      initLocationWatch();
    }

    map.on('moveend', () => {
      clearTimeout(communityVpTimer);
      communityVpTimer = setTimeout(loadCommunityByViewport, 800);
    });
