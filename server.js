const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.send(`
    <h1>🤖 AI Marketing Monster</h1>
    <p>System is running successfully!</p>
    <p>Time: ${new Date().toLocaleString()}</p>
    <a href="/dashboard">Go to Dashboard</a>
  `);
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'AI Marketing Monster is running!'
  });
});

app.listen(PORT, () => {
  console.log(`
🚀 AI MARKETING MONSTER STARTED!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 Server: http://localhost:${PORT}
🎛️ Dashboard: http://localhost:${PORT}/dashboard
🔧 Health: http://localhost:${PORT}/api/health

💡 Ready to dominate social media!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});
