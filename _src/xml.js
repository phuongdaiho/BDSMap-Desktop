function xmlEsc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateXML() {
  const rows = locations.map(loc => `  <location>
    <id>${loc.id}</id>
    <lat>${loc.lat}</lat>
    <lng>${loc.lng}</lng>
    <name>${xmlEsc(loc.name)}</name>
    <desc>${xmlEsc(loc.desc)}</desc>
    <note>${xmlEsc(loc.note)}</note>
    <image>${xmlEsc(loc.image)}</image>
    <link>${xmlEsc(loc.link)}</link>
    <color>${xmlEsc(loc.color)}</color>
    <area>${xmlEsc(loc.area)}</area>
    <direction>${xmlEsc(loc.direction)}</direction>
    <acreage>${xmlEsc(loc.acreage)}</acreage>
    <width>${xmlEsc(loc.width)}</width>
    <length>${xmlEsc(loc.length)}</length>
    <price>${xmlEsc(loc.price)}</price>
    <buildArea>${xmlEsc(loc.buildArea)}</buildArea>
    <floorArea>${xmlEsc(loc.floorArea)}</floorArea>
    <structure>${xmlEsc(loc.structure)}</structure>
    <usage>${xmlEsc(loc.usage)}</usage>
    <phone>${xmlEsc(loc.phone)}</phone>
  </location>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<locations>\n${rows}\n</locations>`;
}

function parseXML(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
  if (doc.querySelector('parsererror')) throw new Error('XML không hợp lệ');
  return Array.from(doc.querySelectorAll('location')).map(el => {
    const get = tag => el.querySelector(tag)?.textContent?.trim() || '';
    return {
      id:        parseInt(get('id')) || Date.now(),
      lat:       parseFloat(get('lat')),
      lng:       parseFloat(get('lng')),
      name:      get('name'),
      desc:      get('desc'),
      note:      get('note'),
      image:     get('image'),
      link:      get('link'),
      color:     get('color') || '#e53935',
      area:      get('area'),
      direction: get('direction'),
      acreage:   get('acreage'),
      width:     get('width'),
      length:    get('length'),
      price:     get('price'),
      buildArea: get('buildArea'),
      floorArea: get('floorArea'),
      structure: get('structure'),
      usage:     get('usage'),
      phone:     get('phone'),
    };
  }).filter(loc => !isNaN(loc.lat) && !isNaN(loc.lng) && loc.name);
}

let savedFileHandle = null;

function xmlBlob() {
  return new Blob([generateXML()], { type: 'text/xml;charset=utf-8' });
}

function fallbackDownload(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'data.xml'; a.click();
  URL.revokeObjectURL(url);
}

async function writeToHandle(handle, blob) {
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

async function saveXML() {
  const blob = xmlBlob();
  if (window.showSaveFilePicker) {
    try {
      savedFileHandle = await window.showSaveFilePicker({
        suggestedName: 'data.xml',
        types: [{ description: 'File XML', accept: { 'text/xml': ['.xml'], 'application/xml': ['.xml'] } }],
      });
      await writeToHandle(savedFileHandle, blob);
      updateSaveBtn();
    } catch (e) {
      if (e.name !== 'AbortError') fallbackDownload(blob);
    }
  } else {
    fallbackDownload(blob);
  }
}

function updateSaveBtn() {
  const btn = document.getElementById('btn-save-xml');
  if (!btn) return;
  if (savedFileHandle) {
    btn.title = `Đang lưu vào: ${savedFileHandle.name}`;
    btn.textContent = '💾 ' + savedFileHandle.name;
  } else {
    btn.title = 'Lưu toàn bộ dữ liệu ra file data.xml';
    btn.textContent = '💾 Lưu XML';
  }
}

let autoDownloadTimer;
function autoDownloadXML() {
  clearTimeout(autoDownloadTimer);
  autoDownloadTimer = setTimeout(async () => {
    const blob = xmlBlob();
    if (savedFileHandle) {
      try {
        await writeToHandle(savedFileHandle, blob);
        return;
      } catch {
        savedFileHandle = null;
        updateSaveBtn();
      }
    }
    fallbackDownload(blob);
  }, 800);
}

function importXML(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      locations = parseXML(e.target.result);
      renderMarkers();
      renderSidebar();
    } catch (err) {
      alert('Lỗi đọc file XML: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

async function loadDataXML() {
  try {
    const res = await fetch('./data.xml');
    if (!res.ok) return;
    const text = await res.text();
    locations = parseXML(text);
    renderMarkers();
    renderSidebar();
  } catch { /* file chưa tồn tại hoặc chạy từ file:// */ }
}
