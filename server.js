#!/usr/bin/env node

/**
 * 🚀 AI Marketing Monster v2.0
 * Advanced AI-powered marketing automation system
 * Real Mute Technologies - 2025
 */

// 📚 Core Dependencies
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const axios = require('axios');
const moment = require('moment-timezone');
const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');
const path = require('path');
const fs = require('fs').promises;

// 🔧 Environment Configuration
require('dotenv').config();

// 📊 Logger Setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ai-marketing-monster' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// 🎯 Application Configuration
const CONFIG = {
  PORT: process.env.PORT || 3000,
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
  FACEBOOK_ACCESS_TOKEN: process.env.FACEBOOK_ACCESS_TOKEN,
  FACEBOOK_PAGE_ID: process.env.FACEBOOK_PAGE_ID,
  
  // 🎨 Brand Configuration
  BRAND: {
    name: process.env.BRAND_NAME || 'Real Mute Technologies',
    product: process.env.PRODUCT_NAME || 'Real Mute',
    website: process.env.WEBSITE_URL || 'https://realmute.com',
    landingPage: process.env.LANDING_PAGE_URL || 'https://ai-monster-marketing.netlify.app'
  },

  // ⏰ Posting Configuration
  POSTING: {
    intervalHours: parseInt(process.env.POST_INTERVAL_HOURS) || 4,
    dailyLimit: parseInt(process.env.DAILY_POST_LIMIT) || 6,
    timezone: process.env.TIMEZONE || 'Asia/Jerusalem',
    maxPostsPerBatch: parseInt(process.env.MAX_POSTS_PER_BATCH) || 10
  },

  // 🎛️ Content Settings
  CONTENT: {
    varietyLevel: process.env.CONTENT_VARIETY_LEVEL || 'high',
    enableHashtags: process.env.ENABLE_HASHTAGS === 'true',
    enableEmojis: process.env.ENABLE_EMOJIS === 'true'
  }
};

// 🚨 Validation
if (!CONFIG.CLAUDE_API_KEY) {
  logger.error('❌ CLAUDE_API_KEY is required');
  process.exit(1);
}

if (!CONFIG.FACEBOOK_ACCESS_TOKEN) {
  logger.warn('⚠️ FACEBOOK_ACCESS_TOKEN not found - Facebook posting disabled');
}

// 🌐 Express App Setup
const app = express();

// 🛡️ Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"]
    }
  }
}));

// 🚦 Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);
app.use(compression());
app.use(cors());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 📁 Static Files
app.use(express.static('public'));

// 💾 In-Memory Storage
const STORAGE = {
  posts: [],
  analytics: {
    totalPosts: 0,
    totalImpressions: 0,
    totalEngagements: 0,
    lastPostTime: null,
    systemStatus: 'active'
  },
  contentQueue: [],
  systemLogs: []
};

