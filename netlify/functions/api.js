// 📁 netlify/functions/api.js - Copy this ENTIRE file

const fetch = require('node-fetch');

// Data storage
let contentStore = [];
let systemStats = { totalGenerated: 0, totalPosted: 0, errors: [] };

// 🔥 SIMPLE Facebook function that works
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

    // Simple POST request
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

    const data = await response.json();
    return { text: data.content[0].text };
  } catch (error) {
    throw new Error('Content generation failed');
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
    systemStats.totalGenerated++;
    
    return results;
  } catch (error) {
    throw error;
  }
}

// Main handler
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path.replace('/.netlify/functions/api', '') || '/';

  try {
    // Dashboard
    if (path === '/' && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          stats: systemStats,
          recentContent: contentStore.slice(0, 5)
        })
      };
    }

    // Generate content
    if (path === '/generate' && event.httpMethod === 'POST') {
      const results = await publishContent();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          results: results,
          stats: systemStats
        })
      };
    }

    // Test Facebook
    if (path === '/test-facebook' && event.httpMethod === 'POST') {
      const result = await postToFacebook('🎺 Test from Real Mute!');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ result })
      };
    }

    // Clear data
    if (path === '/clear' && event.httpMethod === 'POST') {
      contentStore = [];
      systemStats = { totalGenerated: 0, totalPosted: 0, errors: [] };
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
