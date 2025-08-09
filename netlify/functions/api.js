// 🚀 AI Marketing Monster - Netlify Function
const axios = require('axios');

// 🔧 Configuration from environment variables
const CONFIG = {
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
  FACEBOOK_ACCESS_TOKEN: process.env.FACEBOOK_ACCESS_TOKEN,
  FACEBOOK_PAGE_ID: process.env.FACEBOOK_PAGE_ID,
  BRAND: {
    name: 'Real Mute Technologies',
    product: 'Real Mute',
    website: 'https://realmute.com',
    landingPage: process.env.LANDING_PAGE_URL || 'https://real-mute-lp.netlify.app'
  }
};

// 💾 Simple in-memory storage (in production, use external DB)
let STORAGE = {
  posts: [],
  analytics: {
    totalPosts: 0,
    systemStatus: 'active'
  },
  contentQueue: []
};

// 🤖 Claude AI Integration
class ClaudeAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.anthropic.com/v1/messages';
  }

  async generateMultiPlatformContent(topic) {
    const prompt = `
You are an expert social media marketing AI for Real Mute Technologies, a company that makes revolutionary practice mutes for brass instruments with 50dB noise reduction.

Generate engaging social media content about: ${topic}

Create content for these platforms:

1. FACEBOOK (casual, community-focused, 100-200 words)
2. LINKEDIN (professional, B2B, 150-250 words)  
3. INSTAGRAM (visual-focused, hashtag-rich, 80-150 words)
4. TWITTER (concise, under 280 characters)

Focus on:
- How Real Mute solves practice problems
- 50dB noise reduction technology
- Perfect for apartments, hotels, late-night practice
- Silent practice revolution

Return as JSON:
{
  "facebook": "content here",
  "linkedin": "content here", 
  "instagram": "content here",
  "twitter": "content here",
  "topic": "${topic}"
}

Generate authentic, valuable content that musicians will engage with.
`;

    try {
      const response = await axios.post(this.baseURL, {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        timeout: 30000
      });

      const content = response.data.content[0].text;
      
      try {
        return JSON.parse(content);
      } catch {
        return {
          facebook: content.substring(0, 300),
          linkedin: content.substring(0, 400),
          instagram: content.substring(0, 200) + '\n\n#realmute #practicemate #silentpractice #brassmusic',
          twitter: content.substring(0, 200) + ' #realmute #silentpractice',
          topic: topic
        };
      }
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error('Failed to generate content');
    }
  }
}

// 📘 Facebook API
class FacebookAPI {
  constructor(accessToken, pageId) {
    this.accessToken = accessToken;
    this.pageId = pageId;
  }

