import express from 'express';
import db from '../db.ts';

const router = express.Router();

const TABLES = [
  'users',
  'profiles',
  'skills',
  'user_skills',
  'jobs',
  'applications',
  'connections',
  'messages',
  'resume_data',
  'career_scores'
];

// Export all data as JSON
router.get('/export', async (req, res) => {
  try {
    const data: any = {};
    for (const table of TABLES) {
      data[table] = await db(table).select('*');
    }
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Export failed: ' + error.message });
  }
});

// Import data from JSON
router.post('/import', async (req, res) => {
  const data = req.body;
  
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  try {
    await db.transaction(async (trx) => {
      // Disable foreign key checks for the duration of the import
      await trx.raw('PRAGMA foreign_keys = OFF');

      for (const table of TABLES) {
        if (data[table] && Array.isArray(data[table])) {
          // Clear existing data
          await trx(table).del();
          
          // Insert new data in chunks to avoid SQLite limits
          const chunk = 50;
          for (let i = 0; i < data[table].length; i += chunk) {
            await trx(table).insert(data[table].slice(i, i + chunk));
          }
        }
      }

      // Re-enable foreign key checks
      await trx.raw('PRAGMA foreign_keys = ON');
    });

    res.json({ message: 'Data imported successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Import failed: ' + error.message });
  }
});

// Reset all data
router.post('/reset', async (req, res) => {
  try {
    await db.transaction(async (trx) => {
      await trx.raw('PRAGMA foreign_keys = OFF');
      for (const table of TABLES) {
        await trx(table).del();
      }
      await trx.raw('PRAGMA foreign_keys = ON');
    });
    res.json({ message: 'Data reset successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Reset failed: ' + error.message });
  }
});

