import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getPythonExecutable() {
  const candidates = [
    process.env.PYTHON_EXECUTABLE,
    path.resolve(__dirname, '../../.venv/Scripts/python.exe'),
    path.resolve(__dirname, '../../.venv/bin/python'),
    'python',
    'python3'
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      if (candidate === 'python' || candidate === 'python3' || fs.existsSync(candidate)) {
        return candidate;
      }
    } catch {
      continue;
    }
  }

  throw new Error('Python executable not found. Set PYTHON_EXECUTABLE or install Python in a .venv.');
}

const KNOWN_SKILLS = [
  'APIs', 'AWS', 'Azure', 'Azure DevOps', 'BigQuery', 'C', 'C++', 'CSS', 'Deep Learning', 'Docker',
  'Ethical Hacking', 'Excel', 'Firebase', 'GCP', 'Git', 'GitHub', 'GitHub Actions', 'HTML',
  'Java', 'JavaScript', 'Jenkins', 'Kubernetes', 'Machine Learning', 'MongoDB', 'MySQL',
  'Network Security', 'Node.js', 'NLP', 'NumPy', 'Pandas', 'Power BI', 'PostgreSQL', 'Python',
  'PyTorch', 'React', 'Selenium', 'Spark', 'SQL', 'Spring Boot', 'Tableau', 'TensorFlow', 'TypeScript'
];

const KNOWN_TOOLS = [
  'AWS', 'Azure', 'Docker', 'Figma', 'Git', 'GitHub', 'GitHub Actions', 'Google Cloud', 'Grafana',
  'Jenkins', 'Jira', 'Jupyter Notebook', 'Kubernetes', 'Linux', 'Looker', 'MySQL', 'Power BI',
  'PostgreSQL', 'Tableau', 'Terraform', 'VS Code', 'Visual Studio', 'VSCode', 'Notion'
];

function normalizeText(text: string) {
  return String(text).replace(/[^A-Za-z0-9 ]+/g, ' ').toLowerCase();
}

function extractKnownTerms(text: string, terms: string[]) {
  const normalized = normalizeText(text);
  return Array.from(new Set(terms.filter(term => normalized.includes(term.toLowerCase()))));
}

function cleanLocations(items: any[]) {
  return Array.from(new Set((items || []).filter(Boolean).map((item) => String(item).trim())));
}

function extractCareerGoal(text: string, interests: string[]) {
  const normalized = normalizeText(text);
  const combined = [...(interests || []).map((item) => String(item).toLowerCase().trim()), normalized];

  const goalKeywords: Record<string, string[]> = {
    'Software Engineer': ['software engineer', 'software developer', 'developer', 'backend', 'frontend', 'full stack'],
    'Data Analyst': ['data analyst', 'analytics', 'business intelligence', 'reporting'],
    'Data Scientist': ['data scientist', 'machine learning', 'ml', 'ai', 'artificial intelligence'],
    'AI Engineer': ['ai engineer', 'artificial intelligence engineer', 'deep learning', 'nlp'],
    'DevOps Engineer': ['devops', 'site reliability', 'sre', 'ci/cd'],
    'Cloud Engineer': ['cloud engineer', 'aws', 'azure', 'gcp', 'cloud'],
    'Cybersecurity Analyst': ['cybersecurity', 'security analyst', 'ethical hacking', 'info sec'],
    'Product Manager': ['product manager', 'product owner', 'product strategy'],
    'UI/UX Designer': ['ui/ux', 'designer', 'user experience', 'user interface'],
    'Business Analyst': ['business analyst', 'requirements gathering', 'stakeholder']
  };

  for (const [goal, keywords] of Object.entries(goalKeywords)) {
    if (keywords.some((keyword) => combined.some((chunk) => chunk.includes(keyword)))) {
      return goal;
    }
  }

  return '';
}

function experienceLevelFactor(level: string) {
  const normalized = normalizeText(level);
  if (/fresher|entry/.test(normalized)) return 0;
  if (/1-3|junior|associate/.test(normalized)) return 5;
  if (/3-5|mid|intermediate/.test(normalized)) return 10;
  if (/5\+|senior|lead|principal/.test(normalized)) return 15;
  return 5;
}

