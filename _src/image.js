// ── Image upload helpers ──
    function fmtSize(bytes) {
      return bytes >= 1048576 ? (bytes / 1048576).toFixed(1) + ' MB' : (bytes / 1024).toFixed(0) + ' KB';
    }

    function setSlotStatus(el, type, msg) {
      el.textContent = msg;
      el.className = 'image-slot-status st-' + type;
    }

    async function compressImage(file, maxDim = 1200, quality = 0.75) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const objUrl = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(objUrl);
          let w = img.naturalWidth, h = img.naturalHeight;
          if (w > maxDim || h > maxDim) {
            if (w >= h) { h = Math.round(h * maxDim / w); w = maxDim; }
            else        { w = Math.round(w * maxDim / h); h = maxDim; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob(
            blob => blob ? resolve(blob) : reject(new Error('Không thể nén ảnh')),
            'image/jpeg', quality
          );
        };
        img.onerror = () => { URL.revokeObjectURL(objUrl); reject(new Error('Không đọc được file ảnh')); };
        img.src = objUrl;
      });
    }

    async function uploadImage(blob) {
      const IMGBB_KEY = '19d04259d60ec3a851f341e8050e0fd6';
      const b64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const form = new FormData();
      form.append('image', b64);
      const res  = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: form });
      if (!res.ok) throw new Error('imgBB ' + res.status);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'imgBB failed');
      return json.data.url;
    }

    // ── Multi-image slot system ──
    let imgSlotCounter = 0;

    function setSlotPreview(url, previewEl, thumbEl) {
      if (url) {
        thumbEl.src = url;
        thumbEl.onerror = () => { previewEl.style.display = 'none'; };
        thumbEl.onload  = () => { previewEl.style.display = 'block'; };
      } else {
        previewEl.style.display = 'none';
      }
    }

    function addImageSlot(url = '') {
      const container = document.getElementById('images-container');
      const div = document.createElement('div');
      div.className = 'image-slot';
      div.innerHTML = `
        <div class="image-slot-row">
          <input type="url" class="image-slot-url" placeholder="Dán link ảnh hoặc chọn file..." value="${esc(url)}" />
          <label class="upload-btn" title="Chọn ảnh từ máy">📁<input type="file" class="image-slot-file" accept="image/*" style="display:none" /></label>
          <button type="button" class="image-slot-remove" onclick="removeImageSlot(this)" title="Xóa ảnh này">✕</button>
        </div>
        <div class="image-slot-status"></div>
        <div class="image-slot-preview">
          <img class="image-slot-thumb" src="" alt="" crossorigin="anonymous" />
          <button type="button" class="image-slot-ocr" onclick="extractInfoFromSlot(this)">🔍 Trích xuất thông tin</button>
        </div>`;
      container.appendChild(div);

      const urlInput   = div.querySelector('.image-slot-url');
      const fileInput  = div.querySelector('.image-slot-file');
      const uploadLbl  = div.querySelector('.upload-btn');
      const statusEl   = div.querySelector('.image-slot-status');
      const previewEl  = div.querySelector('.image-slot-preview');
      const thumbEl    = div.querySelector('.image-slot-thumb');

      urlInput.addEventListener('input', () => setSlotPreview(urlInput.value.trim(), previewEl, thumbEl));
      if (url) setSlotPreview(url, previewEl, thumbEl);

      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';
        uploadLbl.classList.add('uploading');
        try {
          setSlotStatus(statusEl, 'loading', '⏳ Đang nén ảnh...');
          const compressed = await compressImage(file);
          const sizeLabel = `${fmtSize(file.size)} → ${fmtSize(compressed.size)}`;
          let imgUrl;
          try {
            setSlotStatus(statusEl, 'loading', `⏳ Đang tải lên (${fmtSize(compressed.size)})...`);
            imgUrl = await uploadImage(compressed);
            setSlotStatus(statusEl, 'success', `✅ ${sizeLabel} · imgBB`);
          } catch {
            setSlotStatus(statusEl, 'loading', '⚠️ Không kết nối được, đang lưu offline...');
            imgUrl = await blobToBase64(compressed);
            setSlotStatus(statusEl, 'success', `✅ ${sizeLabel} · offline`);
          }
          urlInput.value = imgUrl;
          setSlotPreview(imgUrl, previewEl, thumbEl);
        } catch (err) {
          setSlotStatus(statusEl, 'error', `❌ ${err.message}`);
        } finally {
          uploadLbl.classList.remove('uploading');
        }
      });

      return div;
    }

    function removeImageSlot(btn) {
      btn.closest('.image-slot').remove();
    }

    function getImagesFromForm() {
      return Array.from(document.querySelectorAll('#images-container .image-slot-url'))
        .map(el => el.value.trim()).filter(Boolean);
    }

    function setImagesInForm(images) {
      document.getElementById('images-container').innerHTML = '';
      const list = images && images.length ? images : [''];
      list.forEach(url => addImageSlot(url));
    }

    function closeModal() {
      document.getElementById('modal-overlay').classList.add('hidden');
      document.getElementById('images-container').innerHTML = '';
      pendingLatLng = null;
      pendingTextData = null;
      editingId = null;
    }

    async function saveLocation() {
      const name = document.getElementById('field-name').value.trim();
      if (!name) { document.getElementById('field-name').focus(); return; }
      const get = id => document.getElementById(id).value.trim();
      const imagesList = getImagesFromForm();
      const raw = {
        name,
        desc:      get('field-desc'),
        note:      get('field-note'),
        images:    imagesList,
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
        roadWidth: get('field-roadwidth'),
        legal:     get('field-legal'),
        interior:  get('field-interior'),
        phone:       get('field-phone'),
        status:      document.getElementById('field-status').value || 'Đang bán',
        updatedDate: get('field-updated-date') || new Date().toISOString().slice(0, 10),
        color:       selectedColor,
      };

      if (appMode === 'guest') {
        const fields = {};
        for (const [k, v] of Object.entries(raw)) {
          const empty = v === '' || v == null || (Array.isArray(v) && v.length === 0);
          if (!empty) fields[k] = v;
        }
        if (editingId !== null) {
          const idx = locations.findIndex(l => l.id === editingId);
          if (idx >= 0) {
            const updated = { ...locations[idx] };
            for (const k of Object.keys(raw)) {
              const v = raw[k];
              const empty = v === '' || v == null || (Array.isArray(v) && v.length === 0);
              if (empty) delete updated[k];
              else updated[k] = v;
            }
            locations[idx] = updated;
            if (leafletMarkers[editingId]) {
              leafletMarkers[editingId].setIcon(createIcon(updated.color, updated.name));
              leafletMarkers[editingId].setLatLng([updated.lat, updated.lng]);
              leafletMarkers[editingId].setPopupContent(makePopupHtml(updated));
            }
          }
        } else {
          const id = Date.now();
          const newLoc = { id, lat: pendingLatLng.lat, lng: pendingLatLng.lng, sortOrder: id, createdAt: id, ...fields };
          locations.push(newLoc);
          addMarker(newLoc);
          fetchArea(id, pendingLatLng.lat, pendingLatLng.lng);
        }
        guestPersist();
        renderSidebar();
        closeModal();
        return;
      }

      // User mode: Firestore
      const newIsPublic = document.getElementById('field-ispublic')?.checked ?? false;
      raw.isPublic = newIsPublic;
      const DEL = firebase.firestore.FieldValue.delete();
      const fields = {};
      for (const [k, v] of Object.entries(raw)) {
        if (k === 'isPublic') { fields[k] = v; continue; }
        const empty = v === '' || v == null || (Array.isArray(v) && v.length === 0);
        if (editingId !== null) fields[k] = empty ? DEL : v;
        else if (!empty) fields[k] = v;
      }

      if (editingId !== null) {
        const existingLoc = locations.find(l => l.id === editingId) || {};
        await userCol().doc(String(editingId)).update(fields);
        if (newIsPublic) {
          const pubData = { ...existingLoc };
          for (const [k, v] of Object.entries(raw)) {
            const empty = v === '' || v == null || (Array.isArray(v) && v.length === 0);
            if (k === 'isPublic') { pubData[k] = true; continue; }
            if (empty) delete pubData[k]; else pubData[k] = v;
          }
          pubData.ownerUid = currentUser.uid;
          pubData.ownerEmail = currentUser.email;
          await publicCol().doc(String(editingId)).set(pubData);
        } else if (existingLoc.isPublic) {
          await publicCol().doc(String(editingId)).delete().catch(() => {});
        }
      } else {
        const id = Date.now();
        const docData = { id, lat: pendingLatLng.lat, lng: pendingLatLng.lng, sortOrder: id, createdAt: id, ...fields };
        await userCol().doc(String(id)).set(docData);
        if (newIsPublic) {
          await publicCol().doc(String(id)).set({ ...docData, ownerUid: currentUser.uid, ownerEmail: currentUser.email });
        }
        fetchArea(id, pendingLatLng.lat, pendingLatLng.lng);
      }
      closeModal();
    }