// Seed dummy data
router.post('/seed', async (req, res) => {
  try {
    // First, disable foreign keys globally
    await db.raw('PRAGMA foreign_keys = OFF');
    
    await db.transaction(async (trx) => {
      // Delete all data in reverse order of dependencies
      const tableOrder = [
        'messages', 'career_scores', 'resume_data', 'applications', 
        'connections', 'user_skills', 'jobs', 'profiles', 'users', 'skills'
      ];
      
      for (const table of tableOrder) {
        try {
          await trx(table).del();
        } catch (e) {
          // Table might not exist yet, ignore
        }
      }

      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('password123', 10);

      // 1. Create Admin
      const adminHashedPassword = await bcrypt.default.hash('admin12345', 10);
      await trx('users').insert({
        email: 'admin@gmail.com',
        password: adminHashedPassword,
        full_name: 'System Administrator',
        role: 'admin',
        is_verified: 1
      });

      // 2. Create 100 Recruiters
      const recruiters = [];
      const companies = ['Google', 'Meta', 'Amazon', 'Microsoft', 'Apple', 'Netflix', 'Tesla', 'SpaceX', 'OpenAI', 'Stripe'];
      for (let i = 1; i <= 100; i++) {
        recruiters.push({
          email: `recruiter${i}@${companies[i % companies.length].toLowerCase()}.com`,
          password: hashedPassword,
          full_name: `Recruiter ${i}`,
          role: 'recruiter'
        });
      }
      const recruiterIds = await trx('users').insert(recruiters).returning('id');

      // 3. Create 400 Students
      const students = [];
      const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
      const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
      for (let i = 1; i <= 400; i++) {
        students.push({
          email: `student${i}@university.edu`,
          password: hashedPassword,
          full_name: `${firstNames[Math.floor(Math.random() * 10)]} ${lastNames[Math.floor(Math.random() * 10)]} ${i}`,
          role: 'student'
        });
      }
      const studentIds = await trx('users').insert(students).returning('id');

      // 4. Create Profiles for Students
      const locations = ['New York, NY', 'San Francisco, CA', 'London, UK', 'Berlin, DE', 'Tokyo, JP', 'Bangalore, IN', 'Toronto, CA'];
      const degrees = ['BS Computer Science', 'MS Data Science', 'B.Tech IT', 'MBA Marketing', 'PhD AI'];
      const profiles = studentIds.map((s: any, index: number) => ({
        user_id: s.id,
        bio: `Aspiring professional with a focus on ${index % 2 === 0 ? 'Software Engineering' : 'Data Analytics'}. Enthusiastic about building scalable solutions.`,
        target_career: index % 2 === 0 ? 'Software Engineer' : 'Data Scientist',
        education: degrees[Math.floor(Math.random() * degrees.length)],
        experience_years: Math.floor(Math.random() * 5),
        job_readiness_score: Math.floor(Math.random() * 40) + 60,
        location: locations[Math.floor(Math.random() * locations.length)],
        website: `https://portfolio-${s.id}.dev`
      }));
      await trx('profiles').insert(profiles);

      // 5. Create 500 Jobs
      const jobTitles = ['Frontend Developer', 'Backend Engineer', 'Full Stack Developer', 'Data Scientist', 'Machine Learning Engineer', 'Product Manager', 'UX Designer', 'DevOps Engineer', 'Cloud Architect', 'Security Analyst'];
      const jobs = [];
      for (let i = 1; i <= 500; i++) {
        const title = jobTitles[Math.floor(Math.random() * jobTitles.length)];
        const company = companies[Math.floor(Math.random() * companies.length)];
        jobs.push({
          title: title,
          company: company,
          description: `We are looking for a talented ${title} to join our team at ${company}. You will work on cutting-edge projects and collaborate with a world-class team.`,
          requirements: JSON.stringify(['JavaScript', 'React', 'Node.js', 'SQL', 'Problem Solving', 'Teamwork']),
          location: locations[Math.floor(Math.random() * locations.length)],
          salary_range: `$${Math.floor(Math.random() * 50) + 80}k - $${Math.floor(Math.random() * 100) + 150}k`,
          posted_by: recruiterIds[Math.floor(Math.random() * recruiterIds.length)].id,
          type: ['Full-time', 'Contract', 'Internship'][Math.floor(Math.random() * 3)],
          status: 'open'
        });
      }
      const jobIds = await trx('jobs').insert(jobs).returning('id');

      // 6. Create 1000 Applications
      const applications = [];
      for (let i = 1; i <= 1000; i++) {
        applications.push({
          job_id: jobIds[Math.floor(Math.random() * jobIds.length)].id,
          user_id: studentIds[Math.floor(Math.random() * studentIds.length)].id,
          status: ['pending', 'shortlisted', 'rejected', 'applied'][Math.floor(Math.random() * 4)],
          applied_at: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString()
        });
      }
      await trx('applications').insert(applications);

      // 7. Create Resume Data for Career Engine (Structured)
      const resumeData = studentIds.map((s: any) => {
        const firstName = firstNames[Math.floor(Math.random() * 10)];
        const lastName = lastNames[Math.floor(Math.random() * 10)];
        return {
          user_id: s.id,
          raw_text: `Resume of ${firstName} ${lastName}. Experience at ${companies[Math.floor(Math.random() * 10)]}. Skills: Coding, Analysis.`,
          extracted_json: JSON.stringify({
            personalInfo: {
              fullName: `${firstName} ${lastName}`,
              email: `student${s.id}@university.edu`,
              phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
              location: locations[Math.floor(Math.random() * locations.length)]
            },
            education: {
              degree: degrees[Math.floor(Math.random() * degrees.length)],
              university: 'State University',
              graduationYear: '2024',
              gpa: (Math.random() * 1.5 + 2.5).toFixed(2)
            },
            experience: {
              jobTitle: jobTitles[Math.floor(Math.random() * jobTitles.length)],
              company: companies[Math.floor(Math.random() * companies.length)],
              duration: '2 years',
              description: 'Worked on various projects involving software development and data analysis.'
            },
            skills: 'JavaScript, React, Node.js, Python, SQL'
          }),
          resume_score: Math.floor(Math.random() * 30) + 60,
          suggestions: JSON.stringify(['Add more projects', 'Quantify achievements', 'Include certifications'])
        };
      });
      await trx('resume_data').insert(resumeData);

      // 8. Create Career Scores (ML Results)
      const careerScores = studentIds.map((s: any) => ({
        user_id: s.id,
        career_path: jobTitles[Math.floor(Math.random() * jobTitles.length)],
        confidence_score: Math.floor(Math.random() * 40) + 50,
        reasoning: 'Based on your strong technical background and project experience.',
        market_fit_score: Math.floor(Math.random() * 30) + 60,
        growth_potential: Math.floor(Math.random() * 40) + 50,
        churn_risk: Math.floor(Math.random() * 20) + 10,
        salary_min: Math.floor(Math.random() * 50) + 70000,
        salary_max: Math.floor(Math.random() * 100) + 120000
      }));
      await trx('career_scores').insert(careerScores);
    });

    res.json({ message: '1000+ authentic records seeded successfully' });
  } catch (error: any) {
    console.error('Seeding error:', error);
    res.status(500).json({ error: 'Seeding failed: ' + error.message });
  }
});

// Add dummy users (without clearing database)
router.post('/add-users', async (req, res) => {
  try {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash('password123', 10);

    // Create sample users
    const usersToAdd = [
      { email: 'student1@university.edu', full_name: 'John Smith', role: 'student' },
      { email: 'student2@university.edu', full_name: 'Jane Doe', role: 'student' },
      { email: 'student3@university.edu', full_name: 'Mike Johnson', role: 'student' },
      { email: 'recruiter1@google.com', full_name: 'Alice Google', role: 'recruiter' },
      { email: 'recruiter2@meta.com', full_name: 'Bob Meta', role: 'recruiter' },
      { email: 'recruiter3@amazon.com', full_name: 'Carol Amazon', role: 'recruiter' }
    ];

    const created = [];
    for (const user of usersToAdd) {
      try {
        const existingUser = await db('users').where({ email: user.email }).first();
        if (!existingUser) {
          const [id] = await db('users').insert({
            email: user.email,
            password: hashedPassword,
            full_name: user.full_name,
            role: user.role,
            is_verified: 1
          });
          
          // Create profile
          await db('profiles').insert({ user_id: id });
          created.push({ id, ...user });
        }
      } catch (e) {
        console.error(`Failed to create user ${user.email}:`, e);
      }
    }

    res.json({ 
      message: `Created ${created.length} dummy users`,
      users: created 
    });
  } catch (error: any) {
    console.error('Error adding users:', error);
    res.status(500).json({ error: 'Failed to add users: ' + error.message });
  }
});

export default router;
