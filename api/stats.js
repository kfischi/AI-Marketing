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
    // In a real app, this would come from a database
    const stats = {
      success: true,
      postsToday: Math.floor(Math.random() * 10) + 1,
      totalPosts: Math.floor(Math.random() * 500) + 100,
      platformsActive: 3,
      engagement: {
        likes: Math.floor(Math.random() * 1000) + 500,
        comments: Math.floor(Math.random() * 200) + 100,
        shares: Math.floor(Math.random() * 100) + 50
      },
      platforms: {
        facebook: {
          status: "active",
          posts: Math.floor(Math.random() * 200) + 50,
          engagement: Math.floor(Math.random() * 500) + 200
        },
        instagram: {
          status: "active", 
          posts: Math.floor(Math.random() * 150) + 30,
          engagement: Math.floor(Math.random() * 400) + 150
        },
        linkedin: {
          status: "active",
          posts: Math.floor(Math.random() * 100) + 20,
          engagement: Math.floor(Math.random() * 300) + 100
        }
      },
      timestamp: new Date().toISOString()
    };

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
