import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root .env
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

// Initialize Gemini with API key from environment
const initializeGemini = () => {
  // Try multiple ways to get the API key
  let apiKey = process.env.GEMINI_API_KEY;
  
  // If not found, try loading from .env file explicitly
  if (!apiKey) {
    const result = dotenv.config({ path: envPath });
    apiKey = result.parsed?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  }
  
  if (!apiKey || apiKey.trim() === '') {
    console.warn('⚠️  GEMINI_API_KEY is not set in environment variables');
    console.warn('📝 Set it in .env file: GEMINI_API_KEY=your_api_key_here');
    console.warn('📍 Looking for .env at:', envPath);
    return null;
  }
  
  console.log('✅ Initializing Gemini with API key (length:', apiKey.length, ')');
  return new GoogleGenerativeAI(apiKey);
};

let genAI: GoogleGenerativeAI | null;
let isGeminiAvailable = false;

try {
  genAI = initializeGemini();
  isGeminiAvailable = genAI !== null;
} catch (error) {
  console.error('❌ Failed to initialize Gemini:', error);
  genAI = null;
  isGeminiAvailable = false;
}

export interface CareerInsight {
  type: 'prediction' | 'improvement' | 'insight' | 'path';
  title: string;
  description: string;
  actionItems?: string[];
  priority?: 'high' | 'medium' | 'low';
}

export interface CareerPathData {
  path_name: string;
  description: string;
  timeline_months: number;
  required_skills: string[];
  milestones: string[];
  resources: string[];
  estimated_salary_range: { min: number; max: number };
}

