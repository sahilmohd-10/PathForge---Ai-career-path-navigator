// Using native Node.js fetch API (available in Node.js 18+)

const ADZUNA_APP_ID = 'f448502e';
const ADZUNA_APP_KEY = '7816e36630e9802e2c7e656b419716f9';
const ADZUNA_BASE_URL = 'https://api.adzuna.com/v1/api/jobs';

interface AdzunaJob {
  id: string;
  title: string;
  company: {
    display_name: string;
  };
  description?: string;
  location: {
    display_name: string;
  };
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: number;
  contract_type?: string;
  redirect_url?: string;
  created?: string;
}

export interface ProcessedJob {
  title: string;
  company: string;
  description: string;
  requirements: string;
  location: string;
  salary_range: string;
  type: string;
  external_id?: string;
  external_url?: string;
}

/**
 * Fetch jobs from Adzuna API
 * @param country Country code (e.g., 'gb', 'us', 'ca', 'au', 'fr', 'de', 'nl', 'at', 'be', 'ch', 'cz', 'dk', 'fi', 'hu', 'ie', 'it', 'no', 'pl', 'pt', 'ru', 'sg')
 * @param categoryTag Optional job category tag (e.g., 'it-jobs', 'graduate-jobs', 'healthcare-jobs')
 * @param pageNumber Page number for pagination (starts at 1)
 * @param pageSize Number of jobs per page (max 50)
 * @returns Array of processed jobs
 */
export async function fetchAdzunaJobs(
  country: string = 'us',
  categoryTag?: string,
  pageNumber: number = 1,
  pageSize: number = 50
): Promise<ProcessedJob[]> {
  try {
    let url = `${ADZUNA_BASE_URL}/${country}/search/${pageNumber}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=${pageSize}`;

    if (categoryTag) {
      url += `&category=${categoryTag}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Adzuna API error: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();

    if (!data.results) {
      console.warn('No results returned from Adzuna API');
      return [];
    }

    return data.results.map((job: AdzunaJob) => processAdzunaJob(job));
  } catch (error) {
    console.error('Error fetching from Adzuna API:', error);
    throw error;
  }
}

/**
 * Search jobs on Adzuna with keyword
 * @param country Country code
 * @param keywords Search keywords
 * @param pageNumber Page number for pagination
 * @param pageSize Number of jobs per page
 * @returns Array of processed jobs
 */
export async function searchAdzunaJobs(
  country: string = 'us',
  keywords: string = '',
  pageNumber: number = 1,
  pageSize: number = 50
): Promise<ProcessedJob[]> {
  try {
    let url = `${ADZUNA_BASE_URL}/${country}/search/${pageNumber}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=${pageSize}`;

    if (keywords) {
      url += `&what=${encodeURIComponent(keywords)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Adzuna API error: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();

    if (!data.results) {
      console.warn('No results returned from Adzuna API');
      return [];
    }

    return data.results.map((job: AdzunaJob) => processAdzunaJob(job));
  } catch (error) {
    console.error('Error searching Adzuna API:', error);
    throw error;
  }
}

/**
 * Process Adzuna job to match our database schema
 */
export function processAdzunaJob(job: AdzunaJob): ProcessedJob {
  const salaryRange = formatSalaryRange(job.salary_min, job.salary_max, job.salary_is_predicted);
  
  // Extract key requirements from description
  const requirements = extractRequirements(job.description || '');

  return {
    title: job.title,
    company: job.company.display_name,
    description: cleanDescription(job.description || ''),
    requirements: JSON.stringify(requirements.length > 0 ? requirements : ['Not specified']),
    location: job.location.display_name,
    salary_range: salaryRange,
    type: formatContractType(job.contract_type),
    external_id: job.id,
    external_url: job.redirect_url
  };
}

/**
 * Format salary range from Adzuna data
 */
function formatSalaryRange(min?: number, max?: number, isPredicted?: number): string {
  if (!min && !max) {
    return 'Negotiable';
  }

  const predicted = isPredicted ? ' (predicted)' : '';
  
  if (min && max) {
    return `$${Math.floor(min / 1000)}k - $${Math.floor(max / 1000)}k${predicted}`;
  } else if (min) {
    return `$${Math.floor(min / 1000)}k+${predicted}`;
  } else if (max) {
    return `Up to $${Math.floor(max / 1000)}k${predicted}`;
  }

  return 'Negotiable';
}

/**
 * Format contract type from Adzuna data
 */
function formatContractType(contractType?: string): string {
  if (!contractType) return 'Full-time';

  const typeMap: { [key: string]: string } = {
    'permanent': 'Full-time',
    'contract': 'Contract',
    'temporary': 'Temporary',
    'part_time': 'Part-time',
    'part-time': 'Part-time',
    'full_time': 'Full-time',
    'full-time': 'Full-time',
    'freelance': 'Freelance',
    'internship': 'Internship'
  };

  return typeMap[contractType.toLowerCase()] || 'Full-time';
}

/**
 * Extract key technical requirements from job description
 */
function extractRequirements(description: string): string[] {
  const techKeywords = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust', 'PHP', 'Ruby',
    'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'ASP.NET',
    'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git',
    'REST API', 'GraphQL', 'Microservices', 'Machine Learning', 'AI', 'Deep Learning',
    'HTML', 'CSS', 'SASS', 'Bootstrap', 'Material UI', 'Tailwind',
    'Agile', 'Scrum', 'JIRA', 'DevOps', 'Linux', 'Unix'
  ];

  const found = new Set<string>();
  const descLower = description.toLowerCase();

  for (const keyword of techKeywords) {
    if (descLower.includes(keyword.toLowerCase())) {
      found.add(keyword);
    }
  }

  return Array.from(found).slice(0, 10); // Maximum 10 keywords
}

/**
 * Clean description by removing HTML tags and extra whitespace
 */
function cleanDescription(description: string): string {
  return description
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim()
    .substring(0, 5000); // Limit to 5000 characters
}

/**
 * Get available categories for a country
 */
export async function getAdzunaCategories(country: string = 'us'): Promise<any> {
  try {
    const response = await fetch(`${ADZUNA_BASE_URL}/${country}/categories?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}`);

    if (!response.ok) {
      throw new Error(`Adzuna API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Adzuna categories:', error);
    throw error;
  }
}

export default {
  fetchAdzunaJobs,
  searchAdzunaJobs,
  processAdzunaJob,
  getAdzunaCategories
};
