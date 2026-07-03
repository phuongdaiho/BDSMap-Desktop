// ── Quick View BĐS đang bán ──

    function distKm(lat1, lng1, lat2, lng2) {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    function openQuickView() {
      const doFilter = (uLat, uLng) => {
        quickViewUserPos = { lat: uLat, lng: uLng };
        quickViewItems = communityLocations
          .filter(loc => loc.ownerUid !== currentUser?.uid)
          .filter(loc => !loc.status || loc.status === 'Đang bán')
          .map(loc => ({ ...loc, _dist: distKm(uLat, uLng, loc.lat, loc.lng) }))
          .filter(loc => loc._dist <= 5)
          .sort((a, b) => a._dist - b._dist);
        quickViewIdx = 0;
        document.getElementById('quickview-overlay').classList.remove('qv-hidden');
        if (!quickViewItems.length) {
          document.getElementById('qv-body').innerHTML =
            '<div class="qv-empty"><div style="font-size:2.5rem">🏘️</div><div>Không tìm thấy BĐS đang bán<br>trong bán kính 5 km.</div><div style="font-size:0.78rem;color:#bbb">Di chuyển bản đồ đến khu vực có BĐS<br>rồi thử lại.</div></div>';
          document.getElementById('qv-counter').textContent = '0 / 0';
          document.getElementById('qv-prev').disabled = true;
          document.getElementById('qv-next').disabled = true;
          return;
        }
        showQuickCard(0);
      };

      if (myLocationMarker) {
        const { lat, lng } = myLocationMarker.getLatLng();
        doFilter(lat, lng);
      } else {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => doFilter(coords.latitude, coords.longitude),
          () => showHint('Không lấy được vị trí GPS. Vui lòng cho phép truy cập vị trí.')
        );
      }
    }

    function showQuickCard(idx) {
      quickViewIdx = idx;
      const loc = quickViewItems[idx];
      incrementCommunityViews(loc.id);
      const total = quickViewItems.length;
      document.getElementById('qv-counter').textContent = `${idx + 1} / ${total}`;
      document.getElementById('qv-prev').disabled = idx === 0;
      document.getElementById('qv-next').disabled = idx === total - 1;

      const fmtDate = d => { if (!d) return ''; const [y,m,dd] = d.split('-'); return `${dd}/${m}/${y}`; };
      const dist = loc._dist != null ? loc._dist.toFixed(1) : null;

      const imgs = loc.images?.length ? loc.images : (loc.image ? [loc.image] : []);
      let imgHtml = '';
      if (imgs.length) {
        const thumbs = imgs.length > 1
          ? `<div class="qv-thumbs">${imgs.map((u, i) =>
              `<img src="${esc(u)}" class="qv-thumb${i === 0 ? ' active' : ''}"
               onclick="var mi=document.getElementById('qv-main-img');mi.src='${esc(u)}';document.querySelectorAll('.qv-thumb').forEach(t=>t.classList.remove('active'));this.classList.add('active')"
               onerror="this.parentNode.removeChild(this)" />`).join('')}</div>`
          : '';
        imgHtml = `<div class="qv-img-wrap">
          <img id="qv-main-img" src="${esc(imgs[0])}" alt="" onerror="this.parentNode.style.display='none'" />
          ${thumbs}
        </div>`;
      }

      const details = [
        loc.acreage   ? `📐 ${esc(loc.acreage)} m²`      : '',
        loc.width     ? `↔ ${esc(loc.width)} m`           : '',
        loc.length    ? `↕ ${esc(loc.length)} m`          : '',
        loc.direction ? `🧭 ${esc(loc.direction)}`         : '',
        loc.legal     ? `📜 ${esc(loc.legal)}`             : '',
        loc.roadWidth ? `🛣️ Lộ ${esc(loc.roadWidth)}`     : '',
      ].filter(Boolean).map(s => `<span>${s}</span>`).join('');

      document.getElementById('qv-body').innerHTML = `
        ${imgHtml}
        <div class="qv-card">
          <div class="qv-name">${esc(loc.name)}</div>
          <div class="qv-meta">
            <span class="qv-badge-selling">Đang bán</span>
            ${dist ? `<span class="qv-dist">📍 ${dist} km</span>` : ''}
            ${loc.updatedDate ? `<span class="qv-date">Cập nhật: ${fmtDate(loc.updatedDate)}</span>` : ''}
          </div>
          <div class="qv-row" style="font-size:0.75rem;color:#888">🌐 ${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}</div>
          ${loc.price      ? `<div class="qv-price">💰 ${esc(loc.price)}</div>` : ''}
          ${loc.area       ? `<div class="qv-area-name">📌 ${esc(loc.area)}</div>` : ''}
          ${details        ? `<div class="qv-details">${details}</div>` : ''}
          ${loc.structure  ? `<div class="qv-row">🏗️ ${esc(loc.structure)}</div>` : ''}
          ${loc.usage      ? `<div class="qv-row">🏠 ${esc(loc.usage)}</div>` : ''}
          ${loc.interior   ? `<div class="qv-row">🛋️ ${esc(loc.interior)}</div>` : ''}
          ${loc.buildArea  ? `<div class="qv-row">🏢 DT xây dựng: ${esc(loc.buildArea)} m²</div>` : ''}
          ${loc.floorArea  ? `<div class="qv-row">📊 DT sàn: ${esc(loc.floorArea)} m²</div>` : ''}
          ${loc.desc       ? `<div class="qv-desc">${esc(loc.desc)}</div>` : ''}
          ${loc.note       ? `<div class="qv-note">${esc(loc.note)}</div>` : ''}
          ${loc.phone      ? `<div class="qv-phone"><span class="qv-phone-num">📞 ${esc(loc.phone)}</span><a href="tel:${esc(loc.phone)}" class="qv-call-btn">Gọi ngay</a></div>` : ''}
          ${loc.link       ? `<div class="qv-link"><a href="${esc(loc.link)}" target="_blank" rel="noopener">🔗 Xem thêm</a></div>` : ''}
          ${loc.views      ? `<div class="qv-row" style="color:#bbb;font-size:0.75rem">👁 Đã xem: ${loc.views} lần</div>` : ''}
          <div class="qv-owner">🌍 ${esc((loc.ownerEmail || '').split('@')[0])}</div>
          <button onclick="shareLocation('${loc.id}','${esc(loc.name)}')" class="qv-share-btn">↗️ Chia sẻ</button>
        </div>`;
    }

    // ── Share / Deep link ──

    function shareLocation(id, name) {
      const url = `${SHARE_WORKER_URL}/?id=${encodeURIComponent(id)}`;
      if (navigator.share) {
        navigator.share({ title: name, text: '🏠 Xem BĐS trên BĐS Map', url }).catch(() => {});
      } else {
        navigator.clipboard.writeText(url)
          .then(() => showHint('Đã copy link chia sẻ'))
          .catch(() => showHint('Link: ' + url));
      }
    }

    function parseFirestoreDoc(doc) {
      if (!doc || !doc.fields) return null;
      const f   = doc.fields;
      const str = k => f[k]?.stringValue || '';
      const num = k => f[k]?.doubleValue ?? f[k]?.integerValue ?? 0;
      const boo = k => f[k]?.booleanValue ?? false;
      const arr = k => (f[k]?.arrayValue?.values || []).map(v => v.stringValue || '').filter(Boolean);
      return {
        id:          doc.name.split('/').pop(),
        lat:         num('lat'),      lng:         num('lng'),
        name:        str('name'),     desc:        str('desc'),
        note:        str('note'),     image:       str('image'),
        images:      arr('images'),   link:        str('link'),
        color:       str('color'),    area:        str('area'),
        direction:   str('direction'),acreage:     str('acreage'),
        width:       str('width'),    length:      str('length'),
        price:       str('price'),    buildArea:   str('buildArea'),
        floorArea:   str('floorArea'),structure:   str('structure'),
        usage:       str('usage'),    roadWidth:   str('roadWidth'),
        legal:       str('legal'),    interior:    str('interior'),
        phone:       str('phone'),    status:      str('status'),
        updatedDate: str('updatedDate'),
        isPublic:    boo('isPublic'), ownerUid:    str('ownerUid'),
        ownerEmail:  str('ownerEmail'),views:      num('views'),
      };
    }

    async function handleShareLink(id) {
      if (!id) return;
      try {
        const fsUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/public_locations/${encodeURIComponent(id)}?key=${FIREBASE_API_KEY}`;
        const res = await fetch(fsUrl);
        if (!res.ok) { showHint('Không tìm thấy BĐS này'); return; }
        const loc = parseFirestoreDoc(await res.json());
        if (!loc || !loc.lat) { showHint('Không tìm thấy BĐS này'); return; }
        map.flyTo([loc.lat, loc.lng], 16, { duration: 1 });
        quickViewItems = [{ ...loc, _dist: null }];
        quickViewIdx   = 0;
        document.getElementById('quickview-overlay').classList.remove('qv-hidden');
        showQuickCard(0);
      } catch (e) {
        showHint('Không tải được BĐS chia sẻ');
      }
    }

    function closeQuickView() {
      document.getElementById('quickview-overlay').classList.add('qv-hidden');
    }

    function prevQuick() {
      if (quickViewIdx > 0) showQuickCard(--quickViewIdx);
    }

    function nextQuick() {
      if (quickViewIdx < quickViewItems.length - 1) showQuickCard(++quickViewIdx);
    }

    function quickViewGoToMap() {
      const loc = quickViewItems[quickViewIdx];
      if (!loc) return;
      closeQuickView();
      map.flyTo([loc.lat, loc.lng], 17, { duration: 0.8 });
      setTimeout(() => { if (communityMarkers[loc.id]) communityMarkers[loc.id].openPopup(); }, 900);
    }

    // Swipe trái/phải trên mobile
    (function () {
      let startX = 0;
      const el = document.getElementById('quickview-overlay');
      el.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
      el.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 55) dx < 0 ? nextQuick() : prevQuick();
      });
    })();
