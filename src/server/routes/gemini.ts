import express from 'express';
import { geminiService, isGeminiAvailable } from '../geminiService.ts';
import db from '../db.ts';

const router = express.Router();

// Check if Gemini API is available
router.get('/status', async (req: any, res) => {
  res.json({
    available: isGeminiAvailable,
    message: isGeminiAvailable 
      ? 'Gemini API is ready' 
      : 'Gemini API not configured. Set GEMINI_API_KEY in .env file'
  });
});

// Generate Predictive Insights
router.post('/predictive-insights', async (req: any, res) => {
  const { userId, profileData, resumeText } = req.body;
  
  if (!userId || !profileData) {
    return res.status(400).json({ error: 'User ID and profile data are required' });
  }

  try {
    console.log('Processing predictive insights for user:', userId);
    console.log('📞 Fetching FRESH insights from Gemini API...');
    
    // Always fetch fresh insights from Gemini (no caching)
    const insightsJson = await geminiService.generatePredictiveInsights(profileData, resumeText || '');
    const insights = JSON.parse(insightsJson);

    // Store insights in database for reference
    try {
      await db('gemini_insights').insert({
        user_id: userId,
        insight_type: 'predictive',
        content: insightsJson,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      console.log('✅ Stored predictive insights for user:', userId);
    } catch (dbError: any) {
      console.warn('⚠️ Database error storing insights:', dbError.message);
    }

    console.log('✅ Returning FRESH predictive insights from Gemini');
    res.json(insights);
  } catch (error: any) {
    console.error('❌ Predictive insights error:', error.message);
    res.status(500).json({ 
      error: error.message || 'Failed to generate predictive insights',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Generate Improvement Tips
router.post('/improvement-tips', async (req: any, res) => {
  const { userId, profileData, resumeText } = req.body;
  
  if (!userId || !profileData) {
    return res.status(400).json({ error: 'User ID and profile data are required' });
  }

  try {
    console.log('Processing improvement tips for user:', userId);
    console.log('📞 Fetching FRESH tips from Gemini API...');
    
    // Always fetch fresh tips from Gemini (no caching)
    const tipsJson = await geminiService.generateImprovementTips(profileData, resumeText || '');
    const tips = JSON.parse(tipsJson);

    // Store tips in database for reference
    try {
      await db('gemini_insights').insert({
        user_id: userId,
        insight_type: 'improvement_tips',
        content: tipsJson,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      console.log('✅ Stored improvement tips for user:', userId);
    } catch (dbError: any) {
      console.warn('⚠️ Database error storing tips:', dbError.message);
    }

    console.log('✅ Returning FRESH improvement tips from Gemini');
    res.json(tips);
  } catch (error: any) {
    console.error('❌ Improvement tips error:', error.message);
    res.status(500).json({ 
      error: error.message || 'Failed to generate improvement tips',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Generate Career Paths
router.post('/career-paths', async (req: any, res) => {
  const { userId, profileData, resumeText } = req.body;
  
  if (!userId || !profileData) {
    return res.status(400).json({ error: 'User ID and profile data are required' });
  }

  try {
    console.log('Processing career paths for user:', userId);
    console.log('📞 Fetching FRESH career paths from Gemini API...');
    
    // Always fetch fresh paths from Gemini (no caching)
    const careerPaths = await geminiService.generateCareerPaths(profileData, resumeText || '');

    // Store career paths in database for reference
    try {
      await db('gemini_insights').insert({
        user_id: userId,
        insight_type: 'career_paths',
        content: JSON.stringify(careerPaths),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      console.log('✅ Stored career paths for user:', userId);
    } catch (dbError: any) {
      console.warn('⚠️ Database error storing paths:', dbError.message);
    }

    console.log('✅ Returning FRESH career paths from Gemini');
    res.json({ career_paths: careerPaths });
  } catch (error: any) {
    console.error('❌ Career paths error:', error.message);
    res.status(500).json({ 
      error: error.message || 'Failed to generate career paths',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Live Career Insights (Streaming)
router.post('/live-insights', async (req: any, res) => {
  const { userId, profileData, resumeText } = req.body;
  
  // Set up streaming response FIRST
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Accel-Buffering', 'no');
  
  if (!userId || !profileData) {
    res.write(`data: ${JSON.stringify({ error: 'User ID and profile data are required' })}\n\n`);
    res.end();
    return;
  }

  try {
    console.log('Processing live insights for user:', userId);
    
    try {
      const generator = geminiService.generateLiveCareerInsights(userId, profileData, resumeText || '');
      
      let insightCount = 0;
      
      // Iterate through the async generator
      for await (const insight of generator) {
        if (insight && Object.keys(insight).length > 0) {
          res.write(`data: ${JSON.stringify(insight)}\n\n`);
          insightCount++;
          console.log('Streamed insight #', insightCount, ':', insight.insight_type || 'unknown');
        }
      }

      console.log(`Completed streaming ${insightCount} insights for user`, userId);
    } catch (streamError: any) {
      console.error('Stream generation error:', streamError.message);
      // Error already handled - generator yields fallback data
    }

    // Store insights in database (non-fatal)
    try {
      await db('gemini_insights').insert({
        user_id: userId,
        insight_type: 'live_insights',
        content: JSON.stringify({ timestamp: new Date().toISOString(), status: 'completed' }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      console.log('Stored live insights for user:', userId);
    } catch (dbError: any) {
      console.warn('Database error storing live insights:', dbError.message);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Live insights handler error:', error.message);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Analyze Skill Gaps
router.post('/skill-gaps', async (req: any, res) => {
  const { userId, profileData } = req.body;
  
  if (!userId || !profileData) {
    return res.status(400).json({ error: 'User ID and profile data are required' });
  }

  try {
    console.log('Processing skill gaps analysis for user:', userId);
    console.log('📞 Fetching FRESH skill gap analysis from Gemini API...');
    
    // Always fetch fresh analysis from Gemini (no caching)
    const analysisJson = await geminiService.analyzeSkillGaps(profileData);
    const analysis = JSON.parse(analysisJson);

    // Store analysis in database for reference
    try {
      await db('gemini_insights').insert({
        user_id: userId,
        insight_type: 'skill_gap_analysis',
        content: analysisJson,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      console.log('✅ Stored skill gap analysis for user:', userId);
    } catch (dbError: any) {
      console.warn('⚠️ Database error storing skill gaps:', dbError.message);
    }

    console.log('✅ Returning FRESH skill gap analysis from Gemini');
    res.json(analysis);
  } catch (error: any) {
    console.error('❌ Skill gap analysis error:', error.message);
    res.status(500).json({ 
      error: error.message || 'Failed to analyze skill gaps',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
