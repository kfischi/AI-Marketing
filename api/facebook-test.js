const fetch = require('node-fetch');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('🧪 Starting Facebook test...');
    
    const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    const pageId = process.env.FACEBOOK_PAGE_ID;

    if (!pageToken || !pageId) {
      return res.status(200).json({
        success: false,
        error: "Facebook credentials not configured",
        details: {
          hasToken: !!pageToken,
          hasPageId: !!pageId,
          message: "Please add FACEBOOK_PAGE_ACCESS_TOKEN and FACEBOOK_PAGE_ID to environment variables"
        },
        timestamp: new Date().toISOString()
      });
    }

    console.log('📋 Credentials found, testing token validity...');

    // Step 1: Test token validity
    const tokenTest = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${pageToken}`);
    const tokenData = await tokenTest.json();

    if (!tokenTest.ok) {
      return res.status(200).json({
        success: false,
        error: "Facebook token invalid",
        details: {
          step: "token_validation",
          statusCode: tokenTest.status,
          facebookError: tokenData.error
        },
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ Token valid, testing page access...');

    // Step 2: Test page access
    const pageTest = await fetch(`https://graph.facebook.com/v19.0/${pageId}?access_token=${pageToken}`);
    const pageData = await pageTest.json();

    if (!pageTest.ok) {
      return res.status(200).json({
        success: false,
        error: "Cannot access Facebook page",
        details: {
          step: "page_access",
          statusCode: pageTest.status,
          facebookError: pageData.error,
          pageId: pageId
        },
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ Page accessible, attempting test post...');

    // Step 3: Attempt test post
    const testMessage = `🧪 Test post from Real Mute AI Marketing System
    
🎺 Testing automated posting functionality
⏰ ${new Date().toLocaleString()}
🔗 Visit: www.realmute.com

#RealMute #TestPost #AIMarketing`;

    const postResponse = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        message: testMessage,
        access_token: pageToken
      }).toString()
    });

    const postData = await postResponse.json();

    if (postResponse.ok && postData.id) {
      console.log('🎉 Test post successful!');
      return res.status(200).json({
        success: true,
        message: "Facebook test completed successfully! 🎉",
        details: {
          tokenValid: true,
          pageAccessible: true,
          postCreated: true,
          postId: postData.id,
          postUrl: `https://facebook.com/${postData.id}`,
          accountName: tokenData.name,
          pageName: pageData.name,
          pageId: pageData.id,
          pageFollowers: pageData.followers_count || 'N/A'
        },
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('❌ Post creation failed:', postData);
      return res.status(200).json({
        success: false,
        error: "Failed to create test post",
        details: {
          step: "post_creation",
          tokenValid: true,
          pageAccessible: true,
          statusCode: postResponse.status,
          facebookError: postData.error,
          accountName: tokenData.name,
          pageName: pageData.name
        },
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Facebook test error:', error);
    return res.status(200).json({
      success: false,
      error: error.message,
      details: {
        step: "connection_error",
        stack: error.stack
      },
      timestamp: new Date().toISOString()
    });
  }
}