const CAREER_PATHS = [
  {
    career_path: 'Software Engineer',
    required_skills: ['Python', 'Java', 'C++', 'React', 'Node.js', 'SQL'],
    optional_skills: ['Docker', 'Kubernetes', 'APIs', 'GitHub Actions', 'TypeScript'],
    industry: 'Software',
    keywords: ['software engineer', 'software developer', 'full stack', 'backend', 'frontend'],
    level: 'mid'
  },
  {
    career_path: 'Frontend Developer',
    required_skills: ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript'],
    optional_skills: ['Figma', 'Vue', 'Angular'],
    industry: 'Web Development',
    keywords: ['frontend', 'ui', 'user interface', 'javascript developer'],
    level: 'entry'
  },
  {
    career_path: 'Backend Developer',
    required_skills: ['Node.js', 'Python', 'Java', 'SQL', 'APIs'],
    optional_skills: ['Docker', 'PostgreSQL', 'MongoDB', 'Redis'],
    industry: 'Web Development',
    keywords: ['backend', 'server', 'api', 'microservices'],
    level: 'mid'
  },
  {
    career_path: 'Full Stack Developer',
    required_skills: ['React', 'Node.js', 'SQL', 'HTML', 'CSS', 'JavaScript'],
    optional_skills: ['Docker', 'AWS', 'TypeScript'],
    industry: 'Web Development',
    keywords: ['full stack', 'frontend', 'backend', 'web developer'],
    level: 'mid'
  },
  {
    career_path: 'Data Analyst',
    required_skills: ['SQL', 'Excel', 'Python', 'Tableau', 'Power BI'],
    optional_skills: ['Power BI', 'Tableau', 'Looker', 'Pandas'],
    industry: 'Data Analytics',
    keywords: ['data analyst', 'analytics', 'business intelligence', 'reporting'],
    level: 'entry'
  },
  {
    career_path: 'Data Scientist',
    required_skills: ['Python', 'Machine Learning', 'Statistics', 'SQL', 'Pandas'],
    optional_skills: ['TensorFlow', 'PyTorch', 'NumPy', 'NLP'],
    industry: 'Data Analytics',
    keywords: ['data scientist', 'machine learning', 'ml', 'ai'],
    level: 'mid'
  },
  {
    career_path: 'AI Engineer',
    required_skills: ['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch'],
    optional_skills: ['NLP', 'Keras', 'Computer Vision'],
    industry: 'Artificial Intelligence',
    keywords: ['ai engineer', 'artificial intelligence', 'deep learning', 'nlp'],
    level: 'mid'
  },
  {
    career_path: 'DevOps Engineer',
    required_skills: ['Docker', 'Kubernetes', 'AWS', 'Azure', 'CI/CD'],
    optional_skills: ['Terraform', 'Jenkins', 'Ansible'],
    industry: 'Cloud',
    keywords: ['devops', 'site reliability', 'sre', 'ci/cd'],
    level: 'mid'
  },
  {
    career_path: 'Cloud Engineer',
    required_skills: ['AWS', 'Azure', 'GCP', 'Terraform', 'Docker'],
    optional_skills: ['Kubernetes', 'Serverless', 'CI/CD'],
    industry: 'Cloud',
    keywords: ['cloud engineer', 'aws', 'azure', 'gcp', 'cloud'],
    level: 'mid'
  },
  {
    career_path: 'Cybersecurity Analyst',
    required_skills: ['Network Security', 'Ethical Hacking', 'Python', 'Security'],
    optional_skills: ['Penetration Testing', 'SIEM'],
    industry: 'Security',
    keywords: ['cybersecurity', 'security analyst', 'ethical hacking', 'info sec'],
    level: 'entry'
  },
  {
    career_path: 'Product Manager',
    required_skills: ['Communication', 'Strategy', 'Agile', 'Stakeholder'],
    optional_skills: ['Roadmapping', 'Jira', 'User Research'],
    industry: 'Product Management',
    keywords: ['product manager', 'product owner', 'product strategy'],
    level: 'mid'
  },
  {
    career_path: 'UI/UX Designer',
    required_skills: ['Figma', 'Adobe XD', 'HTML', 'CSS', 'User Research'],
    optional_skills: ['Prototyping', 'Design Systems'],
    industry: 'Design',
    keywords: ['ui/ux', 'designer', 'user experience', 'user interface'],
    level: 'entry'
  },
  {
    career_path: 'Quality Assurance Engineer',
    required_skills: ['Selenium', 'Testing', 'Automation', 'Java', 'Python'],
    optional_skills: ['Postman', 'Cypress'],
    industry: 'Quality',
    keywords: ['qa', 'quality assurance', 'tester', 'test automation'],
    level: 'entry'
  },
  {
    career_path: 'Business Analyst',
    required_skills: ['Excel', 'SQL', 'Communication', 'Reporting'],
    optional_skills: ['Power BI', 'Tableau'],
    industry: 'Business',
    keywords: ['business analyst', 'requirements', 'stakeholder', 'analysis'],
    level: 'entry'
  }
];

