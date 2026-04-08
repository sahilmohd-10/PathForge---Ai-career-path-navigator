import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Brain, Sparkles, ChevronRight, RefreshCw, TrendingUp, Target, Zap, DollarSign, Activity, Lightbulb, BookOpen, Briefcase, Search, Upload, FileText } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface ResumeData {
  personalInfo: {
    currentRole: string;
    careerGoal: string;
  };
  experienceSummary: string;
  skills: string;
  tools: string;
  educationLevel: string;
  semester: string;
  experienceLevel: string;
}

interface UnifiedResults {
  resumeScore: number;
  overallImprovements: string[];
  mlPredictions: any;
  predictedRole: string;
  skillGaps: { missing_skill: string; topics_to_cover: string[] }[];
  recommendedCourses: { name: string; platform: string; duration: string; link?: string }[];
  jobDescription: string;
}

const getSemesterOptions = (educationLevel: string) => {
  if (!educationLevel) return [];
  let maxSemesters = 0;
  if (educationLevel === 'B.Tech') maxSemesters = 8;
  else if (educationLevel === 'B.Sc IT' || educationLevel === 'BCA') maxSemesters = 6;
  else if (educationLevel === 'M.Tech' || educationLevel === 'MCA') maxSemesters = 4;

  if (maxSemesters === 0) return [{ value: 'N/A', label: 'Not Applicable (N/A)' }];

  const options = [];
  for (let i = 1; i <= maxSemesters; i++) {
    const suffix = i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th';
    options.push({ value: `${i}${suffix} Semester`, label: `${i}${suffix} Semester` });
  }
  options.push({ value: 'N/A', label: 'Not Applicable (N/A)' });
  return options;
};

