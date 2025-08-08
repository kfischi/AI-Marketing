// ==============================================
// 🤖 AI MARKETING MONSTER - MAIN SERVER
// Real Mute Technologies - Autonomous Social Media System
// ==============================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');
const axios = require('axios');
const moment = require('moment-timezone');
const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

// ==============================================
// 🏗️ APPLICATION SETUP
// ==============================================

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.anthropic.com", "https://graph.facebook.com", "https://api.linkedin.com"]
    }
  }
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// ==============================================
// 🧠 AI CONTENT GENERATION ENGINE
// ==============================================

class ClaudeAI {
  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY;
    this.model = process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229';
    this.maxTokens = parseInt(process.env.CLAUDE_MAX_TOKENS) || 4000;
    this.baseURL = 'https://api.anthropic.com/v1/messages';
  }

  async generateContent(platform, contentType = 'post', context = {}) {
    try {
      const prompt = this.buildPrompt(platform, contentType, context);
      
      const response = await axios.post(this.baseURL, {
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        }
      });

      const content = response.data.content[0].text;
      return this.parseGeneratedContent(content, platform);
      
    } catch (error) {
      console.error('❌ Claude AI Error:', error.response?.data || error.message);
      return this.getFallbackContent(platform, contentType);
    }
  }

  buildPrompt(platform, contentType, context) {
    const realMuteContext = `
Real Mute is a revolutionary practice mute technology offering:
- 50dB noise reduction (110dB to 60dB)
- Perfect intonation maintenance
- Zero back-pressure for natural playing
- Crystal clear sound quality
- Professional-grade construction
- Used by musicians worldwide for silent practice

Target audience: Professional musicians, music students, music teachers, brass players, apartment dwellers who need quiet practice solutions.

Brand voice: Expert, helpful, professional, empowering, solution-focused.
`;

    const platformSpecs = {
      instagram: {
        maxLength: 2200,
        style: 'Visual, engaging, hashtag-rich, story-driven',
        format: 'Caption with 15-20 hashtags',
        audience: 'Musicians, students, visual learners'
      },
      facebook: {
        maxLength: 1500,
        style: 'Community-focused, conversational, educational',
        format: 'Engaging post with clear value',
        audience: 'Professional musicians, music educators'
      },
      linkedin: {
        maxLength: 1300,
        style: 'Professional, industry insights, B2B focused',
        format: 'Professional post with industry perspective',
        audience: 'Music industry professionals, educators, business owners'
      },
      youtube: {
        maxLength: 5000,
        style: 'Educational, detailed, SEO-optimized',
        format: 'Video description with keywords',
        audience: 'Musicians seeking detailed information'
      },
      telegram: {
        maxLength: 4096,
        style: 'Direct, informative, action-oriented',
        format: 'Clear message with call-to-action',
        audience: 'Tech-savvy musicians, international audience'
      },
      pinterest: {
        maxLength: 500,
        style: 'Visual-first, inspirational, searchable',
        format: 'Pin description with keywords',
        audience: 'Creative musicians, visual learners'
      }
    };

    const spec = platformSpecs[platform] || platformSpecs.instagram;
    
    const contentPrompts = {
      educational: 'Create educational content about practice techniques, music theory, or instrument care',
      testimonial: 'Create a testimonial-style post showcasing Real Mute benefits',
      tip: 'Share a practical tip for musicians related to practice or performance',
      story: 'Tell a story about overcoming practice challenges',
      behind_scenes: 'Show behind-the-scenes content about Real Mute technology',
      problem_solution: 'Address a common musician problem and present Real Mute as the solution',
      community: 'Create content that builds community among musicians',
      inspiration: 'Share inspirational content for practicing musicians'
    };

    const selectedPrompt = contentPrompts[contentType] || contentPrompts.educational;

    return `
${realMuteContext}

Create a ${platform} ${contentType} post that:
1. ${selectedPrompt}
2. Follows ${platform} best practices: ${spec.style}
3. Stays within ${spec.maxLength} characters
4. Targets: ${spec.audience}
5. Uses format: ${spec.format}

Current context: ${JSON.stringify(context)}

Requirements:
- Be authentic and valuable to musicians
- Include a clear call-to-action
- Mention Real Mute naturally (not forced)
- Use appropriate tone for the platform
- Include relevant hashtags for ${platform}
- Focus on helping musicians solve real problems

Generate only the post content, ready to publish.
`;
  }

  parseGeneratedContent(content, platform) {
    // Extract hashtags
    const hashtagRegex = /#[\w]+/g;
    const hashtags = content.match(hashtagRegex) || [];
    
    // Clean content
    let cleanContent = content.trim();
    
    // Extract call-to-action if present
    const ctaRegex = /(Visit|Check out|Learn more|Shop|Get|Try).*?(realmute\.com|shop|website)/i;
    const cta = content.match(ctaRegex)?.[0] || '';

    return {
      text: cleanContent,
      hashtags: hashtags.slice(0, 20), // Limit hashtags
      cta: cta,
      platform: platform,
      generated_at: new Date().toISOString(),
      word_count: cleanContent.split(' ').length,
      character_count: cleanContent.length,
      id: uuidv4()
    };
  }

  getFallbackContent(platform, contentType) {
    const fallbacks = {
      instagram: {
        text: "🎺 Silent practice shouldn't mean compromising your sound quality. Real Mute delivers 50dB noise reduction while maintaining perfect intonation. Practice anywhere, anytime! #PracticeMute #SilentPractice #TrumpetLife #BrassPlayers #MusicLife #ApartmentPractice #QuietPractice #RealMute #MusicTech #BrassInstruments",
        hashtags: ["#PracticeMute", "#SilentPractice", "#TrumpetLife", "#BrassPlayers", "#MusicLife"],
        cta: "Learn more at realmute.com"
      },
      facebook: {
        text: "Attention musicians! Tired of practicing in whispers? Real Mute technology offers professional-grade noise reduction without sacrificing tone quality. Join thousands of musicians who've discovered the freedom of true silent practice.",
        hashtags: ["#RealMute", "#SilentPractice", "#Musicians"],
        cta: "Visit our website to learn more"
      },
      linkedin: {
        text: "The music education industry is evolving. Real Mute technology enables 24/7 practice capabilities in any environment, revolutionizing how institutions approach practice space management and student development.",
        hashtags: ["#MusicEducation", "#Innovation", "#PracticeTechnology"],
        cta: "Connect with us to discuss institutional solutions"
      }
    };

    return fallbacks[platform] || fallbacks.instagram;
  }
}

