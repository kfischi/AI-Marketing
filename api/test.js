export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const systemInfo = {
      success: true,
      message: "Real Mute AI Marketing System is operational!",
      timestamp: new Date().toISOString(),
      system: {
        status: "online",
        version: "1.0.0",
        environment: "production"
      },
      apis: {
        claude: process.env.CLAUDE_API_KEY ? "configured" : "missing",
        facebook: process.env.FACEBOOK_PAGE_ACCESS_TOKEN ? "configured" : "missing",
        instagram: process.env.INSTAGRAM_ACCESS_TOKEN ? "configured" : "missing",
        linkedin: process.env.LINKEDIN_ACCESS_TOKEN ? "configured" : "missing"
      },
      features: {
        contentGeneration: true,
        socialMediaPosting: true,
        analytics: true,
        scheduling: true
      }
    };

    res.status(200).json(systemInfo);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
