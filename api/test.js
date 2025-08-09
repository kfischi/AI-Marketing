export default function handler(req, res) {
  // Set headers first
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const response = {
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

    return res.status(200).json(response);

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
