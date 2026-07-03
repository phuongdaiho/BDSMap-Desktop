// ── Render sidebar list ──
    let dragSrcId = null;
    let didDrag = false;
    let groupByField = '';
    let sidebarTab = 'personal';
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
          ${loc.price ? `<div class="loc-price">💰 ${esc(loc.price)}</div>` : ''}
          ${loc.phone ? `<div class="loc-phone"><a href="tel:${esc(loc.phone)}" onclick="event.stopPropagation()">📞 ${esc(loc.phone)}</a></div>` : ''}
          <div class="loc-meta-row">
            ${loc.status ? `<span class="loc-status-badge ${loc.status === 'Đã bán' ? 'sold' : 'selling'}">${esc(loc.status)}</span>` : ''}
            ${loc.isPublic ? '<span class="loc-public-badge" title="Công khai">🌍</span>' : ''}
          </div>
          ${loc.updatedDate ? `<div class="loc-updated">Cập nhật: ${loc.updatedDate.split('-').reverse().join('/')}</div>` : ''}
          ${loc.views ? `<div class="loc-views">👁 Đã xem: ${loc.views} lần</div>` : ''}
        </div>
        <div class="loc-actions">
          ${loc.isPublic ? `<button class="btn-share" title="Chia sẻ địa điểm">↗️</button>` : ''}
          <button class="btn-edit" title="Chỉnh sửa">✏️</button>
          <button class="btn-del" title="Xóa địa điểm">❌</button>
        </div>`;

      item.querySelector('.btn-share')?.addEventListener('click', e => { e.stopPropagation(); shareLocation(String(loc.id), loc.name); });
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
          renderSidebar();
          if (appMode === 'guest') {
            guestPersist();
          } else {
            const batch = db.batch();
            locations.forEach((l, idx) => {
              batch.update(userCol().doc(String(l.id)), { sortOrder: idx * 1000 });
            });
            batch.commit();
          }
        });
      }
      return item;
    }

    function switchSidebarTab(tab) {
      sidebarTab = tab;
      document.getElementById('tab-personal').classList.toggle('active', tab === 'personal');
      document.getElementById('tab-community').classList.toggle('active', tab === 'community');
      renderSidebar();
    }

    function flyToCommunity(id) {
      const loc = communityLocations.find(l => l.id === id);
      if (!loc) return;
      if (!sidebarVisible) toggleSidebar();
      map.flyTo([loc.lat, loc.lng], Math.max(map.getZoom(), 16), { duration: 0.8 });
      setTimeout(() => { if (communityMarkers[id]) communityMarkers[id].openPopup(); }, 850);
    }

    function createCommunityLocItem(loc) {
      const item = document.createElement('div');
      item.className = 'loc-item';
      item.dataset.id = loc.id;
      const isOwn = appMode === 'user' && currentUser && loc.ownerUid === currentUser.uid;
      item.innerHTML = `
        <div class="loc-pin" style="background:${loc.color || '#1a73e8'}"></div>
        <div class="loc-info">
          <div class="loc-name">${esc(loc.name)}</div>
          ${loc.price ? `<div class="loc-price">💰 ${esc(loc.price)}</div>` : ''}
          ${loc.phone ? `<div class="loc-phone"><a href="tel:${esc(loc.phone)}" onclick="event.stopPropagation()">📞 ${esc(loc.phone)}</a></div>` : ''}
          <div class="loc-meta-row">
            ${loc.status ? `<span class="loc-status-badge ${loc.status === 'Đã bán' ? 'sold' : 'selling'}">${esc(loc.status)}</span>` : ''}
          </div>
          ${loc.updatedDate ? `<div class="loc-updated">Cập nhật: ${loc.updatedDate.split('-').reverse().join('/')}</div>` : ''}
          ${loc.views ? `<div class="loc-views">👁 Đã xem: ${loc.views} lần</div>` : ''}
        </div>
        <div class="loc-actions">
          <button class="btn-share" title="Chia sẻ địa điểm">↗️</button>
          ${isOwn ? `<button class="btn-edit" title="Chỉnh sửa">✏️</button><button class="btn-del" title="Xóa địa điểm">❌</button>` : ''}
        </div>`;
      item.querySelector('.btn-share').addEventListener('click', e => { e.stopPropagation(); shareLocation(String(loc.id), loc.name); });
      if (isOwn) {
        item.querySelector('.btn-edit').addEventListener('click', e => { e.stopPropagation(); editLocation(loc.id); });
        item.querySelector('.btn-del').addEventListener('click', e => { e.stopPropagation(); deleteLocation(loc.id); });
      }
      item.addEventListener('click', () => flyToCommunity(loc.id));
      return item;
    }

    function renderSidebar() {
      const list = document.getElementById('location-list');
      document.getElementById('count-personal').textContent = locations.length;
      document.getElementById('count-community').textContent = communityLocations.filter(loc => loc.ownerUid !== currentUser?.uid).length;

      if (sidebarTab === 'community') {
        const displayCommunity = communityLocations.filter(loc => loc.ownerUid !== currentUser?.uid);
        if (!displayCommunity.length) {
          list.innerHTML = '<div class="sidebar-empty">Không có địa điểm cộng đồng trong khu vực này.</div>';
          return;
        }
        list.innerHTML = '';
        if (groupByField) {
          const getKey = loc => {
            switch (groupByField) {
              case 'area':      return loc.area      || '— Chưa có khu vực —';
              case 'direction': return loc.direction || '— Chưa có hướng —';
              case 'usage':     return loc.usage     || '— Chưa phân loại —';
              case 'structure': return loc.structure || '— Chưa có kết cấu —';
              case 'color':     return COLOR_NAMES[loc.color] || loc.color || '— Khác —';
              case 'price':     return loc.price     || '— Chưa có giá —';
              default:          return '— Khác —';
            }
          };
          const groups = {}, order = [];
          displayCommunity.forEach(loc => {
            const key = getKey(loc);
            if (!groups[key]) { groups[key] = []; order.push(key); }
            groups[key].push(loc);
          });
          order.forEach(groupName => {
            const isCollapsed = collapsedGroups.has(groupName);
            const header = document.createElement('div');
            header.className = 'group-header' + (isCollapsed ? ' collapsed' : '');
            header.innerHTML = `<span><i class="group-chevron">▼</i>${esc(groupName)}</span><span class="group-count">${groups[groupName].length}</span>`;
            const body = document.createElement('div');
            if (isCollapsed) body.style.display = 'none';
            groups[groupName].forEach(loc => body.appendChild(createCommunityLocItem(loc)));
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
          displayCommunity.forEach(loc => list.appendChild(createCommunityLocItem(loc)));
        }
        return;
      }

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

    function loadCommunityByViewport(reset = false) {
      if (communityUnsub) { communityUnsub(); communityUnsub = null; }
      if (reset) { clearCommunityMarkers(); communityLocations = []; }
      const b = map.getBounds().pad(0.15);
      communityUnsub = publicCol()
        .where('lat', '>=', b.getSouth())
        .where('lat', '<=', b.getNorth())
        .onSnapshot(snap => {
          snap.docChanges().forEach(change => {
            const d = change.doc.data();
            const id = d.id ?? Number(change.doc.id);
            if (change.type === 'removed') return; // Ra ngoài viewport, không phải xóa thật — giữ nguyên marker
            if (d.lng < b.getWest() || d.lng > b.getEast()) return;
            const loc = { ...d, id };
            const idx = communityLocations.findIndex(l => l.id === id);
            if (change.type === 'added') {
              if (idx < 0) { communityLocations.push(loc); addCommunityMarker(loc); }
              else { communityLocations[idx] = loc; }
            } else {
              if (idx >= 0) communityLocations[idx] = loc; else communityLocations.push(loc);
              if (communityMarkers[id]) {
                communityMarkers[id].setIcon(createCommunityIcon(loc.color, loc.name));
                communityMarkers[id].setLatLng([loc.lat, loc.lng]);
                communityMarkers[id].setPopupContent(makePopupHtml(loc, true));
              } else if (!leafletMarkers[id]) {
                addCommunityMarker(loc);
              }
            }
          });
          if (sidebarTab === 'community') renderSidebar();
        });
    }

    // ── Nhóm theo khu vực ──
    async function fetchArea(id, lat, lng) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=vi`
        );
        const data = await res.json();
        const addr = data.address || {};
        const district = addr.city_district || addr.county || addr.town || addr.village || addr.suburb || '';
        const province = addr.state || addr.city || '';
        const area = [district, province].filter(Boolean).join(', ') || 'Không xác định';
        if (appMode === 'guest') {
          const idx = locations.findIndex(l => l.id === id);
          if (idx >= 0) { locations[idx].area = area; renderSidebar(); guestPersist(); }
        } else {
          await userCol().doc(String(id)).update({ area });
        }
      } catch {
        if (appMode !== 'guest') {
          try { await userCol().doc(String(id)).update({ area: 'Không xác định' }); } catch {}
        }
      }
    }

    let areaFetchRunning = false;
    async function fetchMissingAreas() {
      if (areaFetchRunning) return;
      const missing = locations.filter(l => !l.area);
      if (!missing.length) return;
      areaFetchRunning = true;
      for (let i = 0; i < missing.length; i++) {
        const { id, lat, lng } = missing[i];
        await fetchArea(id, lat, lng);
        if (i < missing.length - 1) await new Promise(r => setTimeout(r, 1100));
      }
      areaFetchRunning = false;
    }

    document.getElementById('group-by').addEventListener('change', (e) => {
      groupByField = e.target.value;
      collapsedGroups.clear();
      e.target.classList.toggle('active', !!groupByField);
      renderSidebar();
      if (groupByField === 'area') fetchMissingAreas();
    });