// 🤖 Claude AI Integration
class ClaudeAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.anthropic.com/v1/messages';
  }

  async generateContent(prompt, maxTokens = 1000) {
    try {
      const response = await axios.post(this.baseURL, {
        model: 'claude-3-sonnet-20240229',
        max_tokens: maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        }
      });

      return response.data.content[0].text;
    } catch (error) {
      logger.error('Claude API error:', error.response?.data || error.message);
      throw new Error('Failed to generate content with Claude AI');
    }
  }

  async generateMultiPlatformContent(topic, context = '') {
    const prompt = `
You are an expert social media marketing AI for Real Mute Technologies, a company that makes revolutionary practice mutes for brass instruments with 50dB noise reduction.

Generate engaging social media content about: ${topic}

Context: ${context}

Create content for these platforms with their specific characteristics:

1. FACEBOOK (casual, community-focused, 100-200 words):
- Engaging and conversational
- Include call-to-action
- Community building focus
- Use emojis appropriately

2. LINKEDIN (professional, B2B, 150-250 words):
- Professional tone
- Industry insights
- Educational value
- Thought leadership
- No emojis, formal language

3. INSTAGRAM (visual-focused, hashtag-rich, 80-150 words):
- Lifestyle and visual elements
- Include 8-12 relevant hashtags
- Engaging and trendy
- Visual storytelling

4. TWITTER (concise, engaging, under 280 characters):
- Quick tips or insights
- Engaging and shareable
- Include 2-3 hashtags
- Call-to-action

For each platform, focus on:
- How Real Mute solves practice problems
- 50dB noise reduction technology
- Perfect for apartments, hotels, late-night practice
- Professional quality maintained
- Silent practice revolution

Return the response in this JSON format:
{
  "facebook": "content here",
  "linkedin": "content here", 
  "instagram": "content here",
  "twitter": "content here",
  "topic": "${topic}",
  "generated_at": "${new Date().toISOString()}"
}

Generate authentic, valuable content that musicians will want to engage with. Make it helpful, not just promotional.
`;

    try {
      const response = await this.generateContent(prompt, 1500);
      
      // Try to parse JSON, fallback to simple format if parsing fails
      try {
        const parsed = JSON.parse(response);
        return parsed;
      } catch (parseError) {
        logger.warn('Failed to parse Claude response as JSON, using fallback format');
        return {
          facebook: response.substring(0, 300),
          linkedin: response.substring(0, 400),
          instagram: response.substring(0, 200) + '\n\n#realmute #practicemate #silentpractice #brassmusic #trumpet #musictech #apartmentpractice #musicstudent',
          twitter: response.substring(0, 200) + ' #realmute #silentpractice #musictech',
          topic: topic,
          generated_at: new Date().toISOString()
        };
      }
    } catch (error) {
      logger.error('Error generating multi-platform content:', error);
      throw error;
    }
  }
}

// 📘 Facebook Integration
class FacebookAPI {
  constructor(accessToken, pageId) {
    this.accessToken = accessToken;
    this.pageId = pageId;
    this.baseURL = 'https://graph.facebook.com/v18.0';
  }

  async postToPage(message, link = null) {
    if (!this.accessToken || !this.pageId) {
      throw new Error('Facebook credentials not configured');
    }

    try {
      const postData = {
        message: message,
        access_token: this.accessToken
      };

      if (link) {
        postData.link = link;
      }

      const response = await axios.post(
        `${this.baseURL}/${this.pageId}/feed`,
        postData
      );

      logger.info('📘 Facebook post successful:', response.data.id);
      return response.data;
    } catch (error) {
      logger.error('Facebook API error:', error.response?.data || error.message);
      throw new Error('Failed to post to Facebook');
    }
  }

