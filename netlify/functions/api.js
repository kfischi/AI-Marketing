// 🚀 AI Marketing Monster - Multi-AI Content Generation System
const axios = require('axios');

// 💾 Enhanced storage
let STORAGE = {
  posts: [],
  contentQueue: [],
  analytics: { 
    totalPosts: 0, 
    systemStatus: 'active',
    aiProviders: {
      claude: { used: 0, errors: 0 },
      openai: { used: 0, errors: 0 },
      gemini: { used: 0, errors: 0 },
      fallback: { used: 0, errors: 0 }
    }
  }
};

// 🎨 Fallback templates (in case all APIs fail)
const FALLBACK_TEMPLATES = [
  {
    topic: "Silent Practice Revolution",
    facebook: "🎺 Tired of neighbors complaining about your practice sessions? Real Mute's revolutionary 50dB noise reduction changes everything! Now you can practice anytime, anywhere - from apartment living to hotel rooms. Perfect intonation maintained, zero compromise on your sound quality. Join thousands of musicians who've discovered the freedom of silent practice! #RealMute #SilentPractice #TrumpetLife #MusicianLife",
    linkedin: "The future of musical practice is here. Real Mute Technologies has engineered a breakthrough in acoustic design - delivering 50dB noise reduction while maintaining perfect intonation. For music educators, conservatories, and professional musicians, this represents a paradigm shift in how we approach practice space limitations. This innovation opens new possibilities for urban music education and professional development. #MusicEducation #Innovation #AcousticTechnology",
    instagram: "Practice anywhere, anytime! 🎺✨ Real Mute's 50dB noise reduction = apartment-friendly sessions that don't wake the neighbors 😴 Perfect for late-night practice, hotel rooms, or tiny spaces. Your sound stays perfect, the volume drops to whisper-quiet! 🤫🎵 #RealMute #SilentPractice #TrumpetLife #MusicianProblems #ApartmentLiving #PracticeAnywhere #MusicTech #BrassLife #QuietPractice #MusicianHacks",
    twitter: "🎺 50dB noise reduction = apartment-friendly practice that doesn't compromise your sound! Real Mute is changing how musicians practice. No more angry neighbors! 🤫 #RealMute #SilentPractice #TrumpetLife"
  }
];

// 🎯 Content topics for AI generation
const CONTENT_TOPICS = [
  'silent practice tips for apartment musicians',
  'how 50dB noise reduction changes everything',
  'perfect intonation while practicing quietly',
  'Real Mute vs traditional practice mutes comparison',
  'late night practice sessions made possible',
  'hotel room practice for touring musicians',
  'neighbor-friendly music practice',
  'breakthrough practice mute technology',
  'maintaining embouchure with practice mutes',
  'professional musicians testimonials',
  'music student practice challenges solved',
  'acoustic engineering behind Real Mute',
  'practice efficiency tips',
  'conservatory practice room solutions',
  'urban musician lifestyle benefits'
];

