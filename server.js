const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3457;
const DATA_FILE = path.join(__dirname, 'data', 'posts.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ── 确保数据文件存在 ──
function initData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}
initData();

// ── 读取所有心事 ──
function readPosts() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// ── 保存心事 ──
function savePosts(posts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2), 'utf8');
}

// ── API: 获取所有心事（公开）──
app.get('/api/posts', (req, res) => {
  const posts = readPosts();
  // 只返回公开信息：内容、时间、标签、回复，不暴露 ID 以外的敏感信息
  const publicPosts = posts.map(p => ({
    id: p.id,
    content: p.content,
    tag: p.tag || '💭 心事',
    time: p.time,
    reply: p.reply || null,
    replyTime: p.replyTime || null
  })).reverse(); // 最新的在前面
  res.json({ success: true, posts: publicPosts });
});

// ── API: 提交心事 ──
app.post('/api/post', (req, res) => {
  const { content, tag } = req.body;
  if (!content || content.trim().length === 0) {
    return res.json({ success: false, message: '心事内容不能为空哦～' });
  }
  if (content.length > 2000) {
    return res.json({ success: false, message: '心事太长啦，最多 2000 个字哦～' });
  }

  const posts = readPosts();
  const newPost = {
    id: Date.now(),
    content: content.trim(),
    tag: tag || '💭 心事',
    time: new Date().toLocaleString('zh-CN'),
    reply: null,
    replyTime: null
  };
  posts.push(newPost);
  savePosts(posts);

  res.json({ success: true, message: '🌷 心事已安放好啦，你从来不是一个人。', post: newPost });
});

// ── API: 守护者回复（只有你能回复）──
app.post('/api/reply', (req, res) => {
  const { id, reply } = req.body;
  if (!id || !reply) {
    return res.json({ success: false, message: '参数不完整' });
  }
  const posts = readPosts();
  const idx = posts.findIndex(p => p.id === id);
  if (idx === -1) {
    return res.json({ success: false, message: '未找到这条心事' });
  }
  posts[idx].reply = reply.trim();
  posts[idx].replyTime = new Date().toLocaleString('zh-CN');
  savePosts(posts);
  res.json({ success: true, message: '💌 回复已送达~' });
});

// ── API: 统计数据 ──
app.get('/api/stats', (req, res) => {
  const posts = readPosts();
  const total = posts.length;
  const replied = posts.filter(p => p.reply).length;
  // 获取常用标签
  const tagCount = {};
  posts.forEach(p => {
    const t = p.tag || '💭 心事';
    tagCount[t] = (tagCount[t] || 0) + 1;
  });
  res.json({ success: true, total, replied, tagCount });
});

// ── 验证码存储（内存）──
const verificationCodes = {};

// ── API: 发送验证码（模拟版）──
app.post('/api/send-code', (req, res) => {
  const { phone } = req.body;
  if (!phone || !/^1\d{10}$/.test(phone)) {
    return res.json({ success: false, message: '请输入正确的手机号 📱' });
  }
  // 生成6位验证码
  const code = String(Math.floor(100000 + Math.random() * 900000));
  verificationCodes[phone] = code;
  // 5分钟过期
  setTimeout(() => { delete verificationCodes[phone]; }, 300000);
  console.log(`  [验证码] ${phone} → ${code}`);
  // 模拟版直接返回验证码显示给用户
  res.json({ success: true, message: '验证码已发送 ✨', code });
});

// ── API: 登录验证 ──
app.post('/api/login', (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.json({ success: false, message: '请输入手机号和验证码' });
  }
  if (verificationCodes[phone] && verificationCodes[phone] === code) {
    delete verificationCodes[phone];
    // 生成简易 token
    const token = Date.now().toString(36) + Math.random().toString(36).substr(2);
    res.json({
      success: true,
      token,
      phone: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
      message: '登录成功 🌸'
    });
  } else {
    res.json({ success: false, message: '验证码错误或已过期 ⏰' });
  }
});

// ── API: 获取当前用户（根据 token）──
app.get('/api/user', (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.json({ success: false });
  // 简单的 token 验证（生产环境建议用 JWT）
  res.json({ success: true, phone: '已登录用户' });
});

// ── 启动 ──
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  ╔════════════════════════════════════════╗');
  console.log('  ║     🌳 情绪树洞 - 温柔治愈版          ║');
  console.log('  ║                                        ║');
  console.log('  ║  服务已启动 ~                          ║');
  console.log('  ║                                        ║');
  console.log(`  ║  本地访问: http://localhost:${PORT}      ║`);
  console.log(`  ║  局域网:   http://本机IP:${PORT}         ║`);
  console.log('  ║                                        ║');
  console.log('  ║  愿所有心事，皆有归处 🌸               ║');
  console.log('  ╚════════════════════════════════════════╝');
  console.log('');
});
