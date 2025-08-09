// 📁 netlify/functions/api.js - Replace ENTIRE file with this:

const fetch = require('node-fetch');

// Data storage
let contentStore = [];
let systemStats = { totalGenerated: 0, totalPosted: 0, errors: [] };

// Facebook function
async function postToFacebook(content) {
  try {
    console.log('🔄 Facebook: Starting...');
    
    const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    const pageId = process.env.FACEBOOK_PAGE_ID;
    
    console.log('Token exists:', !!token);
    console.log('Page ID:', pageId);
    
    if (!token || !pageId) {
      return { success: false, platform: 'facebook', error: 'Missing credentials' };
    }

    const url = `https://graph.facebook.com/v19.0/${pageId}/feed`;
    const body = `message=${encodeURIComponent(content)}&access_token=${token}`;
    
    console.log('Posting to:', url);
    console.log('Content length:', content.length);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body
    });

    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', result);

    if (response.ok) {
      const data = JSON.parse(result);
      console.log('✅ Facebook SUCCESS:', data.id);
      return { 
        success: true, 
        platform: 'facebook', 
        postId: data.id 
      };
    } else {
      console.log('❌ Facebook FAILED:', result);
      return { 
        success: false, 
        platform: 'facebook', 
        error: result 
      };
    }

  } catch (error) {
    console.log('❌ Facebook ERROR:', error.message);
    return { 
      success: false, 
      platform: 'facebook', 
      error: error.message 
    };
  }
}

// LinkedIn function
async function postToLinkedIn(content) {
  try {
    if (!process.env.LINKEDIN_ACCESS_TOKEN) {
      return { success: false, platform: 'linkedin', error: 'No LinkedIn token' };
    }

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify({
        author: `urn:li:person:${process.env.LINKEDIN_PERSON_ID}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
      })
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, platform: 'linkedin', postId: data.id };
    } else {
      return { success: false, platform: 'linkedin', error: 'LinkedIn failed' };
    }
  } catch (error) {
    return { success: false, platform: 'linkedin', error: error.message };
  }
}

// Content generation
async function generateContent() {
  try {
    if (!process.env.CLAUDE_API_KEY) {
      throw new Error('Claude API key missing');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: 'Create a short social media post about Real Mute practice technology for trumpet players. Include emojis and keep under 200 characters.'
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    systemStats.totalGenerated++;
    
    return { 
      text: data.content[0].text,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Content generation failed: ${error.message}`);
  }
}

// Main publishing
async function publishContent() {
  try {
    console.log('🚀 Publishing...');
    
    const content = await generateContent();
    console.log('Content:', content.text);
    
    const results = [];
    
    // Facebook
    const fbResult = await postToFacebook(content.text);
    results.push(fbResult);
    
    // LinkedIn  
    const liResult = await postToLinkedIn(content.text);
    results.push(liResult);
    
    // Store
    contentStore.unshift({ ...content, results, id: Date.now() });
    if (contentStore.length > 20) contentStore = contentStore.slice(0, 20);
    
    const successful = results.filter(r => r.success).length;
    systemStats.totalPosted += successful;
    
    return results;
  } catch (error) {
    console.error('Publishing error:', error);
    throw error;
  }
}

// 🔥 MAIN HANDLER - FIXED JSON RESPONSES
exports.handler = async (event, context) => {
  console.log('🌐 API Request:', event.httpMethod, event.path);
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Get path
  const path = event.path.replace('/.netlify/functions/api', '') || '/';
  console.log('📍 Processed path:', path);

  try {
    // Route: Dashboard data (GET /)
    if (path === '/' && event.httpMethod === 'GET') {
      const response = {
        success: true,
        stats: systemStats,
        recentContent: contentStore.slice(0, 10),
        timestamp: new Date().toISOString(),
        message: 'Dashboard data loaded'
      };
      
      console.log('📊 Dashboard response:', response);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response)
      };
    }

    // Route: Generate content (POST /generate)
    if (path === '/generate' && event.httpMethod === 'POST') {
      try {
        const results = await publishContent();
        
        const response = {
          success: true,
          message: 'Content generated and posted',
          results: results,
          stats: systemStats,
          timestamp: new Date().toISOString()
        };
        
        console.log('✅ Generate success:', response);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(response)
        };
      } catch (error) {
        console.error('❌ Generate error:', error);
        
        const response = {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
        
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify(response)
        };
      }
    }

    // Route: Test Facebook (POST /test-facebook)
    if (path === '/test-facebook' && event.httpMethod === 'POST') {
      try {
        const testContent = '🎺 Test from Real Mute AI! ' + new Date().toLocaleTimeString();
        const result = await postToFacebook(testContent);
        
        const response = {
          success: true,
          message: 'Facebook test completed',
          result: result,
          timestamp: new Date().toISOString()
        };
        
        console.log('🧪 Facebook test:', response);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(response)
        };
      } catch (error) {
        console.error('❌ Facebook test error:', error);
        
        const response = {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
        
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify(response)
        };
      }
    }

    // Route: Clear data (POST /clear)
    if (path === '/clear' && event.httpMethod === 'POST') {
      contentStore = [];
      systemStats = { totalGenerated: 0, totalPosted: 0, errors: [] };
      
      const response = {
        success: true,
        message: 'All data cleared',
        timestamp: new Date().toISOString()
      };
      
      console.log('🗑️ Data cleared');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response)
      };
    }

    // Route: Health check (GET /health)
    if (path === '/health' && event.httpMethod === 'GET') {
      const response = {
        success: true,
        status: 'healthy',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: {
          hasClaudeKey: !!process.env.CLAUDE_API_KEY,
          hasFacebookToken: !!process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
          hasFacebookPageId: !!process.env.FACEBOOK_PAGE_ID,
          hasLinkedInToken: !!process.env.LINKEDIN_ACCESS_TOKEN
        }
      };
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response)
      };
    }

    // Default: 404 Not Found
    const response = {
      success: false,
      error: 'Route not found',
      path: path,
      method: event.httpMethod,
      availableRoutes: [
        'GET /',
        'POST /generate', 
        'POST /test-facebook',
        'POST /clear',
        'GET /health'
      ],
      timestamp: new Date().toISOString()
    };
    
    console.log('❌ 404:', response);
    
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    
    const response = {
      success: false,
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    };
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(response)
    };
  }
};