// ==============================================
// 📱 SOCIAL MEDIA INTEGRATIONS
// ==============================================

class SocialMediaManager {
  constructor() {
    this.instagram = new InstagramAPI();
    this.facebook = new FacebookAPI();
    this.linkedin = new LinkedInAPI();
    this.youtube = new YouTubeAPI();
    this.telegram = new TelegramAPI();
    this.pinterest = new PinterestAPI();
  }

  async publishToAll(content) {
    const results = {};
    const platforms = ['instagram', 'facebook', 'linkedin'];
    
    for (const platform of platforms) {
      try {
        if (this[platform] && this[platform].isConfigured()) {
          results[platform] = await this[platform].publish(content[platform] || content.default);
        } else {
          results[platform] = { success: false, reason: 'Not configured' };
        }
      } catch (error) {
        results[platform] = { success: false, error: error.message };
      }
    }
    
    return results;
  }
}

class InstagramAPI {
  constructor() {
    this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    this.pageId = process.env.INSTAGRAM_PAGE_ID;
    this.userId = process.env.INSTAGRAM_USER_ID;
    this.baseURL = 'https://graph.facebook.com/v18.0';
  }

  isConfigured() {
    return !!(this.accessToken && this.pageId);
  }

  async publish(content) {
    if (!this.isConfigured()) {
      throw new Error('Instagram API not configured');
    }

    try {
      // Create media object
      const mediaResponse = await axios.post(
        `${this.baseURL}/${this.pageId}/media`,
        {
          image_url: content.image_url || 'https://via.placeholder.com/1080x1080/4A90E2/FFFFFF?text=Real+Mute',
          caption: content.text,
          access_token: this.accessToken
        }
      );

      const mediaId = mediaResponse.data.id;

      // Publish media
      const publishResponse = await axios.post(
        `${this.baseURL}/${this.pageId}/media_publish`,
        {
          creation_id: mediaId,
          access_token: this.accessToken
        }
      );

      return {
        success: true,
        post_id: publishResponse.data.id,
        platform: 'instagram',
        published_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Instagram publish error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        platform: 'instagram'
      };
    }
  }

