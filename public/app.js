// 🌳 情绪树洞 - 前端交互
// =========================

// ── 标签选择 ──
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('tag-option')) {
    document.querySelectorAll('.tag-option').forEach(t => t.classList.remove('selected'));
    e.target.classList.add('selected');
  }
});

// ── 字数统计 ──
document.addEventListener('input', function(e) {
  if (e.target.id === 'contentInput') {
    const count = e.target.value.length;
    document.getElementById('charCount').textContent = count;
    if (count > 2000) {
      e.target.value = e.target.value.substring(0, 2000);
      document.getElementById('charCount').textContent = 2000;
    }
  }
});

// ── 提交心事 ──
function submitPost() {
  const content = document.getElementById('contentInput');
  const tagEl = document.querySelector('.tag-option.selected');
  const tag = tagEl ? tagEl.dataset.tag : '💭 心事';
  const btn = document.getElementById('submitBtn');

  if (!content.value.trim()) {
    showToast('💌 写点什么再提交吧～');
    content.focus();
    return;
  }

  if (content.value.trim().length < 2) {
    showToast('💌 至少写 2 个字嘛～');
    content.focus();
    return;
  }

  btn.disabled = true;
  btn.textContent = '⏳ 正在安放...';

  fetch('/api/post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: content.value.trim(),
      tag: tag
    })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      showSuccess();
      content.value = '';
      document.getElementById('charCount').textContent = '0';
      // 重置标签
      document.querySelectorAll('.tag-option').forEach(t => t.classList.remove('selected'));
      document.querySelector('.tag-option[data-tag="💭 心事"]').classList.add('selected');
    } else {
      showToast(data.message || '提交失败，再试一次～');
    }
  })
  .catch(err => {
    showToast('网络好像有点问题，再试试～');
  })
  .finally(() => {
    btn.disabled = false;
    btn.textContent = '🌷 安放心事';
  });
}

// ── 加载心事墙 ──
function loadPosts() {
  const container = document.getElementById('postsContainer');
  if (!container) return;

  fetch('/api/posts')
    .then(r => r.json())
    .then(data => {
      if (data.success && data.posts.length > 0) {
        container.innerHTML = '';
        data.posts.forEach((post, index) => {
          const card = document.createElement('div');
          card.className = 'post-card';
          card.style.animationDelay = (index * 0.1) + 's';

          card.innerHTML = `
            <div class="post-header">
              <span class="post-tag">${post.tag || '💭 心事'}</span>
              <span class="post-time">${post.time}</span>
            </div>
            <div class="post-content">${escapeHtml(post.content)}</div>
            ${post.reply ? `
              <div class="post-reply">
                <div class="post-reply-label">💌 树洞回信</div>
                <div class="post-reply-content">${escapeHtml(post.reply)}</div>
                <div class="post-reply-time">${post.replyTime || ''}</div>
              </div>
            ` : ''}
          `;
          container.appendChild(card);
        });
      } else {
        container.innerHTML = `
          <div class="empty-state">
            <div class="icon">🌿</div>
            <p>还没有心事呢～<br>你是第一个来树洞的人吗？</p>
            <div class="btn-center" style="margin-top: 20px;">
              <a href="/post.html" class="btn btn-primary">📝 写下第一份心事</a>
            </div>
          </div>
        `;
      }
    })
    .catch(err => {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">😢</div>
          <p>加载失败了...<br>请稍后再来看看吧</p>
        </div>
      `;
    });
}

// ── 显示成功弹窗 ──
function showSuccess() {
  document.getElementById('successModal').classList.add('show');
}

function closeSuccess() {
  document.getElementById('successModal').classList.remove('show');
}

// ── Toast 提示 ──
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ── HTML 转义 ──
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ── 点击空白关闭弹窗 ──
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('success-modal')) {
    closeSuccess();
  }
  if (e.target.classList.contains('login-modal')) {
    closeLogin();
  }
});

// ══════════════════════════════════════
// 📱 登录系统
// ══════════════════════════════════════

let loginTimer = null;

// 显示登录弹窗
function showLogin() {
  document.getElementById('loginModal').classList.add('show');
  document.getElementById('phoneInput').value = '';
  document.getElementById('codeInput').value = '';
  document.getElementById('codeDisplay').style.display = 'none';
  document.getElementById('sendCodeBtn').disabled = false;
  document.getElementById('sendCodeBtn').textContent = '发送验证码';
  if (loginTimer) clearInterval(loginTimer);
}

// 关闭登录弹窗
function closeLogin() {
  document.getElementById('loginModal').classList.remove('show');
  if (loginTimer) clearInterval(loginTimer);
}

// 发送验证码
function sendCode() {
  const phone = document.getElementById('phoneInput').value.trim();
  if (!phone || !/^1\d{10}$/.test(phone)) {
    showToast('📱 请输入正确的11位手机号');
    return;
  }

  const btn = document.getElementById('sendCodeBtn');
  btn.disabled = true;

  fetch('/api/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      // 显示模拟验证码
      document.getElementById('showCode').textContent = data.code;
      document.getElementById('codeDisplay').style.display = 'block';
      showToast('✨ 验证码已生成，请看下方提示');
      
      // 60秒倒计时
      let count = 60;
      btn.textContent = count + 's';
      loginTimer = setInterval(() => {
        count--;
        if (count <= 0) {
          clearInterval(loginTimer);
          btn.textContent = '重新发送';
          btn.disabled = false;
        } else {
          btn.textContent = count + 's';
        }
      }, 1000);
    } else {
      showToast(data.message || '发送失败');
      btn.disabled = false;
    }
  })
  .catch(() => {
    showToast('网络有点问题');
    btn.disabled = false;
  });
}

// 提交登录
function submitLogin() {
  const phone = document.getElementById('phoneInput').value.trim();
  const code = document.getElementById('codeInput').value.trim();
  const btn = document.getElementById('loginSubmitBtn');

  if (!phone || !code) {
    showToast('请填写手机号和验证码');
    return;
  }

  btn.disabled = true;
  btn.textContent = '⏳ 登录中...';

  fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      // 保存登录状态（先不保存树洞名，去 /me.html 起名）
      localStorage.setItem('treehole_token', data.token);
      localStorage.setItem('treehole_phone', data.phone);
      // 跳转到起名/个人主页
      window.location.href = '/me.html';
    } else {
      showToast(data.message || '登录失败');
    }
  })
  .catch(() => {
    showToast('网络有点问题');
  })
  .finally(() => {
    btn.disabled = false;
    btn.textContent = '登录';
  });
}

// 退出登录
function logout() {
  localStorage.removeItem('treehole_token');
  localStorage.removeItem('treehole_phone');
  localStorage.removeItem('treehole_name');
  updateLoginUI(null);
  showToast('已退出登录 👋');
}

// 更新登录UI (手机版兼容 - 元素可能不存在)
function updateLoginUI(phone) {
  const loginBtn = document.getElementById('loginBtn');
  const userBtn = document.getElementById('userBtn');
  if (loginBtn && userBtn) {
    if (phone) {
      loginBtn.style.display = 'none';
      userBtn.style.display = 'inline-flex';
      userBtn.textContent = '👤 ' + phone;
      userBtn.title = '点击退出登录';
    } else {
      loginBtn.style.display = 'inline-flex';
      userBtn.style.display = 'none';
    }
  }
}
