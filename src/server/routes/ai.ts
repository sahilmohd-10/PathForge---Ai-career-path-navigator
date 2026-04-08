import express from 'express';
import { aiService } from '../aiService.ts';
import db from '../db.ts';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

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

// Resume Upload and Parsing Endpoint
router.post('/upload-resume', upload.single('resume'), async (req: any, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });
  if (!req.file) return res.status(400).json({ error: 'No resume file provided' });

  try {
    let resumeText = '';
    
    if (req.file.mimetype === 'application/pdf') {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: req.file.buffer });
      const textResult = await parser.getText();
      resumeText = textResult.text;
    } else if (req.file.mimetype === 'text/plain') {
      resumeText = req.file.buffer.toString('utf-8');
    } else {
      return res.status(400).json({ error: 'Unsupported file format. Please upload PDF or TXT.' });
    }

    if (!resumeText.trim()) {
      return res.status(400).json({ error: 'Resume file appears to be empty or unreadable' });
    }

    const { geminiService } = await import('../geminiService.ts');
    const parsed = await geminiService.parseResumeText(resumeText);

    // 1. Store in resume_data (which we know has raw_text and extracted_json)
    await db('resume_data').insert({
      user_id: userId,
      raw_text: resumeText,
      extracted_json: JSON.stringify(parsed),
      resume_score: parsed.resume_score || 0,
      suggestions: parsed.career_goal || '',
      updated_at: new Date()
    }).onConflict('user_id').merge();

    // 2. Sync parsed info to Profile
    const profileUpdate: any = {};
    if (parsed.bio) profileUpdate.bio = parsed.bio;
    if (parsed.target_career) profileUpdate.target_career = parsed.target_career;
    if (parsed.education) profileUpdate.education = parsed.education;
    if (parsed.experience_years !== undefined) profileUpdate.experience_years = parsed.experience_years;
    if (parsed.location) profileUpdate.location = parsed.location;
    if (parsed.website) profileUpdate.website = parsed.website;

    if (Object.keys(profileUpdate).length > 0) {
      await db('profiles').where({ user_id: userId }).update(profileUpdate);
    }

    // 3. Sync skills to user_skills
    if (parsed.skills && Array.isArray(parsed.skills) && parsed.skills.length > 0) {
      for (const skillName of parsed.skills) {
        if (!skillName || typeof skillName !== 'string') continue;
        const trimmed = skillName.trim();
        if (!trimmed) continue;

        // Find or create skill
        let skill = await db('skills').where({ name: trimmed }).first();
        if (!skill) {
          const [id] = await db('skills').insert({ name: trimmed, category: 'Parsed from Resume' });
          skill = { id };
        }
        
        // Link to user if not already linked
        const existing = await db('user_skills').where({ user_id: userId, skill_id: skill.id }).first();
        if (!existing) {
          await db('user_skills').insert({ user_id: userId, skill_id: skill.id, proficiency_level: 50 });
        }
      }
    }

    res.json({ 
      message: 'Resume processed successfully and profile updated',
      parsed 
    });
  } catch (error: any) {
    console.error('Resume upload/parse error:', error);
    res.status(500).json({ error: error.message || 'Failed to process resume' });
  }
});

export default router;