  async getPageInsights() {
    if (!this.accessToken || !this.pageId) {
      return null;
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/${this.pageId}/insights`,
        {
          params: {
            access_token: this.accessToken,
            metric: 'page_impressions,page_engaged_users,page_post_engagements',
            period: 'day'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Facebook insights error:', error.response?.data || error.message);
      return null;
    }
  }
}

// 🎯 Content Generation Engine
class ContentEngine {
  constructor() {
    this.claude = new ClaudeAI(CONFIG.CLAUDE_API_KEY);
    this.facebook = CONFIG.FACEBOOK_ACCESS_TOKEN ? 
      new FacebookAPI(CONFIG.FACEBOOK_ACCESS_TOKEN, CONFIG.FACEBOOK_PAGE_ID) : null;
    
    this.contentTopics = [
      'silent practice tips for apartment musicians',
      'how 50dB noise reduction changes everything',
      'perfect intonation while practicing quietly',
      'Real Mute vs traditional practice mutes comparison',
      'late night practice sessions made possible',
      'hotel room practice for touring musicians',
      'conservatory practice room solutions',
      'neighbor-friendly music practice',
      'breakthrough practice mute technology',
      'maintaining embouchure with practice mutes',
      'professional musicians testimonials',
      'music student practice challenges solved',
      'acoustic engineering behind Real Mute',
      'practice efficiency tips',
      'brass instrument care and maintenance',
      'overcoming practice obstacles',
      'music education innovation',
      'sound isolation technology',
      'practice motivation and consistency',
      'musical instrument industry trends'
    ];
  }

  async generateBatchContent(count = 5) {
    const batch = [];
    const selectedTopics = _.sampleSize(this.contentTopics, count);

    for (const topic of selectedTopics) {
      try {
        logger.info(`🎨 Generating content for: ${topic}`);
        
        const content = await this.claude.generateMultiPlatformContent(topic);
        
        const contentItem = {
          id: uuidv4(),
          topic: topic,
          content: content,
          generatedAt: new Date().toISOString(),
          status: 'ready',
          platforms: {
            facebook: { posted: false, postId: null, scheduledFor: null },
            linkedin: { posted: false, ready: true },
            instagram: { posted: false, ready: true },
            twitter: { posted: false, ready: true }
          }
        };

        batch.push(contentItem);
        STORAGE.contentQueue.push(contentItem);
        
        logger.info(`✅ Content generated: ${contentItem.id}`);
        
        // Add delay between generations to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        logger.error(`❌ Failed to generate content for topic "${topic}":`, error.message);
      }
    }

    logger.info(`🎯 Generated ${batch.length} content items`);
    return batch;
  }

  async postToFacebook(contentItem) {
    if (!this.facebook) {
      logger.warn('📘 Facebook not configured, skipping post');
      return false;
    }

    try {
      const result = await this.facebook.postToPage(
        contentItem.content.facebook,
        CONFIG.BRAND.landingPage
      );

      // Update storage
      contentItem.platforms.facebook.posted = true;
      contentItem.platforms.facebook.postId = result.id;
      contentItem.platforms.facebook.postedAt = new Date().toISOString();

      STORAGE.posts.push({
        id: contentItem.id,
        platform: 'facebook',
        content: contentItem.content.facebook,
        postId: result.id,
        postedAt: new Date().toISOString(),
        topic: contentItem.topic
      });

      STORAGE.analytics.totalPosts += 1;
      STORAGE.analytics.lastPostTime = new Date().toISOString();

      logger.info(`📘 Successfully posted to Facebook: ${result.id}`);
      return true;

    } catch (error) {
      logger.error('❌ Facebook posting failed:', error.message);
      return false;
    }
  }

  getContentStats() {
    const total = STORAGE.contentQueue.length;
    const ready = STORAGE.contentQueue.filter(item => item.status === 'ready').length;
    const posted = STORAGE.contentQueue.filter(item => 
      item.platforms.facebook.posted
    ).length;

    return {
      total,
      ready,
      posted,
      pending: ready - posted
    };
  }
}

// 🎛️ Content Engine Instance
const contentEngine = new ContentEngine();

// 📊 Dashboard HTML
const getDashboardHTML = () => {
  const stats = contentEngine.getContentStats();
  const recentPosts = STORAGE.posts.slice(-5).reverse();
  const queuePeek = STORAGE.contentQueue.slice(-3).reverse();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 AI Marketing Monster - Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { 
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
            text-align: center;
            color: white;
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { font-size: 1.2em; opacity: 0.9; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { 
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border-left: 5px solid #667eea;
        }
        .card h3 { color: #667eea; margin-bottom: 15px; font-size: 1.3em; }
        .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .stat { text-align: center; padding: 15px; background: #f8f9fa; border-radius: 10px; }
        .stat-number { font-size: 2em; font-weight: bold; color: #667eea; }
        .stat-label { font-size: 0.9em; color: #666; margin-top: 5px; }
        .controls { margin: 20px 0; }
        .btn { 
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            margin: 5px;
            font-size: 1em;
            transition: all 0.3s ease;
        }
        .btn:hover { background: #5a6fd8; transform: translateY(-2px); }
        .btn.secondary { background: #6c757d; }
        .btn.success { background: #28a745; }
        .btn.danger { background: #dc3545; }
        .post-item { 
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
            border-left: 4px solid #28a745;
        }
        .post-meta { font-size: 0.8em; color: #666; margin-bottom: 8px; }
        .post-content { font-size: 0.9em; line-height: 1.4; }
        .status { 
            display: inline-block;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 0.8em;
            font-weight: bold;
        }
        .status.active { background: #d4edda; color: #155724; }
        .status.paused { background: #fff3cd; color: #856404; }
        .queue-item {
            background: #e3f2fd;
            padding: 12px;
            border-radius: 8px;
            margin: 8px 0;
            border-left: 4px solid #2196f3;
        }
        .platforms { display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
        .platform-tag {
            background: #667eea;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.7em;
            font-weight: bold;
        }
        .platform-tag.ready { background: #28a745; }
        .platform-tag.posted { background: #6c757d; }
        .log-entry {
            background: #f8f9fa;
            padding: 8px 12px;
            border-radius: 6px;
            margin: 5px 0;
            font-family: monospace;
            font-size: 0.8em;
            border-left: 3px solid #17a2b8;
        }
        .copy-btn {
            background: #17a2b8;
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.7em;
            margin-top: 5px;
        }
        .copy-btn:hover { background: #138496; }
        .refresh-notice {
            background: rgba(255,193,7,0.1);
            border: 1px solid #ffc107;
            color: #856404;
            padding: 10px;
            border-radius: 8px;
            margin: 15px 0;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 AI Marketing Monster</h1>
            <p>Real Mute Technologies - Advanced Marketing Automation</p>
            <div class="status ${STORAGE.analytics.systemStatus}">${STORAGE.analytics.systemStatus.toUpperCase()}</div>
        </div>

        <div class="refresh-notice">
            📊 Dashboard auto-refreshes every 30 seconds. Last updated: ${new Date().toLocaleString()}
        </div>

        <div class="grid">
            <div class="card">
                <h3>📊 System Statistics</h3>
                <div class="stat-grid">
                    <div class="stat">
                        <div class="stat-number">${stats.total}</div>
                        <div class="stat-label">Total Content</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${stats.posted}</div>
                        <div class="stat-label">Posted</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${stats.pending}</div>
                        <div class="stat-label">Pending</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${STORAGE.analytics.totalPosts}</div>
                        <div class="stat-label">All Time Posts</div>
                    </div>
                </div>
                <div class="controls">
                    <button class="btn success" onclick="generateContent()">🎨 Generate Content</button>
                    <button class="btn" onclick="postNow()">📘 Post to Facebook</button>
                    <button class="btn secondary" onclick="location.reload()">🔄 Refresh</button>
                </div>
            </div>

            <div class="card">
                <h3>📝 Content Queue (Recent)</h3>
                ${queuePeek.map(item => `
                    <div class="queue-item">
                        <div class="post-meta">
                            <strong>${item.topic}</strong> • ${new Date(item.generatedAt).toLocaleString()}
                        </div>
                        <div class="platforms">
                            <span class="platform-tag ${item.platforms.facebook.posted ? 'posted' : 'ready'}">Facebook</span>
                            <span class="platform-tag ready">LinkedIn</span>
                            <span class="platform-tag ready">Instagram</span>
                            <span class="platform-tag ready">Twitter</span>
                        </div>
                        <button class="copy-btn" onclick="copyContent('${item.id}', 'facebook')">📘 Copy FB</button>
                        <button class="copy-btn" onclick="copyContent('${item.id}', 'linkedin')">💼 Copy LI</button>
                        <button class="copy-btn" onclick="copyContent('${item.id}', 'instagram')">📸 Copy IG</button>
                        <button class="copy-btn" onclick="copyContent('${item.id}', 'twitter')">🐦 Copy TW</button>
                    </div>
                `).join('')}
            </div>

            <div class="card">
                <h3>📘 Recent Facebook Posts</h3>
                ${recentPosts.length > 0 ? recentPosts.map(post => `
                    <div class="post-item">
                        <div class="post-meta">
                            ${new Date(post.postedAt).toLocaleString()} • ${post.topic}
                        </div>
                        <div class="post-content">${post.content.substring(0, 100)}...</div>
                    </div>
                `).join('') : '<p>No posts yet. Generate and post some content!</p>'}
            </div>

            <div class="card">
                <h3>🔧 System Configuration</h3>
                <div class="log-entry">Claude API: ${CONFIG.CLAUDE_API_KEY ? '✅ Connected' : '❌ Not configured'}</div>
                <div class="log-entry">Facebook API: ${CONFIG.FACEBOOK_ACCESS_TOKEN ? '✅ Connected' : '❌ Not configured'}</div>
                <div class="log-entry">Page ID: ${CONFIG.FACEBOOK_PAGE_ID || 'Not set'}</div>
                <div class="log-entry">Posting Interval: ${CONFIG.POSTING.intervalHours} hours</div>
                <div class="log-entry">Daily Limit: ${CONFIG.POSTING.dailyLimit} posts</div>
                <div class="log-entry">Timezone: ${CONFIG.POSTING.timezone}</div>
                <div class="log-entry">Last Post: ${STORAGE.analytics.lastPostTime ? new Date(STORAGE.analytics.lastPostTime).toLocaleString() : 'Never'}</div>
            </div>
        </div>
    </div>

    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => location.reload(), 30000);

        async function generateContent() {
            const btn = event.target;
            btn.disabled = true;
            btn.textContent = '🎨 Generating...';
            
            try {
                const response = await fetch('/api/generate-content', { method: 'POST' });
                const result = await response.json();
                
                if (result.success) {
                    alert(\`✅ Generated \${result.count} content items!\`);
                    location.reload();
                } else {
                    alert('❌ Failed to generate content: ' + result.error);
                }
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
            
            btn.disabled = false;
            btn.textContent = '🎨 Generate Content';
        }

        async function postNow() {
            const btn = event.target;
            btn.disabled = true;
            btn.textContent = '📘 Posting...';
            
            try {
                const response = await fetch('/api/post-now', { method: 'POST' });
                const result = await response.json();
                
                if (result.success) {
                    alert('✅ Posted to Facebook successfully!');
                    location.reload();
                } else {
                    alert('❌ Failed to post: ' + result.error);
                }
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
            
            btn.disabled = false;
            btn.textContent = '📘 Post to Facebook';
        }

        async function copyContent(contentId, platform) {
            try {
                const response = await fetch(\`/api/content/\${contentId}\`);
                const content = await response.json();
                
                if (content && content[platform]) {
                    await navigator.clipboard.writeText(content[platform]);
                    
                    const btn = event.target;
                    const originalText = btn.textContent;
                    btn.textContent = '✅ Copied!';
                    setTimeout(() => btn.textContent = originalText, 2000);
                } else {
                    alert('Content not found');
                }
            } catch (error) {
                alert('Failed to copy: ' + error.message);
            }
        }
    </script>
</body>
</html>
  `;
};

// 🌐 API Routes
app.get('/', (req, res) => {
  res.send(getDashboardHTML());
});

app.get('/api/status', (req, res) => {
  const stats = contentEngine.getContentStats();
  res.json({
    success: true,
    status: STORAGE.analytics.systemStatus,
    stats: stats,
    analytics: STORAGE.analytics,
    config: {
      claudeConnected: !!CONFIG.CLAUDE_API_KEY,
      facebookConnected: !!CONFIG.FACEBOOK_ACCESS_TOKEN,
      pageId: CONFIG.FACEBOOK_PAGE_ID
    }
  });
});

app.post('/api/generate-content', async (req, res) => {
  try {
    logger.info('🎨 Manual content generation requested');
    
    const count = req.body.count || 3;
    const batch = await contentEngine.generateBatchContent(count);
    
    res.json({
      success: true,
      count: batch.length,
      message: `Generated ${batch.length} content items`,
      items: batch.map(item => ({
        id: item.id,
        topic: item.topic,
        generatedAt: item.generatedAt
      }))
    });
    
    logger.info(`✅ Manual generation completed: ${batch.length} items`);
    
  } catch (error) {
    logger.error('❌ Manual content generation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/post-now', async (req, res) => {
  try {
    logger.info('📘 Manual Facebook posting requested');
    
    // Find next ready content
    const readyContent = STORAGE.contentQueue.find(item => 
      item.status === 'ready' && !item.platforms.facebook.posted
    );
    
    if (!readyContent) {
      return res.status(400).json({
        success: false,
        error: 'No ready content available. Generate some content first!'
      });
    }
    
    const success = await contentEngine.postToFacebook(readyContent);
    
    if (success) {
      res.json({
        success: true,
        message: 'Posted to Facebook successfully',
        postId: readyContent.platforms.facebook.postId,
        topic: readyContent.topic
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to post to Facebook'
      });
    }
    
  } catch (error) {
    logger.error('❌ Manual Facebook posting failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/content/:id', (req, res) => {
  try {
    const contentItem = STORAGE.contentQueue.find(item => item.id === req.params.id);
    
    if (!contentItem) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }
    
    res.json(contentItem.content);
    
  } catch (error) {
    logger.error('❌ Content retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/content', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const platform = req.query.platform;
    
    let content = [...STORAGE.contentQueue].reverse();
    
    if (platform) {
      content = content.filter(item => item.content[platform]);
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedContent = content.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      content: paginatedContent,
      pagination: {
        page: page,
        limit: limit,
        total: content.length,
        pages: Math.ceil(content.length / limit)
      }
    });
    
  } catch (error) {
    logger.error('❌ Content listing failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/analytics', async (req, res) => {
  try {
    let facebookInsights = null;
    
    if (contentEngine.facebook) {
      facebookInsights = await contentEngine.facebook.getPageInsights();
    }
    
    res.json({
      success: true,
      analytics: STORAGE.analytics,
      stats: contentEngine.getContentStats(),
      facebookInsights: facebookInsights,
      recentPosts: STORAGE.posts.slice(-10).reverse()
    });
    
  } catch (error) {
    logger.error('❌ Analytics retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/system/pause', (req, res) => {
  STORAGE.analytics.systemStatus = 'paused';
  logger.info('⏸️ System paused');
  res.json({ success: true, status: 'paused' });
});

app.post('/api/system/resume', (req, res) => {
  STORAGE.analytics.systemStatus = 'active';
  logger.info('▶️ System resumed');
  res.json({ success: true, status: 'active' });
});

// 🚨 Error Handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// ⏰ Automated Posting Schedule
function setupAutomatedPosting() {
  if (!CONFIG.FACEBOOK_ACCESS_TOKEN) {
    logger.warn('⚠️ Automated posting disabled - Facebook not configured');
    return;
  }

  // Post every X hours (configurable)
  const cronPattern = `0 */${CONFIG.POSTING.intervalHours} * * *`;
  
  cron.schedule(cronPattern, async () => {
    if (STORAGE.analytics.systemStatus !== 'active') {
      logger.info('⏸️ Automated posting skipped - system paused');
      return;
    }

    try {
      logger.info('⏰ Automated posting cycle started');
      
      // Check daily posting limit
      const today = moment().tz(CONFIG.POSTING.timezone).format('YYYY-MM-DD');
      const todayPosts = STORAGE.posts.filter(post => 
        moment(post.postedAt).tz(CONFIG.POSTING.timezone).format('YYYY-MM-DD') === today
      );

      if (todayPosts.length >= CONFIG.POSTING.dailyLimit) {
        logger.info(`📊 Daily posting limit reached (${CONFIG.POSTING.dailyLimit})`);
        return;
      }

      // Find ready content
      const readyContent = STORAGE.contentQueue.find(item => 
        item.status === 'ready' && !item.platforms.facebook.posted
      );

      if (!readyContent) {
        logger.info('🎨 No ready content, generating new batch...');
        await contentEngine.generateBatchContent(3);
        
        // Try again with fresh content
        const newContent = STORAGE.contentQueue.find(item => 
          item.status === 'ready' && !item.platforms.facebook.posted
        );
        
        if (newContent) {
          await contentEngine.postToFacebook(newContent);
        }
      } else {
        await contentEngine.postToFacebook(readyContent);
      }
      
      logger.info('✅ Automated posting cycle completed');
      
    } catch (error) {
      logger.error('❌ Automated posting failed:', error);
    }
  });

  logger.info(`⏰ Automated posting scheduled: every ${CONFIG.POSTING.intervalHours} hours`);
  logger.info(`📊 Daily limit: ${CONFIG.POSTING.dailyLimit} posts`);
  logger.info(`🌍 Timezone: ${CONFIG.POSTING.timezone}`);
}

// 🔄 Content Queue Management
function setupContentManagement() {
  // Generate initial content batch
  setTimeout(async () => {
    if (STORAGE.contentQueue.length === 0) {
      logger.info('🎨 Generating initial content batch...');
      try {
        await contentEngine.generateBatchContent(5);
        logger.info('✅ Initial content batch ready');
      } catch (error) {
        logger.error('❌ Failed to generate initial content:', error);
      }
    }
  }, 5000);

  // Clean up old content (keep last 100 items)
  cron.schedule('0 0 * * *', () => {
    if (STORAGE.contentQueue.length > 100) {
      const toRemove = STORAGE.contentQueue.length - 100;
      STORAGE.contentQueue.splice(0, toRemove);
      logger.info(`🧹 Cleaned up ${toRemove} old content items`);
    }

    if (STORAGE.posts.length > 500) {
      const toRemove = STORAGE.posts.length - 500;
      STORAGE.posts.splice(0, toRemove);
      logger.info(`🧹 Cleaned up ${toRemove} old post records`);
    }
  });

  // Auto-generate content when queue is low
  cron.schedule('*/30 * * * *', async () => {
    if (STORAGE.analytics.systemStatus !== 'active') return;

    const stats = contentEngine.getContentStats();
    if (stats.pending < 2) {
      logger.info('📝 Content queue low, generating more...');
      try {
        await contentEngine.generateBatchContent(3);
      } catch (error) {
        logger.error('❌ Auto content generation failed:', error);
      }
    }
  });
}

// 💾 Data Persistence (Simple file-based for demo)
async function saveData() {
  try {
    const data = {
      posts: STORAGE.posts.slice(-100), // Keep last 100
      analytics: STORAGE.analytics,
      contentQueue: STORAGE.contentQueue.slice(-50), // Keep last 50
      lastSaved: new Date().toISOString()
    };
    
    // In production, you'd use a proper database
    // For demo purposes, we're just keeping in memory
    logger.info('💾 Data persistence simulation completed');
    
  } catch (error) {
    logger.error('❌ Data save failed:', error);
  }
}

// Save data every hour
cron.schedule('0 * * * *', saveData);

// 🚀 Server Startup
async function startServer() {
  try {
    // Setup automated systems
    setupAutomatedPosting();
    setupContentManagement();
    
    // Start server
    const server = app.listen(CONFIG.PORT, () => {
      logger.info(`🚀 AI Marketing Monster v2.0 started`);
      logger.info(`📊 Dashboard: http://localhost:${CONFIG.PORT}`);
      logger.info(`🤖 Claude AI: ${CONFIG.CLAUDE_API_KEY ? '✅ Connected' : '❌ Not configured'}`);
      logger.info(`📘 Facebook: ${CONFIG.FACEBOOK_ACCESS_TOKEN ? '✅ Connected' : '❌ Not configured'}`);
      logger.info(`📱 Page ID: ${CONFIG.FACEBOOK_PAGE_ID || 'Not set'}`);
      logger.info(`⏰ Auto-posting: ${CONFIG.POSTING.intervalHours}h intervals`);
      logger.info(`📊 Daily limit: ${CONFIG.POSTING.dailyLimit} posts`);
      logger.info(`🎯 Brand: ${CONFIG.BRAND.name}`);
      logger.info(`🌐 Website: ${CONFIG.BRAND.website}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('🛑 SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('🛑 SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('✅ Server closed');
        process.exit(0);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// 🎬 Launch the system
startServer();

module.exports = app;