// 🤖 Claude AI Integration
class ClaudeAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.anthropic.com/v1/messages';
  }

  async generateContent(topic) {
    const prompt = `You are an expert social media marketing AI for Real Mute Technologies, a company that makes revolutionary practice mutes for brass instruments with 50dB noise reduction.

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

Generate authentic, valuable content that musicians will engage with.`;

    try {
      console.log('Claude API: Starting request...');
      
      const response = await axios.post(this.baseURL, {
        model: 'claude-3-haiku-20240307',
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

      console.log('Claude API: Response received');
      const content = response.data.content[0].text;
      
      try {
        const parsed = JSON.parse(content);
        console.log('Claude API: JSON parsed successfully');
        return { success: true, data: parsed, provider: 'claude' };
      } catch (parseError) {
        console.log('Claude API: JSON parse failed, using fallback parser');
        return { success: true, data: this.parseContentFallback(content, topic), provider: 'claude' };
      }
    } catch (error) {
      console.error('Claude API Error Details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      return { success: false, error: `Claude API failed: ${error.message}` };
    }
  }

  parseContentFallback(content, topic) {
    return {
      facebook: content.substring(0, 300),
      linkedin: content.substring(0, 400),
      instagram: content.substring(0, 200) + '\n\n#realmute #practicemate #silentpractice #brassmusic',
      twitter: content.substring(0, 200) + ' #realmute #silentpractice',
      topic: topic
    };
  }
}

// 🧠 OpenAI Integration
class OpenAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.openai.com/v1/chat/completions';
  }

  async generateContent(topic) {
    const prompt = `Create social media content for Real Mute Technologies about: ${topic}

Real Mute is a revolutionary practice mute with 50dB noise reduction that maintains perfect intonation.

Create platform-specific content:
1. Facebook (casual, engaging, 100-200 words)
2. LinkedIn (professional, B2B focus, 150-250 words)
3. Instagram (visual, hashtag-rich, 80-150 words with hashtags)
4. Twitter (concise, under 280 characters)

Return ONLY valid JSON:
{
  "facebook": "content here",
  "linkedin": "content here",
  "instagram": "content here", 
  "twitter": "content here",
  "topic": "${topic}"
}`;

    try {
      const response = await axios.post(this.baseURL, {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a social media expert for Real Mute Technologies. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.7
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 30000
      });

      const content = response.data.choices[0].message.content;
      
      try {
        return { success: true, data: JSON.parse(content), provider: 'openai' };
      } catch {
        return { success: true, data: this.parseContentFallback(content, topic), provider: 'openai' };
      }
    } catch (error) {
      console.error('OpenAI API error:', error.message);
      return { success: false, error: error.message };
    }
  }

  parseContentFallback(content, topic) {
    return {
      facebook: content.substring(0, 300),
      linkedin: content.substring(0, 400),
      instagram: content.substring(0, 200) + '\n\n#realmute #silentpractice #musictech',
      twitter: content.substring(0, 200) + ' #realmute',
      topic: topic
    };
  }
}

// 🌟 Google Gemini Integration
class GeminiAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
  }

  async generateContent(topic) {
    const prompt = `Create social media marketing content for Real Mute Technologies about: ${topic}

Real Mute is a practice mute with 50dB noise reduction and perfect intonation.

Generate content for:
- Facebook: Casual, community-focused (100-200 words)
- LinkedIn: Professional, educational (150-250 words)
- Instagram: Visual, hashtag-rich (80-150 words)
- Twitter: Concise, engaging (under 280 chars)

Return as JSON format:
{
  "facebook": "content",
  "linkedin": "content", 
  "instagram": "content",
  "twitter": "content",
  "topic": "${topic}"
}`;

    try {
      const response = await axios.post(`${this.baseURL}?key=${this.apiKey}`, {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1500
        }
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      const content = response.data.candidates[0].content.parts[0].text;
      
      try {
        return { success: true, data: JSON.parse(content), provider: 'gemini' };
      } catch {
        return { success: true, data: this.parseContentFallback(content, topic), provider: 'gemini' };
      }
    } catch (error) {
      console.error('Gemini API error:', error.message);
      return { success: false, error: error.message };
    }
  }

  parseContentFallback(content, topic) {
    return {
      facebook: content.substring(0, 300),
      linkedin: content.substring(0, 400),
      instagram: content.substring(0, 200) + '\n\n#realmute #silentpractice #musictech',
      twitter: content.substring(0, 200) + ' #realmute',
      topic: topic
    };
  }
}

// 🎯 AI Content Generator with fallback strategy
class AIContentGenerator {
  constructor() {
    this.providers = [];
    
    // Initialize available providers
    if (process.env.CLAUDE_API_KEY) {
      this.providers.push(new ClaudeAI(process.env.CLAUDE_API_KEY));
    }
    
    if (process.env.OPENAI_API_KEY) {
      this.providers.push(new OpenAI(process.env.OPENAI_API_KEY));
    }
    
    if (process.env.GEMINI_API_KEY) {
      this.providers.push(new GeminiAI(process.env.GEMINI_API_KEY));
    }
    
    console.log(`Initialized ${this.providers.length} AI providers`);
  }

