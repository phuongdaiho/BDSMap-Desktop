// ── Modal ──
    function openModal(title, data = {}) {
      selectedColor = data.color || '#e53935';
      document.getElementById('modal-title').textContent = title;
      const set = (id, val) => { document.getElementById(id).value = val || ''; };
      set('field-name',      data.name);
      set('field-desc',      data.desc);
      set('field-note',      data.note);
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
      set('field-roadwidth', data.roadWidth);
      set('field-legal',     data.legal);
      set('field-interior',  data.interior);
      set('field-phone',     data.phone);
      document.getElementById('field-status').value = data.status || 'Đang bán';
      document.getElementById('field-updated-date').value = data.updatedDate || new Date().toISOString().slice(0, 10);
      const phoneBtn = document.getElementById('call-btn-modal');
      if (data.phone) { phoneBtn.href = 'tel:' + data.phone; phoneBtn.style.display = 'inline-block'; }
      else phoneBtn.style.display = 'none';
      document.getElementById('modal-lat').value = parseFloat(data.lat || 0).toFixed(6);
      document.getElementById('modal-lng').value = parseFloat(data.lng || 0).toFixed(6);
      document.querySelectorAll('.color-dot').forEach(d => {
        d.classList.toggle('selected', d.dataset.color === selectedColor);
      });
      const imgs = data.images?.length ? data.images : (data.image ? [data.image] : []);
      setImagesInForm(imgs);
      const pubGroup = document.getElementById('public-share-group');
      const pubCheck = document.getElementById('field-ispublic');
      if (appMode === 'user') {
        pubGroup.style.display = '';
        pubCheck.checked = data.isPublic ?? false;
        document.getElementById('public-toggle-label').textContent = pubCheck.checked ? '🌍 Công khai' : 'Riêng tư';
      } else {
        pubGroup.style.display = 'none';
        pubCheck.checked = false;
      }
      document.getElementById('modal-overlay').classList.remove('hidden');
      setTimeout(() => document.getElementById('field-name').focus(), 50);
    }
