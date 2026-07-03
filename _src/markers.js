function renderMarkers() {
  Object.values(leafletMarkers).forEach(m => map.removeLayer(m));
  leafletMarkers = {};
  locations.forEach(loc => {
    const m = L.marker([loc.lat, loc.lng], { icon: createIcon(loc.color), draggable: true }).addTo(map);
    m.bindPopup(makePopupHtml(loc), { maxWidth: 260 });

    m.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng();
      loc.lat = lat;
      loc.lng = lng;
      m.setPopupContent(makePopupHtml(loc));
      if (editingId === loc.id) {
        document.getElementById('modal-lat').value = lat.toFixed(6);
        document.getElementById('modal-lng').value = lng.toFixed(6);
      }
      renderSidebar();
      autoDownloadXML();
    });

    leafletMarkers[loc.id] = m;
  });
}