  async generateContent(topic) {
    console.log(`Generating content for topic: ${topic}`);
    
    // Try each AI provider in order
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      console.log(`Trying provider ${i + 1}/${this.providers.length}: ${provider.constructor.name}`);
      
      try {
        const result = await provider.generateContent(topic);
        
        if (result.success) {
          console.log(`Success with provider: ${result.provider}`);
          STORAGE.analytics.aiProviders[result.provider].used++;
          return result;
        }
      } catch (error) {
        console.error(`Provider ${provider.constructor.name} failed:`, error.message);
        const providerName = provider.constructor.name.toLowerCase().includes('claude') ? 'claude' :
                           provider.constructor.name.toLowerCase().includes('openai') ? 'openai' : 'gemini';
        STORAGE.analytics.aiProviders[providerName].errors++;
      }
    }
    
    // All AI providers failed, use fallback
    console.log('All AI providers failed, using fallback template');
    STORAGE.analytics.aiProviders.fallback.used++;
    
    const template = FALLBACK_TEMPLATES[Math.floor(Math.random() * FALLBACK_TEMPLATES.length)];
    return {
      success: true,
      data: {
        facebook: template.facebook,
        linkedin: template.linkedin,
        instagram: template.instagram,
        twitter: template.twitter,
        topic: template.topic
      },
      provider: 'fallback'
    };
  }
}