function rankCareerPaths(skills: string[], interests: string[], careerGoal: string = '') {
  const normalizedSkills = skills.map((skill) => normalizeText(skill));
  const normalizedInterests = (interests || []).map((interest) => normalizeText(interest));
  const normalizedGoal = normalizeText(careerGoal);

  return CAREER_PATHS
    .map((path) => {
      const matchedRequired = path.required_skills.filter((skill) => normalizedSkills.includes(normalizeText(skill)));
      const matchedOptional = path.optional_skills.filter((skill) => normalizedSkills.includes(normalizeText(skill)));
      const matchedKeywords = path.keywords.filter((keyword) => normalizedGoal.includes(normalizeText(keyword)) || normalizedInterests.some((i) => i.includes(normalizeText(keyword))));
      const matchRatio = path.required_skills.length ? matchedRequired.length / path.required_skills.length : 0;
      const skillScore = Math.round(matchRatio * 40 + matchedOptional.length * 5 + Math.min(5, normalizedSkills.length) * 2);
      const interestScore = matchedKeywords.length * 8;
      const goalScore = path.keywords.reduce((score, keyword) => (
        normalizedGoal.includes(normalizeText(keyword)) ? score + 10 : score
      ), 0);
      const experienceBoost = experienceLevelFactor(path.level);
      const confidence_score = Math.min(100, Math.max(40, 30 + skillScore + interestScore + goalScore + experienceBoost));
      return {
        ...path,
        confidence_score,
        matchedRequired,
        matchedOptional,
        matchRatio
      };
    })
    .filter((path) => path.matchedRequired.length > 0 || path.confidence_score >= 55)
    .sort((a, b) => b.confidence_score - a.confidence_score)
    .map((item) => ({
      career_path: item.career_path,
      confidence_score: item.confidence_score,
      reasoning: `Your profile matches ${item.matchedRequired.length} core skill${item.matchedRequired.length === 1 ? '' : 's'} for ${item.career_path}${item.matchedOptional.length ? ` and shows strength in ${item.matchedOptional.join(', ')}.` : '.'}`,
      required_skills: item.required_skills,
      matched_required_skills: item.matchedRequired,
      matched_optional_skills: item.matchedOptional
    }));
}

function buildIndustryMatches(skills: string[]) {
  const industryDefinitions = [
    { industry: 'Artificial Intelligence', keywords: ['machine learning', 'deep learning', 'ai', 'tensorflow', 'pytorch', 'nlp'] },
    { industry: 'Data Analytics', keywords: ['sql', 'excel', 'power bi', 'tableau', 'pandas', 'statistics', 'looker'] },
    { industry: 'Web Development', keywords: ['react', 'html', 'css', 'javascript', 'node.js', 'angular', 'vue'] },
    { industry: 'Cloud', keywords: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'serverless'] },
    { industry: 'Security', keywords: ['network security', 'ethical hacking', 'security', 'penetration testing', 'siem'] },
    { industry: 'Design', keywords: ['figma', 'adobe xd', 'ui', 'ux', 'user research', 'prototyping'] },
    { industry: 'DevOps', keywords: ['docker', 'kubernetes', 'ci/cd', 'jenkins', 'terraform', 'ansible'] }
  ];

  const lowerSkills = skills.map((skill) => normalizeText(skill));
  const matches = industryDefinitions
    .map((def) => {
      const matchSkills = def.keywords.filter((keyword) => lowerSkills.some((skill) => skill.includes(keyword)));
      return { industry: def.industry, count: matchSkills.length, score: Math.min(100, 30 + matchSkills.length * 20), matchSkills };
    })
    .filter((item) => item.count > 0)
    .sort((a, b) => b.score - a.score);

  const fallbackIndustries = [
    { industry: 'Technology', count: 0, score: 35, matchSkills: [] },
    { industry: 'General Software', count: 0, score: 30, matchSkills: [] },
    { industry: 'Business Technology', count: 0, score: 25, matchSkills: [] }
  ];

  const padded = [...matches];
  for (const fallback of fallbackIndustries) {
    if (padded.length >= 3) break;
    if (!padded.some((item) => item.industry === fallback.industry)) {
      padded.push(fallback);
    }
  }

  return padded.slice(0, 3).map((item) => ({
    industry: item.industry,
    match_percentage: item.score,
    reasoning: item.matchSkills.length > 0
      ? `Your profile includes ${item.matchSkills.join(', ')} which maps well to ${item.industry}.`
      : `Your experience and technology background align with ${item.industry}.`
  }));
}

