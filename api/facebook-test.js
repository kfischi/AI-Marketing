const fetch = require('node-fetch');

export default async function handler(req, res) {
  // Set CORS headers first
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    const pageId = process.env.FACEBOOK_PAGE_ID;

    console.log('🔍 Testing Facebook connection...');
    console.log('Has token:', !!pageToken);
    console.log('Has page ID:', !!pageId);

    if (!pageToken || !pageId) {
      return res.status(200).json({
        success: false,
        error: "Facebook credentials missing",
        details: {
          hasToken: !!pageToken,
          hasPageId: !!pageId,
          message: "Add FACEBOOK_PAGE_ACCESS_TOKEN and FACEBOOK_PAGE_ID to Vercel environment variables"
        },
        timestamp: new Date().toISOString()
      });
    }

    // Test Facebook API connection
    console.log('🌐 Testing Facebook Graph API...');
    const testUrl = `https://graph.facebook.com/v19.0/me?access_token=${pageToken}`;
    const response = await fetch(testUrl);
    const data = await response.json();

    console.log('📊 Facebook API response:', response.status, data);

    if (!response.ok) {
      return res.status(200).json({
        success: false,
        error: "Facebook API error",
        details: {
          status: response.status,
          facebookError: data.error || data,
          message: "Token may be invalid or expired"
        },
        timestamp: new Date().toISOString()
      });
    }

    // Test page access
    console.log('📄 Testing page access...');
    const pageUrl = `https://graph.facebook.com/v19.0/${pageId}?access_token=${pageToken}`;
    const pageResponse = await fetch(pageUrl);
    const pageData = await pageResponse.json();

    if (!pageResponse.ok) {
      return res.status(200).json({
        success: false,
        error: "Cannot access Facebook page",
        details: {
          status: pageResponse.status,
          pageId: pageId,
          facebookError: pageData.error || pageData
        },
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ Facebook test successful!');
    return res.status(200).json({
      success: true,
      message: "Facebook connection successful! 🎉",
      details: {
        accountName: data.name,
        accountId: data.id,
        pageName: pageData.name,
        pageId: pageData.id,
        tokenValid: true,
        pageAccessible: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Facebook test error:', error);
    return res.status(200).json({
      success: false,
      error: error.message,
      details: {
        type: "Connection error",
        stack: error.stack
      },
      timestamp: new Date().toISOString()
    });
  }
}
