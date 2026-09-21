const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cors = require('cors');
const db = require('./database');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'https://my-react-app-v2-seven.vercel.app',
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));
app.use(session({
  secret: 'my-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 }
}));

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

app.get('/', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/about', (req, res) => {
  res.send('<h1>About</h1><p>Built with Node.js and Express.</p><a href="/">Back</a>');
});

app.get('/contact', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'contact.html'));
});

app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || password.length < 6) {
    return res.status(400).json({ error: 'Username and password (min 6 chars) required' });
  }
  const existing = db.prepare('SELECT id FROM accounts WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: 'Username already taken' });
  }
  const hashed = await bcrypt.hash(password, 10);
  db.prepare('INSERT INTO accounts (username, password) VALUES (?, ?)').run(username, hashed);
  res.json({ success: true });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const account = db.prepare('SELECT * FROM accounts WHERE username = ?').get(username);
  if (!account) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  const match = await bcrypt.compare(password, account.password);
  if (!match) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  req.session.user = { id: account.id, username: account.username };
  res.json({ success: true });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/me', (req, res) => {
  if (!req.session.user) return res.json({ user: null });
  res.json({ user: req.session.user });
});

app.get('/api/users', requireLogin, (req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  res.json(users);
});

app.post('/api/users', requireLogin, (req, res) => {
  const { name, email } = req.body;
  try {
    const result = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)').run(name, email);
    res.json({ id: result.lastInsertRowid, name, email });
  } catch (err) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

app.put('/api/users/:id', requireLogin, (req, res) => {
  const { name, email } = req.body;
  const { id } = req.params;
  try {
    db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(name, email, id);
    res.json({ id, name, email });
  } catch (err) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

app.delete('/api/users/:id', requireLogin, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.post('/api/contact', requireLogin, (req, res) => {
  const { name, email, message } = req.body;
  db.prepare('INSERT INTO messages (name, email, message) VALUES (?, ?, ?)').run(name, email, message);
  res.json({ message: `Thanks ${name}, we received your message!` });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
