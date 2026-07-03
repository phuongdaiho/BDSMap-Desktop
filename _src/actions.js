// ── Actions ──
    function flyTo(id) {
      const loc = locations.find(l => l.id === id);
      if (!loc) return;
      const m = leafletMarkers[id];
      if (!m) return;
      map.flyTo([loc.lat, loc.lng], 16, { duration: 0.8 });
      setTimeout(() => clusterGroup.zoomToShowLayer(m, () => m.openPopup()), 900);
    }

    function editLocation(id) {
      const loc = locations.find(l => l.id === id);
      if (!loc) return;
      editingId = id;
      pendingLatLng = { lat: loc.lat, lng: loc.lng };
      Object.values(leafletMarkers).forEach(m => m.closePopup());
      openModal('Chỉnh sửa địa điểm', loc);
    }

    async function deleteLocation(id) {
      if (!confirm('Xóa địa điểm này?')) return;
      Object.values(leafletMarkers).forEach(m => m.closePopup());
      if (appMode === 'guest') {
        locations = locations.filter(l => l.id !== id);
        if (leafletMarkers[id]) { clusterGroup.removeLayer(leafletMarkers[id]); delete leafletMarkers[id]; }
        guestPersist();
        renderSidebar();
        return;
      }
      const loc = locations.find(l => l.id === id);
      await userCol().doc(String(id)).delete();
      if (loc?.isPublic) {
        await publicCol().doc(String(id)).delete().catch(() => {});
        if (communityMarkers[id]) { communityClusterGroup.removeLayer(communityMarkers[id]); delete communityMarkers[id]; }
        communityLocations = communityLocations.filter(l => l.id !== id);
      }
    }

    // Cập nhật nút gọi khi nhập số điện thoại
    document.getElementById('field-phone').addEventListener('input', (e) => {
      const phone = e.target.value.trim();
      const btn = document.getElementById('call-btn-modal');
      if (phone) { btn.href = 'tel:' + phone; btn.style.display = 'inline-block'; }
      else btn.style.display = 'none';
    });

    function blobToBase64(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
