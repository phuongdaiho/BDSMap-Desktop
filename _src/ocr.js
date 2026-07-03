// ── OCR / Trích xuất thông tin từ ảnh ──
    let ocrWorker = null;

    async function ensureOCR() {
      if (!window.Tesseract) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://unpkg.com/tesseract.js@5/dist/tesseract.min.js';
          s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      if (!ocrWorker) {
        ocrWorker = await Tesseract.createWorker(['vie', 'eng'], 1);
      }
      return ocrWorker;
    }

    async function extractInfoFromSlot(btn) {
      const slot = btn.closest('.image-slot');
      const imgUrl = slot.querySelector('.image-slot-url').value.trim();
      if (!imgUrl) return;
      const statusEl = slot.querySelector('.image-slot-status');

      function showOcrStatus(type, msg) {
        const typeMap = { info: 'loading', success: 'success', warn: 'loading', error: 'error' };
        setSlotStatus(statusEl, typeMap[type] || 'loading', msg);
      }

      btn.disabled = true; btn.textContent = '⏳...';
      try {
        showOcrStatus('info', '⏳ Đang tải Tesseract (lần đầu ~1MB)...');
        const worker = await ensureOCR();
        showOcrStatus('info', '⏳ Đang nhận diện chữ trong ảnh...');
        const { data: { text } } = await worker.recognize(imgUrl);
        if (!text.trim()) { showOcrStatus('warn', '⚠️ Không nhận diện được chữ trong ảnh.'); return; }
        const result = parseRealEstateText(text);
        applyExtractedInfo(result, showOcrStatus);
      } catch (err) {
        showOcrStatus('error', `❌ Lỗi OCR: ${err.message || err}`);
      } finally {
        btn.disabled = false; btn.textContent = '🔍 Trích xuất thông tin';
      }
    }

    function parsePrice(t) {
      // Nhận cả "tỷ/tỉ" có dấu lẫn "ty" (OCR bỏ dấu) — yêu cầu có chữ số phía trước
      const TY   = '(?:tỷ|tỉ|ty\\b)';
      const TIEU = '(?:triệu|tr\\b)';
      const NUM  = '[\\d.,]+';

      function fmtTy(n) {
        // Normalize: bỏ trailing zeros (4.50 → 4.5, 4.00 → 4)
        return parseFloat(n.toFixed(4)).toString() + ' tỷ';
      }
      function n(s) { return parseFloat(s.replace(',', '.')); }

      // "X tỷ Y triệu" → X + Y/1000 tỷ  (vd: "4 tỷ 500 triệu" → 4.5 tỷ, "7 ty 500 tr" → 7.5 tỷ)
      const m1 = t.match(new RegExp(`(${NUM})\\s*${TY}\\s+(${NUM})\\s*${TIEU}`, 'i'));
      if (m1) return fmtTy(n(m1[1]) + n(m1[2]) / 1000);

      // "X tỷ rưỡi" → X.5 tỷ
      const m2 = t.match(new RegExp(`(${NUM})\\s*${TY}\\s+rưỡi`, 'i'));
      if (m2) return fmtTy(n(m2[1]) + 0.5);

      // "X tỷ Y" shorthand (1–3 chữ số, không kèm đơn vị): "7 ty 500" → 7.5, "4 tỷ 5" → 4.5
      const m3 = t.match(new RegExp(`(${NUM})\\s*${TY}\\s+(\\d{1,3})(?!\\d)`, 'i'));
      if (m3) {
        const ty = n(m3[1]);
        const d = parseInt(m3[2]);
        const tr = m3[2].length === 1 ? d * 100 : d;
        return fmtTy(ty + tr / 1000);
      }

      // "4.5 tỷ" hoặc "4.500 tỷ" (dấu chấm = thập phân) → normalize qua parseFloat
      const m4 = t.match(new RegExp(`gi[aá][:\\s]*(${NUM})\\s*${TY}`, 'i'))
               || t.match(new RegExp(`(${NUM})\\s*${TY}`, 'i'));
      if (m4) return fmtTy(n(m4[1]));

      // "X triệu" (loại trừ "triệu/m²")
      const m5 = t.match(new RegExp(`gi[aá][:\\s]*(${NUM})\\s*${TIEU}`, 'i'))
               || t.match(new RegExp(`(${NUM})\\s*${TIEU}(?!\\s*\\/?\\s*m)`, 'i'));
      if (m5) return n(m5[1]) + ' triệu';

      return null;
    }

    function parseRealEstateText(text) {
      const t = text.replace(/\n/g, ' ');
      const result = {};

      // Hướng
      const dirM = t.match(/h[uư][ớo]ng\s*(đông\s*bắc|đông\s*nam|tây\s*bắc|tây\s*nam|đông|tây|nam|bắc)/i);
      if (dirM) {
        const map = { 'đông bắc':'Đông Bắc','đông nam':'Đông Nam','tây bắc':'Tây Bắc','tây nam':'Tây Nam','đông':'Đông','tây':'Tây','nam':'Nam','bắc':'Bắc' };
        result.direction = map[dirM[1].replace(/\s+/,' ').toLowerCase().trim()];
      }

      // Diện tích
      const aM = t.match(/(?:diện\s*tích|dt|s)[:\s]*([\d.,]+)\s*m[²2]/i);
      if (aM) result.acreage = aM[1].replace(',','.');

      // Ngang x Dài pattern "4x15m" hoặc "4 x 15 m"
      const wxlM = t.match(/([\d.,]+)\s*[x×*]\s*([\d.,]+)\s*m/i);
      if (wxlM) {
        const w = parseFloat(wxlM[1].replace(',','.')), l = parseFloat(wxlM[2].replace(',','.'));
        if (w > 0 && l > 0 && w < l) {
          if (!result.acreage) result.acreage = (w * l).toFixed(1);
          result.width = String(w); result.length = String(l);
        }
      }
      // Ngang tường minh
      const wM = t.match(/(?:ngang|rộng|chiều\s*ngang)[:\s]*([\d.,]+)/i);
      if (wM) result.width = wM[1].replace(',','.');
      const lM = t.match(/(?:dài|sâu|chiều\s*dài)[:\s]*([\d.,]+)/i);
      if (lM) result.length = lM[1].replace(',','.');

      // Giá
      result.price = parsePrice(t);

      // Kết cấu
      const floorM = t.match(/(\d+)\s*t[aầ]ng/i);
      const btctM  = t.match(/(btct|bê\s*tông\s*cốt\s*thép)/i);
      if (floorM) result.structure = floorM[1] + ' tầng' + (btctM ? ' BTCT' : '');
      else if (/c[aấ]p\s*4/i.test(t)) result.structure = 'Nhà cấp 4';
      else if (/khung\s*thép/i.test(t)) result.structure = 'Khung thép';
      else if (/nhà\s*gỗ/i.test(t)) result.structure = 'Nhà gỗ';

      // DT xây dựng, DT sàn
      const baM = t.match(/(?:dt\s*xây|xây\s*dựng|dtxd)[:\s]*([\d.,]+)\s*m[²2]?/i);
      if (baM) result.buildArea = baM[1].replace(',','.');
      const faM = t.match(/(?:dt\s*sàn|diện\s*tích\s*sàn)[:\s]*([\d.,]+)\s*m[²2]?/i);
      if (faM) result.floorArea = faM[1].replace(',','.');

      // Công năng
      if (/mặt\s*tiền|kinh\s*doanh|thương\s*mại/i.test(t)) result.usage = 'Thương mại';
      else if (/nhà\s*ở/i.test(t)) result.usage = 'Nhà ở';
      else if (/đất\s*nền/i.test(t)) result.usage = 'Đất nền';
      else if (/đất\s*nông\s*nghiệp/i.test(t)) result.usage = 'Đất nông nghiệp';

      // Lộ giới
      const rwM = t.match(/(?:lộ\s*giới|đường\s*rộng)[:\s]*([\d.,]+)\s*m/i);
      if (rwM) result.roadWidth = rwM[1].replace(',','.') + 'm';

      // Pháp lý
      if (/sổ\s*đỏ|sổ\s*hồng/i.test(t)) result.legal = 'Sổ đỏ/Sổ hồng';
      else if (/viết\s*tay/i.test(t)) result.legal = 'Giấy tờ viết tay';
      else if (/đóng\s*thuế|nộp\s*thuế/i.test(t)) result.legal = 'Có đóng thuế phường';

      // Nội thất
      if (/nội\s*thất\s*đầy\s*đủ|đầy\s*đủ\s*nội\s*thất/i.test(t)) result.interior = 'Đầy đủ';
      else if (/để\s*lại.*nội\s*thất/i.test(t)) result.interior = 'Để lại toàn bộ nội thất';
      else if (/không\s*nội\s*thất|nội\s*thất.*không/i.test(t)) result.interior = 'Không';

      // Số điện thoại (mobile VN: 0[3-9]xxxxxxxx hoặc +84...)
      const ph1 = t.match(/(?<!\d)0[3-9]\d\d[\s.-]?\d{3}[\s.-]?\d{3}(?!\d)/);
      const ph2 = t.match(/(?<!\d)\+84[\s.-]?[3-9]\d\d[\s.-]?\d{3}[\s.-]?\d{3}(?!\d)/);
      const phM = ph1 || ph2;
      if (phM) {
        let p = phM[0].replace(/[\s.-]/g, '');
        if (p.startsWith('+84')) p = '0' + p.slice(3);
        result.phone = p;
      }

      return result;
    }

    function applyExtractedInfo(result, showStatus) {
      const map = [
        ['field-acreage',   result.acreage,   'Diện tích'],
        ['field-width',     result.width,     'Ngang'],
        ['field-length',    result.length,    'Dài'],
        ['field-price',     result.price,     'Giá'],
        ['field-structure', result.structure, 'Kết cấu'],
        ['field-buildarea', result.buildArea, 'DT xây dựng'],
        ['field-floorarea', result.floorArea, 'DT sàn'],
        ['field-usage',     result.usage,     'Công năng'],
        ['field-roadwidth', result.roadWidth, 'Lộ giới'],
        ['field-legal',     result.legal,     'Pháp lý'],
        ['field-interior',  result.interior,  'Nội thất'],
        ['field-phone',     result.phone,     'Điện thoại'],
      ];
      const dirEl = document.getElementById('field-direction');
      const applied = [];
      if (result.direction && !dirEl.value) { dirEl.value = result.direction; applied.push('Hướng: ' + result.direction); }
      for (const [id, val, label] of map) {
        if (!val) continue;
        const el = document.getElementById(id);
        if (!el.value.trim()) {
          el.value = val;
          applied.push(label + ': ' + val);
          if (id === 'field-phone') {
            const btn = document.getElementById('call-btn-modal');
            btn.href = 'tel:' + val; btn.style.display = 'inline-block';
          }
        }
      }
      if (applied.length === 0) showStatus('warn', '⚠️ Không tìm thấy thông tin BĐS. Ảnh cần có chữ rõ nét (giá, diện tích, hướng...).');
      else showStatus('success', '✅ Đã điền: ' + applied.join(' · '));
    }

    // Toggle label khi thay đổi trạng thái public
    document.getElementById('field-ispublic').addEventListener('change', (e) => {
      document.getElementById('public-toggle-label').textContent = e.target.checked ? '🌍 Công khai' : 'Riêng tư';
    });
