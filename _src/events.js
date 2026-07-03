// ── Color picker ──
    document.querySelectorAll('.color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        selectedColor = dot.dataset.color;
        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
        dot.classList.add('selected');
      });
    });

    // Đóng modal khi click overlay
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('modal-overlay')) closeModal();
    });

    // Enter để lưu
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    // ── Sidebar toggle ──
    function toggleSidebar() {
      sidebarVisible = !sidebarVisible;
      document.getElementById('sidebar').classList.toggle('visible', sidebarVisible);
      document.getElementById('sidebar-backdrop').classList.toggle('visible', sidebarVisible);
    }

    // ── Sidebar thêm địa điểm ──
    function showHint(text) {
      const hint = document.getElementById('map-hint');
      hint.textContent = text;
      hint.style.opacity = '1';
      setTimeout(() => { hint.style.opacity = '0'; }, 3000);
    }

    function sidebarAddManual() {
      if (sidebarVisible) toggleSidebar();
      showHint('Click vào bản đồ để thêm địa điểm');
    }

    function toggleTextInput() {
      const panel = document.getElementById('text-input-panel');
      panel.classList.toggle('open');
      if (panel.classList.contains('open')) {
        document.getElementById('text-paste-area').focus();
      }
    }

    function analyzeAndPrepare() {
      const text = document.getElementById('text-paste-area').value.trim();
      if (!text) return;
      const result = parseRealEstateText(text);
      const hasData = Object.keys(result).some(k => result[k]);
      if (!hasData) {
        showHint('Không tìm thấy thông tin BĐS trong đoạn text');
        return;
      }
      pendingTextData = result;
      document.getElementById('text-paste-area').value = '';
      document.getElementById('text-input-panel').classList.remove('open');
      if (sidebarVisible) toggleSidebar();
      showHint('Đã phân tích xong — click vào bản đồ để đặt vị trí');
    }
