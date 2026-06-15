// 🌳 情绪树洞 - Vercel Serverless 入口
// =========================================
const express = require('express');
const path = require('path');
const fs = require('fs');
const serverless = require('serverless-http');

const app = express();

// ── 数据文件路径 ──
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'posts.json');

// ── 确保数据文件存在 ──
function initData() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
    }
  } catch (e) {
    // Vercel 环境可能无法写入文件系统，使用内存存储
  }
}
initData();

// ── 内存存储（Vercel Serverless 环境使用）──
let memoryPosts = [];
let memoryInitialized = false;

// ── 读取所有心事 ──
function readPosts() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    // 文件读取失败时使用内存存储
    if (!memoryInitialized) {
      memoryPosts = [];
      memoryInitialized = true;
    }
    return memoryPosts;
  }
}

// ── 保存心事 ──
function savePosts(posts) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2), 'utf8');
  } catch {
    // Vercel 环境写入失败时保存到内存
    memoryPosts = posts;
    memoryInitialized = true;
  }
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── 静态文件 ──
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── API: 获取所有心事 ──
app.get('/api/posts', (req, res) => {
  const posts = readPosts();
  const publicPosts = posts.map(p => ({
    id: p.id,
    content: p.content,
    tag: p.tag || '💭 心事',
    time: p.time,
    reply: p.reply || null,
    replyTime: p.replyTime || null
  })).reverse();
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

// ── API: 守护者回复 ──
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
  const tagCount = {};
  posts.forEach(p => {
    const t = p.tag || '💭 心事';
    tagCount[t] = (tagCount[t] || 0) + 1;
  });
  res.json({ success: true, total, replied, tagCount });
});

// ── 验证码存储（内存）──
const verificationCodes = {};

// ── API: 发送验证码 ──
app.post('/api/send-code', (req, res) => {
  const { phone } = req.body;
  if (!phone || !/^1\d{10}$/.test(phone)) {
    return res.json({ success: false, message: '请输入正确的手机号 📱' });
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  verificationCodes[phone] = code;
  setTimeout(() => { delete verificationCodes[phone]; }, 300000);
  console.log(`  [验证码] ${phone} → ${code}`);
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

// ── API: 获取当前用户 ──
app.get('/api/user', (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.json({ success: false });
  res.json({ success: true, phone: '已登录用户' });
});

// ── Vercel Serverless Handler ──
module.exports.handler = serverless(app);
