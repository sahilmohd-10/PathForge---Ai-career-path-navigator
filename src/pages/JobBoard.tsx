import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Briefcase, MapPin, DollarSign, Search, Globe, ChevronLeft, ChevronRight, ExternalLink, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PageShell from '../components/PageShell';

const JobBoard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      const match = window.location.hash.match(/[?&]search=([^&]*)/);
      if (match) return decodeURIComponent(match[1]);
    }
    return '';
  });
  const [country, setCountry] = useState('us');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchType, setSearchType] = useState<'browse' | 'search'>(() => {
    if (typeof window !== 'undefined') {
      const match = window.location.hash.match(/[?&]search=([^&]*)/);
      if (match && match[1]) return 'search';
    }
    return 'browse';
  });

  const COUNTRIES = [
    { code: 'af', name: 'Afghanistan' },
    { code: 'al', name: 'Albania' },
    { code: 'dz', name: 'Algeria' },
    { code: 'ad', name: 'Andorra' },
    { code: 'ao', name: 'Angola' },
    { code: 'ag', name: 'Antigua and Barbuda' },
    { code: 'ar', name: 'Argentina' },
    { code: 'am', name: 'Armenia' },
    { code: 'au', name: 'Australia' },
    { code: 'at', name: 'Austria' },
    { code: 'az', name: 'Azerbaijan' },
    { code: 'bs', name: 'Bahamas' },
    { code: 'bh', name: 'Bahrain' },
    { code: 'bd', name: 'Bangladesh' },
    { code: 'bb', name: 'Barbados' },
    { code: 'by', name: 'Belarus' },
    { code: 'be', name: 'Belgium' },
    { code: 'bz', name: 'Belize' },
    { code: 'bj', name: 'Benin' },
    { code: 'bt', name: 'Bhutan' },
    { code: 'bo', name: 'Bolivia' },
    { code: 'ba', name: 'Bosnia and Herzegovina' },
    { code: 'bw', name: 'Botswana' },
    { code: 'br', name: 'Brazil' },
    { code: 'bn', name: 'Brunei' },
    { code: 'bg', name: 'Bulgaria' },
    { code: 'bf', name: 'Burkina Faso' },
    { code: 'bi', name: 'Burundi' },
    { code: 'kh', name: 'Cambodia' },
    { code: 'cm', name: 'Cameroon' },
    { code: 'ca', name: 'Canada' },
    { code: 'cv', name: 'Cape Verde' },
    { code: 'cf', name: 'Central African Republic' },
    { code: 'td', name: 'Chad' },
    { code: 'cl', name: 'Chile' },
    { code: 'cn', name: 'China' },
    { code: 'co', name: 'Colombia' },
    { code: 'km', name: 'Comoros' },
    { code: 'cd', name: 'Congo (Democratic Republic)' },
    { code: 'cg', name: 'Congo (Republic)' },
    { code: 'cr', name: 'Costa Rica' },
    { code: 'hr', name: 'Croatia' },
    { code: 'cu', name: 'Cuba' },
    { code: 'cy', name: 'Cyprus' },
    { code: 'cz', name: 'Czech Republic' },
    { code: 'ci', name: 'Côte d\'Ivoire' },
    { code: 'dk', name: 'Denmark' },
    { code: 'dj', name: 'Djibouti' },
    { code: 'dm', name: 'Dominica' },
    { code: 'do', name: 'Dominican Republic' },
    { code: 'tl', name: 'East Timor' },
    { code: 'ec', name: 'Ecuador' },
    { code: 'eg', name: 'Egypt' },
    { code: 'sv', name: 'El Salvador' },
    { code: 'gq', name: 'Equatorial Guinea' },
    { code: 'er', name: 'Eritrea' },
    { code: 'ee', name: 'Estonia' },
    { code: 'sz', name: 'Eswatini' },
    { code: 'et', name: 'Ethiopia' },
    { code: 'fj', name: 'Fiji' },
    { code: 'fi', name: 'Finland' },
    { code: 'fr', name: 'France' },
    { code: 'ga', name: 'Gabon' },
    { code: 'gm', name: 'Gambia' },
    { code: 'ge', name: 'Georgia' },
    { code: 'de', name: 'Germany' },
    { code: 'gh', name: 'Ghana' },
    { code: 'gr', name: 'Greece' },
    { code: 'gd', name: 'Grenada' },
    { code: 'gt', name: 'Guatemala' },
    { code: 'gn', name: 'Guinea' },
    { code: 'gw', name: 'Guinea-Bissau' },
    { code: 'gy', name: 'Guyana' },
    { code: 'ht', name: 'Haiti' },
    { code: 'hn', name: 'Honduras' },
    { code: 'hu', name: 'Hungary' },
    { code: 'is', name: 'Iceland' },
    { code: 'in', name: 'India' },
    { code: 'id', name: 'Indonesia' },
    { code: 'ir', name: 'Iran' },
    { code: 'iq', name: 'Iraq' },
    { code: 'ie', name: 'Ireland' },
    { code: 'il', name: 'Israel' },
    { code: 'it', name: 'Italy' },
    { code: 'jm', name: 'Jamaica' },
    { code: 'jp', name: 'Japan' },
    { code: 'jo', name: 'Jordan' },
    { code: 'kz', name: 'Kazakhstan' },
    { code: 'ke', name: 'Kenya' },
    { code: 'ki', name: 'Kiribati' },
    { code: 'xk', name: 'Kosovo' },
    { code: 'kw', name: 'Kuwait' },
    { code: 'kg', name: 'Kyrgyzstan' },
    { code: 'la', name: 'Laos' },
    { code: 'lv', name: 'Latvia' },
    { code: 'lb', name: 'Lebanon' },
    { code: 'ls', name: 'Lesotho' },
    { code: 'lr', name: 'Liberia' },
    { code: 'ly', name: 'Libya' },
    { code: 'li', name: 'Liechtenstein' },
    { code: 'lt', name: 'Lithuania' },
    { code: 'lu', name: 'Luxembourg' },
    { code: 'mg', name: 'Madagascar' },
    { code: 'mw', name: 'Malawi' },
    { code: 'my', name: 'Malaysia' },
    { code: 'mv', name: 'Maldives' },
    { code: 'ml', name: 'Mali' },
    { code: 'mt', name: 'Malta' },
    { code: 'mh', name: 'Marshall Islands' },
    { code: 'mr', name: 'Mauritania' },
    { code: 'mu', name: 'Mauritius' },
    { code: 'mx', name: 'Mexico' },
    { code: 'fm', name: 'Micronesia' },
    { code: 'md', name: 'Moldova' },
    { code: 'mc', name: 'Monaco' },
    { code: 'mn', name: 'Mongolia' },
    { code: 'me', name: 'Montenegro' },
    { code: 'ma', name: 'Morocco' },
    { code: 'mz', name: 'Mozambique' },
    { code: 'mm', name: 'Myanmar' },
    { code: 'na', name: 'Namibia' },
    { code: 'nr', name: 'Nauru' },
    { code: 'np', name: 'Nepal' },
    { code: 'nl', name: 'Netherlands' },
    { code: 'nz', name: 'New Zealand' },
    { code: 'ni', name: 'Nicaragua' },
    { code: 'ne', name: 'Niger' },
    { code: 'ng', name: 'Nigeria' },
    { code: 'kp', name: 'North Korea' },
    { code: 'mk', name: 'North Macedonia' },
    { code: 'no', name: 'Norway' },
    { code: 'om', name: 'Oman' },
    { code: 'pk', name: 'Pakistan' },
    { code: 'pw', name: 'Palau' },
    { code: 'ps', name: 'Palestine' },
    { code: 'pa', name: 'Panama' },
    { code: 'pg', name: 'Papua New Guinea' },
    { code: 'py', name: 'Paraguay' },
    { code: 'pe', name: 'Peru' },
    { code: 'ph', name: 'Philippines' },
    { code: 'pl', name: 'Poland' },
    { code: 'pt', name: 'Portugal' },
    { code: 'qa', name: 'Qatar' },
    { code: 'ro', name: 'Romania' },
    { code: 'ru', name: 'Russia' },
    { code: 'rw', name: 'Rwanda' },
    { code: 'kn', name: 'Saint Kitts and Nevis' },
    { code: 'lc', name: 'Saint Lucia' },
    { code: 'vc', name: 'Saint Vincent and the Grenadines' },
    { code: 'ws', name: 'Samoa' },
    { code: 'sm', name: 'San Marino' },
    { code: 'st', name: 'Sao Tome and Principe' },
    { code: 'sa', name: 'Saudi Arabia' },
    { code: 'sn', name: 'Senegal' },
    { code: 'rs', name: 'Serbia' },
    { code: 'sc', name: 'Seychelles' },
    { code: 'sl', name: 'Sierra Leone' },
    { code: 'sg', name: 'Singapore' },
    { code: 'sk', name: 'Slovakia' },
    { code: 'si', name: 'Slovenia' },
    { code: 'sb', name: 'Solomon Islands' },
    { code: 'so', name: 'Somalia' },
    { code: 'za', name: 'South Africa' },
    { code: 'kr', name: 'South Korea' },
    { code: 'ss', name: 'South Sudan' },
    { code: 'es', name: 'Spain' },
    { code: 'lk', name: 'Sri Lanka' },
    { code: 'sd', name: 'Sudan' },
    { code: 'sr', name: 'Suriname' },
    { code: 'se', name: 'Sweden' },
    { code: 'ch', name: 'Switzerland' },
    { code: 'sy', name: 'Syria' },
    { code: 'tw', name: 'Taiwan' },
    { code: 'tj', name: 'Tajikistan' },
    { code: 'tz', name: 'Tanzania' },
    { code: 'th', name: 'Thailand' },
    { code: 'tg', name: 'Togo' },
    { code: 'to', name: 'Tonga' },
    { code: 'tt', name: 'Trinidad and Tobago' },
    { code: 'tn', name: 'Tunisia' },
    { code: 'tr', name: 'Turkey' },
    { code: 'tm', name: 'Turkmenistan' },
    { code: 'tv', name: 'Tuvalu' },
    { code: 'ug', name: 'Uganda' },
    { code: 'ua', name: 'Ukraine' },
    { code: 'ae', name: 'United Arab Emirates' },
    { code: 'gb', name: 'United Kingdom' },
    { code: 'us', name: 'United States' },
    { code: 'uy', name: 'Uruguay' },
    { code: 'uz', name: 'Uzbekistan' },
    { code: 'vu', name: 'Vanuatu' },
    { code: 'va', name: 'Vatican City' },
    { code: 've', name: 'Venezuela' },
    { code: 'vn', name: 'Vietnam' },
    { code: 'ye', name: 'Yemen' },
    { code: 'zm', name: 'Zambia' },
    { code: 'zw', name: 'Zimbabwe' },
  ];

  const pageSize = 20;

  // Fetch jobs from Adzuna API
  const fetchJobs = async (page: number = 1, isSearch: boolean = false) => {
    try {
      setLoading(true);
      setError('');
      
      let url = `/api/jobs?source=all&country=${country}&page=${page}&limit=${pageSize}`;
      
      if (isSearch && searchQuery.trim()) {
        url = `/api/jobs/search?source=all&keywords=${encodeURIComponent(searchQuery)}&country=${country}&page=${page}&limit=${pageSize}`;
      }

      const res = await axios.get(url);
      const data = res.data;
      
      setJobs(data.jobs || []);
      setTotalJobs(data.total || data.jobs?.length || 0);
      setCurrentPage(page);
    } catch (err: any) {
      console.error('Failed to fetch jobs:', err);
      setError(err.response?.data?.error || 'Failed to load jobs from Adzuna. Please try again.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchType === 'search' && searchQuery.trim()) {
      fetchJobs(1, true);
    } else if (searchType === 'browse') {
      fetchJobs(1, false);
    }
  }, [country, searchType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchType('search');
    fetchJobs(1, true);
  };

  const handleApply = async (job: any) => {
    if (!user?.id) {
      setError('Please log in to apply for jobs');
      return;
    }

    try {
      // For Adzuna jobs, save to database first if it has an external_id
      if (job.external_id && !job.id) {
        await axios.post('/api/jobs/sync-to-db', {
          jobs: [job]
        });
      }

      // Then apply
      const jobId = job.id || job.external_id;
      await axios.post(`/api/jobs/${jobId}/apply`, { userId: user.id });
      
      setSuccessMessage('Application submitted successfully! Redirecting to Adzuna...');
      setTimeout(() => {
        if (job.external_url) {
          window.open(job.external_url, '_blank');
        }
        setSuccessMessage('');
      }, 1000);
    } catch (err: any) {
      console.error('Failed to apply:', err);
      // Fallback: open the Adzuna link directly
      if (job.external_url) {
        setSuccessMessage('Opening job on Adzuna...');
        setTimeout(() => {
          window.open(job.external_url, '_blank');
          setSuccessMessage('');
        }, 500);
      }
    }
  };

  const totalPages = Math.ceil(totalJobs / pageSize);

  return (
    <PageShell
      title="Job Board"
      subtitle="Discover real job opportunities from Adzuna - the largest job database"
    >
      {/* Source & Filters Section */}
      <div className="bg-linear-to-r from-indigo-50 to-blue-50 dark:from-neon-dark dark:to-neon-gray p-6 rounded-2xl border border-indigo-100 dark:border-neon-teal mb-8">
        <div className="space-y-4">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by job title, skills, or company (e.g., 'Python Developer', 'React')..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-cyan placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-cyan outline-none transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 dark:bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-700 transition-all whitespace-nowrap"
            >
              Search Jobs
            </button>
          </form>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Country Selector */}
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-600 dark:text-neon-light" />
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-cyan focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Results Info */}
            {jobs.length > 0 && (
              <div className="text-sm text-gray-600 dark:text-neon-light font-medium">
                Showing {jobs.length} of {totalJobs} jobs {searchQuery && `for "${searchQuery}"`}
              </div>
            )}

            {/* Browse Mode Button */}
            {searchType === 'search' && (
              <button
                onClick={() => {
                  setSearchType('browse');
                  setSearchQuery('');
                }}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold"
              >
                ← Browse all jobs
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-xl font-semibold flex items-center gap-2">
          <span className="h-2 w-2 bg-emerald-600 dark:bg-emerald-400 rounded-full animate-pulse"></span>
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl font-semibold flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-16">
          <div className="inline-flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-4 border-gray-200 dark:border-gray-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
            <p className="text-gray-500 dark:text-neon-light font-medium">Loading real jobs from Adzuna...</p>
          </div>
        </div>
      )}

      {/* Jobs Grid */}
      {!loading && jobs.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {jobs.map((job: any, idx: number) => (
              <div
                key={job.external_id || idx}
                className="bg-white dark:bg-neon-dark p-6 rounded-2xl border border-gray-100 dark:border-neon-teal shadow-sm hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-neon-cyan/20 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-neon-cyan line-clamp-2">
                      {job.title}
                    </h3>
                    <p className="text-indigo-600 dark:text-indigo-400 font-medium">{job.company}</p>
                  </div>
                  <div className="h-12 w-12 bg-gray-50 dark:bg-neon-gray rounded-xl flex items-center justify-center shrink-0 ml-2">
                    <Briefcase className="h-6 w-6 text-gray-400 dark:text-neon-light" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-neon-light mb-4">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1 shrink-0" />
                    <span className="truncate">{job.location}</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 shrink-0" />
                    <span>{job.salary_range}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-neon-light line-clamp-2">
                    {job.description}
                  </p>
                </div>

                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      try {
                        const reqs = typeof job.requirements === 'string' 
                          ? JSON.parse(job.requirements) 
                          : job.requirements;
                        return (reqs || []).slice(0, 3).map((req: string) => (
                          <span
                            key={req}
                            className="px-2 py-1 bg-gray-50 dark:bg-neon-gray text-gray-600 dark:text-neon-light rounded text-xs font-semibold"
                          >
                            {req}
                          </span>
                        ));
                      } catch {
                        return null;
                      }
                    })()}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-neon-teal">
                  <button
                    onClick={() => handleApply(job)}
                    disabled={!user?.id}
                    className="px-4 py-2 bg-indigo-600 dark:bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-1"
                  >
                    Apply Now
                  </button>
                  {job.external_url && (
                    <a
                      href={job.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-gray-100 dark:bg-neon-gray text-gray-700 dark:text-neon-light rounded-xl hover:bg-gray-200 dark:hover:bg-neon-teal transition-all"
                      title="View on Adzuna"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mb-8">
              <button
                onClick={() => fetchJobs(currentPage - 1, searchType === 'search')}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-neon-gray disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => fetchJobs(page, searchType === 'search')}
                      className={`px-3 py-2 rounded-lg font-semibold transition-colors ${
                        currentPage === page
                          ? 'bg-indigo-600 dark:bg-indigo-600 text-white'
                          : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-neon-gray'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => fetchJobs(currentPage + 1, searchType === 'search')}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-neon-gray disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && jobs.length === 0 && !error && (
        <div className="text-center py-16">
          <Briefcase className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-neon-light mb-2">
            {searchQuery ? 'No jobs found' : 'No jobs available'}
          </h3>
          <p className="text-gray-500 dark:text-neon-light">
            {searchQuery
              ? `Try searching with different keywords like "Python", "React", or "Developer"`
              : 'Try browsing jobs or use the search to find opportunities'}
          </p>
        </div>
      )}

      {/* Adzuna Info */}
      <div className="mt-12 p-4 bg-blue-50 dark:bg-neon-dark border border-blue-100 dark:border-neon-teal rounded-xl text-sm text-gray-600 dark:text-neon-light text-center">
        💼 Jobs are fetched in real-time from <span className="font-semibold">Adzuna</span> - the world's largest job database
      </div>
    </PageShell>
  );
};

export default JobBoard;

