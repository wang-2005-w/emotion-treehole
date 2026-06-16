// 🌳 情绪树洞 - Vercel Serverless 入口（Redis 版）
// ===============================================
const express = require('express');
const path = require('path');
const fs = require('fs');
const serverless = require('serverless-http');

const app = express();

// ── Redis 连接（仅在 Vercel 环境使用）──
let redis = null;
const KV_URL = process.env.KV_REST_API_URL || process.env.KV_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.KV_TOKEN;
if (KV_URL && KV_TOKEN) {
  const { Redis } = require('@upstash/redis');
  redis = new Redis({ url: KV_URL, token: KV_TOKEN });
}

// ── 数据文件路径（本地开发备用）──
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'posts.json');

// ── 确保本地数据文件存在 ──
function initData() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
    }
  } catch (e) {
    // Vercel 环境可能无法写入
  }
}
initData();

// ── 读取所有心事 ──
async function readPosts() {
  // Vercel 环境优先使用 Redis
  if (redis) {
    try {
      const data = await redis.get('treehole_posts');
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('[Redis 读取失败]', e.message);
    }
  }
  // 本地开发回退到文件
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// ── 保存心事 ──
async function savePosts(posts) {
  // Vercel 环境优先使用 Redis
  if (redis) {
    try {
      await redis.set('treehole_posts', JSON.stringify(posts));
      return;
    } catch (e) {
      console.error('[Redis 保存失败]', e.message);
    }
  }
  // 本地开发回退到文件
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2), 'utf8');
  } catch (e) {
    console.error('[文件保存失败]', e.message);
  }
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── 静态文件 ──
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── API: 获取所有心事 ──
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await readPosts();
    const publicPosts = posts.map(p => ({
      id: p.id,
      content: p.content,
      tag: p.tag || '💭 心事',
      time: p.time,
      reply: p.reply || null,
      replyTime: p.replyTime || null
    })).reverse();
    res.json({ success: true, posts: publicPosts });
  } catch (e) {
    res.json({ success: false, message: '获取失败', posts: [] });
  }
});

// ── API: 提交心事 ──
app.post('/api/post', async (req, res) => {
  const { content, tag } = req.body;
  if (!content || content.trim().length === 0) {
    return res.json({ success: false, message: '心事内容不能为空哦～' });
  }
  if (content.length > 2000) {
    return res.json({ success: false, message: '心事太长啦，最多 2000 个字哦～' });
  }

  try {
    const posts = await readPosts();
    const newPost = {
      id: Date.now(),
      content: content.trim(),
      tag: tag || '💭 心事',
      time: new Date().toLocaleString('zh-CN'),
      reply: null,
      replyTime: null
    };
    posts.push(newPost);
    await savePosts(posts);
    res.json({ success: true, message: '🌷 心事已安放好啦，你从来不是一个人。', post: newPost });
  } catch (e) {
    res.json({ success: false, message: '提交失败，请稍后再试～' });
  }
});

// ── API: 守护者回复 ──
app.post('/api/reply', async (req, res) => {
  const { id, reply } = req.body;
  if (!id || !reply) {
    return res.json({ success: false, message: '参数不完整' });
  }
  try {
    const posts = await readPosts();
    const idx = posts.findIndex(p => p.id === id);
    if (idx === -1) {
      return res.json({ success: false, message: '未找到这条心事' });
    }
    posts[idx].reply = reply.trim();
    posts[idx].replyTime = new Date().toLocaleString('zh-CN');
    await savePosts(posts);
    res.json({ success: true, message: '💌 回复已送达~' });
  } catch (e) {
    res.json({ success: false, message: '回复失败，请稍后再试' });
  }
});

// ── API: 统计数据 ──
app.get('/api/stats', async (req, res) => {
  try {
    const posts = await readPosts();
    const total = posts.length;
    const replied = posts.filter(p => p.reply).length;
    const tagCount = {};
    posts.forEach(p => {
      const t = p.tag || '💭 心事';
      tagCount[t] = (tagCount[t] || 0) + 1;
    });
    res.json({ success: true, total, replied, tagCount });
  } catch (e) {
    res.json({ success: true, total: 0, replied: 0, tagCount: {} });
  }
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

// ── 前端路由（SPA 支持）──
const htmlFiles = {
  '/': 'index.html',
  '/index.html': 'index.html',
  '/wall': 'wall.html',
  '/wall.html': 'wall.html',
  '/post': 'post.html',
  '/post.html': 'post.html',
  '/me': 'me.html',
  '/me.html': 'me.html',
};

for (const [route, file] of Object.entries(htmlFiles)) {
  app.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', file));
  });
}

// ── Vercel Serverless Handler ──
module.exports.handler = serverless(app);
