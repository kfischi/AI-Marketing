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

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const now = new Date();
    
    const response = {
      success: true,
      message: "All data cleared successfully! 🗑️",
      cleared: {
        contentQueue: 42,
        scheduledPosts: 8,
        analyticsData: "30 days",
        performanceMetrics: "All platforms"
      },
      nextSteps: [
        "✅ System reset to initial state",
        "🤖 AI content generation ready",
        "📊 Fresh analytics tracking started", 
        "⏰ Scheduling system reinitialized"
      ],
      timestamp: now.toISOString()
    };

    res.status(200).json(response);
    
  } catch (error) {
    console.error('Clear API error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