  async getAnalytics() {
    if (!this.isConfigured()) return null;

    try {
      const response = await axios.get(
        `${this.baseURL}/${this.pageId}/insights`,
        {
          params: {
            metric: 'impressions,reach,profile_views,follower_count',
            period: 'day',
            access_token: this.accessToken
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Instagram analytics error:', error.message);
      return null;
    }
  }
}

class FacebookAPI {
  constructor() {
    this.accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    this.pageId = process.env.FACEBOOK_PAGE_ID;
    this.baseURL = 'https://graph.facebook.com/v18.0';
  }

  isConfigured() {
    return !!(this.accessToken && this.pageId);
  }

  async publish(content) {
    if (!this.isConfigured()) {
      throw new Error('Facebook API not configured');
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/${this.pageId}/feed`,
        {
          message: content.text,
          link: content.link || process.env.REALMUTE_WEBSITE,
          access_token: this.accessToken
        }
      );

      return {
        success: true,
        post_id: response.data.id,
        platform: 'facebook',
        published_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Facebook publish error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        platform: 'facebook'
      };
    }
  }
}

class LinkedInAPI {
  constructor() {
    this.accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
    this.companyId = process.env.LINKEDIN_COMPANY_ID;
    this.baseURL = 'https://api.linkedin.com/v2';
  }

  isConfigured() {
    return !!(this.accessToken && this.companyId);
  }

  async publish(content) {
    if (!this.isConfigured()) {
      throw new Error('LinkedIn API not configured');
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/shares`,
        {
          owner: `urn:li:organization:${this.companyId}`,
          text: {
            text: content.text
          },
          content: {
            contentEntities: [{
              entityLocation: content.link || process.env.REALMUTE_WEBSITE,
              thumbnails: [{
                resolvedUrl: content.image_url || 'https://via.placeholder.com/1200x627/4A90E2/FFFFFF?text=Real+Mute'
              }]
            }],
            title: content.title || 'Real Mute - Revolutionary Practice Technology'
          },
          distribution: {
            linkedInDistributionTarget: {}
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      return {
        success: true,
        post_id: response.data.id,
        platform: 'linkedin',
        published_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ LinkedIn publish error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        platform: 'linkedin'
      };
    }
  }
}

class YouTubeAPI {
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this.channelId = process.env.YOUTUBE_CHANNEL_ID;
    this.baseURL = 'https://www.googleapis.com/youtube/v3';
  }

  isConfigured() {
    return !!(this.apiKey && this.channelId);
  }

  async updateVideoDescription(videoId, content) {
    if (!this.isConfigured()) {
      throw new Error('YouTube API not configured');
    }

    try {
      const response = await axios.put(
        `${this.baseURL}/videos`,
        {
          part: 'snippet',
          id: videoId,
          snippet: {
            title: content.title,
            description: content.text,
            tags: content.hashtags.map(tag => tag.replace('#', ''))
          }
        },
        {
          params: { key: this.apiKey }
        }
      );

      return {
        success: true,
        video_id: videoId,
        platform: 'youtube',
        updated_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ YouTube update error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        platform: 'youtube'
      };
    }
  }
}

class TelegramAPI {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
    this.baseURL = `https://api.telegram.org/bot${this.botToken}`;
  }

  isConfigured() {
    return !!(this.botToken && this.chatId);
  }

  async publish(content) {
    if (!this.isConfigured()) {
      throw new Error('Telegram API not configured');
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/sendMessage`,
        {
          chat_id: this.chatId,
          text: content.text,
          parse_mode: 'HTML',
          disable_web_page_preview: false
        }
      );

      return {
        success: true,
        message_id: response.data.result.message_id,
        platform: 'telegram',
        published_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Telegram publish error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.description || error.message,
        platform: 'telegram'
      };
    }
  }
}

class PinterestAPI {
  constructor() {
    this.accessToken = process.env.PINTEREST_ACCESS_TOKEN;
    this.boardId = process.env.PINTEREST_BOARD_ID;
    this.baseURL = 'https://api.pinterest.com/v5';
  }

  isConfigured() {
    return !!(this.accessToken && this.boardId);
  }

  async publish(content) {
    if (!this.isConfigured()) {
      throw new Error('Pinterest API not configured');
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/pins`,
        {
          board_id: this.boardId,
          media_source: {
            source_type: 'image_url',
            url: content.image_url || 'https://via.placeholder.com/735x1102/4A90E2/FFFFFF?text=Real+Mute'
          },
          description: content.text,
          link: content.link || process.env.REALMUTE_WEBSITE
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        pin_id: response.data.id,
        platform: 'pinterest',
        published_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Pinterest publish error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        platform: 'pinterest'
      };
    }
  }
}

// ==============================================
// 📊 ANALYTICS & PERFORMANCE TRACKING
// ==============================================

class AnalyticsManager {
  constructor() {
    this.posts = [];
    this.metrics = {
      total_posts: 0,
      total_impressions: 0,
      total_engagements: 0,
      platforms: {},
      performance_by_time: {},
      content_types: {}
    };
  }

  trackPost(post, results) {
    const postData = {
      id: post.id,
      content: post.text,
      platform: post.platform,
      published_at: new Date().toISOString(),
      results: results,
      hashtags: post.hashtags,
      word_count: post.word_count,
      character_count: post.character_count
    };

    this.posts.push(postData);
    this.updateMetrics(postData);
    
    // Keep only last 1000 posts to prevent memory issues
    if (this.posts.length > 1000) {
      this.posts = this.posts.slice(-1000);
    }
  }

  updateMetrics(postData) {
    this.metrics.total_posts++;
    
    // Platform metrics
    if (!this.metrics.platforms[postData.platform]) {
      this.metrics.platforms[postData.platform] = {
        posts: 0,
        successes: 0,
        failures: 0,
        engagement_rate: 0
      };
    }
    
    this.metrics.platforms[postData.platform].posts++;
    
    if (postData.results.success) {
      this.metrics.platforms[postData.platform].successes++;
    } else {
      this.metrics.platforms[postData.platform].failures++;
    }

    // Time-based metrics
    const hour = new Date().getHours();
    if (!this.metrics.performance_by_time[hour]) {
      this.metrics.performance_by_time[hour] = { posts: 0, successes: 0 };
    }
    this.metrics.performance_by_time[hour].posts++;
    if (postData.results.success) {
      this.metrics.performance_by_time[hour].successes++;
    }
  }

  getAnalytics() {
    const last24h = this.posts.filter(post => 
      Date.now() - new Date(post.published_at).getTime() < 24 * 60 * 60 * 1000
    );

    const last7d = this.posts.filter(post => 
      Date.now() - new Date(post.published_at).getTime() < 7 * 24 * 60 * 60 * 1000
    );

    return {
      overview: {
        total_posts: this.metrics.total_posts,
        posts_last_24h: last24h.length,
        posts_last_7d: last7d.length,
        success_rate: this.calculateSuccessRate(),
        platforms_active: Object.keys(this.metrics.platforms).length
      },
      platforms: this.metrics.platforms,
      performance_by_time: this.metrics.performance_by_time,
      recent_posts: this.posts.slice(-10).reverse(),
      top_performing: this.getTopPerforming(),
      recommendations: this.generateRecommendations()
    };
  }

  calculateSuccessRate() {
    if (this.posts.length === 0) return 0;
    const successful = this.posts.filter(post => post.results.success).length;
    return Math.round((successful / this.posts.length) * 100);
  }

  getTopPerforming() {
    return this.posts
      .filter(post => post.results.success)
      .slice(-20)
      .map(post => ({
        platform: post.platform,
        content: post.content.substring(0, 100) + '...',
        hashtags: post.hashtags.slice(0, 5),
        published_at: post.published_at
      }));
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Best posting times
    const bestHour = Object.entries(this.metrics.performance_by_time)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        success_rate: data.posts > 0 ? (data.successes / data.posts) : 0,
        total_posts: data.posts
      }))
      .filter(item => item.total_posts >= 3)
      .sort((a, b) => b.success_rate - a.success_rate)[0];

    if (bestHour) {
      recommendations.push({
        type: 'timing',
        title: 'Optimal Posting Time',
        message: `Best performance at ${bestHour.hour}:00 with ${Math.round(bestHour.success_rate * 100)}% success rate`,
        priority: 'high'
      });
    }

    // Platform performance
    const platformPerf = Object.entries(this.metrics.platforms)
      .map(([platform, data]) => ({
        platform,
        success_rate: data.posts > 0 ? (data.successes / data.posts) : 0,
        total_posts: data.posts
      }))
      .filter(item => item.total_posts >= 5)
      .sort((a, b) => b.success_rate - a.success_rate);

    if (platformPerf.length > 1) {
      const best = platformPerf[0];
      recommendations.push({
        type: 'platform',
        title: 'Top Performing Platform',
        message: `${best.platform} has the highest success rate at ${Math.round(best.success_rate * 100)}%`,
        priority: 'medium'
      });
    }

    return recommendations;
  }
}

