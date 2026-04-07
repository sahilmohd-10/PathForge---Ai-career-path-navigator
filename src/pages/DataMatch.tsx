import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Table, 
  Search, 
  ChevronRight, 
  TrendingUp, 
  DollarSign,
  Briefcase,
  Download,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import PageShell from '../components/PageShell';

const DataMatch: React.FC = () => {
  const { user, token } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (token && user?.id) {
      fetchMatches();
    }
  }, [token, user?.id]);

  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'x-user-id': user?.id.toString() || ''
  });

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/data-match', {
        headers: getHeaders()
      });
      if (Array.isArray(response.data)) {
        // Ensure all matches have default values
        const enrichedData = response.data.map((match: any) => ({
          id: match.id || 0,
          full_name: match.full_name || 'Unknown Student',
          email: match.email || 'student@example.com',
          career_path: match.career_path || 'Software Engineer',
          confidence_score: match.confidence_score ?? 75,
          market_fit_score: match.market_fit_score ?? 70,
          growth_potential: match.growth_potential ?? 75,
          churn_risk: match.churn_risk ?? 25,
          salary_min: match.salary_min ?? 65000,
          salary_max: match.salary_max ?? 120000
        }));
        setMatches(enrichedData);
      } else {
        console.error('Expected array from /api/admin/data-match, got:', response.data);
        setMatches([]);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const generateCareerScores = async () => {
    try {
      setGenerating(true);
      const response = await axios.get('/api/admin/add-career-scores', {
        headers: getHeaders()
      });
      console.log('Career scores generated:', response.data);
      // Refresh the matches
      await fetchMatches();
    } catch (error) {
      console.error('Error generating career scores:', error);
    } finally {
      setGenerating(false);
    }
  };

  const safeMatches = Array.isArray(matches) ? matches : [];
  const highRiskProfiles = safeMatches.filter(m => (m.churn_risk || 0) > 25);

  const exportToCSV = (rows: any[], fileName: string) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csvData = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportFilteredMatches = () => {
    exportToCSV(filteredMatches, 'data-match-filtered.csv');
  };

  const exportMatch = (match: any) => {
    const safeName = match.full_name?.replace(/\s+/g, '_').toLowerCase() || match.id || 'match';
    exportToCSV([match], `data-match-${safeName}.csv`);
  };

  const filteredMatches = safeMatches.filter(match => 
    (match.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     match.career_path?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterRole === 'all' || match.career_path?.toLowerCase().includes(filterRole.toLowerCase()))
  );

  return (
    <PageShell
      title="Career Data Match"
      subtitle="Review AI-predicted student career metrics and manage dataset performance."
    >
      <div className="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <p className="text-gray-500">Analyze and match student profiles with career-path predictions, market fit, and risk signals.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={generateCareerScores}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 dark:hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            {generating ? 'Generating...' : 'Generate Career Scores'}
          </button>
          <button
            onClick={() => { window.location.hash = 'database'; }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-600 text-white rounded-2xl font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-700 transition-all"
          >
            <Table className="w-4 h-4" />
            Open Database Manager
          </button>
          <button
            onClick={exportFilteredMatches}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 dark:bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-700 transition-all"
          >
            <Download className="w-4 h-4" />
            Export Filtered Matches
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase mb-1">Total Analyzed</div>
          <div className="text-2xl font-black text-gray-900">{safeMatches.length}</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-indigo-400 uppercase mb-1">Avg Market Fit</div>
          <div className="text-2xl font-black text-indigo-600">
            {safeMatches.length > 0 
              ? Math.round(safeMatches.reduce((acc, m) => acc + (m.market_fit_score || 0), 0) / safeMatches.length) 
              : 0}%
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-emerald-400 uppercase mb-1">Avg Growth</div>
          <div className="text-2xl font-black text-emerald-600">
            {safeMatches.length > 0 
              ? Math.round(safeMatches.reduce((acc, m) => acc + (m.growth_potential || 0), 0) / safeMatches.length) 
              : 0}%
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-amber-400 uppercase mb-1">High Risk Profiles</div>
          <div className="text-2xl font-black text-amber-600">
            {highRiskProfiles.length}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Predicted Analysis</h3>
            <p className="text-sm text-gray-500 mt-1">These insights are generated from career score predictions and show how student profiles align with market demand.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full sm:w-auto">
            <div className="bg-indigo-50 p-4 rounded-3xl border border-indigo-100">
              <div className="text-xs font-bold text-indigo-400 uppercase mb-1">Average Market Fit</div>
              <div className="text-2xl font-black text-indigo-700">
                {safeMatches.length > 0 ? Math.round(safeMatches.reduce((acc, m) => acc + (m.market_fit_score || 0), 0) / safeMatches.length) : 0}%
              </div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100">
              <div className="text-xs font-bold text-emerald-400 uppercase mb-1">Average Growth</div>
              <div className="text-2xl font-black text-emerald-700">
                {safeMatches.length > 0 ? Math.round(safeMatches.reduce((acc, m) => acc + (m.growth_potential || 0), 0) / safeMatches.length) : 0}%
              </div>
            </div>
            <div className="bg-amber-50 p-4 rounded-3xl border border-amber-100">
              <div className="text-xs font-bold text-amber-400 uppercase mb-1">High Risk Profiles</div>
              <div className="text-2xl font-black text-amber-700">{highRiskProfiles.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name or career path..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="px-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Paths</option>
            <option value="Engineer">Engineers</option>
            <option value="Data">Data Roles</option>
            <option value="Designer">Designers</option>
            <option value="Manager">Managers</option>
          </select>
          <button 
            onClick={fetchMatches}
            className="p-3 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-all"
          >
            <Table className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-bottom border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Target Path</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Market Fit</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Growth</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Risk</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Confidence</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Salary Range</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="px-6 py-8">
                      <div className="h-4 bg-gray-100 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredMatches.length > 0 ? (
                filteredMatches.map((match, i) => (
                  <motion.tr 
                    key={match.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                          {match.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{match.full_name}</div>
                          <div className="text-xs text-gray-400">{match.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">{match.career_path}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        (match.market_fit_score ?? 70) > 80 ? 'bg-emerald-50 text-emerald-700' : 
                        (match.market_fit_score ?? 70) > 60 ? 'bg-indigo-50 text-indigo-700' : 
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {match.market_fit_score ?? 70}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold text-sm">
                        <TrendingUp className="h-3 w-3" />
                        {(match.growth_potential ?? 75)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`text-sm font-bold ${(match.churn_risk ?? 25) > 25 ? 'text-rose-600' : 'text-gray-400'}`}>
                        {(match.churn_risk ?? 25)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                        {(match.confidence_score ?? 75)}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-gray-900 font-bold text-sm">
                        <DollarSign className="h-3 w-3 text-gray-400" />
                        {Math.round((match.salary_min ?? 65000) / 1000)}k - {Math.round((match.salary_max ?? 120000) / 1000)}k
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => exportMatch(match)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Export this match"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100">
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No matches found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
};

export default DataMatch;

