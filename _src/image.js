function fmtSize(bytes) {
  return bytes >= 1048576 ? (bytes / 1048576).toFixed(1) + ' MB' : (bytes / 1024).toFixed(0) + ' KB';
}

function setUploadStatus(type, msg) {
  const el = document.getElementById('upload-status');
  el.className = 'st-' + type;
  el.style.display = 'block';
  el.textContent = msg;
}

function clearUploadStatus() {
  const el = document.getElementById('upload-status');
  el.style.display = 'none';
  el.className = '';
  el.textContent = '';
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
  const form = new FormData();
  form.append('file', blob, 'image.jpg');
  const res = await fetch('https://telegra.ph/upload', { method: 'POST', body: form });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  if (!Array.isArray(data) || !data[0]?.src) throw new Error('Phản hồi không hợp lệ');
  return 'https://telegra.ph' + data[0].src;
}

function setImagePreview(url) {
  const preview = document.getElementById('image-preview');
  const img = document.getElementById('preview-img');
  if (url) {
    img.src = url;
    img.onerror = () => { preview.style.display = 'none'; };
    img.onload = () => { preview.style.display = 'block'; };
  } else {
    preview.style.display = 'none';
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function clearImage() {
  document.getElementById('field-image').value = '';
  setImagePreview('');
  clearUploadStatus();
}

document.getElementById('field-image').addEventListener('input', (e) => {
  setImagePreview(e.target.value.trim());
});

document.getElementById('field-image-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  e.target.value = '';
  const btn = document.getElementById('upload-btn-label');
  btn.classList.add('uploading');
  try {
    setUploadStatus('loading', '⏳ Đang nén ảnh...');
    const compressed = await compressImage(file);
    const saved = ((1 - compressed.size / file.size) * 100).toFixed(0);
    const sizeLabel = `${fmtSize(file.size)} → ${fmtSize(compressed.size)} (tiết kiệm ${saved}%)`;

    let url;
    try {
      setUploadStatus('loading', `⏳ Đang tải lên (${fmtSize(compressed.size)})...`);
      url = await uploadImage(compressed);
      setUploadStatus('success', `✅ ${sizeLabel} · telegra.ph`);
    } catch {
      setUploadStatus('loading', '⚠️ Không kết nối được, đang lưu trực tiếp vào file...');
      url = await blobToBase64(compressed);
      setUploadStatus('success', `✅ ${sizeLabel} · lưu trong XML (offline)`);
    }

    document.getElementById('field-image').value = url;
    setImagePreview(url);
  } catch (err) {
    setUploadStatus('error', `❌ ${err.message}`);
  } finally {
    btn.classList.remove('uploading');
  }
});
