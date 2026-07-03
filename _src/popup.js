function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function makePopupHtml(loc) {
  const image = loc.image ? `<img src="${esc(loc.image)}" alt="" style="width:100%;max-height:130px;object-fit:cover;border-radius:6px;margin-top:6px;display:block" onerror="this.style.display='none'" />` : '';
  const desc  = loc.desc  ? `<div style="color:#555;font-size:0.82rem;margin-top:5px">${esc(loc.desc)}</div>` : '';
  const note  = loc.note  ? `<div style="color:#777;font-size:0.78rem;margin-top:5px;padding-top:5px;border-top:1px solid #eee">${esc(loc.note)}</div>` : '';
  const link  = loc.link  ? `<div style="margin-top:5px"><a href="${esc(loc.link)}" target="_blank" rel="noopener" style="color:#1a73e8;font-size:0.78rem;word-break:break-all">🔗 ${esc(loc.link)}</a></div>` : '';
  const phone = loc.phone ? `<div style="margin-top:4px;font-size:0.78rem;color:#2e7d32;font-weight:600">📞 ${esc(loc.phone)}</div>` : '';
  const coords = `<div style="color:#aaa;font-size:0.72rem;margin-top:4px">📍 ${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}</div>`;

  const row = (label, val, unit='') => val
    ? `<div style="display:flex;gap:4px;font-size:0.78rem"><span style="color:#888;min-width:90px">${label}:</span><b style="color:#333">${esc(val)}${unit ? ' ' + unit : ''}</b></div>`
    : '';
  const landRows = [
    row('Hướng',      loc.direction),
    row('Diện tích',  loc.acreage, 'm²'),
    row('Chiều ngang',loc.width,   'm'),
    row('Chiều dài',  loc.length,  'm'),
    row('Giá trị',    loc.price),
  ].filter(Boolean).join('');
  const assetRows = [
    row('DT xây dựng', loc.buildArea, 'm²'),
    row('DT sàn',      loc.floorArea, 'm²'),
    row('Kết cấu',     loc.structure),
    row('Công năng',   loc.usage),
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
    <strong style="font-size:0.92rem;color:#202124;display:block;margin-top:${loc.image ? '6px' : '0'}">${esc(loc.name)}</strong>
    ${desc}${phone}${note}${link}${coords}${landSection}${assetSection}
    <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
      <button onclick="editLocation(${loc.id})" style="border:1px solid #1a73e8;background:#e8f0fe;color:#1a73e8;border-radius:6px;padding:3px 10px;font-size:0.78rem;cursor:pointer">Sửa</button>
      <button onclick="deleteLocation(${loc.id})" style="border:1px solid #d93025;background:#fce8e6;color:#d93025;border-radius:6px;padding:3px 10px;font-size:0.78rem;cursor:pointer">Xóa</button>
      <a href="${svUrl}" target="_blank" rel="noopener" style="border:1px solid #43a047;background:#e8f5e9;color:#2e7d32;border-radius:6px;padding:3px 10px;font-size:0.78rem;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:3px">🚶 Street View</a>
    </div>
  </div>`;
}
