function save() {
  renderMarkers();
  renderSidebar();
  autoDownloadXML();
}

function flyTo(id) {
  const loc = locations.find(l => l.id === id);
  if (!loc) return;
  map.flyTo([loc.lat, loc.lng], 16, { duration: 0.8 });
  setTimeout(() => leafletMarkers[id]?.openPopup(), 850);
}

function editLocation(id) {
  const loc = locations.find(l => l.id === id);
  if (!loc) return;
  editingId = id;
  pendingLatLng = { lat: loc.lat, lng: loc.lng };
  Object.values(leafletMarkers).forEach(m => m.closePopup());
  openModal('Chỉnh sửa địa điểm', loc);
}

function deleteLocation(id) {
  if (!confirm('Xóa địa điểm này?')) return;
  locations = locations.filter(l => l.id !== id);
  save();
}
