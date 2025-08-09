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

    if (!pageToken || !pageId) {
      return res.status(200).json({
        success: false,
        error: "Facebook credentials missing",
        details: {
          hasToken: !!pageToken,
          hasPageId: !!pageId,
          message: "Add FACEBOOK_PAGE_ACCESS_TOKEN and FACEBOOK_PAGE_ID to Vercel environment variables"
        }
      });
    }

    // Test Facebook API connection
    const testUrl = `https://graph.facebook.com/v19.0/me?access_token=${pageToken}`;
    const response = await fetch(testUrl);
    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({
        success: false,
        error: "Facebook API error",
        details: data
      });
    }

    return res.status(200).json({
      success: true,
      message: "Facebook connection successful!",
      details: {
        accountName: data.name,
        accountId: data.id,
        tokenValid: true
      }
    });

  } catch (error) {
    return res.status(200).json({
      success: false,
      error: error.message,
      details: "Connection failed"
    });
  }
}