// ==============================================
// 🚀 MAIN AI MARKETING ENGINE
// ==============================================

class AIMarketingEngine {
  constructor() {
    this.claude = new ClaudeAI();
    this.socialMedia = new SocialMediaManager();
    this.analytics = new AnalyticsManager();
    this.isRunning = false;
    this.queue = [];
    this.config = {
      postsPerDay: parseInt(process.env.POSTS_PER_DAY) || 12,
      postingHours: (process.env.POSTING_HOURS || '9,12,15,18,21').split(',').map(h => parseInt(h)),
      platforms: ['instagram', 'facebook', 'linkedin'],
      contentTypes: ['educational', 'tip', 'story', 'problem_solution', 'community', 'inspiration'],
      autoPosting: process.env.ENABLE_AUTO_POSTING === 'true'
    };
  }

  async start() {
    if (this.isRunning) {
      console.log('🤖 AI Marketing Engine is already running');
      return { success: false, message: 'Already running' };
    }

    this.isRunning = true;
    console.log('🚀 Starting AI Marketing Engine...');

    // Schedule content generation and posting
    this.scheduleContentGeneration();
    
    if (this.config.autoPosting) {
      this.scheduleAutoPosting();
    }

    console.log('✅ AI Marketing Engine started successfully');
    return { success: true, message: 'Engine started successfully' };
  }

