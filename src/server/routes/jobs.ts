import express from 'express';
import db from '../db.ts';
import { fetchAdzunaJobs, searchAdzunaJobs, ProcessedJob } from '../adzunaService.ts';

const router = express.Router();

/**
 * GET / - Fetch jobs from database or Adzuna
 * Query params:
 * - source: 'db' (database) or 'adzuna' (default: 'db')
 * - country: Adzuna country code (default: 'us')
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 50, max: 50)
 * - category: Job category for Adzuna (optional)
 */
router.get('/', async (req, res) => {
  try {
    const source = (req.query.source as string) || 'db';
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 50);
    const country = (req.query.country as string) || 'us';
    const category = (req.query.category as string) || undefined;

    if (source === 'adzuna') {
      // Fetch from Adzuna API
      const jobs = await fetchAdzunaJobs(country, category, page, limit);
      return res.json({
        source: 'adzuna',
        page,
        limit,
        country,
        total: jobs.length,
        jobs
      });
    } else if (source === 'all') {
      // Fetch from both and merge
      const adzunaJobs = await fetchAdzunaJobs(country, category, page, limit).catch(() => []);
      const dbJobs = await db('jobs').whereNotNull('posted_by').select('*').orderBy('created_at', 'desc').limit(limit).offset((page - 1) * limit);
      
      const formattedDbJobs = dbJobs.map(job => ({
        id: job.id.toString(),
        title: job.title,
        company: job.company,
        description: job.description,
        location: job.location,
        salary_range: job.salary_range,
        requirements: job.requirements,
        created_at: job.created_at,
        is_local: true,
        posted_by: job.posted_by,
        external_url: null
      }));

      return res.json({
        source: 'all',
        page,
        limit,
        country,
        total: adzunaJobs.length + dbJobs.length,
        jobs: [...formattedDbJobs, ...adzunaJobs]
      });
    } else {
      // Fetch from database
      let query = db('jobs').whereNotNull('posted_by');
      
      // If no recruiter-posted jobs exist, this will be empty
      const jobs = await query.select('*').orderBy('created_at', 'desc').limit(limit).offset((page - 1) * limit);
      const total = await db('jobs').whereNotNull('posted_by').count('* as count').first();
      
      res.json({
        source: 'db',
        page,
        limit,
        total: total?.count || 0,
        jobs
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { title, company, description, requirements, location, salaryRange, type, postedBy } = req.body;
  try {
    const [id] = await db('jobs').insert({
      title,
      company,
      description,
      requirements: JSON.stringify(requirements),
      location,
      salary_range: salaryRange,
      type,
      posted_by: postedBy,
      status: 'open'
    });
    res.status(201).json({ id, message: 'Job posted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /search - Search jobs from Adzuna
 * Query params:
 * - keywords: Search keywords (required)
 * - country: Country code (default: 'us')
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 50, max: 50)
 */
router.get('/search', async (req, res) => {
  try {
    const keywords = req.query.keywords as string;
    const country = (req.query.country as string) || 'us';
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 50);

    if (!keywords) {
      return res.status(400).json({ error: 'Keywords parameter is required' });
    }

    let adzunaJobs: ProcessedJob[] = [];
    try {
      adzunaJobs = await searchAdzunaJobs(country, keywords, page, limit);
    } catch (e) {
      console.error('Adzuna search failed, continuing with local jobs', e);
    }

    // Search local database
    const dbJobs = await db('jobs')
      .whereNotNull('posted_by')
      .where(function() {
        this.where('title', 'like', `%${keywords}%`)
            .orWhere('company', 'like', `%${keywords}%`)
      })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset((page - 1) * limit);

    const formattedDbJobs = dbJobs.map(job => ({
      id: job.id.toString(),
      title: job.title,
      company: job.company,
      description: job.description,
      location: job.location,
      salary_range: job.salary_range,
      requirements: job.requirements,
      created_at: job.created_at,
      is_local: true,
      posted_by: job.posted_by,
      external_url: null
    }));

    res.json({
      source: 'all',
      keywords,
      country,
      page,
      limit,
      total: adzunaJobs.length + dbJobs.length,
      jobs: [...formattedDbJobs, ...adzunaJobs]
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /sync-to-db - Sync Adzuna jobs to database
 * Body params:
 * - jobs: Array of Adzuna jobs to save
 * - country: Country code (default: 'us')
 */
router.post('/sync-to-db', async (req, res) => {
  try {
    const { jobs } = req.body;

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return res.status(400).json({ error: 'Jobs array is required and must not be empty' });
    }

    // Format jobs for database insertion (system jobs with posted_by = null or 0)
    const formattedJobs = jobs.map((job: ProcessedJob) => ({
      title: job.title,
      company: job.company,
      description: job.description,
      requirements: job.requirements,
      location: job.location,
      salary_range: job.salary_range,
      type: job.type,
      posted_by: null, // System jobs from Adzuna
      status: 'open',
      external_id: job.external_id,
      external_url: job.external_url
    }));

    const ids = await db('jobs').insert(formattedJobs).returning('id');

    res.status(201).json({
      message: `Successfully synced ${ids.length} jobs to database`,
      count: ids.length,
      ids
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/recruiter/:userId', async (req, res) => {
  try {
    const jobs = await db('jobs').where({ posted_by: req.params.userId }).orderBy('created_at', 'desc');
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/applications/recruiter/:userId', async (req, res) => {
  try {
    const applications = await db('applications')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .join('users', 'applications.user_id', 'users.id')
      .where('jobs.posted_by', req.params.userId)
      .select(
        'applications.*',
        'jobs.title as job_title',
        'users.full_name as student_name',
        'users.email as student_email'
      )
      .orderBy('applied_at', 'desc');
    res.json(applications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/applications/:id/shortlist', async (req, res) => {
  const { message } = req.body;
  try {
    const application = await db('applications').where({ id: req.params.id }).first();
    if (!application) return res.status(404).json({ error: 'Application not found' });

    await db('applications').where({ id: req.params.id }).update({ status: 'shortlisted' });

    // Notify student via messages
    const job = await db('jobs').where({ id: application.job_id }).first();
    const user = await db('users').where({ id: application.user_id }).first();
    const defaultMessage = `Congratulations! You have been shortlisted for the ${job.title} position at ${job.company}.`;
    
    await db('messages').insert({
      sender_id: job.posted_by,
      receiver_id: application.user_id,
      content: message || defaultMessage,
      is_read: false
    });

    // Add a confirmation notification for the recruiter so the selection is visible in their notification panel.
    await db('messages').insert({
      sender_id: job.posted_by,
      receiver_id: job.posted_by,
      content: `You shortlisted ${user.full_name} for the ${job.title} role and notified the candidate.`,
      is_read: false
    });

    res.json({ message: 'Candidate shortlisted and notified' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { userId } = req.body;
  try {
    const job = await db('jobs').where({ id: req.params.id }).first();
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.posted_by !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this job' });
    }
    
    // Applications linked to this job should intuitively disappear, 
    // cascading delete or deleting manually if cascade isn't strictly set
    await db('applications').where({ job_id: req.params.id }).del();
    await db('jobs').where({ id: req.params.id }).del();
    
    res.json({ message: 'Job deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/applications/student/:userId', async (req, res) => {
  try {
    const applications = await db('applications')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .where('applications.user_id', req.params.userId)
      .select(
        'applications.*',
        'jobs.title as job_title',
        'jobs.company as company_name',
        'jobs.location as job_location'
      )
      .orderBy('applied_at', 'desc');
    res.json(applications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:jobId/apply', async (req, res) => {
  const { userId } = req.body;
  try {
    const existing = await db('applications').where({ job_id: req.params.jobId, user_id: userId }).first();
    if (existing) {
      return res.status(400).json({ error: 'You have already applied to this job.' });
    }

    const job = await db('jobs').where({ id: req.params.jobId }).first();
    if (!job) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    const user = await db('users').where({ id: userId }).first();
    if (!user) {
      return res.status(404).json({ error: 'Applicant not found.' });
    }

    await db('applications').insert({
      job_id: req.params.jobId,
      user_id: userId,
      status: 'applied'
    });

    await db('messages').insert({
      sender_id: userId,
      receiver_id: job.posted_by,
      content: `${user.full_name} (${user.email}) has applied for the ${job.title} role.
Please review the application and respond accordingly.`,
      is_read: false
    });

    res.json({ message: 'Application submitted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