// 📊 Enhanced Dashboard HTML
const getDashboardHTML = () => {
  const stats = {
    total: STORAGE.contentQueue.length,
    posted: STORAGE.posts.length,
    pending: STORAGE.contentQueue.filter(item => !item.posted).length
  };

  const aiStats = STORAGE.analytics.aiProviders;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 AI Marketing Monster - Multi-AI System</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 1400px; margin: 0 auto; }
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
        .ai-banner {
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
            background-size: 300% 300%;
            animation: gradientShift 3s ease infinite;
            color: white;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
            font-weight: bold;
        }
        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
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
        .btn.danger { background: #dc3545; }
        .btn.ai { background: linear-gradient(45deg, #ff6b6b, #4ecdc4); }
        .ai-provider {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            margin: 5px 0;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #28a745;
        }
        .ai-provider.error { border-left-color: #dc3545; }
        .ai-provider.not-configured { border-left-color: #6c757d; opacity: 0.6; }
        .content-item {
            background: #e8f5e8;
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
            border-left: 4px solid #28a745;
            position: relative;
        }
        .provider-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            background: #667eea;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.7em;
            font-weight: bold;
        }
        .provider-badge.claude { background: #ff6b6b; }
        .provider-badge.openai { background: #4ecdc4; }
        .provider-badge.gemini { background: #45b7d1; }
        .provider-badge.fallback { background: #6c757d; }
        .copy-btn {
            background: #17a2b8;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8em;
            margin: 2px;
        }
        .copy-btn:hover { background: #138496; }
        .content-text {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            margin: 8px 0;
            font-size: 0.9em;
            max-height: 100px;
            overflow: hidden;
        }
        .platform-label {
            font-weight: bold;
            color: #667eea;
            display: block;
            margin: 10px 0 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 AI Marketing Monster</h1>
            <p>Multi-AI Content Generation System</p>
            <div style="background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; display: inline-block; margin-top: 10px;">
                MULTI-AI POWERED
            </div>
        </div>

        <div class="ai-banner">
            🤖 Powered by Claude AI + ChatGPT + Gemini + Smart Fallbacks = Unstoppable Content!
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
                        <div class="stat-label">Ready to Post</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${STORAGE.analytics.totalPosts}</div>
                        <div class="stat-label">All Time</div>
                    </div>
                </div>
                <div>
                    <button class="btn ai" onclick="generateContent()">🤖 Generate AI Content</button>
                    <button class="btn success" onclick="postNow()">📘 Post to Facebook</button>
                    <button class="btn danger" onclick="clearAll()">🗑️ Clear All</button>
                    <button class="btn" onclick="location.reload()">🔄 Refresh</button>
                </div>
            </div>

            <div class="card">
                <h3>🤖 AI Providers Status</h3>
                <div class="ai-provider ${process.env.CLAUDE_API_KEY ? '' : 'not-configured'}">
                    <div>
                        <strong>🔥 Claude AI</strong><br>
                        <small>${process.env.CLAUDE_API_KEY ? 'Configured' : 'Not configured'}</small>
                    </div>
                    <div>Used: ${aiStats.claude.used} | Errors: ${aiStats.claude.errors}</div>
                </div>
                
                <div class="ai-provider ${process.env.OPENAI_API_KEY ? '' : 'not-configured'}">
                    <div>
                        <strong>🧠 ChatGPT (OpenAI)</strong><br>
                        <small>${process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured'}</small>
                    </div>
                    <div>Used: ${aiStats.openai.used} | Errors: ${aiStats.openai.errors}</div>
                </div>
                
                <div class="ai-provider ${process.env.GEMINI_API_KEY ? '' : 'not-configured'}">
                    <div>
                        <strong>⭐ Google Gemini</strong><br>
                        <small>${process.env.GEMINI_API_KEY ? 'Configured' : 'Not configured'}</small>
                    </div>
                    <div>Used: ${aiStats.gemini.used} | Errors: ${aiStats.gemini.errors}</div>
                </div>
                
                <div class="ai-provider">
                    <div>
                        <strong>🛡️ Smart Fallback</strong><br>
                        <small>Always available</small>
                    </div>
                    <div>Used: ${aiStats.fallback.used}</div>
                </div>
            </div>

            <div class="card">
                <h3>📝 Recent AI-Generated Content</h3>
                <div style="max-height: 500px; overflow-y: auto;">
                    ${STORAGE.contentQueue.slice(-3).reverse().map(item => `
                        <div class="content-item">
                            <div class="provider-badge ${item.provider || 'unknown'}">${(item.provider || 'unknown').toUpperCase()}</div>
                            <strong>${item.topic}</strong>
                            <div>
                                <span class="platform-label">📘 Facebook:</span>
                                <div class="content-text">${item.content.facebook}</div>
                                <button class="copy-btn" onclick="copyText('${item.content.facebook.replace(/'/g, "\\'")}')">Copy FB</button>
                                
                                <span class="platform-label">💼 LinkedIn:</span>
                                <div class="content-text">${item.content.linkedin}</div>
                                <button class="copy-btn" onclick="copyText('${item.content.linkedin.replace(/'/g, "\\'")}')">Copy LI</button>
                                
                                <span class="platform-label">📸 Instagram:</span>
                                <div class="content-text">${item.content.instagram}</div>
                                <button class="copy-btn" onclick="copyText('${item.content.instagram.replace(/'/g, "\\'")}')">Copy IG</button>
                                
                                <span class="platform-label">🐦 Twitter:</span>
                                <div class="content-text">${item.content.twitter}</div>
                                <button class="copy-btn" onclick="copyText('${item.content.twitter.replace(/'/g, "\\'")}')">Copy TW</button>
                            </div>
                        </div>
                    `).join('') || '<p>No content yet. Click "Generate AI Content" to start!</p>'}
                </div>
            </div>

            <div class="card">
                <h3>📘 Facebook Posts</h3>
                <div style="max-height: 300px; overflow-y: auto;">
                    ${STORAGE.posts.slice(-3).reverse().map(post => `
                        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #2196f3;">
                            <div style="font-size: 0.8em; color: #666; margin-bottom: 5px;">
                                Posted: ${new Date(post.postedAt).toLocaleString()}
                            </div>
                            <div style="font-weight: bold; margin-bottom: 5px;">${post.topic}</div>
                            <div style="font-size: 0.9em;">${post.content.substring(0, 150)}...</div>
                            ${post.postId ? `<div style="font-size: 0.8em; color: #666; margin-top: 5px;">Post ID: ${post.postId}</div>` : ''}
                        </div>
                    `).join('') || '<p>No posts yet. Generate content and post to Facebook!</p>'}
                </div>
            </div>
        </div>
    </div>

    <script>
        async function generateContent() {
            const btn = event.target;
            btn.disabled = true;
            btn.textContent = '🤖 Generating with AI...';
            
            try {
                const response = await fetch('/.netlify/functions/api', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'generate' })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert(\`✅ Content generated with \${result.provider.toUpperCase()}!\`);
                    location.reload();
                } else {
                    alert('❌ Error: ' + result.error);
                }
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
            
            btn.disabled = false;
            btn.textContent = '🤖 Generate AI Content';
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

        async function clearAll() {
            if (confirm('Clear all content and posts?')) {
                try {
                    await fetch('/.netlify/functions/api', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'clear' })
                    });
                    
                    alert('✅ All data cleared!');
                    location.reload();
                } catch (error) {
                    alert('❌ Error: ' + error.message);
                }
            }
        }

        async function copyText(text) {
            try {
                await navigator.clipboard.writeText(text);
                
                const btn = event.target;
                const originalText = btn.textContent;
                btn.textContent = '✅ Copied!';
                btn.style.background = '#28a745';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '#17a2b8';
                }, 2000);
            } catch (error) {
                alert('Failed to copy text');
            }
        }
    </script>
</body>
</html>
  `;
};

// 🚀 Main handler function
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

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
      const { action } = JSON.parse(event.body || '{}');

      switch (action) {
        case 'generate':
          console.log('=== GENERATE ACTION STARTED ===');
          
          try {
            const generator = new AIContentGenerator();
            const topic = CONTENT_TOPICS[Math.floor(Math.random() * CONTENT_TOPICS.length)];
            
            console.log(`Selected topic: ${topic}`);
            const result = await generator.generateContent(topic);
            
            if (result.success) {
              const contentItem = {
                id: Date.now().toString(),
                topic: result.data.topic || topic,
                content: {
                  facebook: result.data.facebook,
                  linkedin: result.data.linkedin,
                  instagram: result.data.instagram,
                  twitter: result.data.twitter
                },
                generatedAt: new Date().toISOString(),
                posted: false,
                provider: result.provider
              };

              STORAGE.contentQueue.push(contentItem);
              console.log(`Content generated successfully with ${result.provider}`);

              return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                  success: true, 
                  content: contentItem, 
                  provider: result.provider 
                })
              };
            } else {
              console.error('All AI providers failed');
              return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                  success: false, 
                  error: 'All AI providers failed to generate content',
                  details: result.error 
                })
              };
            }
          } catch (generateError) {
            console.error('Generate case error:', generateError);
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ 
                success: false, 
                error: 'Generation failed: ' + generateError.message 
              })
            };
          }

        case 'post':
          const readyContent = STORAGE.contentQueue.find(item => !item.posted);
          
          if (!readyContent) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ success: false, error: 'No content available to post' })
            };
          }

          // Check if Facebook is configured
          if (!process.env.FACEBOOK_ACCESS_TOKEN || !process.env.FACEBOOK_PAGE_ID) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ success: false, error: 'Facebook credentials not configured' })
            };
          }

          try {
            // Post to Facebook
            const postData = {
              message: readyContent.content.facebook,
              link: 'https://real-mute-lp.netlify.app',
              access_token: process.env.FACEBOOK_ACCESS_TOKEN
            };

            const fbResponse = await axios.post(
              `https://graph.facebook.com/v18.0/${process.env.FACEBOOK_PAGE_ID}/feed`,
              postData,
              { timeout: 30000 }
            );

            // Mark as posted
            readyContent.posted = true;
            
            // Add to posts
            STORAGE.posts.push({
              id: readyContent.id,
              content: readyContent.content.facebook,
              postId: fbResponse.data.id,
              postedAt: new Date().toISOString(),
              topic: readyContent.topic,
              provider: readyContent.provider
            });

            STORAGE.analytics.totalPosts += 1;
            console.log(`Posted to Facebook successfully: ${fbResponse.data.id}`);

            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ 
                success: true, 
                postId: fbResponse.data.id,
                provider: readyContent.provider 
              })
            };

          } catch (fbError) {
            console.error('Facebook posting error:', fbError.message);
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ 
                success: false, 
                error: 'Facebook posting failed: ' + fbError.message 
              })
            };
          }

        case 'clear':
          STORAGE.posts = [];
          STORAGE.contentQueue = [];
          STORAGE.analytics.totalPosts = 0;
          STORAGE.analytics.aiProviders = {
            claude: { used: 0, errors: 0 },
            openai: { used: 0, errors: 0 },
            gemini: { used: 0, errors: 0 },
            fallback: { used: 0, errors: 0 }
          };

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
          };

        case 'stats':
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              stats: {
                total: STORAGE.contentQueue.length,
                posted: STORAGE.posts.length,
                pending: STORAGE.contentQueue.filter(item => !item.posted).length,
                aiProviders: STORAGE.analytics.aiProviders
              }
            })
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
