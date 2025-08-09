const fetch = require('node-fetch');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    console.log('🤖 Generating content...');
    const content = await generateContent();
    
    const response = {
      success: true,
      message: "Content generated successfully!",
      content: content,
      timestamp: new Date().toISOString(),
      platforms: ["facebook", "instagram", "linkedin"]
    };

    console.log('✅ Content generated successfully');
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ Generate content error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function generateContent() {
  const contentTemplates = [
    {
      text: "🌅 Start your day with perfect practice! Real Mute's 50dB noise reduction means you can warm up anytime without disturbing anyone. Perfect intonation, zero complaints! 🎺 www.realmute.com #MorningPractice #RealMute #SilentPractice #TrumpetLife",
      type: "motivational"
    },
    {
      text: "💡 Practice Tip: Maintain your embouchure strength even with a mute! Real Mute's zero back-pressure design lets you practice exactly like you perform. Transform your routine today! 🎯 realmute.com/guide #PracticeTips #TrumpetTechnique #MusicEducation",
      type: "educational"
    },
    {
      text: "🏠 Apartment living doesn't mean giving up your music! Real Mute technology delivers studio-quality silent practice. Your neighbors will thank you! 🤫 Try it risk-free: realmute.com/demo #ApartmentPractice #SilentMusic #BrassInstruments",
      type: "lifestyle"
    },
    {
      text: "🎭 Behind the scenes: Professional musicians use Real Mute for backstage warmups before major performances. No sound leakage, perfect preparation! What's your pre-performance routine? 🎪 realmute.com/shop #ProfessionalMusic #BackstagePractice",
      type: "professional"
    },
    {
      text: "🌙 Late night inspiration hitting? With Real Mute, practice when creativity strikes - not when it's convenient for others. 24/7 musical freedom awaits! ⭐ www.realmute.com #LateNightPractice #MusicalInspiration #PracticeAnytime",
      type: "inspirational"
    },
    {
      text: "🎺 Recording session ready! Real Mute isn't just for silent practice - it's perfect for controlled studio environments too. Professional results every time! 🎙️ realmute.com/professional #StudioRecording #MusicProduction #ProfessionalGear",
      type: "studio"
    },
    {
      text: "🎓 Music teachers love Real Mute! Finally, students can practice more without noise complaints. Better practice habits = better results! 📚 Special educator pricing: realmute.com/educators #MusicEducation #TeachingTools #StudentSuccess",
      type: "education"
    },
    {
      text: "⏰ Practice on YOUR schedule! Real Mute's revolutionary 50dB reduction means morning, noon, or night - your choice! Freedom to improve whenever inspiration strikes! 🚀 www.realmute.com #PracticeAnytime #MusicalFreedom #RealMute",
      type: "freedom"
    }
  ];

  // If Claude API is configured, try to use it
  if (process.env.CLAUDE_API_KEY) {
    try {
      console.log('🧠 Using Claude AI for content generation...');
      const prompt = `Create an engaging social media post about Real Mute's practice mute technology. 

Requirements:
- Keep under 280 characters
- Include relevant emojis
- Add a clear call-to-action with website link
- Make it engaging and authentic
- Focus on Real Mute benefits (50dB noise reduction, perfect intonation, zero back-pressure)
- End with relevant hashtags

Choose from these angles: practice freedom, apartment living, professional use, education, or motivation.`;

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
            content: prompt
          }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Claude AI content generated');
        return {
          text: data.content[0].text,
          source: "claude-ai",
          type: "ai-generated"
        };
      } else {
        console.log('⚠️ Claude API failed, using fallback content');
      }
    } catch (error) {
      console.error('Claude API error:', error);
    }
  }

  // Fallback to template content
  const selectedTemplate = contentTemplates[Math.floor(Math.random() * contentTemplates.length)];
  console.log('📝 Using template content');
  
  return {
    text: selectedTemplate.text,
    source: "template",
    type: selectedTemplate.type
  };
}
