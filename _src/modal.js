function openModal(title, data = {}) {
  selectedColor = data.color || '#e53935';
  document.getElementById('modal-title').textContent = title;
  const set = (id, val) => { document.getElementById(id).value = val || ''; };
  set('field-name',      data.name);
  set('field-desc',      data.desc);
  set('field-note',      data.note);
  set('field-image',     data.image);
  set('field-link',      data.link);
  set('field-direction', data.direction);
  set('field-acreage',   data.acreage);
  set('field-width',     data.width);
  set('field-length',    data.length);
  set('field-price',     data.price);
  set('field-buildarea', data.buildArea);
  set('field-floorarea', data.floorArea);
  set('field-structure', data.structure);
  set('field-usage',     data.usage);
  document.getElementById('modal-lat').value = parseFloat(data.lat || 0).toFixed(6);
  document.getElementById('modal-lng').value = parseFloat(data.lng || 0).toFixed(6);
  document.querySelectorAll('.color-dot').forEach(d => {
    d.classList.toggle('selected', d.dataset.color === selectedColor);
  });
  setImagePreview(data.image || '');
  document.getElementById('modal-overlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('field-name').focus(), 50);
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  clearUploadStatus();
  pendingLatLng = null;
  editingId = null;
}

function saveLocation() {
  const name = document.getElementById('field-name').value.trim();
  if (!name) { document.getElementById('field-name').focus(); return; }
  const get = id => document.getElementById(id).value.trim();
  const fields = {
    name,
    desc:      get('field-desc'),
    note:      get('field-note'),
    image:     get('field-image'),
    link:      get('field-link'),
    direction: get('field-direction'),
    acreage:   get('field-acreage'),
    width:     get('field-width'),
    length:    get('field-length'),
    price:     get('field-price'),
    buildArea: get('field-buildarea'),
    floorArea: get('field-floorarea'),
    structure: get('field-structure'),
    usage:     get('field-usage'),
    color:     selectedColor,
  };

  if (editingId !== null) {
    const loc = locations.find(l => l.id === editingId);
    if (loc) Object.assign(loc, fields);
  } else {
    const newLoc = {
      id: Date.now(),
      lat: pendingLatLng.lat,
      lng: pendingLatLng.lng,
      area: '',
      ...fields,
    };
    locations.push(newLoc);
    fetchArea(newLoc).then(() => { renderSidebar(); autoDownloadXML(); });
  }
  save();
  closeModal();
}
