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
    // In a real app, this would come from a database
    // For now, we'll simulate realistic data
    const now = new Date();
    const today = now.toDateString();
    
    // Simulate daily posts based on time of day
    const hour = now.getHours();
    const postsToday = Math.floor(hour / 4) + Math.floor(Math.random() * 3);
    
    // Simulate growing totals
    const daysSinceStart = Math.floor((now - new Date('2025-01-01')) / (1000 * 60 * 60 * 24));
    const totalPosts = daysSinceStart * 4 + postsToday + Math.floor(Math.random() * 50);
    
    // Check which platforms are configured
    let platformsActive = 0;
    if (process.env.FACEBOOK_PAGE_ACCESS_TOKEN) platformsActive++;
    if (process.env.INSTAGRAM_ACCESS_TOKEN) platformsActive++;
    if (process.env.LINKEDIN_ACCESS_TOKEN) platformsActive++;
    
    const stats = {
      success: true,
      postsToday: postsToday,
      totalPosts: totalPosts,
      platformsActive: platformsActive,
      engagement: {
        likes: Math.floor(totalPosts * 15 + Math.random() * 100),
        comments: Math.floor(totalPosts * 3 + Math.random() * 50),
        shares: Math.floor(totalPosts * 2 + Math.random() * 25),
        clicks: Math.floor(totalPosts * 8 + Math.random() * 75)
      },
      platforms: {
        facebook: {
          status: process.env.FACEBOOK_PAGE_ACCESS_TOKEN ? "active" : "inactive",
          posts: Math.floor(totalPosts * 0.4),
          engagement: Math.floor(totalPosts * 6 + Math.random() * 200)
        },
        instagram: {
          status: process.env.INSTAGRAM_ACCESS_TOKEN ? "active" : "inactive", 
          posts: Math.floor(totalPosts * 0.35),
          engagement: Math.floor(totalPosts * 8 + Math.random() * 150)
        },
        linkedin: {
          status: process.env.LINKEDIN_ACCESS_TOKEN ? "active" : "inactive",
          posts: Math.floor(totalPosts * 0.25),
          engagement: Math.floor(totalPosts * 4 + Math.random() * 100)
        }
      },
      performance: {
        averageEngagementRate: (3.5 + Math.random() * 2).toFixed(1) + "%",
        bestPerformingPlatform: "instagram",
        todayReach: Math.floor(totalPosts * 50 + Math.random() * 500),
        weeklyGrowth: (12 + Math.random() * 8).toFixed(1) + "%"
      },
      lastUpdated: now.toISOString(),
      timestamp: now.toISOString()
    };

    res.status(200).json(stats);
    
  } catch (error) {
    console.error('Stats API error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