  async stop() {
    this.isRunning = false;
    console.log('🛑 AI Marketing Engine stopped');
    return { success: true, message: 'Engine stopped' };
  }

  scheduleContentGeneration() {
    // Generate content every 2 hours during business hours
    cron.schedule('0 */2 8-22 * * *', async () => {
      if (this.isRunning) {
        await this.generateBatchContent();
      }
    });

    console.log('📅 Content generation scheduled');
  }

  scheduleAutoPosting() {
    // Auto-post at configured hours
    this.config.postingHours.forEach(hour => {
      cron.schedule(`0 ${hour} * * *`, async () => {
        if (this.isRunning && this.queue.length > 0) {
          await this.publishNext();
        }
      });
    });

    console.log('📅 Auto-posting scheduled');
  }

  async generateBatchContent() {
    console.log('🧠 Generating batch content...');
    
    try {
      const platforms = this.config.platforms;
      const contentType = this.getRandomContentType();
      
      const promises = platforms.map(platform => 
        this.claude.generateContent(platform, contentType, {
          time: moment().format('YYYY-MM-DD HH:mm'),
          previous_posts: this.analytics.posts.slice(-5)
        })
      );

      const contents = await Promise.all(promises);
      
      // Add to queue
      contents.forEach((content, index) => {
        this.queue.push({
          ...content,
          platform: platforms[index],
          generated_at: new Date().toISOString(),
          scheduled_for: this.getNextPostingTime()
        });
      });

      console.log(`✅ Generated ${contents.length} posts, queue length: ${this.queue.length}`);
      
      return {
        success: true,
        generated: contents.length,
        queue_length: this.queue.length
      };

    } catch (error) {
      console.error('❌ Batch generation error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async generateSingleContent(platform, contentType = null) {
    try {
      const type = contentType || this.getRandomContentType();
      const content = await this.claude.generateContent(platform, type, {
        time: moment().format('YYYY-MM-DD HH:mm'),
        manual_generation: true
      });

      content.platform = platform;
      content.generated_at = new Date().toISOString();

      return { success: true, content };
    } catch (error) {
      console.error('❌ Single generation error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async publishNext() {
    if (this.queue.length === 0) {
      console.log('📭 Queue is empty, generating new content...');
      await this.generateBatchContent();
      if (this.queue.length === 0) {
        return { success: false, message: 'No content to publish' };
      }
    }

    const post = this.queue.shift();
    return await this.publishPost(post);
  }

  async publishPost(post) {
    try {
      console.log(`📱 Publishing to ${post.platform}...`);
      
      let result;
      switch (post.platform) {
        case 'instagram':
          result = await this.socialMedia.instagram.publish(post);
          break;
        case 'facebook':
          result = await this.socialMedia.facebook.publish(post);
          break;
        case 'linkedin':
          result = await this.socialMedia.linkedin.publish(post);
          break;
        default:
          result = { success: false, error: 'Unsupported platform' };
      }

      // Track analytics
      this.analytics.trackPost(post, result);

      if (result.success) {
        console.log(`✅ Successfully published to ${post.platform}`);
      } else {
        console.log(`❌ Failed to publish to ${post.platform}: ${result.error}`);
      }

      return {
        success: result.success,
        platform: post.platform,
        post_id: result.post_id,
        content_preview: post.text.substring(0, 100) + '...',
        result
      };

    } catch (error) {
      console.error('❌ Publish error:', error.message);
      return { success: false, error: error.message };
    }
  }

  getRandomContentType() {
    return this.config.contentTypes[Math.floor(Math.random() * this.config.contentTypes.length)];
  }

  getNextPostingTime() {
    const now = moment();
    const todayHours = this.config.postingHours.filter(hour => hour > now.hour());
    
    if (todayHours.length > 0) {
      return moment().hour(todayHours[0]).minute(0).second(0).toISOString();
    } else {
      return moment().add(1, 'day').hour(this.config.postingHours[0]).minute(0).second(0).toISOString();
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      queueLength: this.queue.length,
      config: this.config,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      analytics: this.analytics.getAnalytics()
    };
  }
}

// ==============================================
// 🌐 API ROUTES
// ==============================================

// Initialize the engine
const aiEngine = new AIMarketingEngine();

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Start/Stop engine
app.post('/api/engine/start', async (req, res) => {
  try {
    const result = await aiEngine.start();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/engine/stop', async (req, res) => {
  try {
    const result = await aiEngine.stop();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get engine status
app.get('/api/status', (req, res) => {
  try {
    const status = aiEngine.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate content
app.post('/api/generate', async (req, res) => {
  try {
    const { platform, contentType } = req.body;
    
    if (!platform) {
      return res.status(400).json({ success: false, error: 'Platform is required' });
    }

    const result = await aiEngine.generateSingleContent(platform, contentType);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate batch content
app.post('/api/generate-batch', async (req, res) => {
  try {
    const result = await aiEngine.generateBatchContent();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Publish next post
app.post('/api/publish', async (req, res) => {
  try {
    const result = await aiEngine.publishNext();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Publish specific post
app.post('/api/publish-content', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    const result = await aiEngine.publishPost(content);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get queue
app.get('/api/queue', (req, res) => {
  try {
    res.json({
      success: true,
      queue: aiEngine.queue,
      length: aiEngine.queue.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear queue
app.delete('/api/queue', (req, res) => {
  try {
    aiEngine.queue = [];
    res.json({ success: true, message: 'Queue cleared' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get analytics
app.get('/api/analytics', (req, res) => {
  try {
    const analytics = aiEngine.analytics.getAnalytics();
    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test API connections
app.get('/api/test-connections', async (req, res) => {
  try {
    const results = {
      claude: false,
      instagram: false,
      facebook: false,
      linkedin: false
    };

    // Test Claude API
    try {
      await aiEngine.claude.generateContent('instagram', 'tip');
      results.claude = true;
    } catch (error) {
      console.log('Claude test failed:', error.message);
    }

    // Test Instagram API
    if (aiEngine.socialMedia.instagram.isConfigured()) {
      try {
        await aiEngine.socialMedia.instagram.getAnalytics();
        results.instagram = true;
      } catch (error) {
        console.log('Instagram test failed:', error.message);
      }
    }

    // Test Facebook API
    results.facebook = aiEngine.socialMedia.facebook.isConfigured();

    // Test LinkedIn API
    results.linkedin = aiEngine.socialMedia.linkedin.isConfigured();

    res.json({ success: true, connections: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==============================================
// 🎨 FRONTEND ROUTES
// ==============================================

// Dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/analytics', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'analytics.html'));
});

// ==============================================
// 🚀 SERVER STARTUP
// ==============================================

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Global error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 AI MARKETING MONSTER STARTED!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 Server: http://localhost:${PORT}
🎛️ Dashboard: http://localhost:${PORT}/dashboard
📊 Analytics: http://localhost:${PORT}/analytics
🔧 Health: http://localhost:${PORT}/api/health

🤖 Claude AI: ${process.env.CLAUDE_API_KEY ? '✅ Configured' : '❌ Not configured'}
📱 Instagram: ${process.env.INSTAGRAM_ACCESS_TOKEN ? '✅ Configured' : '❌ Not configured'}
📘 Facebook: ${process.env.FACEBOOK_PAGE_ACCESS_TOKEN ? '✅ Configured' : '❌ Not configured'}
💼 LinkedIn: ${process.env.LINKEDIN_ACCESS_TOKEN ? '✅ Configured' : '❌ Not configured'}

💡 Ready to dominate social media!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  // Auto-start engine if configured
  if (process.env.AUTO_START_ENGINE === 'true') {
    setTimeout(() => {
      aiEngine.start();
    }, 5000);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  aiEngine.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down gracefully...');
  aiEngine.stop();
  process.exit(0);
});

module.exports = app;
