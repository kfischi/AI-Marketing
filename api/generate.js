const fetch = require('node-fetch');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const content = await generateContent();
    
    const response = {
      success: true,
      message: "Content generated successfully!",
      content: content,
      timestamp: new Date().toISOString(),
      platforms: ["facebook", "instagram", "linkedin"]
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function generateContent() {
  const prompts = [
    "Create an engaging social media post about Real Mute's 50dB noise reduction technology for trumpet practice.",
    "Write about how Real Mute solves apartment practice problems for brass musicians.",
    "Create content about maintaining perfect intonation while practicing silently with Real Mute.",
    "Write about the freedom Real Mute gives musicians to practice anytime, anywhere.",
    "Create a motivational post about consistent practice habits using Real Mute technology."
  ];

  const selectedPrompt = prompts[Math.floor(Math.random() * prompts.length)];

  // If Claude API is configured, use it
  if (process.env.CLAUDE_API_KEY) {
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
            content: `${selectedPrompt}

Requirements:
- Keep under 280 characters for social media
- Include relevant emojis
- Add a clear call-to-action
- Make it engaging and authentic
- Focus on Real Mute benefits
- End with relevant hashtags`
          }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          text: data.content[0].text,
          source: "claude-ai",
          prompt: selectedPrompt
        };
      }
    } catch (error) {
      console.error('Claude API error:', error);
    }
  }

  // Fallback content if Claude API is not available
  const fallbackContent = [
    "🎺 Practice without limits! Real Mute's 50dB noise reduction lets you play anytime, anywhere. Perfect intonation, zero back-pressure. Transform your practice routine today! #RealMute #SilentPractice #TrumpetPractice #MusicTech",
    "🏠 Apartment living doesn't mean giving up your music! Real Mute technology delivers studio-quality silent practice. Your neighbors will thank you! 🤫 #RealMute #ApartmentPractice #SilentMusic #BrassInstruments",
    "⏰ Late night practice session? Early morning warmup? With Real Mute, practice on YOUR schedule. 50dB noise reduction = unlimited practice time! #RealMute #PracticeAnytime #MusicianLife #SilentPractice",
    "🎯 Maintain perfect pitch while practicing silently! Real Mute preserves your instrument's natural intonation. No more compromising between volume and accuracy! #RealMute #PerfectPitch #MusicPractice #BrassPlayers",
    "💪 Consistency is key to musical excellence. Real Mute removes all barriers to daily practice. Practice more, improve faster, achieve your musical goals! #RealMute #DailyPractice #MusicGoals #PracticeMotivation"
  ];

  return {
    text: fallbackContent[Math.floor(Math.random() * fallbackContent.length)],
    source: "fallback",
    prompt: selectedPrompt
  };
}
