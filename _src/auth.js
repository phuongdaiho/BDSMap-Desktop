// ── Auth UI ──

    let authTabMode = 'login'; // 'login' | 'register'

    function openAuthModal() {
      document.getElementById('auth-error').classList.remove('show');
      document.getElementById('auth-success').classList.remove('show');
      document.getElementById('auth-email').value = '';
      document.getElementById('auth-password').value = '';
      switchAuthTab('login');
      document.getElementById('auth-subtitle').textContent = 'Đăng nhập để đồng bộ dữ liệu đa thiết bị';
      document.getElementById('auth-submit-btn').onclick = authSubmit;
      document.getElementById('auth-overlay').classList.remove('hidden');
    }

    function closeAuthModal() {
      document.getElementById('auth-overlay').classList.add('hidden');
    }

    function switchAuthTab(tab) {
      authTabMode = tab;
      document.getElementById('tab-login').classList.toggle('active', tab === 'login');
      document.getElementById('tab-register').classList.toggle('active', tab === 'register');
      document.getElementById('auth-submit-btn').textContent = tab === 'login' ? 'Đăng nhập' : 'Đăng ký';
      document.getElementById('auth-error').classList.remove('show');
      document.getElementById('auth-success').classList.remove('show');
      document.getElementById('auth-forgot-wrap').style.display = tab === 'login' ? '' : 'none';
    }

    async function forgotPassword() {
      const email = document.getElementById('auth-email').value.trim();
      const errEl = document.getElementById('auth-error');
      const sucEl = document.getElementById('auth-success');
      errEl.classList.remove('show');
      sucEl.classList.remove('show');
      if (!email) { showAuthError('Vui lòng nhập email trước.'); return; }
      try {
        await auth.sendPasswordResetEmail(email);
        sucEl.textContent = `Email đặt lại mật khẩu đã gửi đến ${email}. Kiểm tra hộp thư (kể cả Spam).`;
        sucEl.classList.add('show');
      } catch (err) {
        const msg = {
          'auth/user-not-found': 'Email chưa được đăng ký.',
          'auth/invalid-email':  'Email không hợp lệ.',
        }[err.code] || err.message;
        showAuthError(msg);
      }
    }

    async function authSubmit() {
      const email    = document.getElementById('auth-email').value.trim();
      const password = document.getElementById('auth-password').value;
      const errEl    = document.getElementById('auth-error');
      const btn      = document.getElementById('auth-submit-btn');
      if (!email || !password) { showAuthError('Vui lòng nhập email và mật khẩu.'); return; }

      btn.disabled = true;
      btn.textContent = '⏳ Đang xử lý...';
      errEl.classList.remove('show');
      try {
        if (authTabMode === 'login') {
          await auth.signInWithEmailAndPassword(email, password);
        } else {
          await auth.createUserWithEmailAndPassword(email, password);
        }
        closeAuthModal();
      } catch (err) {
        const msg = {
          'auth/user-not-found':    'Email chưa được đăng ký.',
          'auth/wrong-password':    'Sai mật khẩu.',
          'auth/invalid-email':     'Email không hợp lệ.',
          'auth/email-already-in-use': 'Email đã được sử dụng. Hãy đăng nhập.',
          'auth/weak-password':     'Mật khẩu quá yếu (ít nhất 6 ký tự).',
          'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
        }[err.code] || err.message;
        showAuthError(msg);
      } finally {
        btn.disabled = false;
        btn.textContent = authTabMode === 'login' ? 'Đăng nhập' : 'Đăng ký';
      }
    }

    function showAuthError(msg) {
      const el = document.getElementById('auth-error');
      el.textContent = msg;
      el.classList.add('show');
    }

    async function authLogout() {
      if (!confirm('Đăng xuất khỏi tài khoản?')) return;
      closeAuthModal();
      await auth.signOut();
    }

    function continueAsGuest() {
      localStorage.setItem(GUEST_MODE_KEY, 'guest');
      closeAuthModal();
      activateGuestMode();
    }

    function updateModeBadge() {
      const dot         = document.getElementById('mode-dot');
      const userLabel   = document.getElementById('sidebar-user-label');
      const headerLabel = document.getElementById('header-user-label');
      const authBtn     = document.getElementById('sidebar-auth-btn');
      if (appMode === 'user' && currentUser) {
        dot.className = 'mode-dot user';
        const name = currentUser.email.split('@')[0];
        userLabel.textContent = '✉ ' + (name.length > 20 ? name.slice(0, 20) + '…' : name);
        if (headerLabel) headerLabel.textContent = name.length > 12 ? name.slice(0, 12) + '…' : name;
        authBtn.textContent = 'Đăng xuất';
        authBtn.className = 'logout';
        authBtn.onclick = authLogout;
      } else {
        dot.className = 'mode-dot guest';
        userLabel.textContent = '👤 Khách';
        if (headerLabel) headerLabel.textContent = 'Của tôi';
        authBtn.textContent = 'Đăng nhập';
        authBtn.className = '';
        authBtn.onclick = openAuthModal;
      }
    }

    function activateGuestMode() {
      appMode = 'guest';
      currentUser = null;
      if (viewportUnsub) { viewportUnsub(); viewportUnsub = null; }
      updateModeBadge();
      loadGuestData();
      loadCommunityByViewport(true);
      initLocationWatch();
      if (pendingShareId) { const sid = pendingShareId; pendingShareId = null; setTimeout(() => handleShareLink(sid), 1200); }
    }

    async function offerGuestMigration() {
      const guestData = JSON.parse(localStorage.getItem(GUEST_KEY) || '[]');
      if (!guestData.length) return;
      if (!confirm(`Bạn có ${guestData.length} địa điểm từ chế độ Khách.\nChuyển lên tài khoản "${currentUser.email}" không?`)) {
        localStorage.removeItem(GUEST_KEY);
        return;
      }
      try {
        const col = userCol();
        const batch = db.batch();
        guestData.forEach(loc => batch.set(col.doc(String(loc.id)), loc));
        await batch.commit();
        localStorage.removeItem(GUEST_KEY);
      } catch (err) {
        console.error('Migration lỗi:', err);
      }
    }

    // ── Firebase Auth state listener ──
    auth.onAuthStateChanged(async user => {
      if (user) {
        currentUser = user;
        appMode = 'user';
        localStorage.removeItem(GUEST_MODE_KEY);
        updateModeBadge();
        await offerGuestMigration();
        startFirestoreSync();
        if (pendingShareId) { const sid = pendingShareId; pendingShareId = null; setTimeout(() => handleShareLink(sid), 1200); }
      } else {
        currentUser = null;
        if (localStorage.getItem(GUEST_MODE_KEY) === 'guest') {
          activateGuestMode();
        } else {
          // Chưa có lựa chọn → hiện màn hình auth
          appMode = 'loading';
          updateModeBadge();
          openAuthModal();
        }
      }
    });

    // Đóng auth modal khi click ra ngoài
    document.getElementById('auth-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('auth-overlay') && appMode !== 'loading') {
        closeAuthModal();
      }
    });