const CareerEngine = () => {
  const { user } = useAuth();

  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: {
      currentRole: '',
      careerGoal: ''
    },
    experienceSummary: '',
    skills: '',
    tools: '',
    educationLevel: '',
    semester: '',
    experienceLevel: ''
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [unifiedResults, setUnifiedResults] = useState<UnifiedResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user) {
      setError('Please log in to upload your resume.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('userId', user.id.toString());

    setUploading(true);
    setError(null);

    try {
      const res = await axios.post('/api/ai/upload-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const parsed = res.data.parsed;

      // Attempt to map extracted data to the form
      setResumeData(prev => ({
        ...prev,
        personalInfo: {
          currentRole: parsed.target_career || prev.personalInfo.currentRole,
          careerGoal: parsed.career_goal || parsed.suggestions || prev.personalInfo.careerGoal
        },
        experienceSummary: parsed.bio || prev.experienceSummary,
        skills: Array.isArray(parsed.skills) ? parsed.skills.join(', ') : prev.skills,
        experienceLevel: parsed.experience_years ?
          (parsed.experience_years === 0 ? 'Fresher' :
            parsed.experience_years <= 3 ? '1-3 years' :
              parsed.experience_years <= 5 ? '3-5 years' : '5+ years') : prev.experienceLevel,
        educationLevel: parsed.education || prev.educationLevel
      }));

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to parse resume. Please fill manually.');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = ''; // Reset input
    }
  };

  const handleAnalyze = async () => {
    if (!user) {
      setError('Please log in to analyze your resume.');
      return;
    }

    if (!resumeData.personalInfo.currentRole.trim() || !resumeData.skills.trim()) {
      setError('Please provide your current role and skills before analyzing.');
      return;
    }

    if (!resumeData.educationLevel || !resumeData.semester || !resumeData.experienceLevel || !resumeData.personalInfo.careerGoal.trim()) {
      setError('Please explicitly define your highest education, semester, experience level, and top career goal.');
      return;
    }

    if (!resumeData.experienceSummary.trim()) {
      setError('Please describe your experience summary for the analysis.');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const resumeText = `${resumeData.personalInfo.currentRole} ${resumeData.personalInfo.careerGoal} ${resumeData.experienceSummary} ${resumeData.skills} ${resumeData.tools} ${resumeData.educationLevel} ${resumeData.semester}`;

      const profileData = {
        personalInfo: resumeData.personalInfo,
        experience: resumeData.experienceSummary,
        skills: resumeData.skills.split(',').map(s => s.trim()).filter(Boolean),
        tools: resumeData.tools.split(',').map(s => s.trim()).filter(Boolean),
        educationLevel: resumeData.educationLevel,
        semester: resumeData.semester,
        experienceLevel: resumeData.experienceLevel
      };

      const analysisRes = await axios.post('/api/ai/unified-analysis', {
        userId: user?.id,
        resumeText,
        profileData
      });

      setUnifiedResults(analysisRes.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to complete comprehensive analysis. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSearchJobs = () => {
    if (unifiedResults?.predictedRole) {
      window.location.hash = `jobs?search=${encodeURIComponent(unifiedResults.predictedRole)}`;
    } else {
      window.location.hash = 'jobs';
    }
  };

  // Helper variables for charts if results exist
  const mlResults = unifiedResults?.mlPredictions;
  const salaryPrediction = mlResults?.salary_prediction || { min: 0, max: 0, currency: 'USD' };

  const resumeGraphData = Array.isArray(mlResults?.resume_breakdown)
    ? mlResults.resume_breakdown.map((item: any) => ({ name: item.name, value: Number(item.value) || 0 }))
    : [];

  const radarData = mlResults ? [
    { subject: 'Market Fit', A: Number(mlResults.market_fit_score) || 0, fullMark: 100 },
    { subject: 'Growth', A: Number(mlResults.growth_potential) || 0, fullMark: 100 },
    { subject: 'Stability', A: Math.max(0, 100 - (Number(mlResults.churn_risk) || 0)), fullMark: 100 },
    { subject: 'Skill Match', A: Number(mlResults.skill_match_score) || 0, fullMark: 100 },
    { subject: 'Demand', A: 85, fullMark: 100 },
  ] : [];

  const industryData = Array.isArray(mlResults?.top_matching_industries)
    ? mlResults.top_matching_industries.map((ind: any) => ({
      name: ind.industry,
      value: ind.match_percentage ?? 0
    }))
    : [];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl transition-colors duration-300">
            <Brain className="h-8 w-8 text-indigo-600 dark:text-neon-cyan" />
          </div>
          <div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-neon-cyan mb-1 transition-colors duration-300">AI Career Engine</h2>
            <p className="text-gray-500 dark:text-neon-light font-medium transition-colors duration-300">Comprehensive AI & ML trajectory analysis</p>
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 rounded-2xl flex items-center gap-3 transition-colors duration-300">
          <div className="w-2 h-2 bg-red-600 rounded-full"></div>
          <p className="font-medium">{error}</p>
        </div>
      )}

      {!unifiedResults ? (
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-neon-dark border border-gray-200 dark:border-neon-teal rounded-3xl p-8 shadow-sm transition-colors duration-300"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-indigo-600" />
                <h3 className="text-xl font-bold text-gray-900">Career Snapshot</h3>
              </div>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.txt"
                  id="resume-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <label
                  htmlFor="resume-upload"
                  className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${uploading
                      ? 'bg-gray-100 text-gray-400 dark:bg-neon-dark dark:text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 outline-2 outline-indigo-600'
                    }`}
                >
                  {uploading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploading ? 'Parsing Resume...' : 'Auto-fill from Resume'}
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-neon-light uppercase mb-1">Current / Desired Role <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-neon-teal bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-light focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-cyan outline-none transition-colors duration-200"
                  value={resumeData.personalInfo.currentRole}
                  onChange={(e) => setResumeData({ ...resumeData, personalInfo: { ...resumeData.personalInfo, currentRole: e.target.value } })}
                  placeholder="e.g. Software Engineer, Data Analyst"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-neon-light uppercase mb-1">Career Goal <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-neon-teal bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-light focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-cyan outline-none transition-colors duration-200"
                  value={resumeData.personalInfo.careerGoal}
                  onChange={(e) => setResumeData({ ...resumeData, personalInfo: { ...resumeData.personalInfo, careerGoal: e.target.value } })}
                  placeholder="e.g. Build a career in AI / Product Management"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-neon-light uppercase mb-1">Highest Education <span className="text-red-500">*</span></label>
                <select
                  value={resumeData.educationLevel}
                  onChange={(e) => {
                    const newEdu = e.target.value;
                    const options = getSemesterOptions(newEdu);
                    let newSem = resumeData.semester;
                    if (newSem !== '' && !options.find(o => o.value === newSem)) {
                      newSem = '';
                    }
                    setResumeData({ ...resumeData, educationLevel: newEdu, semester: newSem });
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neon-teal bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-light focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-cyan outline-none transition-colors duration-200"
                >
                  <option value="">Select Education</option>
                  <option>B.Tech</option>
                  <option>B.Sc IT</option>
                  <option>BCA</option>
                  <option>M.Tech</option>
                  <option>MCA</option>
                  <option>Self-taught + Certifications</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-neon-light uppercase mb-1">Semester (If Applicable) <span className="text-red-500">*</span></label>
                <select
                  value={resumeData.semester}
                  onChange={(e) => setResumeData({ ...resumeData, semester: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neon-teal bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-light focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-cyan outline-none transition-colors duration-200"
                  disabled={!resumeData.educationLevel}
                >
                  <option value="">{resumeData.educationLevel ? "Select Semester or N/A" : "Select Education First"}</option>
                  {getSemesterOptions(resumeData.educationLevel).map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-neon-light uppercase mb-1">Experience Level <span className="text-red-500">*</span></label>
                <select
                  value={resumeData.experienceLevel}
                  onChange={(e) => setResumeData({ ...resumeData, experienceLevel: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neon-teal bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-light focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-cyan outline-none transition-colors duration-200"
                >
                  <option value="">Select Experience Level</option>
                  <option>Fresher</option>
                  <option>1-3 years</option>
                  <option>3-5 years</option>
                  <option>5+ years</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-neon-light uppercase mb-1">Technical Skills (comma separated) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. React, Node.js, Python, SQL"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neon-teal bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-light focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-cyan outline-none transition-colors duration-200"
                  value={resumeData.skills}
                  onChange={(e) => setResumeData({ ...resumeData, skills: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-neon-light uppercase mb-1">Tools / Platforms (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Git, Docker, Jupyter Notebook, VS Code"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neon-teal bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-light focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-cyan outline-none transition-colors duration-200"
                  value={resumeData.tools}
                  onChange={(e) => setResumeData({ ...resumeData, tools: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-neon-light uppercase mb-1">Experience Summary <span className="text-red-500">*</span></label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neon-teal bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-light focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-cyan outline-none transition-colors duration-200 h-36 resize-none"
                  placeholder="Describe your recent work, projects, or internship impact"
                  value={resumeData.experienceSummary}
                  onChange={(e) => setResumeData({ ...resumeData, experienceSummary: e.target.value })}
                />
              </div>
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 text-lg"
          >
            {analyzing ? (
              <>
                <RefreshCw className="animate-spin h-6 w-6" />
                Synthesizing Unified Career Prediction...
              </>
            ) : (
              <>
                <Sparkles className="h-6 w-6" />
                Start Unified AI Career Analysis
              </>
            )}
          </motion.button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-12"
        >
          {/* Top Hero Section: Score & Predicted Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-indigo-600 rounded-3xl p-8 text-white flex flex-col justify-between shadow-lg">
              <div>
                <p className="text-indigo-100 font-medium mb-1 uppercase tracking-wide text-sm">Accurate Resume Score</p>
                <h3 className="text-6xl font-black">{unifiedResults.resumeScore}<span className="text-3xl text-indigo-300">/100</span></h3>
              </div>
              <div className="mt-8 flex items-center justify-between">
                <p className="text-sm text-indigo-100 max-w-[200px] leading-relaxed">Comprehensive breakdown evaluated by our ML models based on your skillset.</p>
                <Sparkles className="h-12 w-12 text-indigo-300/50" />
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-gray-500 font-bold mb-1 uppercase tracking-wide text-sm">Predicted Target Role</p>
                <h3 className="text-3xl font-extrabold text-indigo-600">{unifiedResults.predictedRole}</h3>
                <p className="text-gray-600 mt-4 text-sm leading-relaxed">{unifiedResults.jobDescription}</p>
              </div>
              <button
                onClick={handleSearchJobs}
                className="mt-6 flex items-center justify-center gap-2 bg-slate-900 text-white w-full py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
              >
                <Search className="h-4 w-4" />
                Search Available Jobs
              </button>
            </div>
          </div>

          {/* ML Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
              <Target className="h-5 w-5 text-indigo-600 mx-auto mb-2" />
              <div className="text-2xl font-black text-gray-900">{mlResults?.market_fit_score ?? 0}%</div>
              <span className="text-xs font-bold text-gray-500 uppercase">Market Fit</span>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
              <TrendingUp className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
              <div className="text-2xl font-black text-gray-900">{mlResults?.growth_potential ?? 0}%</div>
              <span className="text-xs font-bold text-gray-500 uppercase">Growth</span>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
              <Zap className="h-5 w-5 text-amber-600 mx-auto mb-2" />
              <div className="text-2xl font-black text-gray-900">{unifiedResults.resumeScore ?? 0}%</div>
              <span className="text-xs font-bold text-gray-500 uppercase">Readiness</span>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
              <DollarSign className="h-5 w-5 text-green-600 mx-auto mb-2" />
              <div className="text-sm font-black text-gray-900">
                {salaryPrediction.min.toLocaleString()} - {salaryPrediction.max.toLocaleString()}
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase">Est. Salary</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Areas of Improvement */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                Areas of Improvement
              </h4>
              <ul className="space-y-4">
                {unifiedResults.overallImprovements.map((tip: string, i: number) => (
                  <li key={i} className="flex items-start text-sm text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <ChevronRight className="h-5 w-5 text-indigo-500 mr-2 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Radar / Graph Breakdown (if available) */}
            {resumeGraphData.length > 0 && (
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center">
                <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-indigo-600" />
                  Profile Breakdown
                </h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={resumeGraphData} layout="vertical" margin={{ top: 0, right: 0, left: -16, bottom: 0 }}>
                      <XAxis type="number" hide domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" width={90} tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                      <Tooltip formatter={(value: any) => `${value}%`} cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#4f46e5" barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          <hr className="border-gray-100" />

          {/* Deep Dive: Topics to Cover for Skill Gaps */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Lightbulb className="h-6 w-6 text-yellow-500" />
              Skill Gaps & Required Topics
            </h3>
            {unifiedResults.skillGaps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {unifiedResults.skillGaps.map((gap, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-yellow-100 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="font-black text-lg text-gray-900 mb-4 pb-4 border-b border-gray-100 flex items-center justify-between">
                      {gap.missing_skill}
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-[10px] uppercase rounded-full tracking-wider">Gap Priority</span>
                    </h4>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Topics to master:</p>
                    <ul className="space-y-2">
                      {gap.topics_to_cover.map((topic, tIdx) => (
                        <li key={tIdx} className="text-sm font-medium text-gray-700 flex items-center before:content-[''] before:block before:w-1.5 before:h-1.5 before:bg-indigo-500 before:rounded-full before:mr-3">
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-emerald-50 text-emerald-800 p-6 rounded-2xl border border-emerald-100 font-medium">
                Great job! You have no major foundational skill gaps for your predicted role. Focus on advanced topics.
              </div>
            )}
          </div>

          {/* Recommended Courses */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-blue-500" />
              Recommended Online Courses
            </h3>
            {unifiedResults.recommendedCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {unifiedResults.recommendedCourses.map((course, i) => {
                  let href = course.link;
                  if (!href || href.trim() === '' || href.includes('example.com')) {
                    href = `https://www.google.com/search?q=${encodeURIComponent(`${course.name} course ${course.platform}`)}`;
                  }

                  return (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">{course.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-semibold text-xs">{course.platform}</span>
                          <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> {course.duration}</span>
                        </div>
                      </div>
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold text-sm w-full py-2 bg-indigo-50 rounded-xl text-center hover:bg-indigo-100 transition-colors inline-block mt-4">
                        Click here to view course
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 italic">No specific courses recommended at this time.</p>
            )}
          </div>

          <div className="text-center pt-8">
            <button
              onClick={() => setUnifiedResults(null)}
              className="text-gray-500 hover:text-gray-800 font-bold underline transition-colors"
            >
              Analyze Another Profile
            </button>
          </div>

        </motion.div>
      )}
    </div>
  );
};

export default CareerEngine;
