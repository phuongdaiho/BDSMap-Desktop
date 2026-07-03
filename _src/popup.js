// ── Popup content ──
    function makePopupHtml(loc, isCommunity = false) {
      const imgs = loc.images?.length ? loc.images : (loc.image ? [loc.image] : []);
      let image = '';
      if (imgs.length > 0) {
        const imgWrap = (src, cls='') =>
          `<div style="width:100%;background:#f5f5f5;border-radius:6px;display:flex;align-items:center;justify-content:center;overflow:hidden;margin-top:6px;min-height:40px">` +
          `<img ${cls} src="${esc(src)}" alt="" style="max-width:100%;max-height:200px;width:auto;height:auto;display:block;border-radius:4px" onerror="this.parentNode.style.display='none'" /></div>`;
        let inner = '';
        if (imgs.length === 1) {
          inner = imgWrap(imgs[0]);
        } else {
          const thumbs = imgs.map(u =>
            `<div style="flex-shrink:0;width:72px;height:72px;background:#f5f5f5;border-radius:6px;border:1px solid #ddd;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer" onclick="this.closest('.popup-img-wrap').querySelector('.popup-main-img').src='${esc(u)}'">` +
            `<img src="${esc(u)}" alt="" style="max-width:72px;max-height:72px;width:auto;height:auto;display:block;border-radius:4px" onerror="this.parentNode.style.display='none'" /></div>`
          ).join('');
          inner = `<div class="popup-img-wrap">` +
            `<div style="width:100%;background:#f5f5f5;border-radius:6px;display:flex;align-items:center;justify-content:center;overflow:hidden;min-height:40px">` +
            `<img class="popup-main-img" src="${esc(imgs[0])}" alt="" style="max-width:100%;max-height:200px;width:auto;height:auto;display:block;border-radius:4px" onerror="this.parentNode.style.display='none'" /></div>` +
            `<div style="display:flex;gap:5px;overflow-x:auto;padding:4px 0;margin-top:4px">${thumbs}</div></div>`;
        }
        const pid = 'pi' + loc.id;
        const lbl = imgs.length === 1 ? '1 ảnh' : imgs.length + ' ảnh';
        image = `<button onclick="var d=document.getElementById('${pid}'),s=d.style.display==='none';d.style.display=s?'block':'none';this.innerHTML=s?'▲ ${lbl}':'▼ ${lbl}'" style="margin-top:2px;background:#f1f3f4;border:1px solid #e0e0e0;border-radius:6px;padding:3px 10px;font-size:0.78rem;cursor:pointer;color:#555;width:100%;text-align:left">▼ ${lbl}</button>` +
          `<div id="${pid}" style="display:none">${inner}</div>`;
      }
      const desc = loc.desc ? `<div style="color:#555;font-size:0.82rem;margin-top:5px">${truncText(loc.desc, 60, loc.id+'d')}</div>` : '';
      const note = loc.note ? `<div style="color:#777;font-size:0.78rem;margin-top:5px;padding-top:5px;border-top:1px solid #eee">${truncText(loc.note, 60, loc.id+'n')}</div>` : '';
      const linkDisplay = loc.link && loc.link.length > 40 ? esc(loc.link.slice(0, 40)) + '…' : esc(loc.link || '');
      const link = loc.link ? `<div style="margin-top:5px"><a href="${esc(loc.link)}" target="_blank" rel="noopener" style="color:#1a73e8;font-size:0.78rem;word-break:break-all">🔗 ${linkDisplay}</a></div>` : '';
      const phone = loc.phone ? `<div style="margin-top:5px;display:flex;align-items:center;gap:6px"><span style="color:#333;font-size:0.82rem">📞 ${esc(loc.phone)}</span><a href="tel:${esc(loc.phone)}" style="background:#43a047;color:white;border-radius:6px;padding:2px 9px;font-size:0.75rem;text-decoration:none">Gọi</a></div>` : '';
      const coords = `<div style="color:#aaa;font-size:0.72rem;margin-top:4px">📍 ${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}</div>`;
      const fmtDate = d => { if (!d) return ''; const [y,m,dd] = d.split('-'); return `${dd}/${m}/${y}`; };
      const statusColor = loc.status === 'Đã bán' ? '#d93025' : '#43a047';
      const statusBadge = loc.status ? `<span style="display:inline-block;background:${statusColor};color:white;border-radius:4px;padding:1px 8px;font-size:0.7rem;font-weight:600;margin-top:4px">${esc(loc.status)}</span>` : '';
      const updatedDate = loc.updatedDate ? `<div style="color:#aaa;font-size:0.7rem;margin-top:2px">Cập nhật: ${fmtDate(loc.updatedDate)}</div>` : '';
      const viewsBadge = loc.views ? `<div style="color:#aaa;font-size:0.7rem;margin-top:2px">👁 Đã xem: ${loc.views} lần</div>` : '';
      const ownerBadge = isCommunity
        ? `<div style="font-size:0.72rem;color:#2e7d32;margin-top:3px">🌍 ${esc((loc.ownerEmail || '').split('@')[0])}</div>`
        : '';

      const row = (label, val, unit='') => val
        ? `<div style="display:flex;gap:4px;font-size:0.78rem;flex:1;min-width:0"><span style="color:#888;white-space:nowrap">${label}:</span><b style="color:#333">${esc(val)}${unit ? ' ' + unit : ''}</b></div>`
        : '';
      const row2 = (l1,v1,u1, l2,v2,u2) => (v1||v2)
        ? `<div style="display:flex;gap:8px;font-size:0.78rem">${row(l1,v1,u1)}${row(l2,v2,u2)}</div>`
        : '';
      const landRows = [
        row2('Hướng', loc.direction, '', 'Diện tích', loc.acreage, 'm²'),
        row2('Ngang',  loc.width, 'm',   'Dài',       loc.length,  'm'),
        row2('Lộ giới', loc.roadWidth, '', 'Pháp lý', loc.legal, ''),
        row('Giá trị', loc.price),
      ].filter(Boolean).join('');
      const assetRows = [
        row2('DT xây dựng', loc.buildArea, 'm²', 'DT sàn', loc.floorArea, 'm²'),
        row('Kết cấu',  loc.structure),
        row('Công năng',loc.usage),
        row('Nội thất', loc.interior),
      ].filter(Boolean).join('');

      const landSection = landRows ? `
        <div style="margin-top:7px;padding-top:5px;border-top:1px solid #eee">
          <div style="font-size:0.68rem;font-weight:700;color:#1a73e8;margin-bottom:4px">THÔNG TIN ĐẤT</div>
          ${landRows}
        </div>` : '';
      const assetSection = assetRows ? `
        <div style="margin-top:7px;padding-top:5px;border-top:1px solid #eee">
          <div style="font-size:0.68rem;font-weight:700;color:#1a73e8;margin-bottom:4px">TÀI SẢN TRÊN ĐẤT</div>
          ${assetRows}
        </div>` : '';

      const svUrl = `https://www.google.com/maps/@${loc.lat},${loc.lng},3a,75y,90t/data=!3m6!1e1`;
      return `<div style="font-family:sans-serif;min-width:200px;max-width:260px;padding:2px 0">
        ${image}
        <strong style="font-size:0.92rem;color:#202124;display:block;margin-top:6px">${esc(loc.name)}</strong>
        ${statusBadge}
        ${desc}${note}${link}${phone}${coords}${updatedDate}${viewsBadge}${ownerBadge}${landSection}${assetSection}
        <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
          ${(!isCommunity || currentUser?.uid === loc.ownerUid) ? `<button onclick="editLocation(${loc.id})" title="Chỉnh sửa" style="border:1px solid #1a73e8;background:#e8f0fe;color:#1a73e8;border-radius:6px;padding:3px 10px;font-size:0.78rem;cursor:pointer">✏️</button>
          <button onclick="deleteLocation(${loc.id})" title="Xóa địa điểm" style="border:1px solid #d93025;background:#fce8e6;color:#d93025;border-radius:6px;padding:3px 10px;font-size:0.78rem;cursor:pointer">❌</button>` : ''}
          ${(isCommunity || loc.isPublic) ? `<button onclick="shareLocation('${loc.id}','${esc(loc.name)}')" title="Chia sẻ địa điểm" style="border:1px solid #f57c00;background:#fff3e0;color:#e65100;border-radius:6px;padding:3px 10px;font-size:0.78rem;cursor:pointer">↗️</button>` : ''}
          <a href="${svUrl}" target="_blank" rel="noopener" title="Xem Street View" style="border:1px solid #43a047;background:#e8f5e9;color:#2e7d32;border-radius:6px;padding:3px 10px;font-size:0.78rem;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center">🚶</a>
        </div>
      </div>`;
    }

    function esc(str) {
      return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
