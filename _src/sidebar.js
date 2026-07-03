let dragSrcId = null;
let didDrag = false;
let groupByField = '';
const collapsedGroups = new Set();
const COLOR_NAMES = {'#e53935':'Đỏ','#1a73e8':'Xanh lam','#43a047':'Xanh lá','#f57c00':'Cam','#8e24aa':'Tím'};

function createLocItem(loc) {
  const item = document.createElement('div');
  item.className = 'loc-item';
  item.dataset.id = loc.id;
  const canDrag = !groupByField;
  item.draggable = canDrag;

  item.innerHTML = `
    ${canDrag ? '<span class="drag-handle" title="Kéo để sắp xếp">⠿</span>' : ''}
    <div class="loc-pin" style="background:${loc.color}"></div>
    <div class="loc-info">
      <div class="loc-name">${esc(loc.name)}</div>
      ${loc.desc  ? `<div class="loc-desc">${esc(loc.desc)}</div>` : ''}
      ${loc.price ? `<div class="loc-price">💰 ${esc(loc.price)}</div>` : ''}
      <div class="loc-coords">${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}</div>
    </div>
    <div class="loc-actions">
      <button class="btn-edit">Sửa</button>
      <button class="btn-del">Xóa</button>
    </div>`;

  item.querySelector('.btn-edit').addEventListener('click', e => { e.stopPropagation(); editLocation(loc.id); });
  item.querySelector('.btn-del').addEventListener('click', e => { e.stopPropagation(); deleteLocation(loc.id); });
  item.addEventListener('click', () => { if (!didDrag) flyTo(loc.id); });

  if (canDrag) {
    item.addEventListener('dragstart', e => {
      dragSrcId = loc.id;
      didDrag = false;
      setTimeout(() => item.classList.add('dragging'), 0);
      e.dataTransfer.effectAllowed = 'move';
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      document.querySelectorAll('.loc-item').forEach(el =>
        el.classList.remove('drag-over-top', 'drag-over-bottom'));
      setTimeout(() => { didDrag = false; }, 0);
    });
    item.addEventListener('dragover', e => {
      e.preventDefault();
      if (dragSrcId === loc.id) return;
      didDrag = true;
      const rect = item.getBoundingClientRect();
      const isTop = e.clientY < rect.top + rect.height / 2;
      document.querySelectorAll('.loc-item').forEach(el =>
        el.classList.remove('drag-over-top', 'drag-over-bottom'));
      item.classList.add(isTop ? 'drag-over-top' : 'drag-over-bottom');
      e.dataTransfer.dropEffect = 'move';
    });
    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over-top', 'drag-over-bottom');
    });
    item.addEventListener('drop', e => {
      e.preventDefault();
      item.classList.remove('drag-over-top', 'drag-over-bottom');
      if (dragSrcId === loc.id) return;
      const rect = item.getBoundingClientRect();
      const isTop = e.clientY < rect.top + rect.height / 2;
      const srcIdx = locations.findIndex(l => l.id === dragSrcId);
      let tgtIdx = locations.findIndex(l => l.id === loc.id);
      if (srcIdx === -1 || tgtIdx === -1) return;
      const [moved] = locations.splice(srcIdx, 1);
      tgtIdx = locations.findIndex(l => l.id === loc.id);
      locations.splice(isTop ? tgtIdx : tgtIdx + 1, 0, moved);
      save();
    });
  }
  return item;
}

function renderSidebar() {
  const list = document.getElementById('location-list');
  document.getElementById('sidebar-count').textContent = locations.length;

  if (!locations.length) {
    list.innerHTML = '<div class="sidebar-empty">Chưa có địa điểm nào.<br/>Click lên bản đồ để thêm.</div>';
    return;
  }

  list.innerHTML = '';

  if (groupByField) {
    const getKey = loc => {
      switch (groupByField) {
        case 'area':      return loc.area || '⏳ Đang tải địa chỉ...';
        case 'direction': return loc.direction || '— Chưa có hướng —';
        case 'usage':     return loc.usage     || '— Chưa phân loại —';
        case 'structure': return loc.structure || '— Chưa có kết cấu —';
        case 'color':     return COLOR_NAMES[loc.color] || loc.color;
        case 'price':     return loc.price     || '— Chưa có giá —';
        default:          return '— Khác —';
      }
    };
    const groups = {}, order = [];
    locations.forEach(loc => {
      const key = getKey(loc);
      if (!groups[key]) { groups[key] = []; order.push(key); }
      groups[key].push(loc);
    });
    order.forEach(groupName => {
      const isCollapsed = collapsedGroups.has(groupName);
      const header = document.createElement('div');
      header.className = 'group-header' + (isCollapsed ? ' collapsed' : '');
      header.innerHTML = `
        <span><i class="group-chevron">▼</i>${esc(groupName)}</span>
        <span class="group-count">${groups[groupName].length}</span>`;
      const body = document.createElement('div');
      if (isCollapsed) body.style.display = 'none';
      groups[groupName].forEach(loc => body.appendChild(createLocItem(loc)));
      header.addEventListener('click', () => {
        const nowCollapsed = !collapsedGroups.has(groupName);
        nowCollapsed ? collapsedGroups.add(groupName) : collapsedGroups.delete(groupName);
        header.classList.toggle('collapsed', nowCollapsed);
        body.style.display = nowCollapsed ? 'none' : '';
      });
      list.appendChild(header);
      list.appendChild(body);
    });
  } else {
    locations.forEach(loc => list.appendChild(createLocItem(loc)));
  }
}

async function fetchArea(loc) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${loc.lat}&lon=${loc.lng}&format=json&accept-language=vi`
    );
    const data = await res.json();
    const addr = data.address || {};
    const district = addr.city_district || addr.county || addr.town || addr.village || addr.suburb || '';
    const province = addr.state || addr.city || '';
    loc.area = [district, province].filter(Boolean).join(', ') || 'Không xác định';
  } catch {
    loc.area = 'Không xác định';
  }
}

let areaFetchRunning = false;
async function fetchMissingAreas() {
  if (areaFetchRunning) return;
  const missing = locations.filter(l => !l.area);
  if (!missing.length) return;
  areaFetchRunning = true;
  for (let i = 0; i < missing.length; i++) {
    await fetchArea(missing[i]);
    renderSidebar();
    if (i < missing.length - 1) await new Promise(r => setTimeout(r, 1100));
  }
  autoDownloadXML();
  areaFetchRunning = false;
}

document.getElementById('group-by').addEventListener('change', (e) => {
  groupByField = e.target.value;
  collapsedGroups.clear();
  e.target.classList.toggle('active', !!groupByField);
  renderSidebar();
  if (groupByField === 'area') fetchMissingAreas();
});