export const aiService = {
  // 1. Smart Career Direction Engine
  async getCareerGuidance(resumeText: string, interests: string[], currentSkills: string[]) {
    return this.localCareerGuidance(resumeText, interests, currentSkills);
  },

  // 2. Skill Gap Analysis
  async analyzeSkillGap(userSkills: string[], targetJobRequirements: string[]) {
    const missing_skills = targetJobRequirements.filter(req => !userSkills.includes(req));
    return {
      missing_skills,
      priority_order: missing_skills,
      action_plan: missing_skills.map(skill => ({
        skill,
        resource_type: 'Online course',
        estimated_time: '2-4 weeks'
      }))
    };
  },

  // 3. Resume Intelligence
  async analyzeResume(resumeText: string) {
    return this.localAnalyzeResume(resumeText);
  },

  localAnalyzeResume(resumeText: string) {
    const text = String(resumeText || '').trim();
    const skills = extractKnownTerms(text, KNOWN_SKILLS).slice(0, 14);
    const tools = extractKnownTerms(text, KNOWN_TOOLS).slice(0, 10);
    const hasProject = /\b(intern|internship|project|built|developed|designed|launched|implemented|created|delivered)\b/i.test(text);
    const hasExperiencePhrase = /\b(years|months|experience|worked|managed|lead|led|interned)\b/i.test(text);
    const hasQuantifiedResult = /\b(\d+%|\d+\+? years?|\d+ months?|\d+\+? projects?|\d+k?|\d+\s+users?)\b/i.test(text);
    const hasAchievement = /\b(reduced|increased|improved|saved|boosted|launched|delivered|completed|achieved|raised|optimized)\b/i.test(text);
    const education = [];

    if (/\b(b\.tech|btech|b\.e|be|b\.sc|bsc|m\.tech|mtech|m\.ca|mca|bca|b\.ca|mba|ph\.d|phd|diploma)\b/i.test(text)) {
      education.push(RegExp.lastMatch || 'Higher education');
    }
    if (/\b(master|bachelor|associate|diploma|certificate)\b/i.test(text) && education.length === 0) {
      education.push('Higher education experience');
    }

    const resumeScore = Math.min(100, Math.max(40,
      28 + skills.length * 6 + tools.length * 4 + (hasProject ? 10 : 0) + (hasExperiencePhrase ? 8 : 0) + (hasAchievement ? 8 : 0) + (hasQuantifiedResult ? 8 : 0)
    ));

    const suggestions = new Set<string>();
    if (skills.length < 5) {
      suggestions.add('Add more concrete technical skills to your resume.');
    }
    if (tools.length < 3) {
      suggestions.add('List the tools and platforms you use, such as Git, Docker, or Jupyter Notebook.');
    }
    if (!hasProject) {
      suggestions.add('Add project or internship accomplishments with measurable outcomes.');
    }
    if (!hasAchievement) {
      suggestions.add('Use measurable metrics to describe outcomes and business impact.');
    }
    if (!hasQuantifiedResult) {
      suggestions.add('Include quantifiable results such as percentages, time savings, or user growth.');
    }
    if (!/\b(github|linkedin|portfolio|resume)\b/i.test(text)) {
      suggestions.add('Include links to your portfolio, GitHub, or LinkedIn to strengthen your profile.');
    }
    if (education.length === 0) {
      suggestions.add('Add your education background and any certifications relevant to your target role.');
    }

    const skillsScore = Math.min(100, skills.length * 12);
    const toolsScore = Math.min(100, tools.length * 15);
    const projectScore = hasProject ? 100 : 20;
    const achievementScore = hasAchievement ? 100 : 20;
    const quantifiedScore = hasQuantifiedResult ? 100 : 20;
    const educationScore = education.length ? 100 : 30;
    const experienceScore = hasExperiencePhrase ? 100 : 30;

    const resumeBreakdown = [
      { name: 'Skills', value: skillsScore },
      { name: 'Tools', value: toolsScore },
      { name: 'Projects', value: projectScore },
      { name: 'Achievements', value: achievementScore },
      { name: 'Quantified', value: quantifiedScore },
      { name: 'Education', value: educationScore },
      { name: 'Experience', value: experienceScore }
    ];

    const experience = [];
    if (/\bintern(ship)?\b/i.test(text)) experience.push('Internship experience');
    if (/\b(project|projects)\b/i.test(text)) experience.push('Project work');
    if (/\b(lead|managed|coordinated)\b/i.test(text)) experience.push('Leadership experience');
    if (/\b(automation|testing|deployment|production)\b/i.test(text)) experience.push('Operational or production experience');

    const predictedRole = extractCareerGoal(text, []);
    const industryMatches = buildIndustryMatches([...skills, ...tools]);

    return {
      skills: skills.length ? skills : ['Python', 'SQL'],
      tools: tools.length ? tools : ['Git'],
      education,
      experience,
      predicted_role: predictedRole || 'Technology Professional',
      resume_score: resumeScore,
      top_matching_industries: industryMatches,
      suggestions: Array.from(suggestions).length ? Array.from(suggestions) : ['Highlight your achievements, skills, and relevant projects more clearly.'],
      resume_breakdown: resumeBreakdown,
      skill_count: skills.length,
      tool_count: tools.length,
      project_found: hasProject,
      achievement_found: hasAchievement,
      quantified_score: quantifiedScore,
      education_score: educationScore,
      experience_score: experienceScore
    };
  },

  localCareerGuidance(resumeText: string, interests: string[], currentSkills: string[]) {
    const skillsFromText = extractKnownTerms(resumeText, KNOWN_SKILLS);
    const toolsFromText = extractKnownTerms(resumeText, KNOWN_TOOLS);
    const skills = Array.from(new Set([...(currentSkills || []), ...skillsFromText, ...toolsFromText])).slice(0, 24);
    const careerGoal = extractCareerGoal(resumeText, interests || []);
    const guidance = rankCareerPaths(skills, interests || [], careerGoal);

    if (guidance.length) {
      return guidance.map((path) => ({
        ...path,
        reasoning: `${path.reasoning} Build on ${path.matched_required_skills.join(', ') || 'your core skills'} to strengthen fit for ${path.career_path}.`
      }));
    }

    return [{
      career_path: careerGoal || 'Technology Professional',
      confidence_score: 53,
      reasoning: 'Your resume and interests point toward strong transferable technology skills that can be shaped into a high-growth career path.',
      required_skills: skills.slice(0, 5)
    }];
  },

  parseModelOutput<T>(text: string) {
    const cleaned = text.trim();
    try {
      return JSON.parse(cleaned) as T;
    } catch (error) {
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as T;
      }
      const firstBracket = cleaned.indexOf('[');
      const lastBracket = cleaned.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        return JSON.parse(cleaned.slice(firstBracket, lastBracket + 1)) as T;
      }
      throw error;
    }
  },

  fallbackCareerAnalysis(profileData: any) {
    const skills = Array.isArray(profileData?.skills) ? profileData.skills : [];
    const skillSet = Array.from(new Set(skills.map((s: string) => s.toString().trim()))) as string[];
    const skillCount = skillSet.length;
    const educationBoost = profileData?.education?.length ? 10 : 0;
    const experienceBoost = experienceLevelFactor(String(profileData?.experienceLevel || profileData?.experience_level || ''));
    const roleHint = String(profileData?.personalInfo?.currentRole || profileData?.careerGoal || '').trim();
    const inferredGoal = extractCareerGoal(roleHint, []);
    const scoreFromSkills = Math.min(90, 30 + skillCount * 7 + Math.min(15, skillCount * 2));

    const marketFitScore = Math.min(100, scoreFromSkills + educationBoost + experienceBoost);
    const growthPotential = Math.min(100, 40 + Math.floor(skillCount * 8) + experienceBoost / 2);
    const churnRisk = Math.max(10, 60 - Math.floor(skillCount * 6) - Math.floor(experienceBoost / 2));

    const industries = buildIndustryMatches(skillSet);
    const matchedSkillsText = skillSet.length ? skillSet.slice(0, 5).join(', ') : 'your current skills';
    const resumeBreakdown = [
      { name: 'Skills', value: Math.min(100, skillCount * 10) },
      { name: 'Experience', value: Math.max(15, experienceBoost) },
      { name: 'Education', value: Math.max(20, educationBoost * 10) },
      { name: 'Industry Fit', value: industries.length ? industries[0].match_percentage : marketFitScore },
      { name: 'Resume Score', value: marketFitScore }
    ];

    const fallbackRequiredSkills = skillSet;
    const fallbackMissingSkills: string[] = [];
    const fallbackCareerOptions = industries.map((industry) => ({
      role: industry.industry,
      match_score: industry.match_percentage,
      required_skills: []
    }));

    return {
      predicted_role: inferredGoal || 'Technology Professional',
      market_fit_score: marketFitScore,
      growth_potential: growthPotential,
      churn_risk: churnRisk,
      skill_match_score: Math.min(100, skillCount * 8),
      salary_prediction: {
        min: 50000 + Math.floor(skillCount * 3000) + experienceBoost * 500,
        max: 80000 + Math.floor(skillCount * 4000) + experienceBoost * 750,
        currency: 'USD'
      },
      top_matching_industries: industries.length ? industries : [
        { industry: 'General Technology', match_percentage: marketFitScore, reasoning: 'Your profile aligns broadly with technology roles.' }
      ],
      resume_breakdown: resumeBreakdown,
      matched_skill_count: skillCount,
      missing_skill_count: Math.max(0, 6 - skillCount),
      career_options_count: fallbackCareerOptions.length,
      required_skills: fallbackRequiredSkills,
      missing_skills: fallbackMissingSkills,
      career_growth_options: fallbackCareerOptions,
      ml_graph_data: [
        { name: 'Skill Match', value: Math.min(100, skillCount * 8) },
        { name: 'Market Fit', value: marketFitScore },
        { name: 'Industry Fit', value: industries.length ? industries[0].match_percentage : marketFitScore },
        { name: 'Missing Skills', value: Math.max(0, 100 - Math.min(100, skillCount * 8)) }
      ],
      predictive_insights: [
        `Your resume shows strength in ${matchedSkillsText}, which is valuable for current market trends.`,
        `Roles in ${industries.slice(0, 2).map((i) => i.industry).join(' and ') || 'technology'} are especially promising for your profile.`,
        `Focus on adding measurable results, leadership examples, and clear career goals to improve predictions and market fit.`
      ]
    };
  },

  // 4. ML Predictive Analysis
  async getMLModelAnalysis(profileData: any, resumeText: string = '') {
    const scriptPath = path.resolve(__dirname, 'career_model_inference.py');
    const python = getPythonExecutable();

    const payload = JSON.stringify({ profileData, resumeText });
    const result = spawnSync(python, [scriptPath], {
      input: payload,
      encoding: 'utf8',
      maxBuffer: 20_000_000,
      timeout: 20000
    });

    if (result.error) {
      console.error('Python inference process failed:', result.error);
      return this.fallbackCareerAnalysis(profileData);
    }

    if (result.status !== 0) {
      console.error('Python inference error output:', result.stderr || result.stdout);
      return this.fallbackCareerAnalysis(profileData);
    }

    try {
      const localOutput = JSON.parse(result.stdout) as any;
      const fallback = this.fallbackCareerAnalysis(profileData);
      const matchedSkillCount = localOutput.required_skills ? localOutput.required_skills.length - (localOutput.missing_skills?.length || 0) : 0;
      const missingSkillCount = localOutput.missing_skills?.length || 0;
      const topIndustryScore = localOutput.top_matching_industries?.[0]?.match_percentage ?? fallback.top_matching_industries?.[0]?.match_percentage ?? 0;

      return {
        ...fallback,
        ...localOutput,
        predicted_role: localOutput.predicted_role || fallback.predicted_role,
        salary_prediction: fallback.salary_prediction,
        top_matching_industries: localOutput.top_matching_industries || fallback.top_matching_industries,
        predictive_insights: fallback.predictive_insights,
        skill_match_score: localOutput.skill_match_score ?? fallback.skill_match_score,
        required_skills: localOutput.required_skills || [],
        missing_skills: localOutput.missing_skills || [],
        suggested_courses: localOutput.suggested_courses || [],
        known_skills: localOutput.known_skills || [],
        predicted_salary_range: localOutput.predicted_salary_range || null,
        matched_skill_count: matchedSkillCount,
        missing_skill_count: missingSkillCount,
        career_options_count: (localOutput.career_growth_options?.length || 0),
        ml_graph_data: [
          { name: 'Skill Match', value: localOutput.skill_match_score ?? fallback.skill_match_score },
          { name: 'Market Fit', value: fallback.market_fit_score },
          { name: 'Industry Fit', value: topIndustryScore },
          { name: 'Missing Skills', value: Math.min(100, missingSkillCount * 12) }
        ]
      };
    } catch (error: any) {
      console.error('Failed to parse Python inference result:', error, result.stdout);
      return this.fallbackCareerAnalysis(profileData);
    }
  }
};