export const geminiService = {
  async generatePredictiveInsights(profileData: any, resumeText: string): Promise<string> {
    // Ensure Gemini API is initialized
    if (!genAI) {
      console.error('❌ Gemini API not initialized. Check GEMINI_API_KEY in .env file');
      throw new Error('Gemini API not initialized');
    }

    const prompt = `You are an AI career advisor. Analyze this profile and generate 3-4 specific, data-driven predictive insights about career growth and recommended learning resources.

Profile:
- Current Role: ${profileData.personalInfo?.currentRole || 'Not specified'}
- Career Goal: ${profileData.personalInfo?.careerGoal || 'Not specified'}
- Experience Level: ${profileData.experienceLevel || 'Fresher'}
- Education: ${profileData.educationLevel || 'Not specified'}
- Skills: ${profileData.skills?.join(', ') || 'Not specified'}
- Tools: ${profileData.tools?.join(', ') || 'Not specified'}

Generate insights based on current market trends. Return ONLY valid JSON (no markdown):
{
  "insights": [
    {
      "title": "Specific insight title",
      "description": "Detailed analysis about market trends or career opportunities",
      "prediction": "Concrete prediction based on market demand",
      "confidence_percentage": 85
    }
  ],
  "recommended_courses": [
    {
      "name": "Course Name",
      "platform": "Coursera/Udemy/LinkedIn Learning/edX",
      "duration": "4-8 weeks",
      "level": "Beginner/Intermediate/Advanced",
      "relevance": "How this helps achieve career goal",
      "estimated_cost": "$0-$500"
    }
  ]
}`;

    try {
      console.log('📞 Calling Gemini for predictive insights...');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Received Gemini response for predictive insights');
      console.log('📊 Response length:', text.length);
      
      // Extract and parse JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed Gemini predictive insights');
        return JSON.stringify(parsed);
      } else {
        console.warn('⚠️  No JSON found in Gemini response, parsing as full text');
        // If response is already valid JSON
        const parsed = JSON.parse(text);
        return JSON.stringify(parsed);
      }
    } catch (error: any) {
      console.error('❌ Gemini predictive insights error:', error.message);
      console.error('📍 Error details:', error);
      throw error;
    }
  },

  async generateImprovementTips(profileData: any, resumeText: string): Promise<string> {
    // Ensure Gemini API is initialized
    if (!genAI) {
      console.error('❌ Gemini API not initialized. Check GEMINI_API_KEY in .env file');
      throw new Error('Gemini API not initialized');
    }

    const prompt = `You are a career improvement coach. Analyze this profile and generate 5 specific, actionable improvement tips to advance their career.

Profile:
- Current Role: ${profileData.personalInfo?.currentRole || 'Not specified'}
- Skills: ${profileData.skills?.join(', ') || 'Not specified'}
- Experience Level: ${profileData.experienceLevel || 'Fresher'}
- Missing Skills: ${profileData.missingSkills?.join(', ') || 'None identified'}

Generate practical, personalized tips. Return ONLY valid JSON (no markdown):
{
  "improvement_tips": [
    {
      "area": "Specific improvement area",
      "tip": "Concrete, actionable improvement",
      "priority": "high/medium/low",
      "timeline": "When to implement",
      "expected_impact": "How this helps career"
    }
  ]
}`;

    try {
      console.log('📞 Calling Gemini for improvement tips...');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Received Gemini response for improvement tips');
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed Gemini improvement tips');
        return JSON.stringify(parsed);
      } else {
        const parsed = JSON.parse(text);
        return JSON.stringify(parsed);
      }
    } catch (error: any) {
      console.error('❌ Gemini improvement tips error:', error.message);
      console.error('📍 Error details:', error);
      throw error;
    }
  },

  async *generateLiveCareerInsights(userId: string, profileData: any, resumeText: string) {
    // Ensure Gemini API is initialized
    if (!genAI) {
      console.error('❌ Gemini API not initialized. Check GEMINI_API_KEY in .env file');
      throw new Error('Gemini API not initialized');
    }

    const prompt = `Generate 5-7 live career market insights based on this profile:

Current Role: ${profileData.personalInfo?.currentRole || 'Not specified'}
Career Goal: ${profileData.personalInfo?.careerGoal || 'Not specified'}
Skills: ${profileData.skills?.join(', ') || 'Not specified'}

Output exactly the specified number of JSON objects (one per line, no markdown):
{"insight_type": "market_trend", "title": "Title", "description": "Description"}
{"insight_type": "opportunity", "title": "Title", "description": "Description"}
{"insight_type": "salary_trend", "title": "Title", "description": "Description"}`;

    try {
      console.log('📞 Calling Gemini for live insights...');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContentStream(prompt);
      
      let buffer = '';
      let yieldedCount = 0;
      
      for await (const chunk of result.stream) {
        const text = chunk.text();
        buffer += text;
        
        // Parse and yield complete JSON objects
        const lines = buffer.split('\n');
        buffer = lines[lines.length - 1];
        
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (line.startsWith('{') && line.endsWith('}')) {
            try {
              const insight = JSON.parse(line);
              yield insight;
              yieldedCount++;
            } catch (e) {
              console.warn('Failed to parse insight:', (e as any).message);
            }
          }
        }
      }
      
      // Process remaining buffer
      if (buffer.trim().startsWith('{') && buffer.trim().endsWith('}')) {
        try {
          const insight = JSON.parse(buffer.trim());
          yield insight;
          yieldedCount++;
        } catch (e) {
          console.warn('Failed to parse final buffer:', (e as any).message);
        }
      }
      
      console.log('✅ Yielded', yieldedCount, 'live insights from Gemini');
    } catch (error: any) {
      console.error('❌ Gemini live insights error:', error.message);
      console.error('📍 Error details:', error);
      throw error;
    }
  },

  async generateCareerPaths(profileData: any, resumeText: string): Promise<CareerPathData[]> {
    // Ensure Gemini API is initialized
    if (!genAI) {
      console.error('❌ Gemini API not initialized. Check GEMINI_API_KEY in .env file');
      throw new Error('Gemini API not initialized');
    }

    const prompt = `You are a career development advisor. Generate 3 personalized career paths based on this profile:

Current Role: ${profileData.personalInfo?.currentRole || 'Not specified'}
Career Goal: ${profileData.personalInfo?.careerGoal || 'Not specified'}
Skills: ${profileData.skills?.join(', ') || 'Not specified'}
Experience Level: ${profileData.experienceLevel || 'Fresher'}

Create realistic, actionable career paths. Return ONLY valid JSON (no markdown):
{
  "career_paths": [
    {
      "path_name": "Specific Career Path Name",
      "description": "Detailed description of this path",
      "timeline_months": 24,
      "required_skills": ["Skill 1", "Skill 2", "Skill 3"],
      "milestones": ["Month 6 milestone", "Month 12 milestone", "Month 24 milestone"],
      "resources": ["Specific courses/books/resources"],
      "estimated_salary_range": {"min": 60000, "max": 120000}
    }
  ]
}`;

    try {
      console.log('📞 Calling Gemini for career paths...');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Received Gemini response for career paths');
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        const parsed = JSON.parse(text);
        console.log('✅ Successfully parsed Gemini career paths');
        return parsed.career_paths || [];
      }
      
      const data = JSON.parse(jsonMatch[0]);
      console.log('✅ Successfully parsed Gemini career paths');
      return data.career_paths || [];
    } catch (error: any) {
      console.error('❌ Gemini career paths error:', error.message);
      console.error('📍 Error details:', error);
      throw error;
    }
  },

  async analyzeSkillGaps(profileData: any): Promise<string> {
    // Ensure Gemini API is initialized
    if (!genAI) {
      console.error('❌ Gemini API not initialized. Check GEMINI_API_KEY in .env file');
      throw new Error('Gemini API not initialized');
    }

    const prompt = `You are a skills assessment expert. Analyze this profile and identify skill gaps, current strengths, and create a learning roadmap.

Current Skills: ${profileData.skills?.join(', ') || 'None specified'}
Target Role: ${profileData.personalInfo?.careerGoal || 'Not specified'}
Experience Level: ${profileData.experienceLevel || 'Fresher'}

Provide a comprehensive skill gap analysis. Return ONLY valid JSON (no markdown):
{
  "skill_gap_analysis": {
    "current_strengths": ["Skill 1", "Skill 2"],
    "critical_gaps": ["Most important missing skills"],
    "nice_to_have": ["Optional skills for advancement"],
    "learning_roadmap": [
      {
        "phase": "Phase name with timeline",
        "skills": ["Skills to develop in this phase"],
        "resources": ["Specific courses/books/resources"],
        "expected_outcome": "What learner should achieve"
      }
    ]
  }
}`;

    try {
      console.log('📞 Calling Gemini for skill gap analysis...');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Received Gemini response for skill gap analysis');
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed Gemini skill gap analysis');
        return JSON.stringify(parsed);
      } else {
        const parsed = JSON.parse(text);
        return JSON.stringify(parsed);
      }
    } catch (error: any) {
      console.error('❌ Gemini skill gap analysis error:', error.message);
      console.error('📍 Error details:', error);
      throw error;
    }
  },

  async generateComprehensiveAnalysis(profileData: any, predictedRole: string): Promise<any> {
    if (!genAI) {
      console.error('❌ Gemini API not initialized. Check GEMINI_API_KEY in .env file');
      throw new Error('Gemini API not initialized');
    }

    const prompt = `You are a career development advisor. Create a unified career analysis for the following profile.
    
CRITICAL REQUIREMENT: You MUST base your analysis, recommended topics, and course recommendations heavily upon the user's "Target Highest Education", "Semester" (if they are a student), "Experience Level", "Experience Summary" and "Career Goal". These factors determine the difficulty level of courses recommended and the gaps that make sense for their specific career trajectory.

Profile Details:
- Current Role: ${profileData.personalInfo?.currentRole || 'Not specified'}
- Career Goal: ${profileData.personalInfo?.careerGoal || 'Not specified'}
- Experience Summary: ${profileData.experience || 'Not specified'}
- Experience Level: ${profileData.experienceLevel || 'Fresher'}
- Target Highest Education: ${profileData.educationLevel || 'Not specified'}
- Semester: ${profileData.semester || 'N/A'}
- Skills: ${profileData.skills?.join(', ') || 'Not specified'}
- Tools: ${profileData.tools?.join(', ') || 'Not specified'}
- ML Predicted Career Path: ${predictedRole}

Provide a highly accurate and critical comprehensive analysis. Return ONLY valid JSON (no markdown):
{
  "resume_score": 85,
  "areas_of_improvement": ["Actionable improvement tip 1", "Actionable improvement tip 2", "Actionable improvement tip 3"],
  "profile_breakdown": [
    {"name": "Top Skill/Competency 1 (e.g. React/Python)", "value": 85},
    {"name": "Top Skill/Competency 2", "value": 70},
    {"name": "Top Skill/Competency 3", "value": 90},
    {"name": "Top Skill/Competency 4", "value": 80}
  ],
  "skill_gaps": [
    {
      "missing_skill": "Name of the missing skill or tool",
      "topics_to_cover": ["Topic 1 to master this skill", "Topic 2", "Topic 3"]
    }
  ],
  "recommended_courses": [
    {
      "name": "Course Name",
      "platform": "Coursera/Udemy/Level",
      "duration": "Duration in weeks",
      "link": "https://example.com (or leave empty if none available)"
    }
  ],
  "job_description": "A 3-5 sentence description of what the daily responsibilities are for the ML Predicted Career Path."
}`;

    try {
      console.log('📞 Calling Gemini for comprehensive analysis...');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Received Gemini response for comprehensive analysis');
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        return JSON.parse(text);
      }
    } catch (error: any) {
      console.error('❌ Gemini comprehensive analysis error:', error.message);
      return {
        resume_score: 65,
        areas_of_improvement: ["Update your technical skills section", "Add quantifiable metrics to your experience", "Network with industry professionals"],
        profile_breakdown: [],
        skill_gaps: [],
        recommended_courses: [],
        job_description: "Unable to generate job description at this time."
      };
    }
  },

  async parseResumeText(resumeText: string): Promise<any> {
    if (!genAI) {
      console.error('❌ Gemini API not initialized. Check GEMINI_API_KEY in .env file');
      throw new Error('Gemini API not initialized');
    }

    const prompt = `You are a resume parser. Extract structured information from the following resume text.

Resume Text:
---
${resumeText}
---

Extract and return ONLY valid JSON (no markdown, no code fences):
{
  "full_name": "Candidate's full name",
  "email": "Email if found or empty string",
  "phone": "Phone if found or empty string",
  "location": "City, State/Country if found or empty string",
  "bio": "A 2-3 sentence professional summary based on the resume",
  "target_career": "The most likely target career/role based on experience and skills",
  "education": "Highest education qualification (e.g. B.Tech CSE, MCA, etc.)",
  "experience_years": 0,
  "skills": ["skill1", "skill2", "skill3"],
  "tools": ["tool1", "tool2"],
  "experience_summary": "A concise summary of work experience",
  "career_goal": "Inferred career goal based on resume trajectory",
  "current_role": "Current or most recent job title",
  "education_level": "B.Tech CSE or BCA or M.Tech or MCA or B.Sc IT or Self-taught + Certifications",
  "experience_level": "Fresher or 1-3 years or 3-5 years or 5+ years",
  "website": "Portfolio or LinkedIn URL if found or empty string"
}`;

    try {
      console.log('📞 Calling Gemini for resume parsing...');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Received Gemini response for resume parsing');
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        return JSON.parse(text);
      }
    } catch (error: any) {
      console.error('❌ Gemini resume parsing error:', error.message);
      throw new Error('Failed to parse resume with Gemini');
    }
  }
};

// Export status for other modules to check if Gemini is available
export { isGeminiAvailable };
