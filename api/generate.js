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
      platforms: ["facebook", "instagram", "linkedin"],
      aiUsed: content.source
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
    "Create a motivational post about consistent practice habits using Real Mute technology.",
    "Write about Real Mute being perfect for backstage warmups and recording studios.",
    "Create content about how Real Mute preserves embouchure and prevents bad habits.",
    "Write about the science behind Real Mute's acoustic engineering breakthrough.",
    "Create content about Real Mute testimonials from professional musicians.",
    "Write about how Real Mute helps music students practice in dorms and apartments."
  ];

  const selectedPrompt = prompts[Math.floor(Math.random() * prompts.length)];

  const basePrompt = `${selectedPrompt}

Requirements:
- Keep under 200 characters for main content
- Include relevant emojis
- Add a clear call-to-action
- Make it engaging and authentic
- Focus on Real Mute benefits
- End with 2-3 relevant hashtags
- DO NOT include website links - we'll add them separately`;

  // Try Claude first
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
          messages: [{ role: 'user', content: basePrompt }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        return addLinksToContent(data.content[0].text, "claude-ai", selectedPrompt);
      }
    } catch (error) {
      console.error('Claude API error:', error);
    }
  }

  // Try OpenAI GPT if Claude fails
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          max_tokens: 200,
          messages: [{ role: 'user', content: basePrompt }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        return addLinksToContent(data.choices[0].message.content, "openai-gpt4", selectedPrompt);
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
    }
  }

  // Try Google Gemini if others fail
  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: basePrompt }]
          }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        return addLinksToContent(data.candidates[0].content.parts[0].text, "google-gemini", selectedPrompt);
      }
    } catch (error) {
      console.error('Gemini API error:', error);
    }
  }

  // Enhanced fallback content with website links
  const fallbackContent = [
    "🎺 Practice without limits! Real Mute's 50dB noise reduction lets you play anytime, anywhere. Perfect intonation, zero back-pressure. #RealMute #SilentPractice",
    
    "🏠 Apartment living doesn't mean giving up your music! Real Mute technology delivers studio-quality silent practice. Your neighbors will thank you! 🤫 #RealMute #ApartmentPractice",
    
    "⏰ Late night practice session? Early morning warmup? With Real Mute, practice on YOUR schedule. 50dB noise reduction = unlimited practice time! #RealMute #PracticeAnytime",
    
    "🎯 Maintain perfect pitch while practicing silently! Real Mute preserves your instrument's natural intonation. No more compromising! #RealMute #PerfectPitch",
    
    "💪 Consistency is key to musical excellence. Real Mute removes all barriers to daily practice. Practice more, improve faster! #RealMute #DailyPractice",
    
    "🎭 Backstage warmups just got easier! Real Mute lets you prepare without disturbing anyone. Professional musicians trust Real Mute! #RealMute #Professional",
    
    "🔬 Revolutionary acoustic engineering meets practical design. Real Mute's 50dB reduction isn't just quiet - it's scientifically precise! #RealMute #Innovation",
    
    "🎼 Recording studios love Real Mute for control room practice and silent overdubs. Zero interference, perfect sound isolation! #RealMute #Studio",
    
    "⭐ 'Finally, a mute that doesn't compromise my sound!' - Professional musician testimonial. Experience the Real Mute difference! #RealMute #Testimonial",
    
    "🎓 Music students rejoice! Practice in your dorm without complaints. Real Mute makes silent practice sessions incredibly effective! #RealMute #Students"
  ];

  const selectedContent = fallbackContent[Math.floor(Math.random() * fallbackContent.length)];
  return addLinksToContent(selectedContent, "fallback", selectedPrompt);
}

function addLinksToContent(content, source, prompt) {
  // Clean the content
  let cleanContent = content.trim();
  
  // Randomly choose between different link strategies
  const linkTypes = [
    // Main website
    {
      text: "\n\n🌐 Discover Real Mute: www.realmute.com",
      cta: "🛒 Order yours today!"
    },
    // Practice guide
    {
      text: "\n\n🎯 Free Practice Guide: realmute.com/guide",
      cta: "📖 Download now!"
    },
    // Product page
    {
      text: "\n\n🎺 Shop Real Mute: realmute.com/shop",
      cta: "✨ Transform your practice!"
    },
    // Demo page
    {
      text: "\n\n🎧 Hear the difference: realmute.com/demo",
      cta: "🔊 Listen to samples!"
    }
  ];

  const selectedLink = linkTypes[Math.floor(Math.random() * linkTypes.length)];
  
  return {
    text: cleanContent + selectedLink.text + "\n" + selectedLink.cta,
    source: source,
    prompt: prompt,
    hasWebsiteLink: true,
    linkType: selectedLink.text.includes('www.') ? 'main_website' : 'landing_page'
  };
}
