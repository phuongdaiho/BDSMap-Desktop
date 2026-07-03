// ── Icon ──
    function createIcon(color, name) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36" style="display:block">
        <path d="M14 0C6.27 0 0 6.27 0 14c0 9.625 14 22 14 22S28 23.625 28 14C28 6.27 21.73 0 14 0z" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="14" cy="14" r="5.5" fill="white"/>
      </svg>`;
      const label = name
        ? `<span style="position:absolute;left:32px;top:6px;background:white;color:#202124;font-size:11px;font-weight:600;font-family:'Segoe UI',sans-serif;padding:2px 8px;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,0.28);white-space:nowrap;max-width:150px;overflow:hidden;text-overflow:ellipsis;display:block;border:1px solid rgba(0,0,0,0.08)">${esc(name)}</span>`
        : '';
      return L.divIcon({
        className: '',
        html: `<div style="position:relative">${svg}${label}</div>`,
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -36],
      });
    }

    function createCommunityIcon(color, name) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36" style="display:block">
        <path d="M14 0C6.27 0 0 6.27 0 14c0 9.625 14 22 14 22S28 23.625 28 14C28 6.27 21.73 0 14 0z" fill="${color}" stroke="white" stroke-width="2" opacity="0.75"/>
        <circle cx="14" cy="14" r="5.5" fill="white" opacity="0.9"/>
      </svg>`;
      const badge = `<span style="position:absolute;top:-5px;right:-7px;font-size:11px;line-height:1;background:white;border-radius:50%;padding:1px;box-shadow:0 1px 3px rgba(0,0,0,0.25)">🌍</span>`;
      const label = name
        ? `<span style="position:absolute;left:32px;top:6px;background:white;color:#202124;font-size:11px;font-weight:600;font-family:'Segoe UI',sans-serif;padding:2px 8px;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,0.28);white-space:nowrap;max-width:150px;overflow:hidden;text-overflow:ellipsis;display:block;border:1px solid rgba(0,0,0,0.08)">${esc(name)}</span>`
        : '';
      return L.divIcon({
        className: '',
        html: `<div style="position:relative">${svg}${badge}${label}</div>`,
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -36],
      });
    }

    function addCommunityMarker(loc) {
      if (communityMarkers[loc.id]) { communityClusterGroup.removeLayer(communityMarkers[loc.id]); delete communityMarkers[loc.id]; }
      if (leafletMarkers[loc.id]) return;
      const m = L.marker([loc.lat, loc.lng], { icon: createCommunityIcon(loc.color, loc.name) });
      if (communityVisible) communityClusterGroup.addLayer(m);
      m.bindPopup(makePopupHtml(loc, true), { maxWidth: 260 });
      m.on('popupopen', () => incrementCommunityViews(loc.id));
      communityMarkers[loc.id] = m;
    }

    function clearCommunityMarkers() {
      Object.values(communityMarkers).forEach(m => clusterGroup.removeLayer(m));
      communityMarkers = {};
    }

    async function incrementViews(id) {
      // Personal locations are always owned by the current user — never count own views
    }

    async function incrementCommunityViews(id) {
      if (recentlyViewed.has('c_' + id)) return;
      const locIdx = communityLocations.findIndex(l => l.id === id);
      // Skip if viewer is the owner
      if (locIdx >= 0 && currentUser?.uid && communityLocations[locIdx].ownerUid === currentUser.uid) return;
      recentlyViewed.add('c_' + id);
      setTimeout(() => recentlyViewed.delete('c_' + id), 5000);
      if (locIdx >= 0) communityLocations[locIdx].views = (communityLocations[locIdx].views || 0) + 1;
      const qIdx = quickViewItems.findIndex(l => l.id === id);
      if (qIdx >= 0) quickViewItems[qIdx].views = (quickViewItems[qIdx].views || 0) + 1;
      if (locIdx >= 0 && communityMarkers[id])
        communityMarkers[id].setPopupContent(makePopupHtml(communityLocations[locIdx], true));
      try { await db.collection('public_locations').doc(String(id)).update({ views: firebase.firestore.FieldValue.increment(1) }); } catch(e) {}
    }

    function toggleCommunityMarkers() {
      communityVisible = !communityVisible;
      const btn = document.getElementById('btn-toggle-community');
      btn.classList.toggle('active', communityVisible);
      btn.title = communityVisible ? 'Ẩn địa điểm cộng đồng' : 'Hiện địa điểm cộng đồng';
      if (!communityVisible) {
        Object.values(communityMarkers).forEach(m => communityClusterGroup.removeLayer(m));
      } else {
        Object.values(communityMarkers).forEach(m => communityClusterGroup.addLayer(m));
      }
    }

    // Hiện N ký tự đầu, nút ··· để xem đầy đủ; uid phải unique trong trang
    function truncText(raw, max, uid) {
      if (!raw || raw.length <= max) return esc(raw || '');
      const s = 'tfs' + uid, f = 'tff' + uid;
      const tog = (show, hide, lbl) =>
        `<button onclick="document.getElementById('${show}').style.display='inline';document.getElementById('${hide}').style.display='none'" ` +
        `style="background:none;border:none;color:#1a73e8;font-size:0.76rem;cursor:pointer;padding:0 3px;font-weight:700;vertical-align:middle">${lbl}</button>`;
      return `<span id="${s}">${esc(raw.slice(0, max))}…${tog(f, s, '···')}</span>` +
             `<span id="${f}" style="display:none">${esc(raw)}${tog(s, f, '↑')}</span>`;
    }
