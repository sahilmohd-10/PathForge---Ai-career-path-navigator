import express from 'express';
import { aiService } from '../aiService.ts';
import db from '../db.ts';

const router = express.Router();

router.post('/analyze-resume', async (req: any, res) => {
  const { userId, resumeText } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });
  if (!resumeText) return res.status(400).json({ error: 'No resume text provided' });

  try {
    const analysis = await aiService.analyzeResume(resumeText);
    const careerMetrics = aiService.fallbackCareerAnalysis({
      skills: analysis.skills || [],
      experience: analysis.experience || [],
      personalInfo: { currentRole: '' }
    });

    await db('resume_data').insert({
      user_id: userId,
      raw_text: resumeText,
      extracted_json: JSON.stringify(analysis),
      resume_score: analysis.resume_score,
      suggestions: JSON.stringify(analysis.suggestions)
    }).onConflict('user_id').merge();

    await db('profiles').where({ user_id: userId }).update({
      job_readiness_score: analysis.resume_score 
    });

    const existingCareerScore = await db('career_scores')
      .where({ user_id: userId, career_path: 'Resume Review' })
      .first();

    if (existingCareerScore) {
      await db('career_scores')
        .where({ id: existingCareerScore.id })
        .update({
          career_path: 'Resume Review',
          confidence_score: analysis.resume_score,
          market_fit_score: careerMetrics.market_fit_score,
          growth_potential: careerMetrics.growth_potential,
          churn_risk: careerMetrics.churn_risk,
          salary_min: careerMetrics.salary_prediction.min,
          salary_max: careerMetrics.salary_prediction.max,
          reasoning: JSON.stringify(careerMetrics.predictive_insights),
          created_at: new Date().toISOString()
        });
    } else {
      await db('career_scores').insert({
        user_id: userId,
        career_path: 'Resume Review',
        confidence_score: analysis.resume_score,
        market_fit_score: careerMetrics.market_fit_score,
        growth_potential: careerMetrics.growth_potential,
        churn_risk: careerMetrics.churn_risk,
        salary_min: careerMetrics.salary_prediction.min,
        salary_max: careerMetrics.salary_prediction.max,
        reasoning: JSON.stringify(careerMetrics.predictive_insights)
      });
    }

    res.json({ ...analysis, ...careerMetrics });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/career-guidance', async (req, res) => {
  const { userId, interests } = req.body;
  try {
    const resume = await db('resume_data').where({ user_id: userId }).first();
    const skills = await db('user_skills')
      .join('skills', 'user_skills.skill_id', 'skills.id')
      .where({ user_id: userId })
      .select('skills.name');
    
    const guidance = await aiService.getCareerGuidance(
      resume?.raw_text || '',
      interests || [],
      skills.map(s => s.name)
    );

    for (const path of guidance) {
      await db('career_scores').insert({
        user_id: userId,
        career_path: path.career_path,
        confidence_score: path.confidence_score,
        reasoning: path.reasoning
      });
    }

    res.json(guidance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ml-analysis', async (req: any, res) => {
  const { userId, resumeText, profileData } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  try {
    const mlAnalysis = await aiService.getMLModelAnalysis(profileData, resumeText);

    // We can store this in a new table or just return it
    // For now, let's just return it to the frontend
    res.json(mlAnalysis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/unified-analysis', async (req: any, res) => {
  const { userId, resumeText, profileData } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  try {
    // 1. Analyze Resume
    const analysis = await aiService.analyzeResume(resumeText);
    
    // 2. ML Analysis
    const mlAnalysis = await aiService.getMLModelAnalysis(profileData, resumeText);
    const predictedRole = mlAnalysis.predicted_role || analysis.predicted_role || 'Technology Professional';

    // 3. Gemini Comprehensive Analysis (courses, missing skills with topics, job description)
    const { geminiService } = await import('../geminiService.ts');
    const geminiAnalysis = await geminiService.generateComprehensiveAnalysis(profileData, predictedRole);

    // Combine Everything
    const unifiedResults = {
      resumeScore: geminiAnalysis.resume_score || analysis.resume_score,
      overallImprovements: geminiAnalysis.areas_of_improvement && geminiAnalysis.areas_of_improvement.length > 0 
        ? geminiAnalysis.areas_of_improvement 
        : analysis.suggestions,
      mlPredictions: {
        ...mlAnalysis,
        resume_breakdown: geminiAnalysis.profile_breakdown && geminiAnalysis.profile_breakdown.length > 0
          ? geminiAnalysis.profile_breakdown
          : mlAnalysis.resume_breakdown
      },
      predictedRole: predictedRole,
      skillGaps: geminiAnalysis.skill_gaps || [],
      recommendedCourses: geminiAnalysis.recommended_courses || [],
      jobDescription: geminiAnalysis.job_description || 'No description available.',
    };

    res.json(unifiedResults);
  } catch (error: any) {
    console.error('Unified analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to complete unified analysis' });
  }
});

export default router;