  async postToPage(message, link = null) {
    if (!this.accessToken || !this.pageId) {
      throw new Error('Facebook credentials not configured');
    }

    const postData = {
      message: message,
      access_token: this.accessToken
    };

    if (link) postData.link = link;

    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${this.pageId}/feed`,
      postData
    );

    return response.data;
  }
}

// 🎨 Content topics
const contentTopics = [
  'silent practice tips for apartment musicians',
  'how 50dB noise reduction changes everything',
  'perfect intonation while practicing quietly',
  'Real Mute vs traditional practice mutes comparison',
  'late night practice sessions made possible',
  'hotel room practice for touring musicians',
  'neighbor-friendly music practice',
  'breakthrough practice mute technology',
  'maintaining embouchure with practice mutes',
  'professional musicians testimonials'
];

// 📊 Dashboard HTML
const getDashboardHTML = () => {
  const stats = {
    total: STORAGE.contentQueue.length,
    posted: STORAGE.posts.length,
    pending: STORAGE.contentQueue.length - STORAGE.posts.length
  };

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
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
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
        .btn.success { background: #28a745; }
        .status { 
            display: inline-block;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 0.8em;
            font-weight: bold;
            background: #d4edda;
            color: #155724;
        }
        .log-entry {
            background: #f8f9fa;
            padding: 8px 12px;
            border-radius: 6px;
            margin: 5px 0;
            font-family: monospace;
            font-size: 0.8em;
            border-left: 3px solid #17a2b8;
        }
        .content-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
            border-left: 4px solid #28a745;
        }
        .copy-btn {
            background: #17a2b8;
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.7em;
            margin: 2px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 AI Marketing Monster</h1>
            <p>Real Mute Technologies - Netlify Edition</p>
            <div class="status">ONLINE</div>
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
                        <div class="stat-label">All Time</div>
                    </div>
                </div>
                <div>
                    <button class="btn success" onclick="generateContent()">🎨 Generate Content</button>
                    <button class="btn" onclick="postNow()">📘 Post to Facebook</button>
                    <button class="btn" onclick="location.reload()">🔄 Refresh</button>
                </div>
            </div>

            <div class="card">
                <h3>🔧 System Configuration</h3>
                <div class="log-entry">Claude API: ${CONFIG.CLAUDE_API_KEY ? '✅ Connected' : '❌ Not configured'}</div>
                <div class="log-entry">Facebook API: ${CONFIG.FACEBOOK_ACCESS_TOKEN ? '✅ Connected' : '❌ Not configured'}</div>
                <div class="log-entry">Page ID: ${CONFIG.FACEBOOK_PAGE_ID || 'Not set'}</div>
                <div class="log-entry">Platform: Netlify Functions</div>
                <div class="log-entry">Status: Serverless Ready</div>
            </div>

            <div class="card">
                <h3>📝 Recent Content</h3>
                ${STORAGE.contentQueue.slice(-3).map(item => `
                    <div class="content-item">
                        <strong>${item.topic || 'Generated Content'}</strong>
                        <div style="margin-top: 8px;">
                            <button class="copy-btn" onclick="copyContent('${item.id}', 'facebook')">📘 FB</button>
                            <button class="copy-btn" onclick="copyContent('${item.id}', 'linkedin')">💼 LI</button>
                            <button class="copy-btn" onclick="copyContent('${item.id}', 'instagram')">📸 IG</button>
                            <button class="copy-btn" onclick="copyContent('${item.id}', 'twitter')">🐦 TW</button>
                        </div>
                    </div>
                `).join('') || '<p>No content generated yet. Click "Generate Content" to start!</p>'}
            </div>

            <div class="card">
                <h3>📘 Recent Posts</h3>
                ${STORAGE.posts.slice(-3).map(post => `
                    <div class="content-item">
                        <div style="font-size: 0.8em; color: #666; margin-bottom: 5px;">
                            ${new Date(post.postedAt).toLocaleString()}
                        </div>
                        <div style="font-size: 0.9em;">
                            ${post.content.substring(0, 100)}...
                        </div>
                    </div>
                `).join('') || '<p>No posts yet. Generate content and post to Facebook!</p>'}
            </div>
        </div>
    </div>

    <script>
        async function generateContent() {
            const btn = event.target;
            btn.disabled = true;
            btn.textContent = '🎨 Generating...';
            
            try {
                const response = await fetch('/.netlify/functions/api', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'generate' })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('✅ Content generated successfully!');
                    location.reload();
                } else {
                    alert('❌ Error: ' + result.error);
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
                const response = await fetch('/.netlify/functions/api', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'post' })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('✅ Posted to Facebook successfully!');
                    location.reload();
                } else {
                    alert('❌ Error: ' + result.error);
                }
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
            
            btn.disabled = false;
            btn.textContent = '📘 Post to Facebook';
        }

        async function copyContent(contentId, platform) {
            try {
                const response = await fetch('/.netlify/functions/api', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'getContent', contentId, platform })
                });
                
                const result = await response.json();
                
                if (result.success && result.content) {
                    await navigator.clipboard.writeText(result.content);
                    
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

// 🚀 Main handler function
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // GET request - serve dashboard
    if (event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'text/html' },
        body: getDashboardHTML()
      };
    }

    // POST request - API actions
    if (event.httpMethod === 'POST') {
      const { action, contentId, platform } = JSON.parse(event.body || '{}');

      switch (action) {
        case 'generate':
          console.log('Generate action called');
          
          if (!CONFIG.CLAUDE_API_KEY) {
            console.error('Claude API key missing');
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ success: false, error: 'Claude API key not configured' })
            };
          }

          console.log('Claude API key found, generating content...');
          const claude = new ClaudeAI(CONFIG.CLAUDE_API_KEY);
          const topic = contentTopics[Math.floor(Math.random() * contentTopics.length)];
          
          console.log('Selected topic:', topic);
          
          try {
            const content = await claude.generateMultiPlatformContent(topic);
            console.log('Content generated successfully');
            
            const contentItem = {
              id: Date.now().toString(),
              topic: topic,
              content: content,
              generatedAt: new Date().toISOString()
            };

            STORAGE.contentQueue.push(contentItem);
            console.log('Content added to queue');

            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ success: true, content: contentItem })
            };
          } catch (claudeError) {
            console.error('Claude API Error:', claudeError.message);
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ 
                success: false, 
                error: 'Failed to generate content: ' + claudeError.message 
              })
            };
          }

        case 'post':
          if (!CONFIG.FACEBOOK_ACCESS_TOKEN || !CONFIG.FACEBOOK_PAGE_ID) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ success: false, error: 'Facebook credentials not configured' })
            };
          }

          const readyContent = STORAGE.contentQueue.find(item => !item.posted);
          if (!readyContent) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ success: false, error: 'No content available to post' })
            };
          }

          const facebook = new FacebookAPI(CONFIG.FACEBOOK_ACCESS_TOKEN, CONFIG.FACEBOOK_PAGE_ID);
          const result = await facebook.postToPage(
            readyContent.content.facebook,
            CONFIG.BRAND.landingPage
          );

          readyContent.posted = true;
          STORAGE.posts.push({
            id: readyContent.id,
            content: readyContent.content.facebook,
            postId: result.id,
            postedAt: new Date().toISOString(),
            topic: readyContent.topic
          });

          STORAGE.analytics.totalPosts += 1;

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, postId: result.id })
          };

        case 'getContent':
          const item = STORAGE.contentQueue.find(c => c.id === contentId);
          if (!item || !item.content[platform]) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ success: false, error: 'Content not found' })
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, content: item.content[platform] })
          };

        default:
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, error: 'Unknown action' })
          };
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
